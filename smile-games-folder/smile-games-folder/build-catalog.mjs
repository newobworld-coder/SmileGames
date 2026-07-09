#!/usr/bin/env node
/* ---------------------------------------------------------------------------
 * Smile Games — catalog builder
 *
 * Scans the games/ folder and writes catalog.js (a small file the page loads).
 * Folder layout decides the structure:
 *
 *   games/
 *     Games/                      <- a top-level folder = a CATEGORY
 *       Eiken 2/                  <- a folder inside = a SUBCATEGORY
 *         Verballistic.html       <- an .html file = a TITLE
 *       Arcade/
 *         Golazo.html
 *     Apps/
 *       Learning/
 *         Kotoba.html
 *
 * A file placed straight inside a category folder (no subcategory) is fine too.
 *
 * Optional per-game metadata: put a comment near the top of the .html file:
 *
 *   <!-- smile
 *   title: VERBALLISTIC
 *   description: Eiken Pre-1 physics quiz brawler
 *   accent: 190            (a hue 0-360, or a hex like #38E1FF)
 *   order: 1               (lower shows first)
 *   -->
 *
 * Optional smile.config.json in the project root to name/colour/order
 * categories and set the site title & tagline:
 *
 *   {
 *     "title": "SMILE GAMES",
 *     "tagline": "Everything I made, in one place.",
 *     "categories": {
 *       "Games": { "hue": 190, "order": 1 },
 *       "Apps":  { "hue": 315, "order": 2 }
 *     }
 *   }
 * ------------------------------------------------------------------------- */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const GAMES_DIR = path.join(ROOT, "games");
const CONFIG_PATH = path.join(ROOT, "smile.config.json");

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
const prettify = (s) => s.replace(/\.html?$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
const hashHue = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (/\.html?$/i.test(e.name)) out.push(full);
  }
  return out;
}

function parseMeta(html) {
  const meta = {};
  const m = /<!--\s*smile\b([\s\S]*?)-->/i.exec(html);
  if (m) for (const line of m[1].split("\n")) {
    const mm = /^\s*([a-z]+)\s*:\s*(.+?)\s*$/i.exec(line);
    if (mm) meta[mm[1].toLowerCase()] = mm[2];
  }
  return meta;
}

const config = existsSync(CONFIG_PATH) ? JSON.parse(await readFile(CONFIG_PATH, "utf8")) : {};
const catConfig = config.categories || {};

const files = existsSync(GAMES_DIR) ? await walk(GAMES_DIR) : [];
const catMap = new Map();
const games = [];

for (const file of files) {
  const rel = path.relative(GAMES_DIR, file);
  const parts = rel.split(path.sep);
  let catName = "Uncategorized", subName = null;
  if (parts.length >= 3) { catName = parts[0]; subName = parts[1]; }
  else if (parts.length === 2) { catName = parts[0]; }

  const html = (await readFile(file, "utf8")).slice(0, 6000);
  const meta = parseMeta(html);
  const info = await stat(file);
  const title = meta.title || prettify(parts[parts.length - 1]);

  let accent = "";
  if (meta.accent) {
    const a = meta.accent.trim();
    accent = /^\d{1,3}$/.test(a) ? `hsl(${a} 90% 60%)` : a;
  }

  if (!catMap.has(catName)) {
    const cc = catConfig[catName] || {};
    catMap.set(catName, { id: slug(catName), name: catName, hue: cc.hue ?? hashHue(catName), order: cc.order ?? null, subs: new Map() });
  }
  const cat = catMap.get(catName);
  let subId = "";
  if (subName) {
    if (!cat.subs.has(subName)) cat.subs.set(subName, { id: slug(subName), name: subName });
    subId = cat.subs.get(subName).id;
  }

  const urlPath = "games/" + parts.map(encodeURIComponent).join("/");
  games.push({
    id: slug(rel), title, category: cat.id, subcategory: subId,
    description: meta.description || "", accent, path: urlPath,
    size: info.size, order: meta.order ? Number(meta.order) : null, mtime: info.mtimeMs,
  });
}

let categories = [...catMap.values()].map((c) => ({
  id: c.id, name: c.name, hue: c.hue, order: c.order, subcategories: [...c.subs.values()],
}));
categories.sort((a, b) => ((a.order ?? 999) - (b.order ?? 999)) || a.name.localeCompare(b.name));
categories.forEach((c) => delete c.order);

games.sort((a, b) => ((a.order ?? 999) - (b.order ?? 999)) || a.title.localeCompare(b.title));
games.forEach((g) => delete g.order);

const catalog = {
  title: config.title || "SMILE GAMES",
  tagline: config.tagline || "",
  categories, games, built: new Date().toISOString(),
};

await writeFile(path.join(ROOT, "catalog.js"), "window.__CATALOG__ = " + JSON.stringify(catalog) + ";\n");
console.log(`Built catalog.js — ${games.length} title(s) across ${categories.length} categor${categories.length === 1 ? "y" : "ies"}.`);
