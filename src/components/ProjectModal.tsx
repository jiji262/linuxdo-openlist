import { useEffect, useState } from "react";
import {
  X,
  ExternalLink,
  Calendar,
  Clock,
  Heart,
  Eye,
  MessageSquare,
  Copy,
  Check,
  Code2,
  User,
  Globe,
  Tag,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import type { ProjectItem, RelatedPost } from "../types";
import { formatDateTime, formatCompactNumber, getHostLabel } from "../utils/format";

interface ProjectModalProps {
  item: ProjectItem | null;
  onClose: () => void;
  onSelectTag: (tag: string) => void;
}

export function ProjectModal({ item, onClose, onSelectTag }: ProjectModalProps) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    setCopied(false);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  const copyRepo = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const relatedPosts: RelatedPost[] =
    item.posts && item.posts.length > 0
      ? item.posts
      : [
          {
            id: item.id,
            title: item.title,
            topicUrl: item.topicUrl,
            createdAt: item.createdAt,
            likes: item.likes,
            views: item.views,
            replies: item.replies,
            authorUsername: item.author.username,
          },
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-border bg-card shadow-hard-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-2 border-border bg-card/95 px-6 py-4 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-xl border-2 border-border bg-primary px-3 py-0.5 text-xs font-extrabold text-primary-foreground">
              {item.category}
            </span>
            {item.repoHost && (
              <span className="rounded-xl border border-border bg-muted px-2.5 py-0.5 font-mono text-xs font-bold">
                {getHostLabel(item.repoHost)}
              </span>
            )}
            {item.postCount > 1 && (
              <span className="inline-flex items-center gap-1 rounded-xl border border-primary/50 bg-primary/15 px-2.5 py-0.5 font-mono text-xs font-extrabold text-primary">
                <Layers className="h-3.5 w-3.5" />
                <span>已关联 {item.postCount} 篇社区帖</span>
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground">#{item.id}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭弹窗"
            className="tactile-btn flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-foreground cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cover Preview */}
        {item.image && !imgError && (
          <div className="max-h-72 w-full overflow-hidden border-b-2 border-border bg-muted">
            <img
              src={item.image}
              alt={item.name}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="max-h-72 w-full object-contain"
            />
          </div>
        )}

        {/* Body */}
        <div className="space-y-6 p-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{item.name}</h2>
            <p className="mt-1.5 text-sm font-bold text-muted-foreground">{item.title}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 gap-3 rounded-2xl border-2 border-border bg-muted/40 p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2.5 text-xs font-bold">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="text-muted-foreground">
                  {item.postCount > 1 ? "最新发帖时间" : "帖子创建时间"}
                </div>
                <div className="font-mono text-sm text-foreground">
                  {formatDateTime(item.createdAt)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="text-muted-foreground">
                  {item.postCount > 1 && item.firstCreatedAt
                    ? "首次发布时间"
                    : "最近互动时间"}
                </div>
                <div className="font-mono text-sm text-foreground">
                  {formatDateTime(
                    item.postCount > 1 && item.firstCreatedAt ? item.firstCreatedAt : item.bumpedAt
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-xs font-bold">
              <User className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="text-muted-foreground">开源发布作者</div>
                <a
                  href={`https://linux.do/u/${item.author.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-foreground underline decoration-dotted hover:text-primary"
                >
                  {item.author.name
                    ? `${item.author.name} (@${item.author.username})`
                    : `@${item.author.username}`}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4 font-mono text-xs font-bold">
              <span className="inline-flex items-center gap-1 text-primary" title="关联帖子累计点赞">
                <Heart className="h-4 w-4" />
                {item.likes.toLocaleString()} 赞
              </span>
              <span className="inline-flex items-center gap-1" title="关联帖子累计浏览">
                <Eye className="h-4 w-4" />
                {item.views.toLocaleString()} 浏览
              </span>
              <span className="inline-flex items-center gap-1" title="关联帖子累计回复">
                <MessageSquare className="h-4 w-4" />
                {item.replies.toLocaleString()} 回复
              </span>
            </div>
          </div>

          {/* Open Source Project URL Box */}
          <div className="rounded-2xl border-2 border-border bg-muted/55 p-4">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              <Code2 className="h-4 w-4 text-primary" />
              <span>对应的开源项目地址</span>
            </div>
            {item.repoUrl ? (
              <div className="space-y-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <a
                    href={item.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all font-mono text-sm font-bold text-primary underline underline-offset-4"
                  >
                    {item.repoUrl}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyRepo(item.repoUrl!)}
                    className="tactile-btn inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl bg-card px-3 py-1.5 text-xs font-extrabold cursor-pointer"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copied ? "已复制" : "复制地址"}</span>
                  </button>
                </div>

                {item.extraRepos && item.extraRepos.length > 0 && (
                  <div className="border-t border-border-subtle pt-2">
                    <div className="mb-1 text-[11px] font-bold text-muted-foreground">
                      帖子关联的其他仓库 / 链接：
                    </div>
                    <div className="flex flex-col gap-1">
                      {item.extraRepos.map((extra) => (
                        <a
                          key={extra}
                          href={extra}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all font-mono text-xs text-foreground/85 hover:text-primary hover:underline"
                        >
                          {extra}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {item.demoUrl && (
                  <div className="flex items-center gap-2 border-t border-border-subtle pt-2 text-xs font-bold">
                    <Globe className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">在线体验 / 文档：</span>
                    <a
                      href={item.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-mono text-primary hover:underline"
                    >
                      {item.demoUrl}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm font-semibold text-muted-foreground">
                该帖作者将开源说明或链接置于长图/附件或折叠块中，请点击下方「前往 LINUX DO 原帖」直接查看完整源码地址。
              </p>
            )}
          </div>

          {/* Project Summary */}
          <div>
            <h3 className="mb-2 text-sm font-extrabold text-foreground">项目介绍摘要</h3>
            <p className="rounded-2xl border border-border-subtle bg-background/60 p-4 text-sm leading-relaxed whitespace-pre-line text-foreground/90">
              {item.summary}
            </p>
          </div>

          {/* Associated Posts Timeline (especially highlighted when multiple posts map to this single project) */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-extrabold text-foreground">
                <Layers className="h-4 w-4 text-primary" />
                <span>关联社区帖子 ({relatedPosts.length} 篇)</span>
              </div>
              {relatedPosts.length > 1 && (
                <span className="text-xs font-bold text-muted-foreground">
                  同项目多帖已自动去重合并 · 按时间倒序
                </span>
              )}
            </div>

            <div className="space-y-2 rounded-2xl border-2 border-border bg-muted/35 p-3">
              {relatedPosts.map((post, idx) => {
                const isFirstRelease = relatedPosts.length > 1 && idx === relatedPosts.length - 1;
                const isLatestUpdate = relatedPosts.length > 1 && idx === 0;
                return (
                  <a
                    key={post.id}
                    href={post.topicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-1.5 rounded-xl border border-border-subtle bg-card px-3.5 py-2.5 transition-colors hover:border-primary"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        {isLatestUpdate && (
                          <span className="shrink-0 rounded-md border border-border bg-primary px-1.5 py-0.5 text-[10px] font-extrabold text-primary-foreground">
                            最新帖
                          </span>
                        )}
                        {isFirstRelease && (
                          <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-extrabold text-foreground">
                            首发帖
                          </span>
                        )}
                        {!isLatestUpdate && !isFirstRelease && relatedPosts.length > 1 && (
                          <span className="shrink-0 rounded-md border border-border-subtle bg-muted/60 px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                            迭代帖
                          </span>
                        )}
                        <span className="font-bold text-sm text-foreground group-hover:text-primary">
                          {post.title}
                        </span>
                      </div>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold text-muted-foreground">
                      <span>{formatDateTime(post.createdAt)}</span>
                      <span>@{post.authorUsername}</span>
                      <span className="text-primary">♥ {formatCompactNumber(post.likes)}</span>
                      <span>👁 {formatCompactNumber(post.views)}</span>
                      <span>💬 {formatCompactNumber(post.replies)}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          {item.tags.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                <span>社区话题标签</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      onSelectTag(tag);
                      onClose();
                    }}
                    className="rounded-xl border-2 border-border bg-muted px-3 py-1 text-xs font-extrabold transition-colors hover:bg-primary hover:text-primary-foreground cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t-2 border-border pt-4">
            {item.repoUrl && (
              <a
                href={item.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tactile-btn inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-extrabold text-primary-foreground"
              >
                <span>前往开源仓库</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <a
              href={item.topicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tactile-btn inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-card px-5 py-3 text-sm font-extrabold text-foreground"
            >
              <span>前往最新原帖讨论</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
