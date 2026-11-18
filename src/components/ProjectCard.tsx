import { useState } from "react";
import {
  ExternalLink,
  Heart,
  Eye,
  MessageSquare,
  Calendar,
  Copy,
  Check,
  Github,
  Code2,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import type { ProjectItem } from "../types";
import {
  formatDateTime,
  formatRelativeTime,
  formatCompactNumber,
  getHostLabel,
} from "../utils/format";

interface ProjectCardProps {
  item: ProjectItem;
  viewMode: "grid" | "list";
  selectedTag: string | null;
  onSelectTag: (tag: string) => void;
  onSelectProject: (item: ProjectItem) => void;
}

export function ProjectCard({
  item,
  viewMode,
  selectedTag,
  onSelectTag,
  onSelectProject,
}: ProjectCardProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (viewMode === "list") {
    return (
      <article
        onClick={() => onSelectProject(item)}
        className="tactile-card group flex cursor-pointer flex-col gap-3 rounded-2xl bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-border bg-primary/15 px-2 py-0.5 text-[11px] font-extrabold text-primary">
              {item.category}
            </span>
            <h3 className="truncate text-base font-extrabold group-hover:text-primary sm:text-lg">
              {item.name}
            </h3>
            {item.postCount > 1 && (
              <span
                title={`该项目共关联 ${item.postCount} 篇社区发布/更新帖，点击查看全部`}
                className="inline-flex items-center gap-1 rounded-lg border border-primary/50 bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-extrabold text-primary"
              >
                <Layers className="h-3 w-3 shrink-0" />
                <span>关联 {item.postCount} 篇帖子</span>
              </span>
            )}
            {item.repoSlug && (
              <span className="inline-flex max-w-[260px] items-center gap-1 rounded-lg border border-border bg-muted px-2 py-0.5 font-mono text-xs font-bold">
                <Github className="h-3 w-3 shrink-0 text-primary" />
                <span className="truncate">{item.repoSlug}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {formatDateTime(item.createdAt)}
            </span>
          </div>

          <p className="mt-1.5 line-clamp-1 text-sm text-muted-foreground">
            {item.summary}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-3 font-mono text-xs font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-primary">
              <Heart className="h-3.5 w-3.5" />
              {formatCompactNumber(item.likes)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatCompactNumber(item.views)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {item.repoUrl ? (
              <a
                href={item.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-xl border-2 border-border bg-primary px-3 py-1.5 text-xs font-extrabold text-primary-foreground"
              >
                <span>开源仓库</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <a
                href={item.topicUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-xl border-2 border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground"
              >
                <span>原帖地址</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onSelectProject(item)}
      className="tactile-card group flex cursor-pointer flex-col justify-between overflow-hidden rounded-3xl bg-card"
    >
      <div>
        {/* Optional Thumbnail Header */}
        {item.image && !imgError && (
          <div className="relative h-40 w-full overflow-hidden border-b-2 border-border bg-muted">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}

        <div className="p-5">
          {/* Category, Host & Relative Time Row */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-xl border border-border bg-primary/15 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                {item.category}
              </span>
              {item.repoHost && (
                <span className="rounded-xl border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-bold">
                  {getHostLabel(item.repoHost)}
                </span>
              )}
              {item.postCount > 1 && (
                <span
                  title={`已合并关联 ${item.postCount} 篇同项目帖子，点击卡片查看全部关联帖`}
                  className="inline-flex items-center gap-1 rounded-xl border border-primary/50 bg-primary/15 px-2 py-0.5 font-mono text-[11px] font-extrabold text-primary"
                >
                  <Layers className="h-3 w-3 shrink-0" />
                  <span>关联 {item.postCount} 篇帖子</span>
                </span>
              )}
            </div>
            <span className="font-mono text-[11px] font-bold text-muted-foreground">
              {formatRelativeTime(item.createdAt)}
            </span>
          </div>

          {/* Post Creation Timestamp */}
          <div className="mb-2 flex items-center gap-1.5 font-mono text-xs font-bold text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <time
              dateTime={item.createdAt}
              title={
                item.postCount > 1 && item.firstCreatedAt
                  ? `首次发布于 ${formatDateTime(item.firstCreatedAt)}`
                  : "帖子创建时间"
              }
            >
              {item.postCount > 1 ? "最新发帖 " : "发布于 "}
              {formatDateTime(item.createdAt)}
            </time>
          </div>

          {/* Project Name & Original Post Title */}
          <h3 className="line-clamp-1 text-xl font-black tracking-tight group-hover:text-primary">
            {item.name}
          </h3>
          {item.title !== item.name && (
            <p className="mt-1 line-clamp-1 text-xs font-bold text-muted-foreground">
              {item.title}
            </p>
          )}

          {/* Repository Address Pill */}
          {item.repoUrl ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border-2 border-border bg-muted/65 px-3 py-1.5">
              <a
                href={item.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex min-w-0 items-center gap-1.5 font-mono text-xs font-bold text-foreground hover:text-primary"
                title={item.repoUrl}
              >
                <Code2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate">{item.repoSlug || item.repoUrl}</span>
              </a>
              <button
                type="button"
                onClick={(e) => handleCopy(e, item.repoUrl!)}
                title="复制开源项目地址"
                className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-1.5 rounded-2xl border border-dashed border-border bg-muted/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
              <Code2 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">图文内嵌地址 · 点击卡片或原帖查看</span>
            </div>
          )}

          {/* Project Introduction */}
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {item.summary}
          </p>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {item.tags.slice(0, 4).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTag(tag);
                  }}
                  className={`rounded-lg border px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? "border-border bg-primary text-primary-foreground"
                      : "border-border-subtle bg-muted/60 text-muted-foreground hover:border-border hover:text-foreground"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between gap-2 border-t-2 border-border bg-muted/25 px-5 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {item.author.avatar ? (
            <img
              src={item.author.avatar}
              alt={item.author.username}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              className="h-5 w-5 shrink-0 rounded-full border border-border object-cover"
            />
          ) : null}
          <span className="truncate font-mono text-xs font-bold text-muted-foreground">
            @{item.author.username}
          </span>
          <div className="flex items-center gap-2.5 font-mono text-xs font-bold text-muted-foreground">
            <span className="inline-flex items-center gap-1 text-primary" title="点赞数">
              <Heart className="h-3.5 w-3.5" />
              {formatCompactNumber(item.likes)}
            </span>
            <span className="inline-flex items-center gap-1" title="浏览量">
              <Eye className="h-3.5 w-3.5" />
              {formatCompactNumber(item.views)}
            </span>
            <span className="hidden items-center gap-1 sm:inline-flex" title="回复数">
              <MessageSquare className="h-3.5 w-3.5" />
              {formatCompactNumber(item.replies)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {item.repoUrl && (
            <a
              href={item.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-xl border-2 border-border bg-primary px-3 py-1.5 text-xs font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              <span>开源地址</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <a
            href={item.topicUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-xl border-2 border-border bg-card px-2.5 py-1.5 text-xs font-extrabold text-foreground transition-transform hover:-translate-y-0.5"
            title="前往 LINUX DO 原帖"
          >
            <span>原帖</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </article>
  );
}
