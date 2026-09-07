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


# YouTube 对数据中心 IP 会触发机器人检测，不同的 player client 触发概率不同。
# 按顺序尝试，任意一个拿到字幕就停。default 放最后，因为它最容易被拦。
PLAYER_CLIENTS = ("tv_embedded", "ios", "android", "web_safari", "default")


def build_ydl(player_client: str) -> YoutubeDL:
    options = {
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        # Certificate verification stays on: these requests go out over the
        # public internet and the response is fed straight into the app.
        "socket_timeout": 20,
        "retries": 2
    }

    if player_client != "default":
        options["extractor_args"] = {"youtube": {"player_client": [player_client]}}

    return YoutubeDL(options)


def is_bot_block(message: str) -> bool:
    markers = (
        "Sign in to confirm",
        "confirm you're not a bot",
        "LOGIN_REQUIRED",
        "not a bot",
        "cookies"
    )
    return any(marker in message for marker in markers)


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
    """把异常映射成能直接给用户看的中文。

    yt-dlp 的原文既是英文又带内部细节，直接抛给访客没有意义 —— 他真正需要
    知道的是「这个视频不行」还是「这个站点暂时不行」，以及下一步该做什么。
    """
    if isinstance(exc, UserFacingError):
        return str(exc)

    message = str(exc)

    if "Private video" in message or "members-only" in message or "Join this channel" in message:
        return "这是私享或会员专属视频，读取不到字幕。请换一个公开视频。"

    if "Video unavailable" in message or "This video is unavailable" in message:
        return "这个视频不可用，可能已被删除、设为私享，或在当前地区受限。请换一个视频。"

    if "age" in message.lower() and "restrict" in message.lower():
        return "这个视频有年龄限制，无法读取字幕。请换一个视频。"

    if "live" in message.lower() and "not started" in message.lower():
        return "这是尚未开始的直播，还没有字幕。"

    if is_bot_block(message):
        return (
            "YouTube 暂时拒绝了来自本服务器的字幕请求（机器人检测）。"
            "这是服务器网络出口被限制，不是视频的问题，请稍后再试。"
        )

    if "timed out" in message or "timeout" in message.lower():
        return "读取字幕超时了，请稍后再试或换一个更短的视频。"

    return "读取字幕失败，请换一个公开且带字幕的视频再试。"


def main() -> int:
    payload = json.load(sys.stdin)
    video_id = str(payload.get("videoId") or "").strip()
    preferred_language = str(payload.get("sourceLanguage") or "").strip()

    if not VIDEO_ID_PATTERN.match(video_id):
        raise UserFacingError("视频 ID 不合法，请重新输入 YouTube 链接。")

    url = f"https://www.youtube.com/watch?v={video_id}"
    last_error: Exception | None = None
    blocked_everywhere = True
    info = None
    tracks: list[TrackSelection] = []
    segments: list[dict[str, Any]] = []
    warnings: list[str] = []
    selected_track = None

    for player_client in PLAYER_CLIENTS:
        try:
            with build_ydl(player_client) as ydl:
                info = ydl.extract_info(url, download=False)
                tracks = collect_available_tracks(info)
                if not tracks:
                    # 这个 client 能访问但确实没字幕，换 client 也不会有。
                    blocked_everywhere = False
                    raise UserFacingError(
                        "这个视频当前没有可读取的公开字幕。请换一个带字幕的视频再试。"
                    )

                selected_track, warnings = choose_track(tracks, preferred_language)
                segments = fetch_segments(ydl, selected_track)
                break
        except UserFacingError:
            raise
        except Exception as exc:  # noqa: BLE001 - 换下一个 client 再试
            last_error = exc
            if not is_bot_block(str(exc)):
                blocked_everywhere = False

    if selected_track is None:
        if last_error is not None and blocked_everywhere:
            raise UserFacingError(
                "YouTube 暂时拒绝了来自本服务器的字幕请求（机器人检测）。"
                "这是服务器网络出口被限制，不是视频的问题，请稍后再试。"
            )
        # 交给 map_error 翻译成人话，不要把 yt-dlp 的英文原文直接抛给访客。
        if last_error is not None:
            raise last_error
        raise UserFacingError("读取字幕失败，请稍后再试。")

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
        # yt-dlp 也会往 stderr 写日志，混在一起会让上层解析不出 JSON，
        # 真实原因就丢了。加前缀单独成行，上层按前缀提取。
        print(
            "__TRANSCRIPT_ERROR__"
            + json.dumps({"error": map_error(exc), "detail": repr(exc)}, ensure_ascii=False),
            file=sys.stderr
        )
        raise SystemExit(1)
