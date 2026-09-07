把个人视频放在这个目录，命名为 `intro.mp4`。

注意体积：视频会打进 Docker 镜像，直接影响构建时间和部署速度。
建议控制在 20MB 以内（1080p / H.264 / 约 2Mbps，两分钟左右）。

如果原片较大，可以先压：
  ffmpeg -i 原片.mp4 -vcodec libx264 -crf 28 -preset slow -acodec aac -b:a 128k intro.mp4

可选：再放一张 `intro-poster.jpg` 作为封面图，视频加载前显示。
