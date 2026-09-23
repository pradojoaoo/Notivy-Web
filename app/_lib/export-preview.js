import { domToCanvas } from "modern-screenshot";

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const RENDER_SCALE = 1;

function preserveLineClamp(node) {
  // Chromium reports a clamped -webkit-box as flow-root in computed styles.
  if (node instanceof HTMLElement && Number.parseInt(node.style.webkitLineClamp, 10) > 0) {
    node.style.display = "-webkit-box";
    node.style.webkitBoxOrient = "vertical";
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
  const snapshot = await domToCanvas(screen, options);
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
