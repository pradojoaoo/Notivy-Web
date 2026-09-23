import { domToCanvas } from "modern-screenshot";

const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
const RENDER_SCALE = 1;

function preserveLineClamp(node) {
  if (node instanceof HTMLElement && node.classList.contains("notification-readable")) {
    node.style.visibility = "hidden";
  }
  if (node instanceof HTMLElement && node.closest(".lock-screen-controls")) {
    node.style.filter = "none";
    node.style.textShadow = "none";
  }
  // Chromium reports a clamped -webkit-box as flow-root in computed styles.
  if (node instanceof HTMLElement && Number.parseInt(node.style.webkitLineClamp, 10) > 0) {
    node.style.display = "-webkit-box";
    node.style.webkitBoxOrient = "vertical";
  }
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function backgroundImageUrl(element) {
  const value = getComputedStyle(element).backgroundImage;
  const match = value.match(/^url\(["']?(.*?)["']?\)$/);
  return match?.[1] ?? "";
}

function canvasFont(element, scale) {
  const style = getComputedStyle(element);
  return `${style.fontWeight} ${Number.parseFloat(style.fontSize) * scale}px ${style.fontFamily}`;
}

function drawSingleLine(context, element, origin, scale) {
  const bounds = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  context.font = canvasFont(element, scale);
  context.fillStyle = style.color;
  context.textBaseline = "top";
  context.fillText(element.textContent, (bounds.left - origin.left) * scale, (bounds.top - origin.top) * scale);
}

function drawWrappedText(context, element, origin, scale) {
  const bounds = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  const words = element.textContent.trim().split(/\s+/);
  const maxWidth = bounds.width * scale;
  const lineHeight = Number.parseFloat(style.lineHeight) * scale;
  const lines = [];
  let line = "";
  context.font = canvasFont(element, scale);
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  if (lines.length > 2) {
    lines.length = 2;
    while (context.measureText(`${lines[1]}…`).width > maxWidth) lines[1] = lines[1].slice(0, -1);
    lines[1] += "…";
  }
  context.fillStyle = style.color;
  context.textBaseline = "top";
  const x = (bounds.left - origin.left) * scale;
  const y = (bounds.top - origin.top) * scale;
  lines.forEach((text, index) => context.fillText(text, x, y + index * lineHeight));
}

async function drawNotification(context, screen, output) {
  const notification = screen.querySelector(".notification-readable");
  if (!notification) return;
  const origin = screen.getBoundingClientRect();
  const bounds = notification.getBoundingClientRect();
  const scale = OUTPUT_WIDTH / origin.width;
  const x = (bounds.left - origin.left) * scale;
  const y = (bounds.top - origin.top) * scale;
  const width = bounds.width * scale;
  const height = bounds.height * scale;
  const radius = height * .31;

  context.save();
  roundedRect(context, x, y, width, height, radius);
  context.clip();
  const glass = document.createElement("canvas");
  glass.width = Math.ceil(width);
  glass.height = Math.ceil(height);
  const glassContext = glass.getContext("2d");
  glassContext.filter = `blur(${Math.max(12, width * .018)}px) saturate(125%)`;
  glassContext.drawImage(output, x - 18, y - 18, width + 36, height + 36, -18, -18, width + 36, height + 36);
  context.drawImage(glass, x, y, width, height);
  const tint = context.createLinearGradient(x, y, x + width, y + height);
  tint.addColorStop(0, "rgba(58, 70, 84, .40)");
  tint.addColorStop(.55, "rgba(31, 43, 58, .36)");
  tint.addColorStop(1, "rgba(25, 35, 50, .42)");
  context.fillStyle = tint;
  context.fillRect(x, y, width, height);
  context.restore();

  context.save();
  roundedRect(context, x + scale * .45, y + scale * .45, width - scale * .9, height - scale * .9, radius);
  context.strokeStyle = "rgba(255, 255, 255, .48)";
  context.lineWidth = Math.max(1.5, scale * .75);
  context.stroke();
  context.restore();

  const icon = notification.querySelector(".notification-icon");
  const iconBounds = icon.getBoundingClientRect();
  const iconX = (iconBounds.left - origin.left) * scale;
  const iconY = (iconBounds.top - origin.top) * scale;
  const iconWidth = iconBounds.width * scale;
  const iconHeight = iconBounds.height * scale;
  const source = backgroundImageUrl(icon);
  if (source) {
    const image = await loadImage(source);
    context.save();
    roundedRect(context, iconX, iconY, iconWidth, iconHeight, iconWidth * .23);
    context.clip();
    context.drawImage(image, iconX, iconY, iconWidth, iconHeight);
    context.restore();
  }

  const appName = notification.querySelector(".notification-app-name");
  const title = notification.querySelector(".notification-title");
  const message = notification.querySelector(".notification-readable-copy > span");
  const time = notification.querySelector(".notification-readable-time");
  drawSingleLine(context, appName, origin, scale);
  drawSingleLine(context, title, origin, scale);
  drawWrappedText(context, message, origin, scale);
  drawSingleLine(context, time, origin, scale);
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
  await drawNotification(context, screen, output);
  return new Promise((resolve, reject) => output.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("PNG vazio")),
    "image/png",
  ));
}
