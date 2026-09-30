# Clash 书签 · 自设计版

使用 Astro 静态构建、原有 Markdown 文章格式与 Pagefind 搜索。2026-09-30 改为自设计的米白与珊瑚书签界面；活跃页面不再导入 AstroPaper 的 global.css、theme.css、typography.css 或 Tailwind 主题。新版布局与响应式样式位于 src/styles/studio.css，各页面及组件使用自写结构。

原上游代码的 LICENSE 保留。改版前源码备份位于工作区私密维护教程/redesign-backups/35-AstroPaper-20260930-141649.zip，排除依赖、Git 与构建输出。

## 本地构建和预览

```powershell
pnpm install --frozen-lockfile
pnpm build
node scripts/check-site.mjs
pnpm preview --host 127.0.0.1 --port 4203
```

默认地址 http://127.0.0.1:4203/，本地根路径预览设置 noindex，robots 禁止收录。本站本轮只在本地修改，不执行推送、部署或远程配置。

## 内容和页面

保留 6 篇文章，路径 src/content/posts；官网入口、下载、手机版、电脑版、教程、关于与隐私的内容在 src/content/pages。原有 /posts/、/posts/:slug/、/tags/、/archives/、/search/、/rss.xml 与各栏目路由保留。构建时生成静态正文、canonical、sitemap、RSS 和 Pagefind 搜索索引。

导入接口保持 `node scripts/import-content.mjs article.json`，接收统一 JSON 并校验 slug、ISO 日期、状态与来源 URL，再原子写入 Markdown。draft 为 true 时不发布文章。

如以后正式发布，SITE_URL 控制网站来源地址，BASE_PATH 控制 GitHub Pages 仓库子路径；显式非本地 SITE_URL 才允许索引。本轮没有执行这些发布操作。


## 2026-09-30 青色知识书架设计

本地预览端口 4203。首页采用真实搜索表单、四个主题入口、设备导航与教程书架；内页使用统一青色阅读样式。活跃样式为 src/styles/studio.css，不依赖原主题样式。保留 6 篇文章、24 个 HTML 路由、Pagefind 搜索及 import-content 接口。此轮仅本地构建，预览维持 noindex，不推送或部署。
