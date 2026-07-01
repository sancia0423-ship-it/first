# Public Deployment

这个项目现在已经适合部署成一个对外公开的网站。

## 推荐平台

优先推荐：

- Railway
- Render

不优先推荐：

- Vercel

原因是当前 YouTube 翻译链路会在 Node 进程里调用本地 Python 回退脚本，所以更适合用 Docker 容器整体部署。

## 部署前准备

1. 把项目推到 GitHub。
2. 确保根目录包含以下文件：
   - `Dockerfile`
   - `requirements.txt`
   - `.dockerignore`
   - `railway.json`
3. 准备好环境变量：
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`

如果你暂时不配置 `OPENAI_API_KEY`，网站仍然能运行，但 YouTube 翻译会走 Python + Google 回退翻译。

## Railway

1. 在 Railway 新建项目。
2. 选择 `Deploy from GitHub repo`。
3. 指向本仓库根目录。
4. Railway 检测到 `Dockerfile` 后会直接按容器方式构建。
5. 在变量面板配置：
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
6. 仓库里的 `railway.json` 会自动声明 Dockerfile 构建和 `/api/health` 健康检查。
7. 部署完成后，打开分配的 `*.up.railway.app` 域名。
8. 如果要绑定自定义域名，在 Railway 的域名设置里添加你的域名并按提示配置 DNS。

## Render

1. 在 Render 新建 `Web Service`。
2. 连接 GitHub 仓库。
3. Runtime 选择 `Docker`。
4. Root Directory 留空，直接使用项目根目录。
5. 配置环境变量：
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
6. Health Check Path 填：
   - `/api/health`
7. 部署完成后，打开 Render 分配的公开域名。
8. 如果要绑定自定义域名，在 Render 的自定义域名设置里添加你的域名并按提示配置 DNS。

## 本地容器自测

如果你本机装了 Docker，可以在项目根目录执行：

```bash
docker build -t interview-intel-mvp .
docker run --rm -p 3000:3000 --env-file .env.local interview-intel-mvp
```

然后访问：

- `http://localhost:3000`
- `http://localhost:3000/youtube`
- `http://localhost:3000/api/health`

## 当前上线边界

当前公开站点支持：

- 模拟面试
- 面经情报检索
- YouTube 字幕翻译
- 中文 SRT 下载
- 浏览器本地中文跟读

当前不包含：

- 重新混音生成真正的中文配音音轨
- 无字幕视频的完整语音识别流程

如果后面要继续升级，可以把这套站点拆成：

1. Web 前端 + Next.js API
2. 独立的音视频处理 worker
3. 对象存储和任务队列
