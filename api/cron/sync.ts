import type { IncomingMessage, ServerResponse } from "node:http";
import { neon } from "@neondatabase/serverless";

const SOURCE_URL = "https://linux.do/tag/2234-tag/2234";
const TAG_JSON_URLS = [
  "https://linux.do/tag/2234-tag/2234.json?page=0",
  "https://linux.do/tag/2234-tag/2234.json?page=1",
];

function normalizeRepo(rawUrl: string | null | undefined) {
  if (!rawUrl) return null;
  const cleaned = rawUrl.trim().replace(/[),.;'"\]>]+$/, "");
  try {
    const u = new URL(cleaned);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const parts = u.pathname.split("/").filter(Boolean);
    if (
      ["github.com", "gitee.com", "gitlab.com", "codeberg.org"].includes(host) &&
      parts.length >= 2
    ) {
      const owner = parts[0];
      const repo = parts[1].replace(/\.git$/i, "");
      const hostMap: Record<string, string> = {
        "github.com": "github",
        "gitee.com": "gitee",
        "gitlab.com": "gitlab",
        "codeberg.org": "codeberg",
      };
      return {
        url: `https://${host}/${owner}/${repo}`,
        slug: `${owner}/${repo}`,
        host: hostMap[host] || "other",
      };
    }
    if (host === "huggingface.co" && parts.length >= 2) {
      const idx = ["spaces", "datasets", "models"].includes(parts[0]) ? 1 : 0;
      if (parts.length >= idx + 2) {
        const prefix = idx === 1 ? `${parts[0]}/` : "";
        return {
          url: `https://huggingface.co/${prefix}${parts[idx]}/${parts[idx + 1]}`,
          slug: `${parts[idx]}/${parts[idx + 1]}`,
          host: "huggingface",
        };
      }
    }
    if (host === "greasyfork.org") {
      return { url: cleaned.split("?")[0], slug: "greasyfork-script", host: "greasyfork" };
    }
  } catch {
    return null;
  }
  return null;
}

function extractRepoFromText(text: string) {
  const re =
    /https?:\/\/(?:www\.)?(?:github\.com|gitee\.com|gitlab\.com|codeberg\.org|huggingface\.co|greasyfork\.org)\/[^\s)<>"'\]]+/gi;
  const matches = text.match(re) || [];
  for (const m of matches) {
    const norm = normalizeRepo(m);
    if (norm) return norm;
  }
  return null;
}

function cleanProjectName(title: string, repoSlug: string | null): string {
  if (repoSlug && !repoSlug.includes("greasyfork")) {
    const repoName = repoSlug.split("/").pop() || "";
    if (repoName && repoName.length >= 2) return repoName;
  }
  const stripped = title
    .replace(/^[\[【(（][^\]】)）]{1,14}[\]】)）]\s*/g, "")
    .replace(/^(?:开源自荐|开源分享|开源项目|开源推广|自荐|分享|发布)\s*[:：\-—|｜]?\s*/i, "")
    .split(/\s*[-—–:：|｜,，。！!]\s*/)[0]
    .trim();
  return stripped.slice(0, 42) || title.slice(0, 42);
}

function inferCategory(title: string, summary: string, tags: string[]): string {
  const text = `${title} ${summary} ${tags.join(" ")}`.toLowerCase();
  if (
    /(ai|llm|gpt|claude|gemini|deepseek|openai|mcp|agent|rag|ollama|chat|大模型|智能体|提示词|翻译|语音|tts|ocr)/.test(
      text
    )
  ) {
    return "AI 与 Agent";
  }
  if (/(油猴|tampermonkey|userscript|greasyfork|插件|扩展|extension|chrome|browser|脚本)/.test(text)) {
    return "脚本与扩展";
  }
  if (/(docker|nas|面板|监控|代理|节点|服务器|运维|部署|自托管|self-host|ssh|cloudflare|alist|openwrt|k8s|nginx)/.test(text)) {
    return "运维与自托管";
  }
  if (/(音乐|视频|播放器|小说|漫画|阅读|壁纸|相册|tv|iptv|bilibili|b站|youtube|播客|字幕|下载器)/.test(text)) {
    return "影音与阅读";
  }
  if (/(桌面|客户端|macos|windows|android|ios|flutter|tauri|electron|swift|apk|exe|输入法|截图|剪贴板)/.test(text)) {
    return "桌面与移动";
  }
  if (/(cli|sdk|api|终端|编辑器|vscode|git|markdown|数据库|框架|组件|cursor|codex|开发)/.test(text)) {
    return "开发与效率";
  }
  if (/(网站|web|next\.js|react|vue|导航|博客|图床|短链|面板|看板|邮箱|书签|rss)/.test(text)) {
    return "Web 与应用";
  }
  return "社区与综合";
}

function buildRequestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
  };
  if (process.env.LINUXDO_COOKIE) {
    headers.Cookie = process.env.LINUXDO_COOKIE;
  }
  if (process.env.LINUXDO_USER_API_KEY) {
    headers["User-Api-Key"] = process.env.LINUXDO_USER_API_KEY;
  }
  return headers;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // Protect cron endpoint when CRON_SECRET is set on Vercel
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${cronSecret}`) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }
  }

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "DATABASE_URL not configured" }));
    return;
  }

  const sql = neon(dbUrl);
  const headers = buildRequestHeaders();

  try {
    const fetchedTopics: Array<Record<string, any>> = [];
    const userMap = new Map<number, { username: string; name: string; avatar: string | null }>();

    for (const pageUrl of TAG_JSON_URLS) {
      const resp = await fetch(pageUrl, { headers });
      if (!resp.ok) {
        const msg = `Upstream linux.do returned HTTP ${resp.status} (Cloudflare Turnstile may require LINUXDO_COOKIE in Vercel Env)`;
        await sql`
          INSERT INTO sync_runs (trigger_source, status, fetched_topics, new_posts, updated_projects, message)
          VALUES ('vercel-cron', 'skipped_cf', ${fetchedTopics.length}, 0, 0, ${msg})
        `;
        res.statusCode = 200;
        res.end(
          JSON.stringify({
            ok: false,
            status: "skipped_cf",
            message: msg,
          })
        );
        return;
      }

      const data = (await resp.json()) as Record<string, any>;
      for (const u of data.users || []) {
        const avatarTpl = typeof u.avatar_template === "string" ? u.avatar_template : null;
        userMap.set(u.id, {
          username: u.username,
          name: u.name || u.username,
          avatar: avatarTpl
            ? (avatarTpl.startsWith("http") ? avatarTpl : `https://linux.do${avatarTpl}`).replace(
                "{size}",
                "96"
              )
            : null,
        });
      }
      for (const t of data.topic_list?.topics || []) {
        fetchedTopics.push(t);
      }
    }

    if (fetchedTopics.length === 0) {
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, fetched: 0, newPosts: 0, updatedProjects: 0 }));
      return;
    }

    // Check which topic IDs already exist in project_posts
    const topicIds = fetchedTopics.map((t) => Number(t.id));
    const existingPostRows = await sql`
      SELECT topic_id::bigint AS topic_id, project_key
      FROM project_posts
      WHERE topic_id = ANY(${topicIds})
    `;
    const existingPostMap = new Map<number, string>(
      existingPostRows.map((r: any) => [Number(r.topic_id), String(r.project_key)])
    );

    let newPostsCount = 0;
    const touchedProjectKeys = new Set<string>();

    for (const t of fetchedTopics) {
      const topicId = Number(t.id);
      const posterId = t.posters?.[0]?.user_id;
      const author = (posterId && userMap.get(posterId)) || {
        username: "linuxdo_member",
        name: "社区成员",
        avatar: null,
      };
      const topicUrl = `https://linux.do/t/topic/${topicId}`;
      const likes = Number(t.like_count || 0);
      const views = Number(t.views || 0);
      const replies = Math.max(0, Number(t.posts_count || 1) - 1);
      const createdAt = t.created_at || new Date().toISOString();
      const bumpedAt = t.bumped_at || createdAt;
      const tags = (Array.isArray(t.tags) ? t.tags : [])
        .map((tg: any) => (typeof tg === "string" ? tg : tg?.name))
        .filter((tg: any) => tg && tg !== "开源推广");

      // If already known, refresh engagement counters only
      if (existingPostMap.has(topicId)) {
        const pKey = existingPostMap.get(topicId)!;
        await sql`
          UPDATE project_posts
          SET likes = ${likes}, views = ${views}, replies = ${replies}, title = ${t.title}
          WHERE topic_id = ${topicId}
        `;
        touchedProjectKeys.add(pKey);
        continue;
      }

      // New topic! Fetch raw Markdown of post #1 (cap at 12 per daily cron to stay fast & polite)
      let rawBody = String(t.excerpt || "");
      if (newPostsCount < 12) {
        try {
          const rawRes = await fetch(`https://linux.do/raw/${topicId}/1`, { headers });
          if (rawRes.ok) {
            rawBody = await rawRes.text();
          }
        } catch {
          // fallback to excerpt
        }
      }

      const repoInfo = extractRepoFromText(`${t.title}\n${rawBody}`);
      const pName = cleanProjectName(t.title, repoInfo?.slug || null);
      const cleanSummary =
        rawBody
          .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/[#>*`~_]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 260) || t.title;

      // Deduplication check:
      // 1. Same normalized repo_url in `projects`
      // 2. Or same author + normalized project name
      let targetProjectKey = repoInfo
        ? `repo:${repoInfo.url.toLowerCase()}`
        : `name:${author.username.toLowerCase()}:${pName.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "")}`;

      if (repoInfo) {
        const existingByRepo = await sql`
          SELECT project_key FROM projects WHERE lower(repo_url) = ${repoInfo.url.toLowerCase()} LIMIT 1
        `;
        if (existingByRepo[0]?.project_key) {
          targetProjectKey = String(existingByRepo[0].project_key);
        }
      } else {
        const existingByAuthorName = await sql`
          SELECT project_key FROM projects
          WHERE author->>'username' = ${author.username}
            AND lower(name) = ${pName.toLowerCase()}
          LIMIT 1
        `;
        if (existingByAuthorName[0]?.project_key) {
          targetProjectKey = String(existingByAuthorName[0].project_key);
        }
      }

      const category = inferCategory(t.title, cleanSummary, tags);

      // Ensure parent project exists
      await sql`
        INSERT INTO projects (
          project_key, id, name, title, summary, repo_url, repo_slug, repo_host,
          extra_repos, demo_url, topic_url, created_at, first_created_at, bumped_at,
          category, tags, author, likes, views, replies, image, post_count, posts
        )
        VALUES (
          ${targetProjectKey}, ${topicId}, ${pName}, ${t.title}, ${cleanSummary},
          ${repoInfo?.url || null}, ${repoInfo?.slug || null}, ${repoInfo?.host || null},
          '[]'::jsonb, null, ${topicUrl},
          ${createdAt}::timestamptz, ${createdAt}::timestamptz, ${bumpedAt}::timestamptz,
          ${category}, ${JSON.stringify(tags)}::jsonb, ${JSON.stringify(author)}::jsonb,
          ${likes}, ${views}, ${replies}, ${t.image_url || null}, 1, null
        )
        ON CONFLICT (project_key) DO UPDATE SET
          id = GREATEST(projects.id, EXCLUDED.id),
          title = CASE WHEN EXCLUDED.created_at >= projects.created_at THEN EXCLUDED.title ELSE projects.title END,
          topic_url = CASE WHEN EXCLUDED.created_at >= projects.created_at THEN EXCLUDED.topic_url ELSE projects.topic_url END,
          created_at = GREATEST(projects.created_at, EXCLUDED.created_at),
          first_created_at = LEAST(projects.first_created_at, EXCLUDED.first_created_at),
          bumped_at = GREATEST(projects.bumped_at, EXCLUDED.bumped_at),
          repo_url = COALESCE(projects.repo_url, EXCLUDED.repo_url),
          repo_slug = COALESCE(projects.repo_slug, EXCLUDED.repo_slug),
          repo_host = COALESCE(projects.repo_host, EXCLUDED.repo_host),
          image = COALESCE(projects.image, EXCLUDED.image)
      `;

      // Insert post into project_posts
      await sql`
        INSERT INTO project_posts (
          topic_id, project_key, title, topic_url, repo_url, created_at, likes, views, replies, author_username
        )
        VALUES (
          ${topicId}, ${targetProjectKey}, ${t.title}, ${topicUrl}, ${repoInfo?.url || null},
          ${createdAt}::timestamptz, ${likes}, ${views}, ${replies}, ${author.username}
        )
        ON CONFLICT (topic_id) DO UPDATE SET
          likes = EXCLUDED.likes,
          views = EXCLUDED.views,
          replies = EXCLUDED.replies
      `;

      newPostsCount++;
      touchedProjectKeys.add(targetProjectKey);
    }

    // Recompute post_count, posts timeline JSON, and summed metrics for touched projects
    for (const pKey of touchedProjectKeys) {
      const postList = await sql`
        SELECT
          topic_id::int AS id,
          title,
          topic_url AS "topicUrl",
          created_at AS "createdAt",
          likes,
          views,
          replies,
          author_username AS "authorUsername"
        FROM project_posts
        WHERE project_key = ${pKey}
        ORDER BY created_at DESC
      `;

      const postCount = postList.length;
      if (postCount === 0) continue;

      const sumLikes = postList.reduce((acc: number, r: any) => acc + Number(r.likes || 0), 0);
      const sumViews = postList.reduce((acc: number, r: any) => acc + Number(r.views || 0), 0);
      const sumReplies = postList.reduce((acc: number, r: any) => acc + Number(r.replies || 0), 0);
      const postsJson =
        postCount > 1
          ? JSON.stringify(
              postList.map((p: any) => ({
                ...p,
                createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
              }))
            )
          : null;

      await sql`
        UPDATE projects
        SET
          post_count = ${postCount},
          likes = ${sumLikes},
          views = ${sumViews},
          replies = ${sumReplies},
          posts = ${postsJson}::jsonb
        WHERE project_key = ${pKey}
      `;
    }

    // Refresh aggregate counts in site_stats
    const aggRows = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM projects) AS total_projects,
        (SELECT COUNT(*)::int FROM project_posts) AS total_topics,
        (SELECT COUNT(*)::int FROM projects WHERE post_count > 1) AS multi_post_projects,
        (SELECT COUNT(*)::int FROM projects WHERE repo_url IS NOT NULL) AS with_repo_count,
        (SELECT COUNT(DISTINCT lower(repo_url))::int FROM projects WHERE repo_url IS NOT NULL) AS unique_repos_count,
        (SELECT COALESCE(SUM(likes), 0)::bigint FROM projects) AS total_likes,
        (SELECT COALESCE(SUM(views), 0)::bigint FROM projects) AS total_views,
        (SELECT COUNT(DISTINCT author->>'username')::int FROM projects) AS total_authors
    `;
    const agg = aggRows[0];
    const currentStatsRows = await sql`SELECT stats FROM site_stats WHERE id = 1 LIMIT 1`;
    const prevStats = (currentStatsRows[0]?.stats || {}) as Record<string, unknown>;

    const nextStats = {
      ...prevStats,
      totalProjects: Number(agg.total_projects),
      totalTopics: Number(agg.total_topics),
      mergedDuplicatePosts: Math.max(0, Number(agg.total_topics) - Number(agg.total_projects)),
      multiPostProjectsCount: Number(agg.multi_post_projects),
      withRepoCount: Number(agg.with_repo_count),
      uniqueReposCount: Number(agg.unique_repos_count),
      totalLikes: Number(agg.total_likes),
      totalViews: Number(agg.total_views),
      totalAuthors: Number(agg.total_authors),
    };

    await sql`
      INSERT INTO site_stats (id, updated_at, source_url, stats)
      VALUES (1, NOW(), ${SOURCE_URL}, ${JSON.stringify(nextStats)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW(),
        stats = EXCLUDED.stats
    `;

    await sql`
      INSERT INTO sync_runs (trigger_source, status, fetched_topics, new_posts, updated_projects, message)
      VALUES (
        'vercel-cron',
        'success',
        ${fetchedTopics.length},
        ${newPostsCount},
        ${touchedProjectKeys.size},
        'Incremental daily sync & deduplication succeeded'
      )
    `;

    res.statusCode = 200;
    res.end(
      JSON.stringify({
        ok: true,
        fetchedTopics: fetchedTopics.length,
        newPosts: newPostsCount,
        updatedProjects: touchedProjectKeys.size,
      })
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    try {
      await sql`
        INSERT INTO sync_runs (trigger_source, status, fetched_topics, new_posts, updated_projects, message)
        VALUES ('vercel-cron', 'error', 0, 0, 0, ${message})
      `;
    } catch {
      // ignore logging error
    }
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: message }));
  }
}
