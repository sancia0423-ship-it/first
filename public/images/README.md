把首页头像照片放在这个目录，命名为 `profile.jpg`（或 .png / .webp，
改 lib/personal-site-content.ts 里 media.portrait.src 的后缀即可）。

建议：
- 短边不小于 800px，避免在高分屏上发虚
- 先压到 300KB 以内 —— 这个目录会整个打进 Docker 镜像
