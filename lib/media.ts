import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

/**
 * 检查 public/ 下的某个文件是否真的存在。
 *
 * 用途：照片和视频这类资源由作者后续补进来，在文件到位之前，对应版块应当
 * 整块不渲染，而不是留下一个裂图或者空的播放器。检查在构建期执行。
 */
export function publicFileExists(publicPath: string) {
  if (!publicPath) {
    return false;
  }

  const relative = publicPath.replace(/^\/+/, "");

  // 不允许跳出 public/ 目录。
  if (relative.includes("..")) {
    return false;
  }

  return existsSync(path.join(process.cwd(), "public", relative));
}
