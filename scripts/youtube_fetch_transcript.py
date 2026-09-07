from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass
from typing import Any
from urllib.parse import parse_qs, urlparse

from yt_dlp import YoutubeDL

VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{11}$")


class UserFacingError(Exception):
    """An error whose message is written for end users and safe to return verbatim."""


@dataclass
class TrackSelection:
    language_code: str
    label: str
    kind: str
    url: str


def build_ydl() -> YoutubeDL:
    return YoutubeDL(
        {
            "skip_download": True,
            "quiet": True,
            "no_warnings": True,
            # Certificate verification stays on: these requests go out over the
            # public internet and the response is fed straight into the app.
            "socket_timeout": 20,
            "retries": 2
        }
    )


def pick_best_entry(entries: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not entries:
        return None

    for ext in ("json3", "srv3", "srv2", "srv1", "vtt"):
        for entry in entries:
            if entry.get("ext") == ext:
                return entry

    return entries[0]


def match_language_code(track_code: str, preferred: str) -> bool:
    track = track_code.strip().lower()
    target = preferred.strip().lower()

    if not track or not target:
        return False

    return (
        track == target
        or track.split("-")[0] == target
        or target.split("-")[0] == track.split("-")[0]
        or track.startswith(f"{target}-")
    )


def is_source_auto_entry(entry: dict[str, Any]) -> bool:
    url = str(entry.get("url") or "")
    query = parse_qs(urlparse(url).query)
    return "tlang" not in query


def build_track_selection(language_code: str, kind: str, entry: dict[str, Any]) -> TrackSelection | None:
    url = str(entry.get("url") or "").strip()
    if not url:
        return None

    label = str(entry.get("name") or language_code).strip() or language_code
    return TrackSelection(
        language_code=language_code,
        label=label,
        kind=kind,
        url=url
    )


def collect_available_tracks(info: dict[str, Any]) -> list[TrackSelection]:
    tracks: list[TrackSelection] = []
    seen_languages: set[str] = set()

    subtitles = info.get("subtitles") or {}
    for language_code, entries in subtitles.items():
        selected = build_track_selection(language_code, "manual", pick_best_entry(entries) or {})
        if not selected:
            continue

        normalized = language_code.lower()
        if normalized in seen_languages:
            continue

        seen_languages.add(normalized)
        tracks.append(selected)

    automatic_captions = info.get("automatic_captions") or {}
    for language_code, entries in automatic_captions.items():
        source_entries = [entry for entry in entries if is_source_auto_entry(entry)]
        selected = build_track_selection(language_code, "auto", pick_best_entry(source_entries) or {})
        if not selected:
            continue

        normalized = language_code.lower()
        if normalized in seen_languages:
            continue

        seen_languages.add(normalized)
        tracks.append(selected)

    return tracks


def choose_track(tracks: list[TrackSelection], preferred_language: str) -> tuple[TrackSelection, list[str]]:
    warnings: list[str] = []
    preferred = preferred_language.strip().lower()

    if preferred:
        for track in tracks:
            if match_language_code(track.language_code, preferred):
                return track, warnings

        warnings.append(f"没有找到 {preferred_language} 字幕，已自动切换到 {tracks[0].language_code} 轨道。")

    for target_language in ("en",):
        for track in tracks:
            if track.kind == "manual" and match_language_code(track.language_code, target_language):
                return track, warnings
        for track in tracks:
            if track.kind == "auto" and match_language_code(track.language_code, target_language):
                return track, warnings

    return tracks[0], warnings


def fetch_segments(ydl: YoutubeDL, track: TrackSelection) -> list[dict[str, Any]]:
    with ydl.urlopen(track.url) as response:
        payload = json.loads(response.read().decode("utf-8"))

    segments: list[dict[str, Any]] = []

    for event in payload.get("events", []):
        if event.get("aAppend") == 1:
            continue

        segs = event.get("segs") or []
        if not segs:
            continue

        source_text = " ".join("".join(str(part.get("utf8") or "") for part in segs).split())
        if not source_text:
            continue

        start_ms = int(event.get("tStartMs") or 0)
        duration_ms = int(event.get("dDurationMs") or 0)
        segments.append(
            {
                "startMs": start_ms,
                "durationMs": duration_ms,
                "sourceText": source_text
            }
        )

    return segments


def build_track_payload(track: TrackSelection) -> dict[str, Any]:
    return {
        "languageCode": track.language_code,
        "label": track.label,
        "kind": track.kind,
        "isTranslatable": True
    }


def map_error(exc: Exception) -> str:
    """Map an exception to a message that is safe to show a browser.

    Anything unrecognised gets a generic message — raw yt-dlp output can contain
    local paths and internal state. The full text still goes out as `detail`,
    which the Node layer only writes to the server log.
    """
    if isinstance(exc, UserFacingError):
        return str(exc)

    message = str(exc)

    if "Video unavailable" in message or "Private video" in message:
        return "这个视频暂时不可用，或者被地区/年龄限制挡住了。请换一个公开视频再试。"

    if "LOGIN_REQUIRED" in message or "confirm you're not a bot" in message or "Sign in to confirm" in message:
        return "YouTube 暂时拦截了这条视频的字幕读取。请换一个公开视频，或者换一个带公开字幕的视频再试。"

    if "timed out" in message or "timeout" in message.lower():
        return "读取字幕超时了，请稍后再试或换一个更短的视频。"

    return "读取 YouTube 字幕失败，请换一个公开视频再试。"


def main() -> int:
    payload = json.load(sys.stdin)
    video_id = str(payload.get("videoId") or "").strip()
    preferred_language = str(payload.get("sourceLanguage") or "").strip()

    if not VIDEO_ID_PATTERN.match(video_id):
        raise UserFacingError("视频 ID 不合法，请重新输入 YouTube 链接。")

    with build_ydl() as ydl:
        info = ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=False)

        tracks = collect_available_tracks(info)
        if not tracks:
            raise UserFacingError("这个视频当前没有可读取的公开字幕。请换一个带字幕的视频再试。")

        selected_track, warnings = choose_track(tracks, preferred_language)
        segments = fetch_segments(ydl, selected_track)

    if not segments:
        raise UserFacingError("字幕轨道存在，但没有成功读取到正文。请换一个视频再试。")

    json.dump(
        {
            "title": str(info.get("title") or ""),
            "description": str(info.get("description") or ""),
            "availableTracks": [build_track_payload(track) for track in tracks],
            "selectedTrack": build_track_payload(selected_track),
            "segments": segments,
            "warnings": warnings
        },
        sys.stdout,
        ensure_ascii=False
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(
            json.dumps({"error": map_error(exc), "detail": repr(exc)}, ensure_ascii=False),
            file=sys.stderr
        )
        raise SystemExit(1)
