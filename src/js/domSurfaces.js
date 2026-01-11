export const SURFACE_SELECTOR = "[data-surface]";

export function getSurface(name, root = document) {
  return root.querySelector(`[data-surface="${name}"]`);
}

export function getSurfaces(root = document) {
  return Array.from(root.querySelectorAll(SURFACE_SELECTOR));
}
