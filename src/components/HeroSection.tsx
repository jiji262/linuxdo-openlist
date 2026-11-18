import { ArrowDown, Dices, Github, GitFork, Heart, Eye, Sparkles } from "lucide-react";
import type { ProjectsDataset } from "../types";
import { formatCompactNumber, formatShortDate } from "../utils/format";

interface HeroSectionProps {
  stats: ProjectsDataset["stats"] | null;
  updatedAt: string | null;
  onExplore: () => void;
  onRandomPick: () => void;
}

export function HeroSection({ stats, updatedAt, onExplore, onRandomPick }: HeroSectionProps) {
  return (
    <section className="hero-backdrop relative border-b-2 border-border pt-12 pb-16 sm:pt-16 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Status Badge */}
          <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border-2 border-border bg-card px-4 py-1.5 text-xs font-bold shadow-hard-sm sm:text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
            <span>
              同步自 LINUX DO <span className="font-mono text-primary">#开源推广</span> 全部历史帖
            </span>
            {updatedAt && (
              <span className="hidden border-l border-border pl-2.5 font-mono text-xs text-muted-foreground sm:inline">
                更新于 {formatShortDate(updatedAt)}
              </span>
            )}
          </div>

          {/* Two-tone Oversized Headline (hapi.run signature style) */}
          <h1 className="text-4xl leading-[1.08] font-black tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block text-foreground">Open Source Vibes</span>
            <span className="mt-2 block text-primary">
              汇聚佬友创造，点亮开源灵感
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed font-semibold text-muted-foreground sm:text-xl">
            完整收录 <code className="rounded-lg border border-border bg-muted px-2 py-0.5 font-mono text-sm text-foreground">linux.do/tag/2234-tag/2234</code> 下的每一个社区开源发布帖，清晰整理项目创建时间、核心功能介绍与对应的开源仓库地址。免登录即刻检索、直达源码。
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3.5">
            <button
              type="button"
              onClick={onExplore}
              className="tactile-btn inline-flex items-center gap-2 rounded-3xl bg-primary px-6 py-3.5 text-base font-extrabold text-primary-foreground cursor-pointer"
            >
              <span>开始探索项目库</span>
              <ArrowDown className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onRandomPick}
              className="tactile-btn inline-flex items-center gap-2 rounded-3xl bg-card px-5 py-3.5 text-base font-extrabold text-foreground cursor-pointer"
            >
              <Dices className="h-4 w-4 text-primary" />
              <span>手气不错 · 随机逛逛</span>
            </button>

            <a
              href="https://github.com/jiji262/linuxdo-openlist"
              target="_blank"
              rel="noopener noreferrer"
              className="tactile-btn inline-flex items-center gap-2 rounded-3xl bg-card px-5 py-3.5 text-base font-extrabold text-foreground"
            >
              <Github className="h-4 w-4" />
              <span>GitHub 仓库</span>
            </a>
          </div>
        </div>

        {/* 4 Tactile Metric Bento Cards */}
        <div className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="tactile-card rounded-2xl bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground sm:text-sm">收录开源帖总数</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-border bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              {stats ? stats.totalTopics.toLocaleString() : "—"}
            </div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">
              覆盖全部 #2234 历史归档
            </div>
          </div>

          <div className="tactile-card rounded-2xl bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground sm:text-sm">独立开源仓库地址</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-border bg-primary/15 text-primary">
                <GitFork className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              {stats ? stats.uniqueReposCount.toLocaleString() : "—"}
            </div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">
              {stats ? `${stats.withRepoCount.toLocaleString()} 篇含直达源码链接` : "GitHub / GitLab / Gitee 等"}
            </div>
          </div>

          <div className="tactile-card rounded-2xl bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground sm:text-sm">社区累计获赞</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-border bg-primary/15 text-primary">
                <Heart className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              {stats ? formatCompactNumber(stats.totalLikes) : "—"}
            </div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">
              来自 {stats ? stats.totalAuthors.toLocaleString() : "—"} 位开源创作者
            </div>
          </div>

          <div className="tactile-card rounded-2xl bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground sm:text-sm">累计帖子浏览量</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-border bg-primary/15 text-primary">
                <Eye className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-3 font-mono text-2xl font-bold tracking-tight sm:text-3xl">
              {stats ? formatCompactNumber(stats.totalViews) : "—"}
            </div>
            <div className="mt-1 text-xs font-semibold text-muted-foreground">
              活跃开发者真实反馈与共建
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
