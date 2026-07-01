import "server-only";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type RequestTextOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

async function requestText(url: string, options: RequestTextOptions = {}, timeoutSeconds = 20) {
  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
          ...options.headers
        },
        body: options.body,
        signal: controller.signal,
        cache: "no-store"
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }

      const text = await response.text();

      if (!text.trim()) {
        throw new Error(`empty response from ${url}`);
      }

      return text;
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await sleep(350 * (attempt + 1));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`failed to fetch ${url}`);
}

export async function getHtml(url: string, timeoutSeconds = 20) {
  return requestText(url, {}, timeoutSeconds);
}

export async function postJsonText(url: string, payload: unknown, timeoutSeconds = 20) {
  return requestText(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://juejin.cn/"
      },
      body: JSON.stringify(payload)
    },
    timeoutSeconds
  );
}
