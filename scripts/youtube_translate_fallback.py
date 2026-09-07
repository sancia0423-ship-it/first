from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

"""
Free-tier subtitle translation.

This used to call `deep_translator.GoogleTranslator`, which scrapes a web
endpoint that now answers every request with an HTTP 500 error page. The
library does not raise on that — it returns the error page *as the
translation* — so the previous implementation silently handed back untranslated
English and reported success.

Two changes guard against a repeat:
  * Talk to the translate endpoint directly, over the stdlib, so a failure is
    an exception rather than a plausible-looking string.
  * Report how many segments were actually translated, and let the caller treat
    "nothing was translated" as an error instead of a result.

Lines are kept aligned by translating a newline-joined batch and checking that
the reply has the same number of lines; a mismatched batch falls back to
translating its lines one at a time.
"""

ENDPOINT = "https://translate.googleapis.com/translate_a/single"
USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Safari/537.36"

# Batches travel in a query string, so keep them well inside URL length limits.
MAX_BATCH_CHARS = 1200
MAX_ATTEMPTS = 3
RETRY_BACKOFF_SECONDS = 0.6
PAUSE_BETWEEN_BATCHES = 0.15


class TranslationError(Exception):
    """Raised when the upstream endpoint cannot be used at all."""


def translate_text(text: str, target: str = "zh-CN") -> str:
    query = urllib.parse.urlencode(
        {"client": "gtx", "sl": "auto", "tl": target, "dt": "t", "q": text}
    )
    request = urllib.request.Request(f"{ENDPOINT}?{query}", headers={"User-Agent": USER_AGENT})

    last_error: Exception | None = None

    for attempt in range(MAX_ATTEMPTS):
        try:
            with urllib.request.urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))

            segments = payload[0] or []
            return "".join(part[0] for part in segments if part and part[0])
        except Exception as exc:  # noqa: BLE001 - retried below, re-raised at the end
            last_error = exc
            if attempt < MAX_ATTEMPTS - 1:
                time.sleep(RETRY_BACKOFF_SECONDS * (attempt + 1))

    raise TranslationError(f"translate endpoint unavailable: {last_error}")


def build_batches(texts: list[str]) -> list[tuple[int, list[str]]]:
    """Group indices into newline-joinable batches, returning (start, lines)."""
    batches: list[tuple[int, list[str]]] = []
    current: list[str] = []
    start = 0
    length = 0

    for index, text in enumerate(texts):
        if current and length + len(text) + 1 > MAX_BATCH_CHARS:
            batches.append((start, current))
            current = []
            start = index
            length = 0

        current.append(text)
        length += len(text) + 1

    if current:
        batches.append((start, current))

    return batches


def translate_batch(lines: list[str]) -> list[str] | None:
    """Translate lines together; None when the reply does not line up."""
    joined = "\n".join(lines)
    result = translate_text(joined)
    candidate = result.split("\n")

    if len(candidate) == len(lines):
        return candidate

    return None


def main() -> int:
    payload = json.load(sys.stdin)
    texts = payload.get("texts", [])

    if not isinstance(texts, list):
        raise ValueError("texts must be a list")

    # Newlines inside a segment would break line alignment.
    sources = [" ".join(str(item or "").split()) for item in texts]
    translations = sources[:]
    translated_count = 0

    for start, lines in build_batches(sources):
        indexes = [start + offset for offset, line in enumerate(lines) if line]
        if not indexes:
            continue

        batch = translate_batch(lines)

        if batch is None:
            # The batch came back misaligned; translate its lines individually
            # so one awkward line cannot corrupt the whole batch.
            batch = []
            for line in lines:
                if not line:
                    batch.append(line)
                    continue
                try:
                    batch.append(translate_text(line))
                except TranslationError:
                    batch.append(line)

        for offset, line in enumerate(batch):
            index = start + offset
            if line.strip() and line.strip() != sources[index]:
                translations[index] = line.strip()
                translated_count += 1

        time.sleep(PAUSE_BETWEEN_BATCHES)

    json.dump(
        {
            "translations": translations,
            "translatedCount": translated_count,
            "totalCount": len([text for text in sources if text]),
        },
        sys.stdout,
        ensure_ascii=False,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # noqa: BLE001
        print(
            json.dumps(
                {"error": "翻译服务暂时不可用，请稍后再试。", "detail": repr(exc)},
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        raise SystemExit(1)
