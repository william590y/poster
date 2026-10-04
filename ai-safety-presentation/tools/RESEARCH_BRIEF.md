# Research brief (shared by all research agents)

Context: we are building a professional, visually dense PowerPoint deck "AI Safety and Existential Risk" (author: William Liaw).
Its goal: convey how fast AI is advancing, how scary that is, why safety is urgent, and the theory behind it.
The user wants LOTS of visuals, especially real screenshots of real news headlines "to make everything seem real".

TODAY IS 2026-10-04. Many outline items refer to events in 2025-2026 that you will NOT know from training
(e.g. model names like GPT-6 Astra, Claude Opus 5.5, Fable, MiniMax 3.1). Use WebSearch / WebFetch (load them via
ToolSearch "select:WebSearch,WebFetch") and the browser screenshot tool to find what actually happened.

## Hard rules
1. NEVER fabricate. Every headline, quote, statistic, date and image must come from a page you actually loaded.
   Copy headlines verbatim. If you cannot verify an outline item, put it in `not_found` with what you searched.
   Do NOT create mock-ups that imitate a news outlet, tweet, or document. Do NOT edit screenshots beyond cropping/resizing.
2. Real screenshots: `node /home/user/poster/ai-safety-presentation/tools/shot.js <url> <out.png> [--selector "css"] [--clip x,y,w,h] [--width 1280 --height 900] [--wait 4000] [--scroll N]`
   (run from any dir; it routes through the proxy and trusts its CA). Aim for a crop of headline + subhead (+ hero image if nice),
   typically ~1280x700 viewport, e.g. `--selector "article header"` or `--selector "h1"` with a parent, or a clip.
   ALWAYS look at every screenshot with the Read tool. Delete it if it shows a captcha, "Just a moment", cookie wall, paywall
   blocker, blank page, or an ad covering the headline. Retry with a different selector / scroll / wait, or try an alternate
   URL (e.g. archive.ph / web.archive.org snapshot, syndicated copy on Yahoo/MSN, the outlet's AMP page) — but the content
   must be the genuine article. Many outlets block headless browsers; that's fine, just record the verified headline text
   (from WebFetch/WebSearch) with `file: null` — we will render a neutral citation card from it.
3. Images: download real images with `curl -sSL -o file URL` (figures from papers on arXiv, official blog charts, Wikimedia Commons,
   press photos from the article). Prefer >= 1000px wide. Record the source URL. Check each with the Read tool.
4. Data: when you find numeric series that could become a native chart (benchmark scores over time, CVE counts per year,
   capex by year, etc.), record the numbers + source in `datasets`.
5. Videos: find the actual YouTube (or other) URL; record it; save the thumbnail
   (`https://img.youtube.com/vi/<ID>/maxresdefault.jpg`, fallback hqdefault.jpg).
6. Abundance matters: target 10-20 usable items for your group (headline screenshots, headline texts, images, datasets).
   Prioritize credible outlets (NYT, WSJ, FT, Reuters, Bloomberg, AP, Guardian, BBC, The Verge, Wired, Axios, MIT Tech Review,
   Nature/Science, company blogs, arXiv), and recency (2025-2026 most compelling).

## Output
Write everything into `/home/user/poster/ai-safety-presentation/assets/research/<GROUP>/` and a
`manifest.json` there with this schema:
```json
{
  "group": "<GROUP>",
  "items": [
    {"id": "short-kebab-id", "slide_topic": "which outline slide it serves",
     "type": "headline|image|chart|video|quote|screenshot",
     "file": "filename.png or null", "headline": "verbatim headline (for headlines)", "dek": "verbatim subhead/lede or quote text",
     "outlet": "Reuters", "author": "optional", "date": "YYYY-MM-DD", "url": "https://...",
     "caption": "one-line description of what the image shows", "quality": 1-5,
     "verified": true, "notes": "anything useful"}
  ],
  "datasets": [{"id": "...", "title": "...", "unit": "...", "labels": [...], "series": [{"name": "...", "values": [...]}], "source": "...", "url": "..."}],
  "facts": [{"claim": "punchy verified stat/sentence for slide text", "source": "...", "url": "...", "date": "..."}],
  "not_found": [{"outline_item": "...", "searched": "..."}]
}
```
Validate the JSON (`python3 -m json.tool manifest.json`). Your final reply should be SHORT: counts, the 5 strongest items, and the
not_found list. Do not paste the manifest.
