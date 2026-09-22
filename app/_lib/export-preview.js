import { domToCanvas } from "modern-screenshot";

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const RENDER_SCALE = 2;

function preserveLineClamp(node) {
  // Chromium reports a clamped -webkit-box as flow-root in computed styles.
  if (node instanceof HTMLElement && Number.parseInt(node.style.webkitLineClamp, 10) > 0) {
    node.style.display = "-webkit-box";
    node.style.webkitBoxOrient = "vertical";
  }
}

async function bakeBackdropFilters(root, options) {
  // SVG image decoding drops backdrop-filter. Capture each element's actual
  // lower layers with the same filter, then use that image behind its background.
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;pointer-events:none;";
  host.setAttribute("aria-hidden", "true");
  // Keep page selectors and pseudo-elements from restyling the frozen clone.
  host.attachShadow({ mode: "closed" }).appendChild(root);
  root.style.position = "relative";
  document.body.appendChild(host);

  try {
    const elements = [...root.querySelectorAll("*")].filter((element) => {
      const filter = element.style.backdropFilter || element.style.webkitBackdropFilter;
      return filter && filter !== "none";
    });
    for (const element of elements) {
      const filter = element.style.backdropFilter || element.style.webkitBackdropFilter;
      const layer = Number(element.closest("[data-preview-layer]").dataset.previewLayer);
      const background = await domToCanvas(root, {
        ...options,
        style: { ...options.style, filter },
        filter: (node) => !(node instanceof Element)
          || !node.hasAttribute("data-preview-layer")
          || Number(node.getAttribute("data-preview-layer")) < layer,
      });
      // The screen is opaque. SVG blur fades its outer pixels to transparent;
      // retain the filtered colors there so the sharp wallpaper cannot bleed
      // through the glass near the left/right edges of the screen.
      const context = background.getContext("2d");
      const pixels = context.getImageData(0, 0, background.width, background.height);
      for (let index = 3; index < pixels.data.length; index += 4) pixels.data[index] = 255;
      context.putImageData(pixels, 0, 0);
      const bounds = element.getBoundingClientRect();
      const rootBounds = root.getBoundingClientRect();
      const style = element.style;
      const originalImage = style.backgroundImage || "none";
      const originalColor = style.backgroundColor || "transparent";
      const originalSize = style.backgroundSize || "auto";
      const originalPosition = style.backgroundPosition || "0% 0%";
      const originalRepeat = style.backgroundRepeat || "repeat";
      const originalOrigin = style.backgroundOrigin || "padding-box";
      const originalClip = style.backgroundClip || "border-box";
      style.backgroundImage = `${originalImage}, linear-gradient(${originalColor}, ${originalColor}), url("${background.toDataURL()}")`;
      style.backgroundSize = `${originalSize}, auto, ${options.width}px ${options.height}px`;
      style.backgroundPosition = `${originalPosition}, 0% 0%, ${rootBounds.left - bounds.left}px ${rootBounds.top - bounds.top}px`;
      style.backgroundRepeat = `${originalRepeat}, no-repeat, no-repeat`;
      style.backgroundOrigin = `${originalOrigin}, border-box, border-box`;
      style.backgroundClip = `${originalClip}, border-box, border-box`;
      style.backgroundColor = "transparent";
      style.backdropFilter = "none";
      style.webkitBackdropFilter = "none";
    }
  } finally {
    root.remove();
    host.remove();
  }
}

export async function exportPreviewPng(screen) {
  if (!screen) throw new Error("Prévia indisponível");
  await document.fonts.ready;
  const computed = getComputedStyle(screen);
  // Layout dimensions exclude the decorative phone's perspective transform.
  const width = Number.parseFloat(computed.width);
  const height = Number.parseFloat(computed.height);
  let resourceError;
  const options = {
    width,
    height,
    // Supersample text, SVG icons and glass before a single final downsample.
    scale: (OUTPUT_WIDTH * RENDER_SCALE) / width,
    // Export the rectangular wallpaper, excluding the decorative phone frame.
    style: { borderRadius: "0", margin: "0", transform: "none" },
    onCloneEachNode: preserveLineClamp,
    // Never silently export an empty area if an uploaded image cannot be loaded.
    fetch: { placeholderImage: () => {
      resourceError = new Error("Não foi possível carregar uma imagem da prévia");
      throw resourceError;
    } },
  };
  const snapshot = await domToCanvas(screen, {
    ...options,
    onCloneNode: (clone) => bakeBackdropFilters(clone, options),
  });
  // The capture library logs resource failures; surface them to the editor too.
  if (resourceError) throw resourceError;
  // Fractional CSS layout dimensions can otherwise yield a 1919px/1921px file.
  const output = document.createElement("canvas");
  output.width = OUTPUT_WIDTH;
  output.height = OUTPUT_HEIGHT;
  const context = output.getContext("2d");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(snapshot, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  return new Promise((resolve, reject) => output.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("PNG vazio")),
    "image/png",
  ));
}
