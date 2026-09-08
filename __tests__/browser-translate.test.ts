import { afterEach, describe, expect, it, vi } from "vitest";
import {
  askAboutContent,
  buildQuiz,
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

const config = {
  apiKey: "test-key",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-5.6-luna",
  label: "OpenAI"
};

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

  it("sends a whole interview-length transcript without sampling", async () => {
    // 一部 1.5 小时访谈约 14 万字符。抽样是给更长的视频兜底的，这个长度应当完整送出。
    const interview = Array.from({ length: 1500 }, (_, index) => ({
      startMs: index * 4000,
      text: "这是一句访谈字幕"
    }));

    const fetchMock = mockCompletion({ summary: "", chapters: [], quotes: [] });
    vi.stubGlobal("fetch", fetchMock);
    await buildVideoOverview(interview, config);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(JSON.parse(init.body as string).messages[1].content).captions;

    expect(sent.length).toBe(interview.length);
  });

  it("samples across the whole video once past the budget", async () => {
    const huge = Array.from({ length: 20000 }, (_, index) => ({
      startMs: index * 1000,
      text: "这是一句足够长的字幕内容用来撑开字符预算"
    }));

    const fetchMock = mockCompletion({ summary: "", chapters: [], quotes: [] });
    vi.stubGlobal("fetch", fetchMock);
    await buildVideoOverview(huge, config);

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(JSON.parse(init.body as string).messages[1].content)
      .captions as Array<{ startMs: number }>;

    expect(sent.length).toBeLessThan(huge.length);
    // 关键：抽样必须覆盖到结尾，截断的话章节就只会集中在开头。
    expect(sent[sent.length - 1].startMs).toBeGreaterThan(huge[huge.length - 1].startMs * 0.9);
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
      { ...config, apiKey: "k" }
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
        { ...config, apiKey: "k" }
      )
    ).rejects.toThrow("请先选中一段字幕");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("drops non-string notes the model may return", async () => {
    vi.stubGlobal("fetch", mockCompletion({ meaning: "m", notes: ["ok", 42, null, "  "] }));

    const result = await explainSelection(
      { selection: "x", context: "y" },
      { ...config, apiKey: "k" }
    );

    expect(result.notes).toEqual(["ok"]);
  });
});

describe("incremental translation", () => {
  it("reports each batch as it lands, so long videos can render progressively", async () => {
    // 一部 1.5 小时的访谈约 1500 条；等全部翻完再显示要好几分钟。
    const segments = Array.from({ length: 90 }, (_, index) => ({
      id: `seg-${index + 1}`,
      sourceText: `line ${index + 1}`
    }));

    let call = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        const sent = JSON.parse(JSON.parse(init.body as string).messages[1].content);
        call += 1;
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    items: sent.items.map((item: { id: string }) => ({
                      id: item.id,
                      text: `译-${item.id}`
                    }))
                  })
                }
              }
            ]
          }),
          { status: 200 }
        );
      })
    );

    const partials: number[] = [];
    const { translations, translatedCount } = await translateSegmentsInBrowser(segments, {
      ...config,
      onPartial: (partial) => partials.push(Object.keys(partial).length)
    });

    expect(translatedCount).toBe(90);
    expect(translations[0]).toBe("译-seg-1");
    expect(translations[89]).toBe("译-seg-90");
    // 90 条 / 每批 40 条 = 3 批，所以应当分三次回传而不是最后一次性给出。
    expect(partials.length).toBe(3);
    expect(partials.reduce((sum, n) => sum + n, 0)).toBe(90);
    expect(call).toBe(3);
  });
});

