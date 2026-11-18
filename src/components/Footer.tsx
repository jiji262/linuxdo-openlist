import { Github, ExternalLink, Heart } from "lucide-react";

interface FooterProps {
  updatedAt: string | null;
  totalProjects: number;
  totalTopics: number;
}

export function Footer({ updatedAt, totalProjects, totalTopics }: FooterProps) {
  return (
    <footer className="border-t-2 border-border bg-card/60 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-border bg-primary text-primary-foreground shadow-hard-sm">
                <svg viewBox="0 0 36 36" className="h-5 w-5" fill="none">
                  <rect x="4" y="6" width="28" height="24" rx="6" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.6" />
                  <circle cx="13.5" cy="16.5" r="2.2" fill="currentColor" />
                  <circle cx="22.5" cy="16.5" r="2.2" fill="currentColor" />
                  <path d="M13 23C15 25.2 21 25.2 23 23" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tight">LINUX DO OpenList</span>
            </div>
            <p className="mt-3 max-w-md text-sm leading-relaxed font-semibold text-muted-foreground">
              聚合整理自 LINUX DO 社区 <span className="font-mono text-foreground">#开源推广#</span> 标签下的{" "}
              {totalProjects > 0 ? totalProjects.toLocaleString() : "全部"} 个独立开源项目（合并自{" "}
              {totalTopics > 0 ? totalTopics.toLocaleString() : "全部"} 篇开源自荐与迭代帖）。基于 Vercel Neon Postgres 驱动。
            </p>
            {updatedAt && (
              <p className="mt-3 font-mono text-xs text-muted-foreground">
                数据同步时间：{new Date(updatedAt).toLocaleString("zh-CN")} · 每日定时增量同步
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-extrabold tracking-wider uppercase">快速导航</h4>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-muted-foreground">
              <li>
                <a href="#featured" className="hover:text-primary">
                  高赞开源精选
                </a>
              </li>
              <li>
                <a href="#directory" className="hover:text-primary">
                  全部开源项目库
                </a>
              </li>
              <li>
                <a href="#insights" className="hover:text-primary">
                  月度趋势与创作者榜
                </a>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-sm font-extrabold tracking-wider uppercase">社区与源码</h4>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-muted-foreground">
              <li>
                <a
                  href="https://linux.do/tag/2234-tag/2234"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-primary"
                >
                  <span>LINUX DO #开源推广</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/jiji262/linuxdo-openlist"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-primary"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span>jiji262/linuxdo-openlist</span>
                </a>
              </li>
              <li>
                <a
                  href="https://hapi.run"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-primary"
                >
                  <span>视觉致敬 HAPI.run</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border-subtle pt-6 text-xs font-bold text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} LINUX DO OpenList · MIT License Open Source.</p>
          <p className="inline-flex items-center gap-1">
            <span>为开源社区</span>
            <Heart className="h-3.5 w-3.5 fill-primary text-primary" />
            <span>精心构建</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
