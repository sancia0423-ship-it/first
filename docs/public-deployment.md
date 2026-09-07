# 上线到自己的域名

目标：一个真正对外的网站（不是 GitHub Pages），有自己的域名和 HTTPS。

## 为什么是 Railway

YouTube 字幕那条链路会在 Node 进程里调用本地 Python 脚本（yt-dlp + deep-translator），
所以需要一个能跑 **完整容器** 且允许 **长时请求** 的平台。

| 平台 | 能否直接跑 | 说明 |
| --- | --- | --- |
| Railway | 可以 | 识别 `Dockerfile`，Python 一起打进镜像。约 $5/月起 |
| Render | 可以 | 同样跑 Docker。免费档会休眠，首次访问很慢，所以要付费档，$7/月起 |
| Fly.io | 可以 | 也跑 Docker，配置比前两个繁琐一些 |
| Vercel | 不行 | 无法在函数里跑 yt-dlp 子进程，需要先把抓字幕改成外部服务 |

域名另算，`.com` 大约 $10–15/年（Cloudflare Registrar 按成本价卖，不加价，推荐）。

> 注册账号、绑定信用卡、购买域名这几步需要你自己操作 —— 这类涉及支付和账号的动作我不能代做。
> 下面每一步都写清楚了点哪里、填什么。

---

## 一、准备仓库

```bash
git push origin main
```

确认根目录有这几个文件（都已经在仓库里了）：

- `Dockerfile` — 多阶段构建，Node 22 + Python 依赖分层，非 root 用户运行
- `railway.json` — 健康检查指向 `/api/health`
- `requirements.txt` — yt-dlp / deep-translator
- `.dockerignore`

本地先验证一次镜像能起来，能省掉很多线上排查：

```bash
npm run docker:build && npm run docker:run
```

打开 `http://localhost:3000`，确认首页和 `/api/health` 都正常。

---

## 二、Railway 部署

1. 打开 railway.com 用 GitHub 账号登录
2. `New Project` → `Deploy from GitHub repo` → 选中这个仓库
3. Railway 检测到 `Dockerfile`，会自动按容器构建（不要选 Nixpacks）
4. 打开服务的 `Variables` 面板，配置环境变量（见下一节）
5. 等待首次构建完成，Railway 会给一个 `*.up.railway.app` 的临时地址
6. 打开 `https://<临时地址>/api/health`，返回 `{"ok":true,...}` 就算成功

### 环境变量

必填：

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://你的域名` | 决定 sitemap、robots 和分享卡片里的绝对地址 |

强烈建议填（公网暴露 API 之后）：

| 变量 | 值 | 说明 |
| --- | --- | --- |
| `API_KEYS` | 逗号分隔的随机字符串 | 不填则 `/api/v1/*` 对所有人开放 |

可选：

| 变量 | 说明 |
| --- | --- |
| `OPENAI_API_KEY` | 不填站点照样能跑，只是走规则抽取 + 本地翻译 |
| `OPENAI_MODEL` | 默认 `gpt-5.2` |

生成 API key：

```bash
openssl rand -hex 24
```

其余可调参数（超时、限流、字幕条数上限）见 `.env.example`，一般不用改。

---

## 三、绑定自己的域名

### 1. 买域名

推荐 Cloudflare Registrar（按成本价，不加价，含隐私保护）。
Namecheap、Porkbun 也可以。

### 2. 在 Railway 添加域名

`Settings` → `Networking` → `Custom Domain` → 填入你的域名，
Railway 会给出一条 `CNAME` 记录。

### 3. 在域名商配置 DNS

| 类型 | 名称 | 值 |
| --- | --- | --- |
| CNAME | `www` | Railway 给的目标地址 |
| CNAME 或 ALIAS | `@` | 同上（根域名，Cloudflare 支持 CNAME flattening） |

用 Cloudflare 的话，代理开关（小云朵）建议先设成 `DNS only`，
证书签发成功后再决定是否打开代理。

### 4. 等证书

Railway 会自动签发 Let's Encrypt 证书，通常几分钟内完成。
面板上域名状态变成 `Active` 即可。

### 5. 回填站点地址

把 `NEXT_PUBLIC_SITE_URL` 改成正式域名，重新部署一次，
让 `sitemap.xml` 和 `robots.txt` 里的绝对地址正确。

---

## 四、上线后自查

```bash
BASE=https://你的域名

curl -s $BASE/api/health
curl -s $BASE/api/v1/health          # 看 authRequired / aiEnhanced 是否符合预期
curl -s $BASE/robots.txt
curl -s $BASE/sitemap.xml | head
curl -s -o /dev/null -w "%{http_code}\n" $BASE/api/v1/interview/briefing   # 配了 key 应该返回 401
```

MCP server 也连一次真实线上环境：

```bash
SANCIA_API_BASE_URL=https://你的域名 SANCIA_API_KEY=你的key npm run mcp:smoke
```

---

## 五、成本与注意事项

- Railway 按用量计费，这个站点的量级通常在最低档附近
- 仓库里 `public/docs/` 有约 61MB 的 PDF，会一起打进镜像并占带宽；
  如果要压缩镜像和构建时间，可以把这些文件迁到对象存储
- 文件缓存（`.cache/pipeline`）写在容器内，实例重启即丢失；
  限流也是单实例内存态。扩到多实例时这两块需要换成 Redis 之类的共享存储
- `/api/v1/*` 每次调用都可能触发 OpenAI 请求，配 `API_KEYS` 是控制成本的第一道闸