describe("temperature compatibility", () => {
  it("retries without temperature when the model rejects it", async () => {
    // 较新的模型只接受默认温度，传 0 会直接 400 —— 但确定性对翻译有价值，
    // 所以先带上，被拒后重试，而不是一律不传。
    const bodies: string[] = [];
    let call = 0;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        bodies.push(init.body as string);
        call += 1;

        if (call === 1) {
          return new Response(
            JSON.stringify({
              error: {
                message:
                  "Unsupported value: 'temperature' does not support 0 with this model. Only the default (1) value is supported."
              }
            }),
            { status: 400 }
          );
        }

        return new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify({ meaning: "意思", notes: [] }) } }]
          }),
          { status: 200 }
        );
      })
    );

    const result = await explainSelection(
      { selection: "x", context: "y" },
      { ...config, model: "picky-model" }
    );

    expect(result.meaning).toBe("意思");
    expect(call).toBe(2);
    expect(JSON.parse(bodies[0])).toHaveProperty("temperature", 0);
    expect(JSON.parse(bodies[1])).not.toHaveProperty("temperature");
  });

  it("skips temperature on later calls to a model already known to reject it", async () => {
    const bodies: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        bodies.push(init.body as string);
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: JSON.stringify({ meaning: "m", notes: [] }) } }]
          }),
          { status: 200 }
        );
      })
    );

    // 上一个用例已经把 picky-model 记下了，这次应当一次就成功且不带 temperature。
    await explainSelection({ selection: "x", context: "y" }, { ...config, model: "picky-model" });

    expect(bodies).toHaveLength(1);
    expect(JSON.parse(bodies[0])).not.toHaveProperty("temperature");
  });
});

describe("askAboutContent", () => {
  const segments = [
    { startMs: 0, text: "开场" },
    { startMs: 30000, text: "他讲了扩展法则" },
    { startMs: 90000, text: "结尾" }
  ];

  it("snaps citation timestamps onto real captions", async () => {
    vi.stubGlobal(
      "fetch",
      mockCompletion({
        answer: "他在中段讲了扩展法则。",
        citations: [{ startMs: 29999, quote: "他讲了扩展法则" }]
      })
    );

    const result = await askAboutContent({ question: "他讲了什么", segments }, config);

    expect(result.answer).toContain("扩展法则");
    expect(result.citations[0].startMs).toBe(30000);
  });

  it("refuses an empty question before spending a request", async () => {
    const fetchMock = mockCompletion({});
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      askAboutContent({ question: "  ", segments }, config)
    ).rejects.toThrow("请先输入问题");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps an answer that cites nothing", async () => {
    // 字幕里没讲到时模型应当直说，这种回答同样有价值，不该被丢掉。
    vi.stubGlobal("fetch", mockCompletion({ answer: "字幕里没有讲到这一点。", citations: [] }));

    const result = await askAboutContent({ question: "他提到价格了吗", segments }, config);
    expect(result.answer).toContain("没有讲到");
    expect(result.citations).toEqual([]);
  });
});

describe("buildQuiz", () => {
  const segments = [
    { startMs: 0, text: "一" },
    { startMs: 10000, text: "二" }
  ];

  it("drops questions whose answer index is out of range", async () => {
    // 一道点不出正确答案的题比没有这道题更糟。
    vi.stubGlobal(
      "fetch",
      mockCompletion({
        questions: [
          { question: "好题", options: ["A", "B"], answerIndex: 1, explanation: "", startMs: 0 },
          { question: "越界", options: ["A", "B"], answerIndex: 5, explanation: "", startMs: 0 },
          { question: "选项不足", options: ["A"], answerIndex: 0, explanation: "", startMs: 0 },
          { question: "", options: ["A", "B"], answerIndex: 0, explanation: "", startMs: 0 }
        ]
      })
    );

    const quiz = await buildQuiz(segments, config);

    expect(quiz).toHaveLength(1);
    expect(quiz[0].question).toBe("好题");
  });

  it("limits the number of questions to what was asked for", async () => {
    vi.stubGlobal(
      "fetch",
      mockCompletion({
        questions: Array.from({ length: 9 }, (_, index) => ({
          question: `题 ${index}`,
          options: ["A", "B"],
          answerIndex: 0,
          explanation: "",
          startMs: 0
        }))
      })
    );

    expect(await buildQuiz(segments, { ...config, count: 3 })).toHaveLength(3);
  });
});
