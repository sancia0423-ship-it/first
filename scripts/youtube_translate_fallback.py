from __future__ import annotations

import json
import re
import sys

from deep_translator import GoogleTranslator

MARKER_TEMPLATE = "[[[SEG_{:04d}]]]"
MARKER_PATTERN = re.compile(r"\[\[\[SEG_(\d{4})\]\]\]")


def build_packets(texts: list[str], limit: int = 2600) -> list[str]:
    packets: list[str] = []
    current_parts: list[str] = []
    current_length = 0

    for index, text in enumerate(texts):
        part = f"{MARKER_TEMPLATE.format(index)}\n{text.strip()}"
        if current_parts and current_length + len(part) + 2 > limit:
            packets.append("\n\n".join(current_parts))
            current_parts = [part]
            current_length = len(part)
        else:
            current_parts.append(part)
            current_length += len(part) + (2 if len(current_parts) > 1 else 0)

    if current_parts:
        packets.append("\n\n".join(current_parts))

    return packets


def parse_packet_translation(translated_packet: str) -> dict[int, str]:
    parsed: dict[int, str] = {}
    parts = MARKER_PATTERN.split(translated_packet)

    for index in range(1, len(parts), 2):
        marker = parts[index]
        content = parts[index + 1].strip() if index + 1 < len(parts) else ""
        parsed[int(marker)] = content

    return parsed


def main() -> int:
    payload = json.load(sys.stdin)
    texts = payload.get("texts", [])

    if not isinstance(texts, list):
        raise ValueError("texts must be a list")

    translator = GoogleTranslator(source="auto", target="zh-CN")
    normalized_texts = [str(item or "").strip() for item in texts]
    translated = normalized_texts[:]

    for packet in build_packets(normalized_texts):
        translated_packet = translator.translate(packet) or ""
        for index, content in parse_packet_translation(translated_packet).items():
            if 0 <= index < len(translated) and content:
                translated[index] = content

    json.dump({"translations": translated}, sys.stdout, ensure_ascii=False)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(
            json.dumps(
                {"error": "翻译服务暂时不可用，请稍后再试。", "detail": repr(exc)},
                ensure_ascii=False
            ),
            file=sys.stderr
        )
        raise SystemExit(1)
