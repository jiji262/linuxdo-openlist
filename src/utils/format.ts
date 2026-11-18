import type { RepoHost } from "../types";

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (Number.isNaN(diffMs)) return "";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1).replace(/\.0$/, "")}w`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(num);
}

export function getHostLabel(host: RepoHost | null): string {
  switch (host) {
    case "github":
      return "GitHub";
    case "gitee":
      return "Gitee";
    case "gitlab":
      return "GitLab";
    case "codeberg":
      return "Codeberg";
    case "huggingface":
      return "HuggingFace";
    case "greasyfork":
      return "GreasyFork";
    case "npm":
      return "NPM";
    case "pypi":
      return "PyPI";
    case "crates":
      return "Crates.io";
    case "docker":
      return "DockerHub";
    case "other":
      return "开源主页";
    default:
      return "社区原帖";
  }
}
