/** SRT 字幕格式化。服务端和浏览器端都会用，所以不依赖任何服务端能力。 */

function formatSrtTimestamp(ms: number) {
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const milliseconds = ms % 1000;

  return (
    [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":") +
    `,${String(milliseconds).padStart(3, "0")}`
  );
}

export function buildSrt(
  segments: Array<{ startMs: number; endMs: number; translatedText: string }>
) {
  return segments
    .map(
      (segment, index) =>
        `${index + 1}\n${formatSrtTimestamp(segment.startMs)} --> ${formatSrtTimestamp(segment.endMs)}\n${segment.translatedText}`
    )
    .join("\n\n");
}
