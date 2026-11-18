import type { IncomingMessage, ServerResponse } from "node:http";
import { gzipSync } from "node:zlib";
import { neon } from "@neondatabase/serverless";

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method && req.method !== "GET" && req.method !== "HEAD") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Neon DATABASE_URL not configured" }));
    return;
  }

  try {
    const urlObj = new URL(req.url || "/api/projects", "http://localhost");
    const isInitial = urlObj.searchParams.get("mode") === "initial";
    const sql = neon(dbUrl);

    const [statsRows, projectRows] = await Promise.all([
      sql`SELECT updated_at, source_url, stats FROM site_stats WHERE id = 1 LIMIT 1`,
      isInitial
        ? sql`
            SELECT * FROM (
              (SELECT
                project_key AS "projectKey",
                id::int AS id,
                name,
                title,
                summary,
                repo_url AS "repoUrl",
                repo_slug AS "repoSlug",
                repo_host AS "repoHost",
                extra_repos AS "extraRepos",
                demo_url AS "demoUrl",
                topic_url AS "topicUrl",
                created_at AS "createdAt",
                first_created_at AS "firstCreatedAt",
                bumped_at AS "bumpedAt",
                category,
                tags,
                author,
                likes,
                views,
                replies,
                image,
                post_count AS "postCount",
                posts
              FROM projects
              ORDER BY created_at DESC
              LIMIT 72)
              UNION
              (SELECT
                project_key AS "projectKey",
                id::int AS id,
                name,
                title,
                summary,
                repo_url AS "repoUrl",
                repo_slug AS "repoSlug",
                repo_host AS "repoHost",
                extra_repos AS "extraRepos",
                demo_url AS "demoUrl",
                topic_url AS "topicUrl",
                created_at AS "createdAt",
                first_created_at AS "firstCreatedAt",
                bumped_at AS "bumpedAt",
                category,
                tags,
                author,
                likes,
                views,
                replies,
                image,
                post_count AS "postCount",
                posts
              FROM projects
              WHERE repo_url IS NOT NULL
              ORDER BY likes DESC
              LIMIT 16)
            ) AS sub
            ORDER BY "createdAt" DESC
          `
        : sql`
            SELECT
              project_key AS "projectKey",
              id::int AS id,
              name,
              title,
              summary,
              repo_url AS "repoUrl",
              repo_slug AS "repoSlug",
              repo_host AS "repoHost",
              extra_repos AS "extraRepos",
              demo_url AS "demoUrl",
              topic_url AS "topicUrl",
              created_at AS "createdAt",
              first_created_at AS "firstCreatedAt",
              bumped_at AS "bumpedAt",
              category,
              tags,
              author,
              likes,
              views,
              replies,
              image,
              post_count AS "postCount",
              posts
            FROM projects
            ORDER BY created_at DESC
          `,
    ]);

    const statRow = statsRows[0];
    const items = projectRows.map((r: Record<string, unknown>) => {
      const cleaned: Record<string, unknown> = {
        id: Number(r.id),
        projectKey: r.projectKey,
        name: r.name,
        title: r.title,
        summary: r.summary,
        repoUrl: r.repoUrl ?? null,
        repoSlug: r.repoSlug ?? null,
        repoHost: r.repoHost ?? null,
        topicUrl: r.topicUrl,
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
        firstCreatedAt:
          r.firstCreatedAt instanceof Date ? r.firstCreatedAt.toISOString() : r.firstCreatedAt,
        bumpedAt: r.bumpedAt instanceof Date ? r.bumpedAt.toISOString() : r.bumpedAt,
        category: r.category,
        tags: Array.isArray(r.tags) ? r.tags : [],
        author: r.author,
        likes: Number(r.likes || 0),
        views: Number(r.views || 0),
        replies: Number(r.replies || 0),
        image: r.image ?? null,
        postCount: Number(r.postCount || 1),
      };
      if (Array.isArray(r.extraRepos) && r.extraRepos.length > 0) {
        cleaned.extraRepos = r.extraRepos;
      }
      if (r.demoUrl) {
        cleaned.demoUrl = r.demoUrl;
      }
      if (Array.isArray(r.posts) && r.posts.length > 1) {
        cleaned.posts = r.posts;
      }
      return cleaned;
    });

    const payloadObj = {
      updatedAt:
        statRow?.updated_at instanceof Date
          ? statRow.updated_at.toISOString()
          : statRow?.updated_at || new Date().toISOString(),
      sourceUrl: statRow?.source_url || "https://linux.do/tag/2234-tag/2234",
      dataSource: "neon-postgres",
      ...(isInitial ? { isPartial: true } : {}),
      stats: statRow?.stats || {},
      items,
    };

    const jsonBuffer = Buffer.from(JSON.stringify(payloadObj), "utf-8");

    // Edge CDN caching: 1h fresh + 24h stale-while-revalidate protects Neon Free Tier CU-hours
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Vary", "Accept-Encoding");

    const acceptEncoding = String(req.headers["accept-encoding"] || "");
    if (acceptEncoding.includes("gzip") || jsonBuffer.byteLength > 4_000_000) {
      const gz = gzipSync(jsonBuffer, { level: 6 });
      res.setHeader("Content-Encoding", "gzip");
      res.statusCode = 200;
      res.end(gz);
      return;
    }

    res.statusCode = 200;
    res.end(jsonBuffer);
  } catch (err) {
    console.error("[api/projects] Neon query error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: "Failed to query Neon database",
        detail: err instanceof Error ? err.message : String(err),
      })
    );
  }
}
