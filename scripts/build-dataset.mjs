import fs from "node:fs";
import path from "node:path";

const SCRATCH =
  process.env.OPENLIST_SCRATCH ||
  "/Users/crimson/.t3/userdata/providers/antigravity/ac0a3dfd6dddb20962cecff6ee5fe65e19d3923be20e52c5ab52ff877f7e4c32/antigravity-acp/brain/3f7a62d5-5752-4302-9660-a6f5225b2a75/scratch";

const OUT_FILE = path.resolve(process.cwd(), "public/data/projects.json");
const OUT_INITIAL_FILE = path.resolve(process.cwd(), "public/data/initial.json");

const rawTopicsData = JSON.parse(fs.readFileSync(path.join(SCRATCH, "tag_topics.json"), "utf8"));
const searchHarvest = fs.existsSync(path.join(SCRATCH, "search_harvest.json"))
  ? JSON.parse(fs.readFileSync(path.join(SCRATCH, "search_harvest.json"), "utf8"))
  : {};
const rawPosts = fs.existsSync(path.join(SCRATCH, "raw_posts.json"))
  ? JSON.parse(fs.readFileSync(path.join(SCRATCH, "raw_posts.json"), "utf8"))
  : {};

const userMap = new Map((rawTopicsData.users || []).map((u) => [u.id, u]));

const IGNORED_GH_OWNERS = new Set([
  "orgs",
  "settings",
  "features",
  "marketplace",
  "sponsors",
  "topics",
  "trending",
  "collections",
  "events",
  "about",
  "pricing",
  "login",
  "join",
  "user-attachments",
  "images",
  "assets",
  "notifications",
  "issues",
  "pulls",
  "codespaces",
  "enterprise",
]);

