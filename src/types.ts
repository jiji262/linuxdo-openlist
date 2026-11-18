export type RepoHost =
  | "github"
  | "gitee"
  | "gitlab"
  | "codeberg"
  | "huggingface"
  | "greasyfork"
  | "npm"
  | "pypi"
  | "crates"
  | "docker"
  | "other";

export interface ProjectAuthor {
  username: string;
  name: string;
  avatar: string | null;
}

export interface ProjectItem {
  id: number;
  name: string;
  title: string;
  summary: string;
  repoUrl: string | null;
  repoSlug: string | null;
  repoHost: RepoHost | null;
  extraRepos?: string[];
  demoUrl?: string | null;
  topicUrl: string;
  createdAt: string;
  bumpedAt: string;
  category: string;
  tags: string[];
  author: ProjectAuthor;
  likes: number;
  views: number;
  replies: number;
  image: string | null;
}

export interface MonthlyStat {
  month: string;
  count: number;
  withRepo: number;
}

export interface TagStat {
  name: string;
  count: number;
}

export interface AuthorStat {
  username: string;
  name: string;
  avatar: string | null;
  count: number;
  totalLikes: number;
}

export interface ProjectsDataset {
  updatedAt: string;
  sourceUrl: string;
  isPartial?: boolean;
  stats: {
    totalTopics: number;
    withRepoCount: number;
    uniqueReposCount: number;
    totalLikes: number;
    totalViews: number;
    totalAuthors: number;
    monthlyCounts: MonthlyStat[];
    topTags: TagStat[];
    topAuthors: AuthorStat[];
  };
  items: ProjectItem[];
}
