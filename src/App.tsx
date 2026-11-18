import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import type { ProjectItem, ProjectsDataset } from "./types";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { FeaturedStrip } from "./components/FeaturedStrip";
import { ProjectCard } from "./components/ProjectCard";
import { ProjectModal } from "./components/ProjectModal";
import { InsightsSection } from "./components/InsightsSection";
import { Footer } from "./components/Footer";

const CATEGORIES = [
  "全部",
  "AI 与 Agent",
  "开发与效率",
  "Web 与应用",
  "桌面与移动",
  "运维与自托管",
  "脚本与扩展",
  "影音与阅读",
  "社区与综合",
] as const;

type SortKey = "newest" | "oldest" | "likes" | "views" | "replies";

const PAGE_SIZE = 24;

export function App() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document !== "undefined") {
      return document.documentElement.classList.contains("dark") ? "dark" : "light";
    }
    return "dark";
  });

  const [dataset, setDataset] = useState<ProjectsDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & view state
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("全部");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"all" | "7d" | "30d" | "90d">("all");
  const [onlyWithRepo, setOnlyWithRepo] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [activeProject, setActiveProject] = useState<ProjectItem | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Theme sync
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("openlist-theme", theme);
    } catch {}
  }, [theme]);

  // Keyboard shortcut `/` or `Cmd+K` to focus search
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
      } else if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Load fast bootstrap dataset first, then hydrate full archive seamlessly
  useEffect(() => {
    let cancelled = false;
    let fullLoaded = false;

    fetch("/data/initial.json")
      .then((res) => (res.ok ? (res.json() as Promise<ProjectsDataset>) : null))
      .then((initialData) => {
        if (!cancelled && initialData && !fullLoaded) {
          setDataset(initialData);
          setLoading(false);
        }
      })
      .catch(() => {});

    fetch("/data/projects.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ProjectsDataset>;
      })
      .then((data) => {
        if (!cancelled) {
          fullLoaded = true;
          setDataset(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled && !fullLoaded) {
          setError(err instanceof Error ? err.message : "加载数据失败");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [query, category, selectedTag, selectedAuthor, selectedMonth, timeRange, onlyWithRepo, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 全部: dataset?.items.length ?? 0 };
    if (!dataset) return counts;
    for (const item of dataset.items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [dataset]);

  // Filtered & sorted items
  const filteredItems = useMemo(() => {
    if (!dataset) return [];
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const rangeMs =
      timeRange === "7d"
        ? 7 * 86400000
        : timeRange === "30d"
          ? 30 * 86400000
          : timeRange === "90d"
            ? 90 * 86400000
            : 0;

    const list = dataset.items.filter((item) => {
      if (onlyWithRepo && !item.repoUrl) return false;
      if (category !== "全部" && item.category !== category) return false;
      if (selectedTag && !item.tags.includes(selectedTag)) return false;
      if (selectedAuthor && item.author.username !== selectedAuthor) return false;
      if (selectedMonth !== "all" && !item.createdAt.startsWith(selectedMonth)) return false;
      if (rangeMs > 0 && now - new Date(item.createdAt).getTime() > rangeMs) return false;

      if (q) {
        const hay = `${item.name} ${item.title} ${item.repoSlug ?? ""} ${item.repoUrl ?? ""} ${item.summary} ${item.author.username} ${item.author.name} ${item.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        case "oldest":
          return a.createdAt.localeCompare(b.createdAt);
        case "likes":
          return b.likes - a.likes || b.views - a.views;
        case "views":
          return b.views - a.views;
        case "replies":
          return b.replies - a.replies;
      }
    });

    return list;
  }, [
    dataset,
    query,
    category,
    selectedTag,
    selectedAuthor,
    selectedMonth,
    timeRange,
    onlyWithRepo,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, page]);

  const hasActiveFilters =
    query.trim() !== "" ||
    category !== "全部" ||
    selectedTag !== null ||
    selectedAuthor !== null ||
    selectedMonth !== "all" ||
    timeRange !== "all" ||
    onlyWithRepo;

  const resetAllFilters = () => {
    setQuery("");
    setCategory("全部");
    setSelectedTag(null);
    setSelectedAuthor(null);
    setSelectedMonth("all");
    setTimeRange("all");
    setOnlyWithRepo(false);
    setSortBy("newest");
  };

  const handleRandomPick = () => {
    if (!dataset || dataset.items.length === 0) return;
    const pool = dataset.items.filter((i) => i.repoUrl && i.likes >= 5);
    const source = pool.length > 0 ? pool : dataset.items;
    const pick = source[Math.floor(Math.random() * source.length)];
    setActiveProject(pick);
  };

  const focusDirectorySearch = () => {
    document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => searchInputRef.current?.focus(), 250);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
        onFocusSearch={focusDirectorySearch}
        totalCount={dataset?.stats.totalTopics ?? 0}
      />

      <main>
        <HeroSection
          stats={dataset?.stats ?? null}
          updatedAt={dataset?.updatedAt ?? null}
          onExplore={() =>
            document.getElementById("directory")?.scrollIntoView({ behavior: "smooth" })
          }
          onRandomPick={handleRandomPick}
        />

        {dataset && (
          <FeaturedStrip
            items={dataset.items}
            onSelectProject={(item) => setActiveProject(item)}
          />
        )}

        {/* Main Open Source Project Directory */}
        <section id="directory" className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-2xl font-black tracking-tight sm:text-4xl">
                  开源项目总库 ·{" "}
                  <span className="text-primary">
                    {loading
                      ? "加载中..."
                      : `${(dataset?.isPartial && !hasActiveFilters ? dataset.stats.totalTopics : filteredItems.length).toLocaleString()} 个项目`}
                  </span>
                </h2>
                <p className="mt-1.5 text-sm font-semibold text-muted-foreground">
                  按项目名、GitHub 仓库、功能介绍、标签、作者或发布时间自由筛选
                </p>
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-2 self-start">
                <div className="inline-flex rounded-2xl border-2 border-border bg-card p-1 shadow-hard-sm">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    title="大气卡片网格"
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>卡片</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    title="紧凑清单列表"
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold cursor-pointer ${
                      viewMode === "list"
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                    <span>清单</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Search & Filter Control Panel */}
            <div className="mb-8 rounded-3xl border-2 border-border bg-card p-4 shadow-hard sm:p-6">
              <div className="grid gap-3 lg:grid-cols-12">
                {/* Search Input */}
                <div className="relative lg:col-span-6">
                  <Search className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索项目名、owner/repo、关键词、作者 @username..."
                    className="h-12 w-full rounded-2xl border-2 border-border bg-background pr-10 pl-11 text-sm font-bold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="清空搜索词"
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Time Filter */}
                <div className="lg:col-span-2">
                  <select
                    value={timeRange}
                    onChange={(e) => {
                      setTimeRange(e.target.value as "all" | "7d" | "30d" | "90d");
                      if (e.target.value !== "all") setSelectedMonth("all");
                    }}
                    aria-label="发布时间范围"
                    className="h-12 w-full rounded-2xl border-2 border-border bg-background px-3.5 text-sm font-extrabold text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="all">全部时间</option>
                    <option value="7d">最近 7 天发布</option>
                    <option value="30d">最近 30 天发布</option>
                    <option value="90d">最近 90 天发布</option>
                  </select>
                </div>

                {/* Sort Select */}
                <div className="lg:col-span-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    aria-label="排序方式"
                    className="h-12 w-full rounded-2xl border-2 border-border bg-background px-3.5 text-sm font-extrabold text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="newest">最新发布优先</option>
                    <option value="likes">最多点赞优先</option>
                    <option value="views">最多浏览优先</option>
                    <option value="replies">最多讨论优先</option>
                    <option value="oldest">最早发布优先</option>
                  </select>
                </div>

                {/* Only With Direct Repo Toggle */}
                <div className="lg:col-span-2">
                  <button
                    type="button"
                    onClick={() => setOnlyWithRepo((v) => !v)}
                    className={`flex h-12 w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-border px-3 text-xs font-extrabold transition-colors cursor-pointer sm:text-sm ${
                      onlyWithRepo
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>仅含直达仓库</span>
                  </button>
                </div>
              </div>

              {/* Category Pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-4">
                <span className="mr-1 inline-flex items-center gap-1 text-xs font-extrabold text-muted-foreground">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  领域分类：
                </span>
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border-2 px-3 py-1.5 text-xs font-extrabold transition-all cursor-pointer ${
                        active
                          ? "border-border bg-primary text-primary-foreground shadow-hard-sm"
                          : "border-transparent bg-muted/75 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      <span>{cat}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.2 font-mono text-[10px] ${
                          active
                            ? "bg-black/15 text-primary-foreground"
                            : "bg-background/80 text-muted-foreground"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Filter Chips */}
              {hasActiveFilters && (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3.5">
                  <span className="text-xs font-bold text-muted-foreground">当前筛选：</span>
                  {selectedTag && (
                    <button
                      type="button"
                      onClick={() => setSelectedTag(null)}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-primary/15 px-2.5 py-1 text-xs font-extrabold text-primary cursor-pointer"
                    >
                      <span>标签 #{selectedTag}</span>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {selectedAuthor && (
                    <button
                      type="button"
                      onClick={() => setSelectedAuthor(null)}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-primary/15 px-2.5 py-1 text-xs font-extrabold text-primary cursor-pointer"
                    >
                      <span>作者 @{selectedAuthor}</span>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {selectedMonth !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedMonth("all")}
                      className="inline-flex items-center gap-1 rounded-xl border border-border bg-primary/15 px-2.5 py-1 text-xs font-extrabold text-primary cursor-pointer"
                    >
                      <span>月份 {selectedMonth}</span>
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="ml-auto inline-flex items-center gap-1 rounded-xl border border-border bg-muted px-3 py-1 text-xs font-extrabold text-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>重置全部筛选</span>
                  </button>
                </div>
              )}
            </div>

            {/* Loading / Error / Project List */}
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-72 animate-pulse rounded-3xl border-2 border-border bg-card p-5"
                  >
                    <div className="h-5 w-24 rounded-lg bg-muted" />
                    <div className="mt-4 h-7 w-3/4 rounded-lg bg-muted" />
                    <div className="mt-3 h-9 w-full rounded-xl bg-muted" />
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-5/6 rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="tactile-card rounded-3xl bg-card p-10 text-center">
                <p className="text-lg font-extrabold text-foreground">加载项目数据时遇到问题</p>
                <p className="mt-2 font-mono text-sm text-muted-foreground">{error}</p>
              </div>
            ) : pagedItems.length === 0 ? (
              <div className="tactile-card rounded-3xl bg-card p-12 text-center">
                <p className="text-xl font-black">未找到匹配的开源项目</p>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  可以尝试更换关键词或清除筛选条件重新浏览
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="tactile-btn mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>查看全部项目</span>
                </button>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                      : "flex flex-col gap-3"
                  }
                >
                  {pagedItems.map((item) => (
                    <ProjectCard
                      key={item.id}
                      item={item}
                      viewMode={viewMode}
                      selectedTag={selectedTag}
                      onSelectTag={(t) => setSelectedTag((prev) => (prev === t ? null : t))}
                      onSelectProject={(p) => setActiveProject(p)}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-border bg-card px-5 py-3.5 shadow-hard-sm">
                    <div className="font-mono text-xs font-bold text-muted-foreground sm:text-sm">
                      第 <span className="text-foreground">{page}</span> / {totalPages} 页 · 共{" "}
                      <span className="text-primary">{filteredItems.length.toLocaleString()}</span>{" "}
                      条记录
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => {
                          setPage((p) => Math.max(1, p - 1));
                          document
                            .getElementById("directory")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="tactile-btn inline-flex items-center gap-1 rounded-xl bg-background px-3.5 py-2 text-xs font-extrabold disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>上一页</span>
                      </button>

                      {/* Quick page numbers */}
                      <div className="hidden items-center gap-1 sm:flex">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                          let pNum = page - 2 + idx;
                          if (page <= 3) pNum = idx + 1;
                          else if (page >= totalPages - 2) pNum = totalPages - 4 + idx;
                          if (pNum < 1 || pNum > totalPages) return null;
                          return (
                            <button
                              key={pNum}
                              type="button"
                              onClick={() => {
                                setPage(pNum);
                                document
                                  .getElementById("directory")
                                  ?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className={`h-9 min-w-9 rounded-xl border-2 px-2.5 font-mono text-xs font-extrabold cursor-pointer ${
                                pNum === page
                                  ? "border-border bg-primary text-primary-foreground"
                                  : "border-transparent bg-muted text-foreground hover:border-border"
                              }`}
                            >
                              {pNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => {
                          setPage((p) => Math.min(totalPages, p + 1));
                          document
                            .getElementById("directory")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="tactile-btn inline-flex items-center gap-1 rounded-xl bg-background px-3.5 py-2 text-xs font-extrabold disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
                      >
                        <span>下一页</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Ecosystem Insights & Leaderboards */}
        {dataset && (
          <InsightsSection
            stats={dataset.stats}
            selectedMonth={selectedMonth}
            onSelectMonth={setSelectedMonth}
            selectedTag={selectedTag}
            onSelectTag={(t) => setSelectedTag((prev) => (prev === t ? null : t))}
            onSelectAuthor={(u) => setSelectedAuthor((prev) => (prev === u ? null : u))}
          />
        )}
      </main>

      <Footer
        updatedAt={dataset?.updatedAt ?? null}
        totalTopics={dataset?.stats.totalTopics ?? 0}
      />

      <ProjectModal
        item={activeProject}
        onClose={() => setActiveProject(null)}
        onSelectTag={(t) => setSelectedTag(t)}
      />
    </div>
  );
}
