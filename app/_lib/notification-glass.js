// Pixel-based glass rendering also works where CanvasRenderingContext2D.filter
// is ignored (notably Safari versions used on iPhones).
export function filterGlassPixels(pixels, width, height, sigma, saturation = 1) {
  let source = Float32Array.from(pixels);
  let target = new Float32Array(source.length);
  // Three box convolutions approximate a Gaussian with the CSS blur sigma.
  const ideal = Math.sqrt(4 * sigma * sigma + 1);
  const lower = Math.max(1, Math.floor(ideal) - (Math.floor(ideal) % 2 === 0 ? 1 : 0));
  const upper = lower + 2;
  const lowerCount = Math.round((12 * sigma * sigma - 3 * lower * lower - 12 * lower - 9) / (-4 * lower - 4));
  const pass = (radius, horizontal) => {
    const length = horizontal ? width : height;
    const lines = horizontal ? height : width;
    const stride = horizontal ? 4 : width * 4;
    const size = radius * 2 + 1;
    for (let line = 0; line < lines; line++) {
      const base = horizontal ? line * width * 4 : line * 4;
      for (let channel = 0; channel < 4; channel++) {
        let sum = 0;
        for (let offset = -radius; offset <= radius; offset++) {
          sum += source[base + Math.min(length - 1, Math.max(0, offset)) * stride + channel];
        }
        for (let position = 0; position < length; position++) {
          target[base + position * stride + channel] = sum / size;
          sum += source[base + Math.min(length - 1, position + radius + 1) * stride + channel]
            - source[base + Math.max(0, position - radius) * stride + channel];
        }
      }
    }
    [source, target] = [target, source];
  };
  if (sigma > 0) {
    for (let index = 0; index < 3; index++) {
      const radius = ((index < lowerCount ? lower : upper) - 1) / 2;
      pass(radius, true);
      pass(radius, false);
    }
  }
  for (let index = 0; index < pixels.length; index += 4) {
    const luminance = .213 * source[index] + .715 * source[index + 1] + .072 * source[index + 2];
    for (let channel = 0; channel < 3; channel++) {
      pixels[index + channel] = luminance + saturation * (source[index + channel] - luminance);
    }
    pixels[index + 3] = source[index + 3];
  }
  return pixels;
}
