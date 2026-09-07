import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildVideoOverview,
  explainSelection,
  translateSegmentsInBrowser
} from "../lib/browser-translate";

/** 让被测代码以为拿到了服务商的一次正常响应。 */
function mockCompletion(content: unknown) {
  return vi.fn(async () =>
    new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  );
}

const config = { apiKey: "test-key", provider: "openai" as const, model: "gpt-4o-mini" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("buildVideoOverview", () => {
  const segments = [
    { startMs: 0, text: "开场" },
    { startMs: 18640, text: "规则" },
    { startMs: 42000, text: "永远不会" },
    { startMs: 150000, text: "结尾" }
  ];

  it("snaps timestamps onto real captions", async () => {
    // 模型给出的时间戳不一定落在真实字幕上；照搬会让用户点了跳到空白处。
    vi.stubGlobal(
      "fetch",
      mockCompletion({
        summary: "速览",
        chapters: [
          { startMs: 41999, title: "差一毫秒", summary: "" },
          { startMs: 999999, title: "远超范围", summary: "" },
          { startMs: -5000, title: "负数", summary: "" }
        ],
        quotes: []
      })
    );

    const overview = await buildVideoOverview(segments, config);
    const starts = overview.chapters.map((chapter) => chapter.startMs);

    expect(starts).toEqual([0, 42000, 150000]);
    expect(starts.every((value) => segments.some((s) => s.startMs === value))).toBe(true);
  });

  it("orders chapters and quotes by time", async () => {
    vi.stubGlobal(
      "fetch",
      mockCompletion({
        summary: "速览",
        chapters: [
          { startMs: 150000, title: "尾", summary: "" },
          { startMs: 0, title: "头", summary: "" }
        ],
        quotes: [
          { startMs: 42000, text: "b", why: "" },
          { startMs: 18640, text: "a", why: "" }
        ]
      })
    );

    const overview = await buildVideoOverview(segments, config);
    expect(overview.chapters.map((c) => c.title)).toEqual(["头", "尾"]);
    expect(overview.quotes.map((q) => q.text)).toEqual(["a", "b"]);
  });

  it("drops entries with no title or text", async () => {
    vi.stubGlobal(
      "fetch",
      mockCompletion({
        chapters: [{ startMs: 0, title: "", summary: "空标题" }, { startMs: 0, title: "有效" }],
        quotes: [{ startMs: 0, why: "没有正文" }]
      })
    );

    const overview = await buildVideoOverview(segments, config);
    expect(overview.chapters).toHaveLength(1);
    expect(overview.quotes).toHaveLength(0);
  });

  it("samples long transcripts across the whole video, not just the start", async () => {
    const long = Array.from({ length: 4000 }, (_, index) => ({
      startMs: index * 1000,
      text: "这是一句足够长的字幕内容用来撑开字符预算"
    }));

    const fetchMock = mockCompletion({ summary: "", chapters: [], quotes: [] });
    vi.stubGlobal("fetch", fetchMock);

    await buildVideoOverview(long, config);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    const sent = JSON.parse(body.messages[1].content).captions as Array<{ startMs: number }>;

    expect(sent.length).toBeLessThan(long.length);
    // 关键：抽样必须覆盖到结尾，截断的话章节就只会集中在开头。
    expect(sent[sent.length - 1].startMs).toBeGreaterThan(long[long.length - 1].startMs * 0.9);
  });

  it("reports a readable error when the key is rejected", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: { message: "Incorrect API key provided" } }), {
          status: 401
        })
      )
    );

    await expect(buildVideoOverview(segments, config)).rejects.toThrow("Incorrect API key");
  });
});

describe("translateSegmentsInBrowser", () => {
  it("keeps the source text for segments the model skipped", async () => {
    vi.stubGlobal("fetch", mockCompletion({ items: [{ id: "seg-1", text: "译文一" }] }));

    const { translations, translatedCount } = await translateSegmentsInBrowser(
      [
        { id: "seg-1", sourceText: "one" },
        { id: "seg-2", sourceText: "two" }
      ],
      config
    );

    expect(translations).toEqual(["译文一", "two"]);
    expect(translatedCount).toBe(1);
  });

  it("refuses to run without a key", async () => {
    await expect(
      translateSegmentsInBrowser([{ id: "seg-1", sourceText: "one" }], { ...config, apiKey: "" })
    ).rejects.toThrow("还没有填写 API key");
  });
});

describe("explainSelection", () => {
  it("passes the surrounding context along with the selection", async () => {
    const fetchMock = mockCompletion({ meaning: "意思", notes: ["用法"] });
    vi.stubGlobal("fetch", fetchMock);

    await explainSelection(
      { selection: "get it", context: "before get it after" },
      { apiKey: "k", provider: "openai", model: "gpt-4o-mini" }
    );

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(JSON.parse(init.body as string).messages[1].content);

    // 脱离上下文时 "get it" 有十几种意思，模型只能猜，所以上下文必须一起发。
    expect(sent.selection).toBe("get it");
    expect(sent.context).toContain("before");
  });

  it("rejects an empty selection before spending a request", async () => {
    const fetchMock = mockCompletion({});
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      explainSelection(
        { selection: "   ", context: "x" },
        { apiKey: "k", provider: "openai", model: "gpt-4o-mini" }
      )
    ).rejects.toThrow("请先选中一段字幕");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops non-string notes the model may return", async () => {
    vi.stubGlobal("fetch", mockCompletion({ meaning: "m", notes: ["ok", 42, null, "  "] }));

    const result = await explainSelection(
      { selection: "x", context: "y" },
      { apiKey: "k", provider: "openai", model: "gpt-4o-mini" }
    );

    expect(result.notes).toEqual(["ok"]);
  });
});
