import { renderPreviewPng } from "./export-preview";

const previews = new WeakMap();

function renderLatest(screen, state) {
  if (state.pending) return state.pending;
  state.pending = (async () => {
    while (state.rendered !== state.revision) {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const revision = state.revision;
      const blob = await renderPreviewPng(screen);
      if (revision !== state.revision) continue;
      state.blob = blob;
      state.rendered = revision;
      state.onReady(blob);
    }
    return state.blob;
  })().finally(() => { state.pending = null; });
  return state.pending;
}

export function refreshPreview(screen, onReady, onError) {
  let state = previews.get(screen);
  if (!state) {
    state = { revision: 0, rendered: -1, pending: null, blob: null };
    previews.set(screen, state);
  }
  state.revision++;
  state.onReady = onReady;
  renderLatest(screen, state).catch(onError);
}

// Download the exact blob displayed by the editor, never a second rendering.
export async function exportDisplayedPreview(screen) {
  const state = previews.get(screen);
  if (!state) throw new Error("A prévia ainda não está pronta.");
  return renderLatest(screen, state);
}
