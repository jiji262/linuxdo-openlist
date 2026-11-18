import { BarChart3, Award, Hash } from "lucide-react";
import type { ProjectsDataset } from "../types";
import { formatCompactNumber } from "../utils/format";

interface InsightsSectionProps {
  stats: ProjectsDataset["stats"];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  selectedTag: string | null;
  onSelectTag: (tag: string) => void;
  onSelectAuthor: (username: string) => void;
}

export function InsightsSection({
  stats,
  selectedMonth,
  onSelectMonth,
  selectedTag,
  onSelectTag,
  onSelectAuthor,
}: InsightsSectionProps) {
  const recentMonths = stats.monthlyCounts.slice(-10);
  const maxMonthCount = Math.max(...recentMonths.map((m) => m.count), 1);

  return (
    <section id="insights" className="border-t-2 border-border py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-primary/15 px-3 py-1 text-xs font-extrabold text-primary">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>社区开源生态全景</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
            数据洞察 · <span className="text-primary">开源脉搏与贡献榜单</span>
          </h2>
          <p className="mt-2 text-sm font-semibold text-muted-foreground sm:text-base">
            点击任意月份柱状条、热门标签或创作者卡片，即可联动筛选上方的开源项目列表。
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Monthly Trend Chart */}
          <div className="tactile-card rounded-3xl bg-card p-6 lg:col-span-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold">月度开源推广发帖趋势</h3>
                <p className="text-xs font-semibold text-muted-foreground">
                  点击柱状图按对应月份过滤项目
                </p>
              </div>
              {selectedMonth !== "all" && (
                <button
                  type="button"
                  onClick={() => onSelectMonth("all")}
                  className="rounded-xl border border-border bg-muted px-2.5 py-1 text-xs font-bold hover:bg-primary hover:text-primary-foreground cursor-pointer"
                >
                  清除月份筛选 ({selectedMonth})
                </button>
              )}
            </div>

            <div className="flex h-52 items-end gap-2 sm:gap-3">
              {recentMonths.map((m) => {
                const heightPct = Math.max(Math.round((m.count / maxMonthCount) * 100), 8);
                const isSelected = selectedMonth === m.month;
                return (
                  <button
                    key={m.month}
                    type="button"
                    onClick={() => {
                      onSelectMonth(isSelected ? "all" : m.month);
                      document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="group flex flex-1 flex-col items-center gap-2 cursor-pointer"
                    title={`${m.month}: 共 ${m.count} 篇开源帖`}
                  >
                    <span className="font-mono text-[10px] font-bold text-muted-foreground group-hover:text-foreground sm:text-xs">
                      {m.count}
                    </span>
                    <div className="flex h-36 w-full items-end justify-center">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-10 rounded-t-xl border-2 border-border transition-all ${
                          isSelected
                            ? "bg-primary shadow-hard-sm"
                            : "bg-primary/45 group-hover:bg-primary"
                        }`}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-muted-foreground sm:text-xs">
                      {m.month.slice(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top Contributors Leaderboard */}
          <div className="tactile-card rounded-3xl bg-card p-6 lg:col-span-5">
            <div className="mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-extrabold">活跃开源创作者榜</h3>
            </div>
            <div className="space-y-2.5">
              {stats.topAuthors.slice(0, 6).map((author, idx) => (
                <button
                  key={author.username}
                  type="button"
                  onClick={() => {
                    onSelectAuthor(author.username);
                    document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-border-subtle bg-muted/45 px-3.5 py-2.5 text-left transition-colors hover:border-border hover:bg-muted cursor-pointer"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-border bg-primary/20 font-mono text-xs font-black text-primary">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold">
                        {author.name || author.username}
                      </div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        @{author.username}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right font-mono text-xs font-bold">
                    <div className="text-primary">{author.count} 个项目</div>
                    <div className="text-muted-foreground">
                      ♥ {formatCompactNumber(author.totalLikes)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Popular Tech Tags Cloud */}
          <div className="tactile-card rounded-3xl bg-card p-6 lg:col-span-12">
            <div className="mb-4 flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-extrabold">热门社区标签分布</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {stats.topTags.slice(0, 24).map((t) => {
                const active = selectedTag === t.name;
                return (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => {
                      onSelectTag(t.name);
                      document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`tactile-btn inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-extrabold cursor-pointer sm:text-sm ${
                      active ? "bg-primary text-primary-foreground" : "bg-background text-foreground"
                    }`}
                  >
                    <span>#{t.name}</span>
                    <span className="rounded-lg border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
