#!/usr/bin/env node
/**
 * Seed / Upsert LINUX DO OpenList dataset into Vercel Neon Postgres (`neon-openlist`).
 * Usage:
 *   node --env-file=.env.local scripts/seed-neon.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!dbUrl) {
  console.error("Missing DATABASE_URL or POSTGRES_URL environment variable.");
  process.exit(1);
}

const sql = neon(dbUrl);
const DATA_PATH = path.resolve(process.cwd(), "public/data/projects.json");

async function chunked(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    await fn(items.slice(i, i + size), i);
  }
}

async function main() {
  const dataset = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const items = dataset.items || [];
  console.log(`Connecting to Neon Postgres... Preparing to seed ${items.length} deduplicated projects.`);

  // 1. Create schema
  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      project_key TEXT PRIMARY KEY,
      id BIGINT NOT NULL,
      name TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      repo_url TEXT,
      repo_slug TEXT,
      repo_host TEXT,
      extra_repos JSONB NOT NULL DEFAULT '[]'::jsonb,
      demo_url TEXT,
      topic_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      first_created_at TIMESTAMPTZ NOT NULL,
      bumped_at TIMESTAMPTZ NOT NULL,
      category TEXT NOT NULL,
      tags JSONB NOT NULL DEFAULT '[]'::jsonb,
      author JSONB NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      replies INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      post_count INTEGER NOT NULL DEFAULT 1,
      posts JSONB
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_projects_likes ON projects (likes DESC);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_projects_repo_url ON projects (repo_url) WHERE repo_url IS NOT NULL;`;

  await sql`
    CREATE TABLE IF NOT EXISTS project_posts (
      topic_id BIGINT PRIMARY KEY,
      project_key TEXT NOT NULL REFERENCES projects(project_key) ON DELETE CASCADE,
      title TEXT NOT NULL,
      topic_url TEXT NOT NULL,
      repo_url TEXT,
      created_at TIMESTAMPTZ NOT NULL,
      likes INTEGER NOT NULL DEFAULT 0,
      views INTEGER NOT NULL DEFAULT 0,
      replies INTEGER NOT NULL DEFAULT 0,
      author_username TEXT NOT NULL
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_project_posts_project_key ON project_posts (project_key, created_at DESC);`;

  await sql`
    CREATE TABLE IF NOT EXISTS site_stats (
      id INTEGER PRIMARY KEY DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL,
      source_url TEXT NOT NULL,
      stats JSONB NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sync_runs (
      id SERIAL PRIMARY KEY,
      ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      trigger_source TEXT NOT NULL,
      status TEXT NOT NULL,
      fetched_topics INTEGER NOT NULL DEFAULT 0,
      new_posts INTEGER NOT NULL DEFAULT 0,
      updated_projects INTEGER NOT NULL DEFAULT 0,
      message TEXT
    );
  `;

  // Clean obsolete rows if re-seeding after deduplication refinement
  await sql`TRUNCATE TABLE project_posts, projects RESTART IDENTITY CASCADE;`;

  // 2. Batch insert projects using jsonb_to_recordset for fast, low-CU single roundtrips
  console.log("Seeding `projects` table in batches of 500...");
  await chunked(items, 500, async (batch, offset) => {
    const payload = JSON.stringify(
      batch.map((item) => ({
        project_key: item.projectKey,
        id: item.id,
        name: item.name,
        title: item.title,
        summary: item.summary,
        repo_url: item.repoUrl,
        repo_slug: item.repoSlug,
        repo_host: item.repoHost,
        extra_repos: item.extraRepos || [],
        demo_url: item.demoUrl || null,
        topic_url: item.topicUrl,
        created_at: item.createdAt,
        first_created_at: item.firstCreatedAt || item.createdAt,
        bumped_at: item.bumpedAt,
        category: item.category,
        tags: item.tags || [],
        author: item.author,
        likes: item.likes,
        views: item.views,
        replies: item.replies,
        image: item.image,
        post_count: item.postCount || 1,
        posts: item.posts || null,
      }))
    );

    await sql`
      INSERT INTO projects (
        project_key, id, name, title, summary, repo_url, repo_slug, repo_host,
        extra_repos, demo_url, topic_url, created_at, first_created_at, bumped_at,
        category, tags, author, likes, views, replies, image, post_count, posts
      )
      SELECT
        r.project_key, r.id, r.name, r.title, r.summary, r.repo_url, r.repo_slug, r.repo_host,
        COALESCE(r.extra_repos, '[]'::jsonb), r.demo_url, r.topic_url,
        r.created_at::timestamptz, r.first_created_at::timestamptz, r.bumped_at::timestamptz,
        r.category, COALESCE(r.tags, '[]'::jsonb), r.author,
        r.likes, r.views, r.replies, r.image, r.post_count, r.posts
      FROM jsonb_to_recordset(${payload}::jsonb) AS r(
        project_key TEXT,
        id BIGINT,
        name TEXT,
        title TEXT,
        summary TEXT,
        repo_url TEXT,
        repo_slug TEXT,
        repo_host TEXT,
        extra_repos JSONB,
        demo_url TEXT,
        topic_url TEXT,
        created_at TEXT,
        first_created_at TEXT,
        bumped_at TEXT,
        category TEXT,
        tags JSONB,
        author JSONB,
        likes INTEGER,
        views INTEGER,
        replies INTEGER,
        image TEXT,
        post_count INTEGER,
        posts JSONB
      )
      ON CONFLICT (project_key) DO UPDATE SET
        id = EXCLUDED.id,
        name = EXCLUDED.name,
        title = EXCLUDED.title,
        summary = EXCLUDED.summary,
        repo_url = EXCLUDED.repo_url,
        repo_slug = EXCLUDED.repo_slug,
        repo_host = EXCLUDED.repo_host,
        extra_repos = EXCLUDED.extra_repos,
        demo_url = EXCLUDED.demo_url,
        topic_url = EXCLUDED.topic_url,
        created_at = EXCLUDED.created_at,
        first_created_at = EXCLUDED.first_created_at,
        bumped_at = EXCLUDED.bumped_at,
        category = EXCLUDED.category,
        tags = EXCLUDED.tags,
        author = EXCLUDED.author,
        likes = EXCLUDED.likes,
        views = EXCLUDED.views,
        replies = EXCLUDED.replies,
        image = EXCLUDED.image,
        post_count = EXCLUDED.post_count,
        posts = EXCLUDED.posts;
    `;
    console.log(`  -> Inserted projects ${offset + 1}..${offset + batch.length}`);
  });

  // 3. Expand all associated posts (both multi-post and single-post items) into `project_posts`
  const allPostRows = [];
  for (const item of items) {
    if (item.posts && item.posts.length > 0) {
      for (const p of item.posts) {
        allPostRows.push({
          topic_id: p.id,
          project_key: item.projectKey,
          title: p.title,
          topic_url: p.topicUrl,
          repo_url: item.repoUrl,
          created_at: p.createdAt,
          likes: p.likes,
          views: p.views,
          replies: p.replies,
          author_username: p.authorUsername || item.author.username,
        });
      }
    } else {
      allPostRows.push({
        topic_id: item.id,
        project_key: item.projectKey,
        title: item.title,
        topic_url: item.topicUrl,
        repo_url: item.repoUrl,
        created_at: item.createdAt,
        likes: item.likes,
        views: item.views,
        replies: item.replies,
        author_username: item.author.username,
      });
    }
  }

  console.log(`Seeding \`project_posts\` table (${allPostRows.length} total community posts)...`);
  await chunked(allPostRows, 800, async (batch, offset) => {
    const payload = JSON.stringify(batch);
    await sql`
      INSERT INTO project_posts (
        topic_id, project_key, title, topic_url, repo_url, created_at, likes, views, replies, author_username
      )
      SELECT
        r.topic_id, r.project_key, r.title, r.topic_url, r.repo_url,
        r.created_at::timestamptz, r.likes, r.views, r.replies, r.author_username
      FROM jsonb_to_recordset(${payload}::jsonb) AS r(
        topic_id BIGINT,
        project_key TEXT,
        title TEXT,
        topic_url TEXT,
        repo_url TEXT,
        created_at TEXT,
        likes INTEGER,
        views INTEGER,
        replies INTEGER,
        author_username TEXT
      )
      ON CONFLICT (topic_id) DO UPDATE SET
        project_key = EXCLUDED.project_key,
        title = EXCLUDED.title,
        likes = EXCLUDED.likes,
        views = EXCLUDED.views,
        replies = EXCLUDED.replies;
    `;
    console.log(`  -> Inserted posts ${offset + 1}..${offset + batch.length}`);
  });

  // 4. Upsert site_stats & record initial seed in sync_runs
  const statsJson = JSON.stringify(dataset.stats);
  await sql`
    INSERT INTO site_stats (id, updated_at, source_url, stats)
    VALUES (1, ${dataset.updatedAt}::timestamptz, ${dataset.sourceUrl}, ${statsJson}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      updated_at = EXCLUDED.updated_at,
      source_url = EXCLUDED.source_url,
      stats = EXCLUDED.stats;
  `;

  await sql`
    INSERT INTO sync_runs (trigger_source, status, fetched_topics, new_posts, updated_projects, message)
    VALUES (
      'seed-script',
      'success',
      ${allPostRows.length},
      ${allPostRows.length},
      ${items.length},
      'Initial full seed with deduplication & multi-post association completed'
    );
  `;

  const counts = await sql`
    SELECT
      (SELECT COUNT(*)::int FROM projects) AS projects_count,
      (SELECT COUNT(*)::int FROM projects WHERE post_count > 1) AS multi_post_projects,
      (SELECT COUNT(*)::int FROM project_posts) AS posts_count
  `;
  console.log("Neon Postgres seed complete!", counts[0]);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
