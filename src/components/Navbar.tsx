import { Sun, Moon, Github, ExternalLink, Search } from "lucide-react";

interface NavbarProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onFocusSearch: () => void;
  totalCount: number;
}

export function Navbar({ theme, onToggleTheme, onFocusSearch, totalCount }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo (HAPI-inspired cute terminal face) */}
        <a href="#" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-primary text-primary-foreground shadow-hard-sm transition-transform group-hover:-rotate-3">
            <svg viewBox="0 0 36 36" className="h-6 w-6" fill="none">
              <rect x="4" y="6" width="28" height="24" rx="6" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.6" />
              <circle cx="13.5" cy="16.5" r="2.2" fill="currentColor" />
              <circle cx="22.5" cy="16.5" r="2.2" fill="currentColor" />
              <path d="M13 23C15 25.2 21 25.2 23 23" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight">OpenList</span>
              <span className="hidden rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-[11px] font-bold sm:inline-block">
                LINUX DO #{totalCount > 0 ? totalCount.toLocaleString() : "2234"}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-muted-foreground">
              社区开源推广聚合目录
            </span>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-6 text-sm font-bold md:flex">
          <a href="#featured" className="text-muted-foreground transition-colors hover:text-foreground">
            精选焦点
          </a>
          <a href="#directory" className="text-muted-foreground transition-colors hover:text-foreground">
            开源项目库
          </a>
          <a href="#insights" className="text-muted-foreground transition-colors hover:text-foreground">
            趋势与榜单
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onFocusSearch}
            className="tactile-btn hidden items-center gap-2 rounded-2xl bg-card px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground sm:flex cursor-pointer"
            title="搜索开源项目 (快捷键 / 或 ⌘K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span>搜索项目...</span>
            <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="切换明暗主题"
            title={theme === "dark" ? "切换为浅色暖纸主题" : "切换为深色极客主题"}
            className="tactile-btn flex h-10 w-10 items-center justify-center rounded-2xl bg-card text-foreground cursor-pointer"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <a
            href="https://github.com/jiji262/linuxdo-openlist"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Repository"
            title="GitHub 仓库: jiji262/linuxdo-openlist"
            className="tactile-btn flex h-10 w-10 items-center justify-center rounded-2xl bg-card text-foreground"
          >
            <Github className="h-4 w-4" />
          </a>

          <a
            href="https://linux.do/tag/2234-tag/2234"
            target="_blank"
            rel="noopener noreferrer"
            className="tactile-btn inline-flex items-center gap-1.5 rounded-2xl bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground sm:text-sm"
          >
            <span>开源专区</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </header>
  );
}
