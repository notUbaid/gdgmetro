<div align="center">

<img src="public/pwa-512x512.png" alt="Ek Safar Logo" width="96" height="96" />

# Ek Safar

**Offline-first journey planner for the Ahmedabad–Gandhinagar metro network**

[![Live App](https://img.shields.io/badge/Live%20App-eksafar.transit-0066CC?style=for-the-badge&logo=googlechrome&logoColor=white)](https://eksafar.transit/)
[![Google Play](https://img.shields.io/badge/Google%20Play-Install-34A853?style=for-the-badge&logo=google-play&logoColor=white)](https://play.google.com/store/apps/details?id=eksafar.transit)
[![License: MIT](https://img.shields.io/badge/License-MIT-0066CC?style=for-the-badge)](LICENSE)

[![CI](https://img.shields.io/github/actions/workflow/status/notUbaid/gdgmetro/test.yml?branch=main&style=flat-square&label=CI%20%2F%20Tests&logo=github)](https://github.com/notUbaid/gdgmetro/actions)
[![Vitest](https://img.shields.io/badge/131%20tests-passing-22c55e?style=flat-square&logo=vitest&logoColor=white)](src/lib/__tests__)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?style=flat-square&logo=pwa)](https://eksafar.transit/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](tsconfig.json)

[**Live App**](https://eksafar.transit/) · [**Google Play**](https://play.google.com/store/apps/details?id=eksafar.transit) · [**Report a Bug**](https://github.com/notUbaid/gdgmetro/issues/new?template=bug_report.md) · [**Request a Feature**](https://github.com/notUbaid/gdgmetro/issues/new?template=feature_request.md)

</div>

---

## What is Ek Safar?

Ek Safar is a **100% client-side, offline-capable Progressive Web App** that helps commuters navigate the Ahmedabad–Gandhinagar metro network (operated by GMRC / MEGA). The entire transit graph — all **53 stations**, the complete **inter-station fare matrix**, **725 generated train schedules**, and a **rule-based crowding model** — ships inside the browser bundle and service-worker cache.

Route planning, fare lookup, and timetable queries all resolve locally with **no network connection required** — including in underground metro tunnels.

A minimal serverless layer on Vercel handles the three things that genuinely need a server: geocoding proxying, OpenRouteService walking directions, and AI-bot-aware share previews. Everything else runs entirely in the client.

> **DevFest Gandhinagar Metro Hackathon** — This project is the flagship submission for **Problem Statement 08 (PS-08): "One City, One Journey"**, unifying Gujarat Metro, Janmarg BRTS, and AMTS municipal buses into one seamless, single-fare journey engine. See [PS08_ONE_CITY_ONE_JOURNEY.md](PS08_ONE_CITY_ONE_JOURNEY.md) for the full architectural and mathematical specification.

---

## At a Glance

| | Detail |
|:---|:---|
| 🚇 **Network** | Gujarat Metro (53 stations, 4 lines) + Janmarg BRTS + AMTS Feeders |
| 📅 **Timetable** | 725 generated train schedules (Mon–Fri / Saturday / Sunday) |
| ✅ **Test Coverage** | 131 test cases across 17 Vitest suites — runs on every push & PR |
| 📡 **Offline** | 100% client-side routing, fares, timetables, ~3,500-place landmark index |
| 🌐 **Languages** | English, Gujarati (ગુજરાતી), Hindi (हिन्दी) |
| 📱 **Platforms** | Web (installable PWA) · Android (Trusted Web Activity on Google Play) |
| 🔒 **Security** | Zero client-side API keys · strict CSP headers · CORS origin allowlist |
| ⚡ **Performance** | Manual chunk splitting · Terser minification · Workbox tile caching |

---

## Table of Contents

- [Features](#features)
- [Ek Safar — PS-08 Showcase](#-ek-safar--one-city-one-journey-ps-08-showcase)
- [Network Model](#network-model)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Environment Variables](#environment-variables)
- [Serverless API Layer](#serverless-api-layer)
- [Data Pipeline](#data-pipeline)
- [Testing](#testing)
- [Progressive Web App](#progressive-web-app)
- [Android Distribution](#android-distribution)
- [Deployment](#deployment)
- [Internationalization](#internationalization)
- [SEO & Machine Discoverability](#seo--machine-discoverability)
- [Security](#security)
- [Data Source & Accuracy](#data-source--accuracy)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Journey Planning
- 🗺️ **Interactive Leaflet Map** — Pan, zoom, tap any station or arbitrary map point to set origin/destination
- 🔍 **Unified Search** — Searches metro stations, BRTS stops, AMTS bus stops, and ~3,500 local landmarks simultaneously
- 🛤️ **Multi-Leg Route Planner** — Dijkstra pathfinding across the full metro graph with interchange-aware step-by-step instructions
- 💰 **Real-Time Fare Engine** — Official GMRC distance-slab fare matrix (exact paise), displayed per route
- 🕐 **Live Timetable Simulation** — Next 5 departures from any station, accurate to day-of-week and current IST time
- 🚦 **Dynamic Crowding Indicators** — Rule-based crowding model (Low / Moderate / Heavy) across peak and off-peak hours

### Multi-Modal Routing (PS-08)
- 🔀 **Pareto-Optimal Journeys** — 3 ranked options: Fastest, Cheapest, and Minimum Transfers
- 🚌 **Integrated BRTS + AMTS** — Janmarg BRTS and AMTS feeder buses woven into the unified graph
- 💳 **15% Multimodal Rebate** — Automatic integrated fare discount vs. buying separate tickets
- 🏃 **Walking Leg Cards** — Real distances, pedestrian minutes at 4.5 km/h, and transfer risk labels

### AI & Intelligence
- 🤖 **Gujlish NLP Parser** — Understands Gujarati, Hindi, English, and colloquial "Gujlish" transit queries client-side
- 🧠 **AI Trip Optimizer** — 5 commuter personas (Balanced, Speed, Budget, Heat Avoidance, Accessible/Luggage) that re-weight Pareto scoring
- 📐 **Authority Console** — Transfer desert gap analysis + 5,000-trip revenue settlement simulator (for operators/judges)

### UX & Accessibility
- 🌙 **Dark-First Design** — Polished dark theme built on a coherent design token system
- 📍 **GPS Geolocation** — One-tap "Use My Location" with nearest-station snap
- 👥 **Friends Journey Viewer** — Share your live position with travel companions
- 🤝 **Join Ride** — Deep-link into a shared journey
- 💾 **Commute Memory** — Saved home ↔ work commute with smart time-of-day suggestions
- 🔔 **PWA Update Banner** — Unmissable in-app banner + "Check for Updates" on new service-worker deployment

### Offline & PWA
- ✈️ **Airplane-Mode Safe** — Full functionality with zero network (underground included)
- 🗃️ **OSM Tile Caching** — Up to 2,000 map tiles cached 30 days via Workbox CacheFirst
- 📦 **Installable** — Add to Home Screen on Android, iOS, Windows, and macOS

---

## 🌟 Ek Safar — One City, One Journey (PS-08 Showcase)

> **Full specification, mathematical derivations, and pitch script:** [PS08_ONE_CITY_ONE_JOURNEY.md](PS08_ONE_CITY_ONE_JOURNEY.md)

Ek Safar (**એક સફર**) unites Gujarat Metro (GMRC), Janmarg BRTS, and AMTS Municipal Feeder Buses into one seamless, single-fare journey engine — solving PS-08's "One City, One Journey" challenge.

### Key Capabilities

**1. 📍 Interactive 2-Point Map Planner**
Tap any two arbitrary locations on the Leaflet map (or pick from popular presets like *Science City → Airport Circle* or *Kalupur → Motera*). Draggable origin (green) and destination (red) pins re-calculate multi-modal paths on drag release.

**2. ⚡ Pareto-Optimal Multi-Modal Routing**
A unified directed graph covering rail trunks, dedicated busways, and municipal feeders. Three options returned per query:
- 🚀 **Fastest** — Priority rail trunks and express dedicated lanes
- 💸 **Cheapest** — Maximum feeder stage discounts and minimal overall fare
- 🔄 **Min Transfers** — Direct corridors with minimal platform switches

**3. 💳 Single Unified Fare & 15% Multimodal Rebate**
Automatically computes separate ticket totals vs. the integrated single fare, applying the rebate $r = 0.15$ — saving commuters money while eliminating multi-ticket queues.

**4. 🏃 Transfer Walking Cards & Risk Labels**
Real walking distances (metres) and pedestrian minutes. Risk indicators: **Comfortable / OK / Tight** with expected connection wait times.

**5. 📊 Hare-Niemeyer Exact-Paise Revenue Splitting**
Solves multi-operator revenue distribution across GMRC, Janmarg, AMTS, and a 5% PPP digital clearinghouse reserve. Enforces the **Largest Remainder Method** with ₹2 minimum operator floors — guaranteeing that settled shares sum to the integrated fare with **0 paise discrepancy**.

$$\text{Uplift}_{\text{break-even}} = \frac{r}{1 - r}$$

A 15% fare discount requires only a 17.65% ridership increase to maintain revenue neutrality.

**6. 🛂 Authority Console (Judges' Differentiator)**
- **Transfer Desert Gap Analysis** — Scans all 53 stations, detects any with no bus feeder within 500 m, and auto-proposes electric mini-feeder routes
- **5,000-Trip Settlement Simulator** — Models revenue shifts and tests elasticity break-even

---

## Network Model

The station registry ([`src/data/metroData.ts`](src/data/metroData.ts)) is the single source of truth.

| Line | Route | Stations | Underground |
|:---|:---|:---:|:---|
| 🔵 **Blue** | Thaltej Gam → Vastral Gam | 18 | Shahpur, Gheekanta, Kalupur, Kankaria East |
| 🔴 **Red** | APMC → Koteshwar Road | 15 | — |
| 🟢 **Green** | Koteshwar Road → Mahatma Mandir | 20 | — |
| 🟣 **Purple** | GNLU → GIFT City (via PDEU) | 3 | — |

> Counts include shared interchange stations at line endpoints — which is why they sum to 56 rather than 53.

### Interchange Stations

| Station | Lines | Role |
|:---|:---|:---|
| **Old High Court** | Blue ↔ Red | Major cross-platform interchange |
| **Koteshwar Road** | Red ↔ Green | Southern terminus / through-running point |
| **APMC** | Red ↔ Green (BRTS hub) | Multimodal gateway |
| **GNLU** | Green ↔ Purple | Branch-line gateway to GIFT City |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser / PWA Bundle                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │   Route Engine  │  │  Fare Engine │  │  NLP Parser    │  │
│  │  (Dijkstra +    │  │ (GMRC matrix)│  │  (Gujlish/     │  │
│  │   Pareto graph) │  │              │  │   Hi/Gu/En)    │  │
│  └────────┬────────┘  └──────────────┘  └────────────────┘  │
│           │                                                 │
│  ┌────────▼────────────────────────────────────────────────┐│
│  │              Static Data Layer (in-bundle)              ││
│  │  metroData.ts · timetable.ts · fareData.ts              ││
│  │  multimodalData.ts · segmentTimings.ts · popularPlaces  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │             Workbox Service Worker Cache                ││
│  │  OSM tiles · CARTO tiles · Nominatim · App shell        ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────┘
                            │ (only when online)
┌───────────────────────────▼─────────────────────────────────┐
│                  Vercel Serverless Functions                │
│  /api/nominatim      — geocoding proxy (CORS + caching)     │
│  /api/walking-route  — OpenRouteService proxy (server key)  │
│  /api/ors-geocode    — ORS geocode proxy (CDN cached)       │
│  /api/share          — AI bot detection + OG card renderer  │
└─────────────────────────────────────────────────────────────┘
```

The design guarantees that **no user-facing feature degrades when the serverless layer is unavailable** — geocoding falls back to the local landmark index, and walking legs are omitted rather than blocking the route response.

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| **UI Framework** | React 18 + TypeScript 5 |
| **Build Tool** | Vite 5 (SWC transpiler) |
| **Styling** | Tailwind CSS v3 + shadcn/ui primitives |
| **Map** | Leaflet 1.9 + OpenStreetMap / CARTO tiles |
| **Routing State** | React Router v6 |
| **Server State** | TanStack Query v5 |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Testing** | Vitest 2 + @vitest/coverage-v8 |
| **E2E** | Playwright |
| **Analytics** | Vercel Analytics (privacy-safe) |
| **Deployment** | Vercel (static build + serverless functions) |
| **Android** | Trusted Web Activity (PWABuilder + androidbrowserhelper) |

---

## Repository Structure

```
gdgmetro/
├── api/                          # Vercel serverless functions
│   ├── nominatim.ts              # Geocoding proxy
│   ├── walking-route.ts          # ORS walking directions proxy
│   ├── ors-geocode.ts            # ORS geocode proxy
│   └── share.ts                  # AI bot detection + OG card
│
├── public/                       # Static assets (served as-is)
│   ├── .well-known/assetlinks.json  # Android TWA verification
│   ├── llms.txt / llms-full.txt  # AI engine knowledge manifests
│   ├── robots.txt / sitemap.xml  # SEO crawling
│   ├── station/ route/ …         # Pre-rendered SSG landing pages
│   └── pwa-*.png                 # PWA icons
│
├── scripts/                      # Build-time code-generation
│   ├── generateSeoAndLlms.js     # Generates sitemap, robots, llms.txt
│   ├── generateStaticPages.js    # SSG: 53 station + 342 route HTML pages
│   ├── generateRouteSegments.cjs # GeoJSON segment builder
│   └── generateTimetableFromExcel.js  # Excel → timetable JSON
│
├── src/
│   ├── components/               # React UI components
│   │   ├── MetroMap.tsx          # Root map shell
│   │   ├── RoutePlanner.tsx      # Step-by-step route result
│   │   ├── SearchBar.tsx         # Unified search (metro + BRTS + places)
│   │   ├── LiveTrainTrackingDialog.tsx  # Timetable-driven train positions
│   │   ├── MultimodalRouteModal.tsx     # PS-08 multi-modal journey cards
│   │   ├── BottomPanel.tsx       # Sliding departure sheet
│   │   ├── SideMenu.tsx          # Navigation drawer
│   │   └── …
│   │
│   ├── data/                     # Static transit data (in-bundle)
│   │   ├── metroData.ts          # 53 stations, coordinates, line membership
│   │   ├── timetable.ts          # 725 train schedules (3 day types)
│   │   ├── fareData.ts           # GMRC distance-slab fare matrix
│   │   ├── multimodalData.ts     # BRTS stops, AMTS stops, transit routes
│   │   ├── segmentTimings.ts     # Inter-station travel times
│   │   ├── popularPlaces.ts      # ~3,500-entry local landmark index
│   │   └── __tests__/            # Timetable integrity verification
│   │
│   ├── lib/                      # Core business logic
│   │   ├── routePlanner.ts       # Metro Dijkstra + fare engine
│   │   ├── multimodalGraphRouter.ts  # Unified multi-modal graph solver
│   │   ├── multimodalRouter.ts   # Multi-modal fare + walking helpers
│   │   ├── aiTripOptimizer.ts    # 5-persona Pareto re-scorer
│   │   ├── gujlishParser.ts      # NLP: Gu/Hi/En/Gujlish query parser
│   │   ├── crowding.ts           # Rule-based crowding model
│   │   ├── walkingRoute.ts       # ORS walking-route client
│   │   ├── geolocation.ts        # GPS helpers
│   │   ├── i18n.ts               # En/Gu/Hi translation system
│   │   ├── commuteStorage.ts     # Saved commute localStorage layer
│   │   ├── seoRoutes.ts          # Deep-link route parser
│   │   └── __tests__/            # 17 Vitest suites
│   │
│   ├── contexts/
│   │   ├── LanguageContext.tsx   # Global language state
│   │   └── MetroCardContext.tsx  # Metro card balance state
│   │
│   ├── hooks/
│   │   ├── useCurrentTime.ts     # IST clock (ticks every minute)
│   │   ├── useNominatimSearch.ts # Debounced geocoding hook
│   │   └── use-mobile.tsx        # Responsive breakpoint hook
│   │
│   └── pages/
│       ├── Index.tsx             # Root page → MetroMap
│       └── NotFound.tsx          # 404
│
├── vite.config.ts                # Vite + PWA + chunk-splitting config
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                   # Headers, rewrites, serverless routing
├── PS08_ONE_CITY_ONE_JOURNEY.md  # PS-08 full specification
├── DEPLOYMENT.md                 # Vercel deployment guide
├── DEPLOYMENT_ANDROID.md         # TWA / Google Play packaging guide
└── CONTRIBUTING.md               # Contribution guide
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 (LTS recommended)
- **npm** ≥ 10

### Installation

```bash
# Clone the repository
git clone https://github.com/notUbaid/gdgmetro.git
cd gdgmetro

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5000**.

> **No `.env` file is required to run locally.** The walking-route feature will show an "API not configured" hint, but all other features (route planning, fares, timetables, map, search) work fully offline without any keys.

---

## Available Scripts

| Command | Description |
|:---|:---|
| `npm run dev` | Start Vite dev server on port 5000 (hot-reload) |
| `npm run build` | Full production build: SEO generation → Vite bundle → SSG pages |
| `npm run build:dev` | Vite build in development mode (no SSG, faster iteration) |
| `npm run preview` | Locally preview the production build |
| `npm run seo:generate` | Run SEO/LLMs pipeline only (sitemap, robots, llms.txt) |
| `npm run lint` | ESLint across the full source tree |
| `npm test` | Run Vitest in watch mode |
| `npx vitest run --coverage` | Single-pass run with V8 coverage report (what CI runs) |

---

## Environment Variables

| Variable | Where | Required | Purpose |
|:---|:---|:---:|:---|
| `ORS_API_KEY` | Vercel (server-only) | Production | OpenRouteService key — consumed by `/api/walking-route` and `/api/ors-geocode`. **Never set on the client.** |
| `VITE_ORS_API_KEY` | Local `.env` | Dev only | Client-visible hint that shows "walking routes not configured" in dev. Not used in production at all. |

Create a `.env` file for local development:

```env
# .env  (never commit this file)
VITE_ORS_API_KEY=your_ors_key_here
```

> For production deployment to Vercel, set `ORS_API_KEY` as a server-only environment variable in the Vercel dashboard. See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the full walkthrough.

---

## Serverless API Layer

| Endpoint | Handler | Notes |
|:---|:---|:---|
| `GET /api/nominatim` | `api/nominatim.ts` | Geocoding proxy — adds CORS, rate-limit headers, 7-day CDN cache |
| `POST /api/walking-route` | `api/walking-route.ts` | ORS walking directions — server-side key, CORS allowlist, 1h CDN cache |
| `GET /api/ors-geocode` | `api/ors-geocode.ts` | ORS geocode — server-side key, 24h CDN cache, stays inside ORS free tier |
| `GET /api/share` | `api/share.ts` | Detects AI crawlers; returns structured OG/JSON-LD card; routes humans to the SPA |

All four functions read secrets **only from server-side environment variables** and are never included in the client bundle.

---

## Data Pipeline

```
Excel / GMRC PDFs
      │
      ▼
scripts/generateTimetableFromExcel.js
      │   → src/data/timetableFromExcel.generated.json
      │
      ▼
scripts/generateRouteSegments.cjs
      │   → src/data/routeSegments.generated.json
      │   → public/metroRoutes.geojson
      │   → public/blueLineRoutes.geojson
      │
      ▼  (on every `npm run build`)
scripts/generateSeoAndLlms.js
      │   → public/sitemap.xml
      │   → public/robots.txt
      │   → public/llms.txt  (AI context manifest)
      │   → public/llms-full.txt  (75 KB encyclopedic reference)
      │   → Injects semantic HTML into index.html
      │
      ▼
scripts/generateStaticPages.js
      │   → public/station/[slug]/index.html  (53 pages)
      │   → public/route/[from]-to-[to]/index.html  (342+ pages)
      │   → public/map|stations|routes|fare|timings/index.html
```

This pipeline runs automatically as part of `npm run build`. The generated files are committed to the repository so Vercel's static build step does not need Node to re-run them.

---

## Testing

```bash
npm test                          # Watch mode
npx vitest run                    # Single pass (fast)
npx vitest run --coverage         # With V8 coverage report
```

### Test Suites (131 Passing Tests)

| Suite | File | Tests | Focus Area |
|:---|:---|:---:|:---|
| Route Planner | `lib/__tests__/routePlanner.test.ts` | 14 | Dijkstra paths, interchange detection, edge cases |
| Network Reliability | `lib/__tests__/networkReliability.test.ts` | 7 | Diverse cross-line timetable verification |
| Multi-modal Graph | `lib/__tests__/multimodalGraphRouter.test.ts` | 5 | Unified graph construction & Pareto paths |
| AI Trip Optimizer | `lib/__tests__/aiTripOptimizer.test.ts` | 7 | Persona re-scoring & Pareto ranking |
| Crowding Rules | `lib/__tests__/crowding.test.ts` | 10 | Peak/off-peak rules, corridor crowding |
| Commute Storage | `lib/__tests__/commuteStorage.test.ts` | 10 | Resilience, corrupt JSON, quota exceptions |
| Geolocation | `lib/__tests__/geolocation.test.ts` | 6 | Nearest-station snap & Haversine formula |
| Gujlish Parser | `lib/__tests__/gujlishParser.test.ts` | 10 | NLP parsing accuracy & multi-language detection |
| Walking Route | `lib/__tests__/walkingRoute.test.ts` | 9 | ORS client & offline fallback behaviour |
| PWA Update | `lib/__tests__/pwaUpdate.test.ts` | 6 | Service worker lifecycle & auto-update |
| SEO Routes | `lib/__tests__/seoRoutes.test.ts` | 5 | Deep-link parsing & slug validation |
| SSG Pipeline | `lib/__tests__/ssgPipeline.test.ts` | 7 | Static page generation & pre-rendering |
| Utils | `lib/__tests__/utils.test.ts` | 7 | IST helpers & time calculations |
| Timetable | `data/__tests__/timetable.test.ts` | 6 | Schedule correctness across day types |
| Timetable Integrity | `data/__tests__/verifyTimetableIntegrity.test.ts` | 13 | Cross-line consistency & station ordering |
| Nominatim Hook | `hooks/__tests__/useNominatimSearch.test.ts` | 8 | Debounce, 429 rate limit, network errors |
| Planner Edge | `lib/__tests__/planner.test.ts` | 1 | Outside operating hours routing |

CI runs `npx vitest run --coverage` on every push and pull request to `main` via `.github/workflows/test.yml` on Node 20.

---

## Progressive Web App

Configured via `vite-plugin-pwa` (Workbox) in [`vite.config.ts`](vite.config.ts).

### Manifest Features

| Feature | Detail |
|:---|:---|
| Install shortcuts | "Plan Route" shortcut → `/?action=route` |
| Share target | Receives shared URLs via `GET /share` |
| Protocol handler | `web+metro://` deep-links into the app |
| File handler | `.metro` JSON files open in the app |
| Edge side panel | Preferred width 400 px |
| Widgets | `metro-widget` adaptive card tag |

### Runtime Tile Caching

| Resource | Strategy | Max Entries | TTL |
|:---|:---|:---:|:---|
| OpenStreetMap tiles | `CacheFirst` | 2,000 | 30 days |
| CARTO basemap tiles | `CacheFirst` | 2,000 | 30 days |
| Nominatim geocoding | `NetworkFirst` | 100 | 7 days · 5s timeout |

---

## Android Distribution

The Google Play listing is a **Trusted Web Activity (TWA)** — not a Capacitor or Cordova wrapper. The installed app is a thin native shell (`androidbrowserhelper`) pointing at the verified web origin. The web app and Android app share one codebase and one deployment.

- Verified against `www.eksafar.transit` via Digital Asset Links (`public/.well-known/assetlinks.json`)
- Targets Android 16 / API 36: edge-to-edge display, R8 code and resource shrinking, OS-level GPS permission delegation to the web app
- Full packaging walkthrough — PWABuilder settings, Gradle config, `AndroidManifest.xml`, and Play Console upload steps — is in [`DEPLOYMENT_ANDROID.md`](DEPLOYMENT_ANDROID.md)

---

## Deployment

Hosted on **Vercel**. One project serves both the static Vite build and the four `/api` serverless functions.

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for the full setup guide including:
- Required environment variables
- Walking routes troubleshooting ("renders as straight lines" ≈ missing `ORS_API_KEY`)
- ORS free-tier budget management via server-side caching + CDN `s-maxage` headers
- Security headers from `vercel.json`

---

## Internationalization

Three languages — **English**, **Gujarati (ગુજરાતી)**, **Hindi (हिन्दी)** — defined in [`src/lib/i18n.ts`](src/lib/i18n.ts) and served through `LanguageContext`.

Station names carry native-script fields (`nameGu`, `nameHi`) directly on each station record rather than being translated only at UI level, so search and route steps display correctly in all three languages. Language selection persists to `localStorage` and survives offline use.

---

## SEO & Machine Discoverability

Ek Safar is engineered for discoverability across search engines (Google, Bing) and AI answer engines (Google AI Overviews, Perplexity, ChatGPT Search, Claude, Gemini):

| Feature | Detail |
|:---|:---|
| **AI Knowledge Manifests** | [`/llms.txt`](https://eksafar.transit/llms.txt) (standard) · [`/llms-full.txt`](https://eksafar.transit/llms-full.txt) (75 KB encyclopedic reference with 650 route pairs, 28 commuter Q&As, all fares) |
| **Pre-Hydration Semantic HTML** | `index.html` serves a crawlable 53-station directory, fare slabs, and 28 Q&As *before* React mounts |
| **SSG Landing Pages** | 53 station pages + 342 route pages + 8 core intent pages pre-rendered at build time |
| **Schema.org JSON-LD** | `TransitSystem`, `WebApplication`, `MobileApplication`, `FAQPage`, 53-item station `ItemList` |
| **XML Sitemap** | 53 station timetables + 250 top commuter queries |
| **AI Bot Policy** | `robots.txt` explicitly welcomes GPTBot, ClaudeBot, PerplexityBot, Googlebot, Bingbot, and 10 others |
| **Smart Share Cards** | `/api/share` serves OG/Twitter Card + `TrainTrip` JSON-LD to bots; SPA to humans |

---

## Security

| Control | Implementation |
|:---|:---|
| **API key isolation** | `ORS_API_KEY` is a server-only Vercel env var — never in the client bundle |
| **CORS allowlist** | `/api/walking-route` and `/api/ors-geocode` restrict `Access-Control-Allow-Origin` to an explicit origin list |
| **Security headers** | Set globally in `vercel.json`: `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (geolocation only) |
| **No camera/mic** | `Permissions-Policy` blocks camera and microphone outright |

---

## Data Source & Accuracy

Station geometry, line topology, the fare matrix, and timetables are derived from **GMRC's official published data**. Service changes, fare revisions, or new station openings on the real network won't be reflected until the source data is updated in this repository.

> **Disclaimer:** This is an independent, community-built project. It is not affiliated with, endorsed by, or connected to Gujarat Metro Rail Corporation (GMRC), MEGA, or the Government of Gujarat.
>
> "Live train tracking" is a **timetable-driven simulation** — not a GPS/AVL feed.

---

## Contributing

Contributions, issues, and feature requests are welcome! See **[CONTRIBUTING.md](CONTRIBUTING.md)** for:
- Development setup
- Branch naming and commit conventions
- PR checklist (lint + tests must pass)
- Data change traceability requirements

**Quick start for contributors:**

```bash
# Fork & clone, then:
npm install
npm run dev

# Before opening a PR:
npm run lint
npx vitest run --coverage
```

CI re-runs these on every push and PR to `main`. Keep it green. 🟢

---

## License

Released under the **[MIT License](LICENSE)** — Copyright © 2026 Ubaid.

---

<div align="center">

Built with ❤️ for Ahmedabad commuters · [eksafar.transit](https://eksafar.transit/)

</div>
