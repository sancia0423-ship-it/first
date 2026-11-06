import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
await mkdir(path.join(root, "icons"), { recursive: true });

for (const size of [16, 32, 48, 128]) {
  await sharp(path.join(root, "icon-source.svg"))
    .resize(size, size)
    .png()
    .toFile(path.join(root, "icons", `icon-${size}.png`));
}
