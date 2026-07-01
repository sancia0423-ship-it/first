import { describe, expect, it } from "vitest";
import { buildSrt, parseYouTubeVideoId } from "../lib/youtube-agent";

describe("parseYouTubeVideoId", () => {
  it("parses watch urls", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses short urls", () => {
    expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("parses shorts urls", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("returns null for unsupported input", () => {
    expect(parseYouTubeVideoId("not a youtube url")).toBeNull();
  });
});

describe("buildSrt", () => {
  it("formats translated subtitles into srt", () => {
    expect(
      buildSrt([
        {
          startMs: 1500,
          endMs: 4250,
          translatedText: "第一句"
        },
        {
          startMs: 5000,
          endMs: 7600,
          translatedText: "第二句"
        }
      ])
    ).toBe(
      "1\n00:00:01,500 --> 00:00:04,250\n第一句\n\n2\n00:00:05,000 --> 00:00:07,600\n第二句"
    );
  });
});
