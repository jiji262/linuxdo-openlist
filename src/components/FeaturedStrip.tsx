import { useState, useMemo } from "react";
import { Flame, Trophy, ExternalLink, Heart, Calendar, Code2 } from "lucide-react";
import type { ProjectItem } from "../types";
import { formatShortDate, formatCompactNumber } from "../utils/format";

interface FeaturedStripProps {
  items: ProjectItem[];
  onSelectProject: (item: ProjectItem) => void;
}

export function FeaturedStrip({ items, onSelectProject }: FeaturedStripProps) {
  const [mode, setMode] = useState<"recent" | "alltime">("recent");

  const featured = useMemo(() => {
    const withRepo = items.filter((i) => i.repoUrl);
    if (mode === "recent") {
      const cutoff = Date.now() - 35 * 24 * 3600 * 1000;
      const recent = withRepo.filter((i) => new Date(i.createdAt).getTime() >= cutoff);
      const pool = recent.length >= 6 ? recent : withRepo.slice(0, 120);
      return [...pool].sort((a, b) => b.likes - a.likes).slice(0, 6);
    }
    return [...withRepo].sort((a, b) => b.likes - a.likes).slice(0, 6);
  }, [items, mode]);

  if (featured.length === 0) return null;

  return (
    <section id="featured" className="border-b-2 border-border py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-primary/15 px-3 py-1 text-xs font-extrabold text-primary">
              <Flame className="h-3.5 w-3.5" />
              <span>社区高光项目</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
              佬友力荐 · <span className="text-primary">高赞开源精选</span>
            </h2>
          </div>

          <div className="inline-flex self-start rounded-2xl border-2 border-border bg-card p-1 shadow-hard-sm">
            <button
              type="button"
              onClick={() => setMode("recent")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors cursor-pointer sm:text-sm ${
                mode === "recent"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              <span>近期热榜 (30天)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("alltime")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition-colors cursor-pointer sm:text-sm ${
                mode === "alltime"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Trophy className="h-3.5 w-3.5" />
              <span>历史总榜殿堂</span>
            </button>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((item, index) => (
            <article
              key={item.id}
              onClick={() => onSelectProject(item)}
              className="tactile-card group flex cursor-pointer flex-col justify-between rounded-3xl bg-card p-5"
            >
              <div>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl border-2 border-border bg-primary font-mono text-xs font-black text-primary-foreground">
                      #{index + 1}
                    </span>
                    <span className="rounded-xl border border-border bg-muted px-2.5 py-0.5 text-xs font-bold">
                      {item.category}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatShortDate(item.createdAt)}
                  </span>
                </div>

                <h3 className="line-clamp-1 text-lg font-extrabold tracking-tight group-hover:text-primary">
                  {item.name}
                </h3>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-muted-foreground">
                  {item.title}
                </p>

                {item.repoSlug && (
                  <div className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-xl border border-border bg-muted/70 px-2.5 py-1 font-mono text-xs font-bold text-foreground">
                    <Code2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{item.repoSlug}</span>
                  </div>
                )}

                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {item.summary}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border-subtle pt-3.5">
                <div className="flex items-center gap-3 font-mono text-xs font-bold text-muted-foreground">
                  <span className="inline-flex items-center gap-1 text-primary">
                    <Heart className="h-3.5 w-3.5 fill-current" />
                    {formatCompactNumber(item.likes)}
                  </span>
                  <span>@{item.author.username}</span>
                </div>

                {item.repoUrl && (
                  <a
                    href={item.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 rounded-xl border-2 border-border bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground transition-transform hover:-translate-y-0.5"
                  >
                    <span>开源地址</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