function normalizeRepoCandidate(rawUrl) {
  let cleaned = rawUrl
    .trim()
    .replace(/[),.;:!?'"\]】）》>\\*]+$/g, "")
    .replace(/^\(+/, "");

  if (!/^https?:\/\//i.test(cleaned)) return null;

  let u;
  try {
    u = new URL(cleaned);
  } catch {
    return null;
  }

  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  if (
    host.endsWith("linux.do") ||
    host.endsWith("ldstatic.com") ||
    host.includes("shields.io") ||
    host.includes("badge") ||
    host.includes("img.") ||
    host.includes("imgur.com") ||
    host.includes("jsdelivr.net") ||
    host.includes("opensource.org") ||
    host.includes("gnu.org") ||
    host.includes("apache.org/licenses")
  ) {
    return null;
  }

  const segs = u.pathname.split("/").filter(Boolean);

  if (host === "github.com") {
    if (segs.length < 2) return null;
    const owner = segs[0];
    const repo = segs[1].replace(/\.git$/i, "");
    if (IGNORED_GH_OWNERS.has(owner.toLowerCase())) return null;
    if (!repo || repo.length < 1) return null;
    return {
      url: `https://github.com/${owner}/${repo}`,
      slug: `${owner}/${repo}`,
      owner,
      repo,
      host: "github",
      baseScore: 100,
    };
  }

  if (host === "gist.github.com" && segs.length >= 2) {
    return {
      url: `https://gist.github.com/${segs[0]}/${segs[1]}`,
      slug: `gist:${segs[0]}/${segs[1]}`,
      owner: segs[0],
      repo: segs[1],
      host: "github",
      baseScore: 85,
    };
  }

  if (host === "gitee.com" && segs.length >= 2) {
    const repo = segs[1].replace(/\.git$/i, "");
    return {
      url: `https://gitee.com/${segs[0]}/${repo}`,
      slug: `gitee:${segs[0]}/${repo}`,
      owner: segs[0],
      repo,
      host: "gitee",
      baseScore: 90,
    };
  }

  if ((host === "gitlab.com" || host.startsWith("gitlab.")) && segs.length >= 2) {
    const repo = segs[1].replace(/\.git$/i, "");
    return {
      url: `https://${host}/${segs[0]}/${repo}`,
      slug: `${host}/${segs[0]}/${repo}`,
      owner: segs[0],
      repo,
      host: "gitlab",
      baseScore: 90,
    };
  }

  if (host === "codeberg.org" && segs.length >= 2) {
    const repo = segs[1].replace(/\.git$/i, "");
    return {
      url: `https://codeberg.org/${segs[0]}/${repo}`,
      slug: `codeberg:${segs[0]}/${repo}`,
      owner: segs[0],
      repo,
      host: "codeberg",
      baseScore: 90,
    };
  }

  if (host === "cnb.cool" && segs.length >= 2) {
    return {
      url: `https://cnb.cool/${segs[0]}/${segs[1]}`,
      slug: `cnb.cool/${segs[0]}/${segs[1]}`,
      owner: segs[0],
      repo: segs[1],
      host: "other",
      baseScore: 88,
    };
  }

  if (host === "huggingface.co" && segs.length >= 2) {
    const slugPath =
      segs[0] === "spaces" || segs[0] === "datasets"
        ? segs.slice(0, 3).join("/")
        : segs.slice(0, 2).join("/");
    return {
      url: `https://huggingface.co/${slugPath}`,
      slug: `hf:${slugPath}`,
      owner: segs[0],
      repo: segs[segs.length - 1],
      host: "huggingface",
      baseScore: 80,
    };
  }

  if (host === "greasyfork.org" && cleaned.includes("/scripts/")) {
    const m = u.pathname.match(/\/scripts\/(\d+[^/]*)/);
    return {
      url: `${u.origin}${u.pathname}`,
      slug: m ? `greasyfork/${m[1].slice(0, 28)}` : "greasyfork",
      owner: "",
      repo: m ? m[1] : "",
      host: "greasyfork",
      baseScore: 80,
    };
  }

  if (host === "npmjs.com" && segs[0] === "package" && segs.length >= 2) {
    const pkg = segs[1].startsWith("@") && segs[2] ? `${segs[1]}/${segs[2]}` : segs[1];
    return {
      url: `https://www.npmjs.com/package/${pkg}`,
      slug: `npm:${pkg}`,
      owner: "",
      repo: pkg,
      host: "npm",
      baseScore: 70,
    };
  }

  if (host === "pypi.org" && segs[0] === "project" && segs[1]) {
    return {
      url: `https://pypi.org/project/${segs[1]}/`,
      slug: `pypi:${segs[1]}`,
      owner: "",
      repo: segs[1],
      host: "pypi",
      baseScore: 70,
    };
  }

  if (host === "crates.io" && segs[0] === "crates" && segs[1]) {
    return {
      url: `https://crates.io/crates/${segs[1]}`,
      slug: `crate:${segs[1]}`,
      owner: "",
      repo: segs[1],
      host: "crates",
      baseScore: 70,
    };
  }

  if (host === "hub.docker.com" && segs.length >= 2) {
    return {
      url: `${u.origin}${u.pathname}`,
      slug: `docker:${segs.slice(-2).join("/")}`,
      owner: segs[segs.length - 2] || "",
      repo: segs[segs.length - 1] || "",
      host: "docker",
      baseScore: 70,
    };
  }

  if (host.endsWith(".github.io")) {
    const owner = host.replace(/\.github\.io$/, "");
    if (segs[0]) {
      return {
        url: `https://github.com/${owner}/${segs[0]}`,
        slug: `${owner}/${segs[0]}`,
        owner,
        repo: segs[0],
        host: "github",
        baseScore: 82,
        demo: cleaned,
      };
    }
  }

  return {
    url: cleaned,
    slug: host,
    host: "other",
    baseScore: 10,
    isExternalSite: true,
  };
}

function extractReposAndDemo(rawMarkdown, blurbs, featuredLink, authorUsername, topicTitle) {
  const combined = [rawMarkdown || "", ...(blurbs || []), featuredLink || ""].join("\n");
  const candidates = new Map();
  let demoUrl = null;

  const urlRegex = /https?:\/\/[^\s<>"')\]】）》`]+/gi;
  let orderIdx = 0;
  for (const match of combined.matchAll(urlRegex)) {
    const parsed = normalizeRepoCandidate(match[0]);
    if (!parsed) continue;
    if (parsed.isExternalSite) {
      if (!demoUrl) demoUrl = parsed.url;
      continue;
    }
    if (parsed.demo && !demoUrl) demoUrl = parsed.demo;
    const lowerKey = parsed.url.toLowerCase();
    if (!candidates.has(lowerKey)) {
      candidates.set(lowerKey, { ...parsed, orderIdx: orderIdx++ });
    }
  }

  if (
    [...candidates.values()].filter((c) => c.host === "github").length === 0 &&
    combined.includes("github.com")
  ) {
    const ghPatterns = [
      /GitHub\s*-\s*([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/i,
      /\b([A-Za-z0-9_.-]{2,39})\/([A-Za-z0-9_.-]{2,80})\s+https?:\/\/github\.com/i,
      /https?:\/\/github\.com\/[A-Za-z0-9_.-]*\s+([A-Za-z0-9_.-]{2,39})\/([A-Za-z0-9_.-]{2,80})/i,
    ];
    for (const pat of ghPatterns) {
      const m = combined.match(pat);
      if (m && m[1] && m[2] && !IGNORED_GH_OWNERS.has(m[1].toLowerCase())) {
        const repo = m[2].replace(/\.git$/i, "").replace(/[:.,;]+$/, "");
        const url = `https://github.com/${m[1]}/${repo}`;
        candidates.set(url.toLowerCase(), {
          url,
          slug: `${m[1]}/${repo}`,
          owner: m[1],
          repo,
          host: "github",
          baseScore: 100,
          orderIdx: orderIdx++,
        });
        break;
      }
    }
  }

  // Score candidates using author & title affinity so forks/plugins don't pick upstream repos!
  const uLower = (authorUsername || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const titleLower = (topicTitle || "").toLowerCase();

  const scored = [...candidates.values()].map((c) => {
    let score = c.baseScore - c.orderIdx * 2;
    const ownerClean = (c.owner || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const repoLower = (c.repo || "").toLowerCase();

    if (uLower.length >= 3 && ownerClean) {
      if (ownerClean === uLower) score += 45;
      else if (ownerClean.includes(uLower) || uLower.includes(ownerClean)) score += 25;
    }
    if (repoLower.length >= 3 && titleLower.includes(repoLower)) {
      score += 35;
    }
    return { ...c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const primary = scored[0] || null;
  const extraRepos = scored.slice(1, 4).map((c) => c.url);

  return {
    repoUrl: primary?.url ?? null,
    repoSlug: primary?.slug ?? null,
    repoHost: primary?.host ?? null,
    extraRepos,
    demoUrl,
  };
}

function extractProjectName(title, repoSlug) {
  const t = (title || "")
    .replace(/^\s*(?:【[^】]{1,14}】|\[[^\]]{1,14}\]|（[^）]{1,10}）|\([^)]{1,10}\))\s*/g, "")
    .replace(/^\s*(?:开源自荐|开源推广|开源项目|开源分享|开源软件|开源|自荐|首发)\s*[:：\-—|｜]?\s*/i, "")
    .trim();

  const splitMatch = t.match(
    /^([A-Za-z0-9\u4e00-\u9fa5_.+\- ]{2,28}?)\s*(?:[:：|｜]|——|--|\s-\s)\s*(.+)$/
  );
  if (splitMatch) {
    const candidate = splitMatch[1].trim();
    if (candidate.length >= 2 && candidate.length <= 28) {
      return candidate;
    }
  }

  if (repoSlug && repoSlug.includes("/")) {
    const repoPart = repoSlug.split("/").pop().replace(/^(?:hf|gitee|codeberg|gist):/, "");
    if (t.length > 26 && repoPart && repoPart.length >= 2 && repoPart.length <= 30) {
      return repoPart;
    }
  }

  return t.slice(0, 34) || title;
}

function cleanBoilerplateText(input) {
  if (!input) return "";
  let s = input;
  s = s.replace(/\[details[^\]]*\][\s\S]*?\[\/details\]/gi, " ");
  s = s.replace(/<details[\s\S]*?<\/details>/gi, " ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s.replace(/!\[[^\]]*\]\([^)]+\)/g, " ");
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 ");
  s = s.replace(/\[([^\]]+)\]\(upload:\/\/[^)]+\)/g, " ");
  s = s.replace(/https?:\/\/[^\s<>"')\]】]+/g, " ");
  s = s.replace(/本帖使用社区开源推广[\s\S]{0,320}?接受社区和佬友监督[：:\s]*是/g, " ");
  s = s.replace(/我申明并遵循社区要求的以下内容[：:\s]*(?:[>*\-\s]|我的[^\n]*|我帖子[^\n]*|以上选择[^\n]*)+/g, " ");
  s = s.replace(/以下为项目介绍正文内容[，,]?\s*AI\s*生成、润色内容已使用截图方式发出[：:。!*\s]*/g, " ");
  s = s.replace(/AI\s*生成、润色内容(?:部分)?已(?:使用)?截图(?:方式)?发出[：:\s]*(?:是)?/g, " ");
  s = s.replace(/本帖使用社区开源推广[^\n。]*[。\n]?/g, " ");
  s = s.replace(/我的帖子已经打上[\s\S]{0,180}?是/g, " ");
  s = s.replace(/我的开源项目(?:完整开源|已链接认可)[^\n。]*是/g, " ");
  s = s.replace(/以上选择我承诺是永久有效的[^\n。]*是/g, " ");
  s = s.replace(/#square-full\s*开源推广/g, " ");
  s = s.replace(/\/tag\/2234-tag\/2234/g, " ");
  s = s.replace(/(?:\b仓库\s+)+/g, " ");
  s = s.replace(/\b(?:PixPin|Snipaste|CleanShot|SCR|Screenshot|image)[A-Za-z0-9_-]*\b/gi, " ");
  s = s.replace(/\b\d{3,4}x\d{3,4}\s+\d+(?:\.\d+)?\s*[KMG]B\b/gi, " ");
  s = s.replace(/(?:[*>-]\s*){2,}/g, " ");
  s = s.replace(/[#>*`~_]{2,}/g, " ");
  s = s.replace(/\s+/g, " ").trim();
  s = s.replace(/^[.,;:!?\-—|·\s]+/, "").replace(/\s*\.{2,}$/, "");
  return s.trim();
}

function buildSummary(topic, rawMarkdown, blurbs, repoSlug) {
  let ghOneboxDesc = "";
  const joinedBlurbs = (blurbs || []).join(" ");
  const ghMatch = joinedBlurbs.match(
    /GitHub\s*-\s*[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+:\s*([^·\n]{6,180})/i
  );
  if (ghMatch) {
    ghOneboxDesc = ghMatch[1]
      .replace(/\s*Contribute to\s+[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+.*$/i, "")
      .replace(/\.\.\.$/, "")
      .trim();
  }

  let bodyText = "";
  if (rawMarkdown) {
    bodyText = cleanBoilerplateText(rawMarkdown);
  }
  if (!bodyText || bodyText.length < 18) {
    bodyText = cleanBoilerplateText(joinedBlurbs);
  }

  if (repoSlug) {
    const escaped = repoSlug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    bodyText = bodyText
      .replace(new RegExp(`(?:GitHub\\s*-\\s*)?${escaped}\\s*:?`, "gi"), " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  let result = "";
  if (
    ghOneboxDesc &&
    bodyText &&
    !bodyText.toLowerCase().includes(ghOneboxDesc.slice(0, 14).toLowerCase())
  ) {
    result = `${ghOneboxDesc} —— ${bodyText}`;
  } else {
    result = bodyText || ghOneboxDesc;
  }

  result = result.replace(/^[\s:：\-—|·,，。.*]+/, "").trim();

  if (!result || result.length < 12) {
    const tagStr = (topic.tags || [])
      .map((t) => (typeof t === "string" ? t : t.name))
      .filter((n) => n && n !== "开源推广")
      .join(" / ");
    result = `${topic.title}${tagStr ? `（标签：${tagStr}）` : ""}`;
  }

  return result.length > 220 ? `${result.slice(0, 218).trim()}…` : result;
}

function classifyCategory(title, summary, tags) {
  const cleanSummary = summary.replace(/AI\s*生成/gi, "");
  const text = `${title} ${cleanSummary} ${tags.join(" ")}`.toLowerCase();

  if (
    tags.some((t) => ["油猴脚本", "浏览器扩展", "Tampermonkey"].includes(t)) ||
    /(油猴|tampermonkey|userscript|greasyfork|chrome\s*插件|浏览器插件|浏览器扩展|\bcrx\b)/i.test(text)
  ) {
    return "脚本与扩展";
  }

  if (
    /(音乐|视频|影视|播放器|阅读器|小说|漫画|相册|壁纸|画廊|播客|短剧|字幕|bilibili|b站|youtube|spotify|\biptv\b|xview-tv|tv\s*端)/i.test(
      text
    )
  ) {
    return "影音与阅读";
  }

  if (
    tags.some((t) => ["Docker", "NAS", "运维", "服务器", "Cloudflare"].includes(t)) ||
    /\b(uptime|self-hosted|selfhosted|nas|kubernetes|k8s|nginx|vps|ddns|ipprobe|内网穿透|监控|自托管|探针|软路由|防火墙|网关)\b/i.test(
      text
    )
  ) {
    return "运维与自托管";
  }

  if (
    tags.some((t) =>
      ["人工智能", "Agent", "Claude", "ChatGPT", "Gemini", "MCP", "LLM", "DeepSeek", "OpenAI"].includes(t)
    ) ||
    /\b(llm|agent|mcp|chatgpt|claude|gemini|codex|cursor|openai|deepseek|rag|prompt|向量|大模型|智能体|提示词|对话管理)\b/i.test(
      text
    )
  ) {
    return "AI 与 Agent";
  }

  if (
    /\b(macos|windows|android|ios|flutter|electron|tauri|swift|kotlin|wpf|桌面端|客户端|状态栏|菜单栏|安卓)\b/i.test(
      text
    )
  ) {
    return "桌面与移动";
  }

  if (
    /\b(cli|sdk|ide|vscode|neovim|vim|git|terminal|终端|命令行|编译器|数据库|调试|重构|测试|代码审查)\b/i.test(
      text
    )
  ) {
    return "开发与效率";
  }

  if (
    /\b(react|vue|nextjs|next\.js|svelte|tailwind|web|pwa|博客|导航站|图床|书签|面板|dashboard|短链|邮箱)\b/i.test(
      text
    )
  ) {
    return "Web 与应用";
  }

  return "社区与综合";
}

function pickThumbnail(topic) {
  if (Array.isArray(topic.thumbnails) && topic.thumbnails.length > 0) {
    const preferred =
      topic.thumbnails.find((t) => t.max_width === 600) ||
      topic.thumbnails.find((t) => t.max_width === 400) ||
      topic.thumbnails.find((t) => t.max_width === 800) ||
      topic.thumbnails[0];
    if (preferred?.url) {
      return preferred.url.startsWith("//") ? `https:${preferred.url}` : preferred.url;
    }
  }
  if (topic.image_url) {
    return topic.image_url.startsWith("//") ? `https:${topic.image_url}` : topic.image_url;
  }
  return null;
}

const rawPostEntries = [];
const seenTopicIds = new Set();
const sortedTopics = [...(rawTopicsData.topics || [])]
  .filter((t) => {
    if (!t || seenTopicIds.has(t.id)) return false;
    seenTopicIds.add(t.id);
    return true;
  })
  .sort((a, b) => b.created_at.localeCompare(a.created_at));

for (const topic of sortedTopics) {
  const opPoster =
    (topic.posters || []).find((p) => (p.description || "").includes("原始发帖人")) ||
    (topic.posters || [])[0];
  const userObj = opPoster ? userMap.get(opPoster.user_id) : null;
  const username = userObj?.username || topic.last_poster_username || "linuxdo_user";
  const authorName = userObj?.name || username;
  let avatar = userObj?.avatar_template
    ? userObj.avatar_template.replace("{size}", "96")
    : null;
  if (avatar && avatar.startsWith("/")) avatar = `https://linux.do${avatar}`;
  if (avatar && avatar.startsWith("//")) avatar = `https:${avatar}`;

  const rawMd = rawPosts[topic.id] || null;
  const blurbs = searchHarvest[topic.id] || [];
  const { repoUrl, repoSlug, repoHost, extraRepos, demoUrl } = extractReposAndDemo(
    rawMd,
    blurbs,
    topic.featured_link,
    username,
    topic.title
  );

  const tags = (topic.tags || [])
    .map((t) => (typeof t === "string" ? t : t.name))
    .filter((n) => n && n !== "开源推广");

  const name = extractProjectName(topic.title, repoSlug);
  const summary = buildSummary(topic, rawMd, blurbs, repoSlug);
  const category = classifyCategory(topic.title, summary, tags);
  const likes = topic.like_count || topic.op_like_count || 0;
  const views = topic.views || 0;
  const replies = Math.max(0, (topic.posts_count || 1) - 1);

  rawPostEntries.push({
    id: topic.id,
    name,
    title: topic.title,
    summary,
    repoUrl,
    repoSlug,
    repoHost,
    extraRepos,
    demoUrl,
    topicUrl: `https://linux.do/t/topic/${topic.id}`,
    createdAt: topic.created_at,
    bumpedAt: topic.bumped_at || topic.last_posted_at || topic.created_at,
    category,
    tags,
    author: { username, name: authorName, avatar },
    likes,
    views,
    replies,
    image: pickThumbnail(topic),
  });
}

// Recover repoUrl for follow-up update posts by the SAME author mentioning an earlier sibling repo/project
const byAuthorWithRepo = new Map();
for (const entry of rawPostEntries) {
  if (entry.repoUrl) {
    const list = byAuthorWithRepo.get(entry.author.username) || [];
    list.push(entry);
    byAuthorWithRepo.set(entry.author.username, list);
  }
}

for (const entry of rawPostEntries) {
  if (!entry.repoUrl) {
    const siblings = byAuthorWithRepo.get(entry.author.username) || [];
    for (const sib of siblings) {
      const repoName = (sib.repoSlug || "").split("/").pop()?.toLowerCase() || "";
      const sibName = sib.name.toLowerCase();
      const hay = `${entry.title} ${entry.summary}`.toLowerCase();
      if (
        (repoName.length >= 3 && hay.includes(repoName)) ||
        (sibName.length >= 3 && hay.includes(sibName))
      ) {
        entry.repoUrl = sib.repoUrl;
        entry.repoSlug = sib.repoSlug;
        entry.repoHost = sib.repoHost;
        break;
      }
    }
  }
}

// Group and deduplicate posts into unified Project records!
const projectGroups = new Map();

for (const entry of rawPostEntries) {
  let projectKey;
  if (entry.repoUrl) {
    projectKey = entry.repoUrl.toLowerCase();
  } else {
    const normName = entry.name
      .toLowerCase()
      .replace(/v?\d+(?:\.\d+)+/g, "")
      .replace(/[^\u4e00-\u9fa5a-z0-9]/g, "")
      .slice(0, 18);
    projectKey =
      normName.length >= 3
        ? `author:${entry.author.username.toLowerCase()}::${normName}`
        : `topic:${entry.id}`;
  }

  const group = projectGroups.get(projectKey) || [];
  group.push(entry);
  projectGroups.set(projectKey, group);
}

const mergedProjects = [];
const monthlyMap = new Map();
const tagCounts = new Map();
const authorStats = new Map();
const uniqueRepos = new Set();

let totalLikes = 0;
let totalViews = 0;
let withRepoCount = 0;
let multiPostProjectsCount = 0;

// Track monthly stats across all raw posts (ecosystem activity) while deduplicating project list
for (const entry of rawPostEntries) {
  const month = entry.createdAt.slice(0, 7);
  const mEntry = monthlyMap.get(month) || { month, count: 0, withRepo: 0 };
  mEntry.count += 1;
  if (entry.repoUrl) mEntry.withRepo += 1;
  monthlyMap.set(month, mEntry);
}

for (const [projectKey, postsGroup] of projectGroups.entries()) {
  // Sort posts newest -> oldest
  postsGroup.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const newestPost = postsGroup[0];
  const oldestPost = postsGroup[postsGroup.length - 1];

  // Pick best project display name & richest summary (prefer post with highest likes or cleanest non-trivial summary)
  const bestSummaryPost = [...postsGroup].sort((a, b) => {
    const aScore = (a.summary.length > 35 ? 50 : 0) + a.likes;
    const bScore = (b.summary.length > 35 ? 50 : 0) + b.likes;
    return bScore - aScore;
  })[0];

  // Prefer canonical repo name when multi-post or oldest (first release) post name
  let projectName = bestSummaryPost.name;
  if (postsGroup.length > 1 && newestPost.repoSlug && newestPost.repoSlug.includes("/")) {
    const repoPart = newestPost.repoSlug.split("/").pop().replace(/^(?:hf|gitee|codeberg|gist):/, "");
    if (oldestPost.name.length >= 2 && oldestPost.name.length <= 20) {
      projectName = oldestPost.name;
    } else if (repoPart && repoPart.length >= 2) {
      projectName = repoPart;
    }
  } else {
    const shortPost = postsGroup.find((p) => p.name.length >= 2 && p.name.length <= 22);
    if (shortPost) projectName = shortPost.name;
  }

  const unionTags = [...new Set(postsGroup.flatMap((p) => p.tags))].slice(0, 8);
  const unionExtras = [
    ...new Set(
      postsGroup
        .flatMap((p) => p.extraRepos || [])
        .filter((u) => u.toLowerCase() !== (newestPost.repoUrl || "").toLowerCase())
    ),
  ].slice(0, 4);

  const demoUrl = postsGroup.find((p) => p.demoUrl)?.demoUrl || null;
  const bestImage = postsGroup.find((p) => p.image)?.image || null;
  const latestBumped = postsGroup.reduce(
    (max, p) => (p.bumpedAt > max ? p.bumpedAt : max),
    newestPost.bumpedAt
  );

  const sumLikes = postsGroup.reduce((s, p) => s + p.likes, 0);
  const sumViews = postsGroup.reduce((s, p) => s + p.views, 0);
  const sumReplies = postsGroup.reduce((s, p) => s + p.replies, 0);

  // Primary creator is the original poster of the earliest post (the project creator!)
  const creator = oldestPost.author;

  if (postsGroup.length > 1) multiPostProjectsCount++;
  if (newestPost.repoUrl) {
    withRepoCount++;
    uniqueRepos.add(newestPost.repoUrl.toLowerCase());
  }

  totalLikes += sumLikes;
  totalViews += sumViews;

  for (const tg of unionTags) {
    tagCounts.set(tg, (tagCounts.get(tg) || 0) + 1);
  }

  const aStat = authorStats.get(creator.username) || {
    username: creator.username,
    name: creator.name,
    avatar: creator.avatar,
    count: 0,
    totalLikes: 0,
  };
  aStat.count += 1;
  aStat.totalLikes += sumLikes;
  authorStats.set(creator.username, aStat);

  const relatedPosts = postsGroup.map((p) => ({
    id: p.id,
    title: p.title,
    topicUrl: p.topicUrl,
    createdAt: p.createdAt,
    likes: p.likes,
    views: p.views,
    replies: p.replies,
    authorUsername: p.author.username,
  }));

  const projectItem = {
    id: newestPost.id,
    projectKey,
    name: projectName,
    title: newestPost.title,
    summary: bestSummaryPost.summary,
    repoUrl: newestPost.repoUrl,
    repoSlug: newestPost.repoSlug,
    repoHost: newestPost.repoHost,
    topicUrl: newestPost.topicUrl,
    createdAt: newestPost.createdAt,
    firstCreatedAt: oldestPost.createdAt,
    bumpedAt: latestBumped,
    category: bestSummaryPost.category,
    tags: unionTags,
    author: creator,
    likes: sumLikes,
    views: sumViews,
    replies: sumReplies,
    image: bestImage,
    postCount: relatedPosts.length,
    ...(relatedPosts.length > 1 ? { posts: relatedPosts } : {}),
  };

  if (unionExtras.length > 0) projectItem.extraRepos = unionExtras;
  if (demoUrl) projectItem.demoUrl = demoUrl;

  mergedProjects.push(projectItem);
}

// Sort merged projects by latest post creation date descending
mergedProjects.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

const updatedAt = new Date().toISOString();
const stats = {
  totalProjects: mergedProjects.length,
  totalTopics: rawPostEntries.length,
  mergedDuplicatePosts: rawPostEntries.length - mergedProjects.length,
  multiPostProjectsCount,
  withRepoCount,
  uniqueReposCount: uniqueRepos.size,
  totalLikes,
  totalViews,
  totalAuthors: authorStats.size,
  monthlyCounts: [...monthlyMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
  topTags: [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([name, count]) => ({ name, count })),
  topAuthors: [...authorStats.values()]
    .sort((a, b) => b.count - a.count || b.totalLikes - a.totalLikes)
    .slice(0, 20),
};

const dataset = {
  updatedAt,
  sourceUrl: "https://linux.do/tag/2234-tag/2234",
  dataSource: "static-fallback",
  stats,
  items: mergedProjects,
};

const initialIds = new Set();
const initialItems = [];
for (const item of [
  ...mergedProjects.slice(0, 48),
  ...[...mergedProjects].filter((i) => i.repoUrl).sort((a, b) => b.likes - a.likes).slice(0, 12),
]) {
  if (!initialIds.has(item.projectKey)) {
    initialIds.add(item.projectKey);
    initialItems.push(item);
  }
}

const initialDataset = {
  updatedAt,
  sourceUrl: "https://linux.do/tag/2234-tag/2234",
  dataSource: "static-fallback",
  isPartial: true,
  stats,
  items: initialItems,
};

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(dataset));
fs.writeFileSync(OUT_INITIAL_FILE, JSON.stringify(initialDataset));

console.log("Deduplicated dataset built!", {
  totalRawPosts: stats.totalTopics,
  uniqueProjects: stats.totalProjects,
  mergedDuplicatePosts: stats.mergedDuplicatePosts,
  multiPostProjectsCount: stats.multiPostProjectsCount,
  withRepoCount: stats.withRepoCount,
  fullSizeMB: `${(fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(2)} MB`,
});
