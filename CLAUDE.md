# Aancestr — Brand Prototype

Context for Claude Code working on this repo. Read this first.

## What this is

A rapid prototype + CMS for **Aancestr**, a philosophy-led wellness brand (first product: Shilajit). Built for Marc — UI/UX designer with 26+ years experience — to iterate on copy and design fast, and to share work-in-progress with the client (Kimberly Lloyd in London, Lobe Lloyd International).

Strategic brand brief is signed off (Lobe Lloyd, 13 March 2026). This prototype implements two artefacts from that brief:

1. A **review tool** for editorial work on the website transcript copy (per-block approve / cut / flag / edit, version history, JSON export).
2. A **design stage** for typographic prototyping of the consumer-facing scrolling page, with control panel, variable-font axis controls, scroll-driven type behaviour, video masking, and a publish-to-Netlify flow.

Both are single-file vanilla HTML / CSS / JS. No build step. Hosted on Netlify (`aancestr.netlify.app`), repo on GitHub at `rgbk/aancestr`.

## File map

```
/
├── index.html                         # The review tool (was transcript-review-tool.html, renamed)
├── stage.html                         # The design prototype with control panel
├── netlify.toml                       # Build + functions config
├── package.json                       # Just @netlify/blobs for the functions
├── netlify/functions/
│   ├── design.js                      # GET/POST published design state (Netlify Blobs)
│   └── video.js                       # GET/POST video URLs by slot (bg | mask)
├── fonts/
│   ├── AdamLegacyVF.ttf              # Variable font, slnt axis (-400 to 400)
│   └── DeutschVARVF.ttf              # Variable font, wght (100–900) + wdth (100–250)
├── website-transcript-v01.md          # Strategy-doc voice (kept for reference, wrong register)
├── website-transcript-v02.md          # Consumer voice, some lines flagged
├── website-transcript-v03.md          # Current copy — built from Marc's v0.2 review report
└── .gitignore
```

## The two artefacts

### `index.html` — Review Tool (CMS-ish)

Per-block editorial tool for the website transcript copy. Marc uses it to approve / cut / flag-for-rewrite / edit-inline every block of the consumer page, with notes and tags. Versions stored in `localStorage` under `aancestr-transcript-v03-review`. Exports JSON; that JSON is the spec for what `stage.html` then renders.

### `stage.html` — Design Stage

Single-file scrolling typographic prototype. Renders the 22 blocks of v0.3 transcript content as full-viewport statements grouped by section. Press `x` to open the right-side control panel.

**Content source:** stage tries to read v0.3 from review tool's `localStorage` (same origin = live sync); falls back to bundled `FALLBACK_BLOCKS` constant if not available (incognito, different device, etc.).

