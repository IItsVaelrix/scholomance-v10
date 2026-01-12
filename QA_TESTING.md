# QA Testing Guide

## Primary QA Gate
Run all QA checks:

```bash
npm run qa
```

This runs:
- Unit tests (Vitest)
- UI wiring tests (Testing Library + jsdom)
- Visual regression (Puppeteer + pixelmatch)

## Individual Suites

```bash
npm run test:unit
npm run test:ui
npm run test:visual
```

## Visual Baselines
To update visual baselines:

```bash
npm run test:visual:update
```

## Notes
- Visual tests start a local dev server unless `VISUAL_BASE_URL` is set.
- Visual runs mark `document.documentElement.dataset.visualTest="true"` and force `prefers-reduced-motion` so CSS animations are frozen for deterministic screenshots.
- CSS invariants for the Color API live in `tests/unit/css.invariants.spec.ts` to ensure required classes/variables exist.
- Visual snapshots now include a `color-palette` scene that smokes school and feel swatches against the current CSS variables.
- Playwright suites are still available via `npm run test:e2e` (not part of QA gate).
