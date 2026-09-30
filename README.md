# Clash 书签 · AstroPaper

采用 satnaing/astro-paper 6.1.0，保留原始 MIT LICENSE。中文官网入口、下载、手机版、电脑版、教程、博客六个栏目，以及关于、隐私、站内搜索、标签、归档和 RSS。

## 本地运行

Node.js 24，pnpm 11.19.0。

```powershell
pnpm install --frozen-lockfile
pnpm build
pnpm preview --host 127.0.0.1 --port 4193
```

默认预览地址 http://127.0.0.1:4193/clash-astropaper/ 。需根路径本地预览时在当前会话设置 `$env:BASE_PATH='/'` 后构建。SITE_URL 为正式域名或 GitHub Pages 源站，BASE_PATH 为仓库路径。默认正式地址 https://cordherald39.github.io/clash-astropaper/ 。

## 内容维护

文章位于 src/content/posts/*.md，栏目位于 src/content/pages/*.md。修改后构建自动更新正文、博客、标签、RSS、sitemap 和 Pagefind 搜索索引。文章前置信息包含 title、description、pubDatetime、modDatetime、tags、draft。draft=true 不发布。

统一内容导入：`node scripts/import-content.mjs article.json`。支持 published/draft 状态，先校验完整输入再原子替换原生 Markdown。来源链接追加至正文。

## GitHub Pages

仓库 Actions 使用官方 Pages artifact/deploy 流程，在仓库 Settings → Pages 选择 GitHub Actions。工作流读取 SITE_URL 仓库变量（默认 GitHub 用户域名），BASE_PATH 来自 configure-pages。启用自定义域名时同步 SITE_URL 与 Pages 设置，不保留仓库路径。

软件下载直达客户端开发者 Releases。文章依据所列开发文档编写，不声称软件官方授权或设备实测。
