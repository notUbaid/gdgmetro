# Contributing to Ek Safar

Thank you for taking the time to contribute! Ek Safar is a community-built, offline-first journey planner for the Ahmedabad–Gandhinagar metro network. Contributions of all kinds are welcome — bug fixes, data corrections, new features, tests, translations, and documentation improvements.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Branch Naming](#branch-naming)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Data Changes](#data-changes)
- [Translations](#translations)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

Be respectful, constructive, and inclusive. Harassment, personal attacks, and discriminatory language will not be tolerated. If you see a problem, open an issue or reach out to the project maintainer.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20 (LTS recommended — check with `node --version`)
- **npm** ≥ 10
- A GitHub account

### Fork & Clone

```bash
# 1. Fork the repo on GitHub (top-right "Fork" button)

# 2. Clone your fork
git clone https://github.com/<your-username>/gdgmetro.git
cd gdgmetro

# 3. Add the upstream remote
git remote add upstream https://github.com/notUbaid/gdgmetro.git

# 4. Install dependencies
npm install

# 5. Start the development server
npm run dev
# App is available at http://localhost:5000
```

### Environment Setup (Optional)

Walking-route directions require an [OpenRouteService](https://openrouteservice.org/) API key. All other features work without any keys.

```env
# .env  (create at project root — never commit)
VITE_ORS_API_KEY=your_ors_key_here
```

---

## Project Architecture

Before making changes, familiarise yourself with the key layers:

| Directory | Purpose |
|:---|:---|
| `src/data/` | Static transit data bundled into the client (stations, timetables, fares) |
| `src/lib/` | Pure business logic — routing, fare engine, NLP parser, crowding model |
| `src/components/` | React UI components |
| `src/contexts/` | Global React context (language, metro card) |
| `src/hooks/` | Reusable React hooks |
| `api/` | Vercel serverless functions (geocoding, walking routes, share cards) |
| `scripts/` | Build-time code generators (SEO, SSG, timetable, GeoJSON) |
| `public/` | Static assets served as-is (icons, GeoJSON, pre-rendered pages) |

The golden rule: **the app must remain fully functional with zero network connection.** Any new feature that introduces a hard network dependency must have a graceful offline fallback.

---

## Development Workflow

```bash
# Sync with upstream before starting new work
git fetch upstream
git checkout main
git merge upstream/main

# Create a feature branch (see Branch Naming below)
git checkout -b feat/your-feature-name

# Develop, then run checks before committing
npm run lint
npx vitest run

# Commit (see Commit Messages below)
git add .
git commit -m "feat(component): add departure countdown to BottomPanel"

# Push and open a PR
git push origin feat/your-feature-name
```

---

## Branch Naming

Use the following prefixes:

| Prefix | Use case |
|:---|:---|
| `feat/` | New feature or capability |
| `fix/` | Bug fix |
| `data/` | Station, fare, or timetable data update |
| `test/` | Adding or improving tests |
| `docs/` | Documentation only |
| `refactor/` | Code restructure with no behaviour change |
| `perf/` | Performance improvement |
| `chore/` | Dependency updates, config changes |

**Examples:**
```
feat/multimodal-share-card
fix/interchange-time-calculation
data/purple-line-extension
test/gujlish-parser-edge-cases
docs/update-deployment-guide
```

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer: BREAKING CHANGE, closes #issue]
```

**Types:** `feat` · `fix` · `data` · `test` · `docs` · `refactor` · `perf` · `chore`

**Scopes** (optional but helpful): `routing` · `fare` · `timetable` · `pwa` · `seo` · `i18n` · `map` · `api` · `ui` · `test` · `data`

**Examples:**
```
feat(routing): add interchange wait time to route steps
fix(fare): correct Blue Line slab boundary at 26 km
data(timetable): update Sunday frequency for Green Line
test(crowding): add edge cases for midnight IST boundary
docs(readme): add architecture diagram
perf(bundle): lazy-load MultimodalRouteModal
```

---

## Pull Request Process

1. **One concern per PR.** Keep PRs focused. A PR that fixes a bug and refactors unrelated code will be asked to split.

2. **Fill out the PR template.** Describe what changed, why, and how you tested it.

3. **All CI checks must pass** before a PR can be merged:
   - `npm run lint` — zero ESLint errors
   - `npx vitest run --coverage` — all 131 tests pass, no regression

4. **Data changes require source traceability.** If your PR touches fares, station coordinates, or timetables, note the GMRC source document or effective date in the PR description.

5. **Screenshots for UI changes.** Attach before/after screenshots or a short screen recording for any visual change.

6. **Maintain offline guarantee.** New features must either work fully offline or degrade gracefully when offline. Add an offline test case if your feature has a network path.

7. **Do not bump `package.json` version** unless explicitly asked by a maintainer.

---

## Testing Requirements

Every non-trivial logic change must be accompanied by tests.

```bash
# Run full test suite
npx vitest run

# Run with coverage
npx vitest run --coverage

# Run a specific suite
npx vitest run src/lib/__tests__/routePlanner.test.ts

# Watch mode during development
npm test
```

### Where to put tests

| What you changed | Where to add tests |
|:---|:---|
| `src/lib/*.ts` | `src/lib/__tests__/<module>.test.ts` |
| `src/data/*.ts` | `src/data/__tests__/<module>.test.ts` |
| `src/hooks/*.ts` | `src/hooks/__tests__/<hook>.test.ts` |
| Serverless `api/*.ts` | Create `api/__tests__/<fn>.test.ts` |

### Test guidelines

- Tests must be **deterministic** — no reliance on real network calls, current time (use mocks/stubs), or filesystem state outside the project.
- Use Vitest's `vi.mock()` for external dependencies and `vi.useFakeTimers()` for time-sensitive logic.
- Timetable tests must cover all three day types: `Mon-Fri`, `Saturday`, `Sunday`.
- Routing tests must cover: direct single-line trips, single-interchange trips, edge cases (same origin/destination, invalid station IDs).

---

## Data Changes

The transit data files are the source of truth for the entire app. Changes here have wide blast radius — the route engine, fare engine, timetable simulation, SSG pages, and LLM manifests all derive from them.

### Files and their owners

| File | What it contains | Change triggers |
|:---|:---|:---|
| `src/data/metroData.ts` | 53 station records (id, name, coords, lines, flags) | New stations, coordinate corrections, line extensions |
| `src/data/timetable.ts` | 725 train schedules | Frequency changes, new services, holiday schedules |
| `src/data/fareData.ts` | GMRC fare matrix (paise) | Fare revisions |
| `src/data/segmentTimings.ts` | Inter-station travel times | Speed changes, new segments |
| `src/data/multimodalData.ts` | BRTS stops, AMTS stops, transit routes | Feeder network changes |
| `src/data/popularPlaces.ts` | ~3,500 local landmark entries | New landmarks, coordinate fixes |

### Data change checklist

- [ ] Cite the GMRC source document or announcement URL in the PR description
- [ ] Note the effective date of the change
- [ ] Run `npx vitest run` — timetable integrity tests will catch structural inconsistencies
- [ ] Run `npm run build` and check that the SEO/SSG pipeline completes without errors
- [ ] If station IDs change, update all references (timetable, segmentTimings, multimodalData, GeoJSON)

---

## Translations

Ek Safar supports English (`en`), Gujarati (`gu`), and Hindi (`hi`). Translation strings live in [`src/lib/i18n.ts`](src/lib/i18n.ts).

To add or correct a translation:

1. Find the key in the `translations` object in `i18n.ts`
2. Add or fix the `gu` and/or `hi` values
3. Station names in native script go directly on the station record in `metroData.ts` as `nameGu` and `nameHi`
4. Open a PR with the label `i18n`

To add a **new language**, open an issue first so we can discuss the scope before you start.

---

## Reporting Bugs

Use the [Bug Report template](https://github.com/notUbaid/gdgmetro/issues/new?template=bug_report.md) and include:

- **Steps to reproduce** — as precise as possible
- **Expected behaviour** — what should happen
- **Actual behaviour** — what does happen
- **Environment** — browser, OS, device, app version (visible in the side menu)
- **Network state** — online / offline / slow connection
- **Screenshots or console errors** — if applicable

**For timetable/fare inaccuracies**, please note the route, day of week, and time of day so the data can be traced to the GMRC source.

---

## Requesting Features

Use the [Feature Request template](https://github.com/notUbaid/gdgmetro/issues/new?template=feature_request.md) and explain:

- **The problem** your feature solves for commuters
- **Your proposed solution**
- **Alternatives you've considered**
- **Offline behaviour** — can this work without a network connection?

Features that break the offline guarantee, significantly increase the bundle size, or require a real-time data feed are unlikely to be accepted in their default form — but we're happy to discuss alternatives.

---

## Questions?

Open a [Discussion](https://github.com/notUbaid/gdgmetro/discussions) or file an [Issue](https://github.com/notUbaid/gdgmetro/issues). Happy commuting! 🚇