**Control panel** lets the user set:
- Page bg colour + text colour
- Font family (Adam Legacy only right now — Deutsch VAR removed at Marc's request)
- Variable axes (slnt for Adam Legacy)
- Per-axis **scroll-driven** sliders (slntScroll) — scroll velocity adds signed delta to base axis value. Scroll down → slnt right; scroll up → slnt left. Decays back to base when scrolling stops via rAF loop.
- Type size, letter-spacing, line-height, alignment, case, opacity
- Padding X / Y
- Two video slots: **Page bg** (full-screen background video) and **Text mask** (revealed inside text shape only)
- Bg blur slider — applies CSS `filter: blur()` to page-bg video, plus auto-scales the video up so blur edges stay outside the viewport
- Per-statement bg colour (click a statement to select)
- Version save / load / export (localStorage)
- **Publish to Netlify** button — pushes design state + both video URLs to live API
- **Pull latest** — fetches live state and overwrites local

## Architecture decisions worth knowing

### Local vs deployed mode

The page detects `IS_LOCAL` via hostname (`localhost` / `127.0.0.1`). When true:
- All `/api/*` calls go to `https://aancestr.netlify.app/api/*` (cross-origin, CORS enabled on functions)
- localStorage caches working state + video URLs so reload survives
- Tweaks don't auto-publish — explicit **Publish to Netlify** button is the only way to push live

On the deployed site, the page reads from the Netlify Functions on first visit (if no local cache) and uses localStorage afterwards.

Marc's stated preference: **iterate fast locally, push to Netlify only when happy** for Kimberly.

### True SVG masking (not mix-blend-mode)

Each statement renders a hidden inline SVG with a `<mask>` containing the statement text as SVG `<text>`. A `<video class="text-mask-video">` element is masked via CSS `mask: url(#tm-NN)`, so the video is visible *only inside the text shape*. The mask's text inherits CSS variables (`--font-family`, `--font-size`, `--font-variation`, etc.) so the masked shape always matches the visible HTML text.

Mask + video are both inset by padding via `calc(100% - 2 * var(--section-padding-x))` so they stay aligned with the HTML text inside the padded content box.

SVG text doesn't wrap automatically — multi-line statements are split on `\n` into `<tspan>` elements with dy offsets. Long single lines that exceed the content box get cleanly clipped at the padding edge (because the mask area ends there).

### Variable fonts

Adam Legacy has only the `slnt` axis (-400 to 400). Deutsch VAR has `wght` (100–900) and `wdth` (100–250). The CP auto-shows the relevant axis slider per font. Marc has currently restricted the dropdown to Adam Legacy only.

### Scroll-driven axes

A `requestAnimationFrame` loop (animateScroll) reads `_scrollVelocity` (signed, accumulates from scroll events, decays at 0.9 per frame) and writes to `--font-variation`. The CP's "Slant · scroll" slider determines magnitude and direction. Scroll fast → axis pushes hard; stop → axis returns to base.

### Section headers

One fixed-position `.section-header` per section-group, all stacked at `top: 0`. Only the active one has `opacity: 1` via `.active` class. JS (`updateActiveSectionHeader`) finds the latest section-group whose top has crossed the viewport top and marks its header active. Clean swap at section boundaries.

### Cloudinary for video files

Upload preset: `Aancestr` (unsigned). Cloud name: `dsgxmrcyq`. Videos go direct browser → Cloudinary, returned URL is stored via the `/api/video` function. Folder per slot: `aancestr-stage/bg` and `aancestr-stage/mask`.

### Netlify Functions + Blobs

Two functions: `design.js` (GET/POST one JSON state blob) and `video.js` (GET both slots, POST one slot). Backed by Netlify Blobs (`aancestr-stage` store), strong consistency. CORS open on all origins so localhost can publish to live without proxy.

## Conventions Marc cares about

1. **Local first, publish explicit.** Don't auto-push to Netlify on every Save. Marc wants Save = local snapshot; Publish = push live.
2. **No arbitrary padding/margin.** When he sets padding to 0, text edges should kiss the viewport edges. If you find yourself adding `5%` or `8px` "for spacing", stop.
3. **Cowork comes first for visual iteration.** Marc may bounce back to the Cowork session for conversational refinement, screenshots, and ideation. Don't assume this repo is the only source of his project context.
4. **Memory in the brief.** The full content rationale, audience strategy, founder positioning, and post-it priorities are in the strategic brief PDF (not in this repo). The eight through-lines Marc circled in his post-it audit are: *Ritual vs Intervention · Health is built over time · Philosophy · Ritual · Ceremony · FAMILY · Ancient vs Modern · Daily Practice · 3,000 / 30 · Moments vs Lifetimes.*
5. **Speak human in the consumer copy.** v0.1 (strategy-doc voice) was a wrong register — never lift brand-book language into consumer copy. v0.3 is the current spec.

## Workflow

**Local development:**
```bash
cd ~/Documents/Claude/Projects/Aancestr
npx serve .
# open http://localhost:3000/stage.html and http://localhost:3000/
```

For full local function support (if needed):
```bash
netlify dev   # instead of npx serve
```

**Push to live:**
```bash
git add -A
git commit -m "..."
git push
# Netlify auto-deploys in ~30–60 seconds at aancestr.netlify.app
```

## Open work / nice-to-haves

- SVG text auto-wrap (currently long lines clip at padding edge instead of wrapping into tspans)
- Shared version history (currently version snapshots are per-user localStorage; publishing only pushes the current state)
- Password protection on the live URL when sharing more widely (Netlify paid feature or a tiny gate)
- Production migration to Next.js + Tailwind + Framer Motion when ready — current vanilla code translates 1:1 (CSS vars become Tailwind config, scroll loop becomes a hook, etc.)

## Stakeholders

- **Marc Kremers** — designer, building this (marc@futurecorp.paris)
- **Ali Al-Hamadi** + **Mohamed Bouaziz** — Aancestr founders
- **Sascha Lobe** + **Kimberly Lloyd** — Lobe Lloyd International, authors of the strategic brand brief
