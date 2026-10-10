# Deployment Guide

This document covers deploying Ek Safar to **Vercel** (the primary hosting platform) and configuring the walking-route API key. For Android/Play Store packaging, see [`DEPLOYMENT_ANDROID.md`](DEPLOYMENT_ANDROID.md).

---

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier is sufficient)
- An [OpenRouteService](https://openrouteservice.org/) API key (free tier: 2,500 requests/day)
- The repository forked/cloned and linked to your Vercel project

---

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/notUbaid/gdgmetro)

1. Click the button above and import the repository into Vercel.
2. Vercel auto-detects Vite — no framework override needed.
3. Set the **Build Command** to `npm run build` and **Output Directory** to `dist`.
4. Add the required environment variable (see below).
5. Deploy.

---

## Environment Variables

### Required (Production)

| Variable | Scope | Description |
|:---|:---|:---|
| `ORS_API_KEY` | **Server only** | Your OpenRouteService API key. Consumed by `/api/walking-route` and `/api/ors-geocode`. **Never expose to the client.** |

Set it in the Vercel dashboard under **Project → Settings → Environment Variables**. Set scope to **Production** (and optionally **Preview**). Do **not** prefix with `VITE_`.

### Optional (Local Development Only)

| Variable | Scope | Description |
|:---|:---|:---|
| `VITE_ORS_API_KEY` | Client (dev only) | Shows a "walking routes not configured" hint in the UI. Not used in production. |

```env
# .env  (create at project root — never commit)
VITE_ORS_API_KEY=your_ors_key_here
```

---

## Build Command Explained

```bash
npm run build
```

This runs three steps in sequence:

1. **`scripts/generateSeoAndLlms.js`** — Parses timetable + fare matrix → generates `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt`, and injects semantic HTML into `index.html`.
2. **`vite build`** — Bundles the React app into `dist/` with Terser minification and manual chunk splitting.
3. **`scripts/generateStaticPages.js`** — Generates 53 station pages, 342+ route pages, and 8 intent landing pages as pre-rendered HTML inside `dist/`.

---

## Vercel Configuration

Security headers and API rewrites are configured in [`vercel.json`](vercel.json). Key headers applied globally:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(self), camera=(), microphone=()`

Serverless functions in `api/` are auto-detected by Vercel — no explicit routing configuration is needed.

---

## Free Tier Budget Management

OpenRouteService's free tier allows **2,500 requests/day**. The two proxy functions stay within this budget via:

- **`/api/ors-geocode`** — CDN `s-maxage=86400` (24 h cache) + server-side deduplication
- **`/api/walking-route`** — CDN `s-maxage=3600` (1 h cache) + server-side response caching

Monitor usage at [openrouteservice.org/dashboard](https://openrouteservice.org/dashboard/).

---

## Troubleshooting

### Walking routes render as straight lines

**Cause:** `ORS_API_KEY` is missing, wrong, or not set for the correct Vercel environment.

**Fix:**
1. Go to **Vercel Dashboard → Project → Settings → Environment Variables**.
2. Verify `ORS_API_KEY` exists and is set for `Production` (and `Preview` if needed).
3. **Redeploy** — env var changes only take effect on the next deployment.
4. Confirm the key is valid:
   ```bash
   curl "https://api.openrouteservice.org/v2/health" -H "Authorization: <your_key>"
   ```

### Service worker not updating

Users on a stale PWA see the **Update Banner** in-app. To force cache busting, increment the cache name in `vite.config.ts` → `workbox.cacheName`.

### SSG pages returning 404

Verify `dist/station/<slug>/index.html` exists after build. The Workbox `navigateFallbackDenylist` pattern excludes `/station/**`, `/route/**`, etc. from the SPA fallback so they're served as real HTML files. If the build didn't run `generateStaticPages.js`, those directories won't exist.

### `generateSeoAndLlms.js` fails on CI

The script requires `--experimental-strip-types` (Node 20+). Ensure your CI workflow specifies `node-version: '20'` or later.

---

## Custom Domain

1. Go to **Vercel Dashboard → Project → Settings → Domains**.
2. Add your domain (e.g. `eksafar.transit`).
3. Update your DNS registrar with the CNAME or A records Vercel provides.
4. Vercel automatically provisions and renews a TLS certificate.
5. Update `assetlinks.json` (`public/.well-known/assetlinks.json`) if the origin changes — required for the Android TWA to pass asset link verification.

---

## CI / Continuous Integration

The CI workflow (`.github/workflows/test.yml`) runs on every push and PR to `main`:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
- run: npm ci
- run: npx vitest run --coverage
```

Coverage reports are uploaded as build artifacts. All 131 tests must pass before a PR can merge.

---

## Post-Deployment Checklist

- [ ] Open the live URL and confirm the app loads
- [ ] Test route planning between two stations (online)
- [ ] Enable airplane mode and re-test (offline)
- [ ] Check `/sitemap.xml` and `/robots.txt` are accessible
- [ ] Check `/llms.txt` is accessible
- [ ] Verify the service worker registers (DevTools → Application → Service Workers)
- [ ] Test the Android TWA if a Play Store update was triggered
