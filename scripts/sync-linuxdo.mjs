#!/usr/bin/env node
/**
 * Incremental Sync Utility for LINUX DO #开源推广 (tag 2234)
 * Usage:
 *   LINUXDO_COOKIE="..." node scripts/sync-linuxdo.mjs
 * Or invoke via ego-browser logged-in session to pull newly published topics.
 */
import fs from "node:fs";
import path from "node:path";

const DATA_PATH = path.resolve(process.cwd(), "public/data/projects.json");

async function main() {
  if (!fs.existsSync(DATA_PATH)) {
    console.error("public/data/projects.json not found. Run initial dataset build first.");
    process.exit(1);
  }

  const existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const knownIds = new Set(existing.items.map((i) => i.id));
  const cookie = process.env.LINUXDO_COOKIE || "";

  console.log(`Loaded ${existing.items.length} existing projects. Checking https://linux.do/tag/2234-tag/2234.json ...`);

  const res = await fetch("https://linux.do/tag/2234-tag/2234.json", {
    headers: {
      Accept: "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    console.error(`HTTP ${res.status}: Note that linux.do is protected by Cloudflare; pass LINUXDO_COOKIE or run sync inside an authenticated browser session.`);
    process.exit(1);
  }

  const data = await res.json();
  const newTopics = (data.topic_list?.topics || []).filter((t) => !knownIds.has(t.id));
  console.log(`Found ${newTopics.length} new topics on page 0.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
