"use client";

import { useEffect } from "react";

/**
 * 把指针位置写成 CSS 变量 --mx / --my（范围 -1 ~ 1），交给样式表去用。
 *
 * 为什么不直接在 JS 里设 transform：那样每个元素的动效都得写进脚本，
 * 改一次视觉要改两个地方。只写两个变量，元素怎么响应完全由 CSS 决定 ——
 * 加一个会视差的元素不需要动这里。
 *
 * 三个不启用的情况：
 * - 用户开了「减少动效」
 * - 粗指针设备（手机平板）：没有悬停概念，跟手位移只会让页面显得抖
 * - 窗口很窄：小屏上视差位移会把元素推出边界
 */
export function PointerDepth() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 760px)");

    let raf = 0;
    let active = false;

    const onMove = (event: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const x = (event.clientX / window.innerWidth - 0.5) * 2;
        const y = (event.clientY / window.innerHeight - 0.5) * 2;
        const root = document.documentElement;
        root.style.setProperty("--mx", x.toFixed(3));
        root.style.setProperty("--my", y.toFixed(3));
      });
    };

    const sync = () => {
      const shouldRun = !reduced.matches && !coarse.matches && !narrow.matches;
      if (shouldRun === active) return;
      active = shouldRun;

      if (shouldRun) {
        window.addEventListener("pointermove", onMove, { passive: true });
        document.documentElement.classList.add("depth-on");
      } else {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.classList.remove("depth-on");
        // 退出时归零，否则元素会停在最后一次偏移的位置上
        document.documentElement.style.setProperty("--mx", "0");
        document.documentElement.style.setProperty("--my", "0");
      }
    };

    sync();
    reduced.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    narrow.addEventListener("change", sync);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      reduced.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
      narrow.removeEventListener("change", sync);
      document.documentElement.classList.remove("depth-on");
    };
  }, []);

  return null;
}
