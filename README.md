# Smile Games — folder edition

A 3D "select screen" for your self-contained HTML games and apps. No backend, no
password, no upload limits. **You add a game by dropping its `.html` file into a
folder.** A tiny build step lists everything automatically, and each tile shows
the real game running in miniature — click to launch it full-screen in a new tab.

---

## How adding a game works

The folder structure *is* the menu:

```
games/
  Games/                 <- a top-level folder = a CATEGORY
    Eiken 2/             <- a folder inside = a SUBCATEGORY
      Verballistic.html  <- an .html file = a TITLE
    Arcade/
      Golazo.html
  Apps/
    Learning/
      Kotoba no Mori.html
```

- Make a folder for each **category** (Games, Apps, …).
- Make folders inside for **subcategories** (Eiken 2, Eiken Pre-2, Arcade, …).
- Drop your single-file `.html` games into them.
- A file placed straight inside a category folder (with no subcategory) is fine too.

That's it. To add, remove, rename, or recategorise a title, you just add / delete /
move / rename files and folders.

### Optional: per-game details

By default the title comes from the filename and the accent from its category. To
override, put a short comment near the top of the game's `.html` file:

```html
<!-- smile
title: VERBALLISTIC
description: Eiken Pre-1 physics quiz brawler
accent: 190              (a hue 0-360, or a hex like #38E1FF)
order: 1                 (lower numbers show first)
-->
```

Everything is optional — include only what you want.

### Optional: name & colour your categories

Category names and colours come from the folder names automatically. To control the
site title, tagline, category colours, or order, edit **`smile.config.json`**:

```json
{
  "title": "SMILE GAMES",
  "tagline": "Everything I made, in one place. Tap a tile to play.",
  "categories": {
    "Games": { "hue": 190, "order": 1 },
    "Apps":  { "hue": 315, "order": 2 }
  }
}
```

---

## Deploy to Netlify

**Option A — connect a Git repo (recommended)**
1. Push this folder to a GitHub/GitLab repo.
2. Netlify → *Add new site → Import an existing project* → pick the repo.
3. Netlify reads `netlify.toml`, runs `node build-catalog.mjs`, and publishes. Done.

From then on, **adding a game = add the file, commit, push.** Netlify rebuilds and
it appears. No dashboard steps.

**Option B — Netlify CLI**
```bash
npm i -g netlify-cli
netlify deploy --build --prod
```

**Option C — drag-and-drop**
Run the build yourself first so `catalog.js` is up to date, then drag the whole
folder onto Netlify:
```bash
node build-catalog.mjs
```
(Manual drops don't run the build step, so you must build locally first.)

---

## Preview locally

After building once (`node build-catalog.mjs`), you can just **double-click
`index.html`** — it loads the catalog from `catalog.js` and the game files by
relative path, so browsing, previews, and launching all work offline. Re-run the
build whenever you add or change games.

---

## Notes

- No file-size limit — games are served as plain static files, so even your big
  builds are fine.
- Previews are lazy-loaded (a tile only starts running when it scrolls into view),
  so a large shelf stays smooth.
- `catalog.js` is generated. It's committed here so drag-drop and local preview work
  out of the box; the build overwrites it each deploy. You never edit it by hand.
- The `games/` folder ships with three tiny example titles so you can see it working
  — delete them and add your own.
