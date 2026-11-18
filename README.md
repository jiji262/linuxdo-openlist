# LINUX DO OpenList

> 完整收录 [LINUX DO 社区 `#开源推广#` 标签下](https://linux.do/tag/2234-tag/2234) 的全部开源项目发布帖，自动识别并合并同项目重复/迭代帖，清晰整理项目创建时间、功能介绍、对应的开源仓库地址与关联讨论帖时间线。

## 核心特性

- **全量归档与同项目多帖去重关联**：解析 `#开源推广#` 下的全部历史话题（5,645+ 篇），基于规范化仓库地址与作者+项目名亲和度算法合并为独立开源项目条目（4,800+ 个），并将同一项目的首发帖、版本更新帖全部关联在同一卡片详情时间线中。
- **Vercel Neon Postgres 数据库驱动**：所有独立项目（`projects`）、关联帖子明细（`project_posts`）、统计聚合（`site_stats`）与同步日志（`sync_runs`）均持久化于 Vercel 集成的 **Neon Serverless Postgres**，并通过边缘 CDN 缓存（`s-maxage=3600, stale-while-revalidate=86400` + Gzip 压缩）大幅节省免费额度。
- **每日增量自动同步（Vercel Cron）**：通过 `vercel.json` 配置每日定时任务（`0 2 * * *`，北京时间每日 10:00）增量拉取最新帖子并自动去重入库；同时支持本地 CLI 携带 `LINUXDO_COOKIE` 一键增量同步。
- **HAPI.run 灵感视觉与明暗双主题切换**：新锐触感设计语言（`Nunito` + `Space Mono` + 硬朗描边与立体偏移阴影），深色极客主题与浅色暖纸主题一键切换，免登录即刻检索。

## 本地运行与数据库同步

```bash
pnpm install
pnpm dev

# 初始化 / 全量导入 Neon Postgres 数据库
pnpm db:seed

# 增量同步最新 #开源推广# 帖子并自动去重合并至 Neon
LINUXDO_COOKIE="..." pnpm sync

# 构建生产包
pnpm build
```

## 技术栈

- **React 19 + TypeScript + Vite 6 + Tailwind CSS v4**
- **Neon Serverless Postgres (`@neondatabase/serverless`)**
- **Vercel Serverless Functions & Vercel Cron Jobs**
