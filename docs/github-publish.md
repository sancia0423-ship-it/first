# GitHub Publish

如果你要把这个项目作为独立仓库发到 GitHub，按下面这套最短流程就够了。

## 本地初始化

如果仓库已经初始化过，可以跳过这一步。

```bash
cd /Users/sancia/Documents/Playground/interview-intel-mvp
git init -b main
git add .
git commit -m "Initial public-ready MVP"
```

## 在 GitHub 创建仓库

1. 打开 GitHub。
2. 点击 `New repository`。
3. 仓库名建议用：
   - `youtube-translate-agent`
   - 或 `interview-intel-mvp`
4. 建议先选：
   - `Private`
5. 不要勾选自动生成 `README`、`.gitignore` 或 `license`。

## 绑定远程并推送

把下面的 `<YOUR_REPO_URL>` 换成 GitHub 仓库地址：

```bash
cd /Users/sancia/Documents/Playground/interview-intel-mvp
git remote add origin <YOUR_REPO_URL>
git push -u origin main
```

HTTPS 例子：

```bash
git remote add origin https://github.com/your-name/interview-intel-mvp.git
```

SSH 例子：

```bash
git remote add origin git@github.com:your-name/interview-intel-mvp.git
```

## 推到 GitHub 之后

1. 去 Railway 或 Render 导入这个 GitHub 仓库。
2. 配置环境变量：
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
3. 让平台按 `Dockerfile` 构建。
4. 健康检查路径填：
   - `/api/health`

## 建议

第一版先用 `Private` 仓库。

等你确认：

- 页面可正常访问
- YouTube 翻译链路稳定
- 环境变量没问题

再切成 `Public` 会更稳。
