#!/usr/bin/env node
/**
 * Incremental Sync Utility for LINUX DO #开源推广 (tag 2234) -> Neon Postgres
 * Usage:
 *   LINUXDO_COOKIE="..." node --env-file=.env.local scripts/sync-linuxdo.mjs
 * Or seed full dataset:
 *   node --env-file=.env.local scripts/seed-neon.mjs
 */
import handler from "../api/cron/sync.ts";

// Allows running the exact same incremental deduplicating Neon sync locally when run via tsx/node --experimental-strip-types
const fakeReq = {
  method: "GET",
  url: "/api/cron/sync",
  headers: process.env.CRON_SECRET ? { authorization: `Bearer ${process.env.CRON_SECRET}` } : {},
};

const fakeRes = {
  statusCode: 200,
  headers: {},
  setHeader(k, v) {
    this.headers[k] = v;
  },
  end(body) {
    console.log(`[sync-linuxdo] HTTP ${this.statusCode}:`, body);
  },
};

handler(fakeReq, fakeRes).catch((err) => {
  console.error(err);
  process.exit(1);
});
