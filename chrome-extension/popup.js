const PRODUCT_URL = "https://sancia-aboutme.com/tools/youtube";

const input = document.getElementById("video-url");
const status = document.getElementById("status");
const openButton = document.getElementById("open");

function normalizedYouTubeUrl(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (url.pathname === "/watch" && url.searchParams.get("v")) {
        return `https://www.youtube.com/watch?v=${encodeURIComponent(url.searchParams.get("v"))}`;
      }
      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/live/")) {
        const id = url.pathname.split("/").filter(Boolean)[1];
        return id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function validate() {
  const normalized = normalizedYouTubeUrl(input.value);
  openButton.disabled = !normalized;
  status.classList.toggle("error", Boolean(input.value.trim()) && !normalized);
  status.textContent = normalized
    ? "已识别视频链接，可以继续。"
    : input.value.trim()
      ? "请输入有效的 YouTube 视频链接。"
      : "请打开一个 YouTube 视频，或粘贴视频链接。";
  return normalized;
}

input.addEventListener("input", validate);
openButton.addEventListener("click", async () => {
  const videoUrl = validate();
  if (!videoUrl) return;
  const destination = `${PRODUCT_URL}?url=${encodeURIComponent(videoUrl)}#video-input`;
  await chrome.tabs.create({ url: destination });
  window.close();
});

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const current = normalizedYouTubeUrl(tab?.url || "");
  if (current) input.value = current;
  validate();
});
