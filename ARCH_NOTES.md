# Semantic Surface Architecture Notes

## Surfaces
- Core shell: `header` (HUD), `main` (page viewport), `footer` in `src/App.jsx` with `.surface` + `data-surface`.
- Page shells: `watch`, `listen`, `read` sections wrap the content and carry `.surface`.
- Read sub-surfaces: `library` (scroll list), `editor`, `spellbook`, `analysis` overlay (`data-role="overlay"` + `.overlay-panel`).

## State Classes
- Single source of truth is `STATE_CLASS_MAP` in `src/js/stateClasses.js`.
- Keys: `section`, `theme`, `view`, `overlay`, `school`, `vowelFamily`.
- Components derive classes via `buildStateClasses`/`getStateClass` and only toggle classes (no state inline styles).

## Layering & Z-Index Tokens
- Tokens live in `src/css/layers.css`: `--z-base`, `--z-content`, `--z-hud`, `--z-overlay`, `--z-modal`.
- HUD uses `data-role="hud"`, overlays use `data-role="overlay"` and `.overlay-panel` for pointer events.
- Visual FX and overlay panels align to tokens; core content stays in normal flow.
