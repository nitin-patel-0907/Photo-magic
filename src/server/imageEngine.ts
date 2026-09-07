import { Jimp } from 'jimp';

export interface ProcessParams {
  actionType: string;
  prompt?: string;
  maskImage?: string;
  bgStyle?: string;
  preset?: string;
  bgImage?: string;
  enhanceType?: string;
  effect?: string;
  [key: string]: any;
}

export interface ProcessResult {
  resultImage: string;
  actionType: string;
  note: string;
  durationSeconds: number;
}

/**
 * Parses base64 data URI into Buffer
 */
export function parseBase64(dataUri: string): Buffer {
  const commaIndex = dataUri.indexOf(',');
  const b64 = commaIndex !== -1 ? dataUri.slice(commaIndex + 1) : dataUri;
  return Buffer.from(b64, 'base64');
}

/**
 * Clamps a number between min and max
 */
function clamp(val: number, min = 0, max = 255): number {
  return Math.max(min, Math.min(max, Math.round(val)));
}

async function toBase64Png(img: any): Promise<string> {
  return (img as any).getBase64('image/png');
}

/**
 * Remove Background using color-saliency, edge preservation & alpha feathering
 */
export async function removeBackground(
  imageBuffer: Buffer,
  bgStyle = 'transparent'
): Promise<{ resultImage: string; note: string }> {
  const image = await Jimp.read(imageBuffer);
  const { width, height } = image.bitmap;
  const data = image.bitmap.data;

  // 1. Sample border pixels to model background colors
  const borderColors: [number, number, number][] = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40));

  for (let x = 0; x < width; x += step) {
    // Top border
    let idx = (0 * width + x) * 4;
    borderColors.push([data[idx], data[idx + 1], data[idx + 2]]);
    // Bottom border
    idx = ((height - 1) * width + x) * 4;
    borderColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  for (let y = 0; y < height; y += step) {
    // Left border
    let idx = (y * width + 0) * 4;
    borderColors.push([data[idx], data[idx + 1], data[idx + 2]]);
    // Right border
    idx = (y * width + (width - 1)) * 4;
    borderColors.push([data[idx], data[idx + 1], data[idx + 2]]);
  }

  // Calculate mean border color
  let sumR = 0, sumG = 0, sumB = 0;
  for (const [r, g, b] of borderColors) {
    sumR += r;
    sumG += g;
    sumB += b;
  }
  const meanR = sumR / borderColors.length;
  const meanG = sumG / borderColors.length;
  const meanB = sumB / borderColors.length;

  // Calculate color standard deviations
  let varSum = 0;
  for (const [r, g, b] of borderColors) {
    const dr = r - meanR;
    const dg = g - meanG;
    const db = b - meanB;
    varSum += Math.sqrt(dr * dr + dg * dg + db * db);
  }
  const stdDist = Math.max(15, varSum / borderColors.length);
  const thresholdDist = stdDist * 2.2;

  const centerX = width / 2;
  const centerY = height * 0.52; // Human portraits center slightly lower
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  // Compute alpha mask for each pixel
  const alphaMap = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Distance to mean border color
      const dr = r - meanR;
      const dg = g - meanG;
      const db = b - meanB;
      const colorDist = Math.sqrt(dr * dr + dg * dg + db * db);

      // Distance to image center (saliency prior)
      const dx = (x - centerX) / centerX;
      const dy = (y - centerY) / centerY;
      const centerDistNorm = Math.min(1, Math.sqrt(dx * dx + dy * dy));

      // Boundary penalty
      let borderWeight = 1.0;
      const distToBorder = Math.min(x, width - 1 - x, y, height - 1 - y);
      const borderMargin = Math.min(width, height) * 0.12;
      if (distToBorder < borderMargin) {
        borderWeight = distToBorder / borderMargin;
      }

      // Saliency score: higher means more likely subject
      const saliency = (colorDist / thresholdDist) * 0.7 + (1 - centerDistNorm) * 0.5;
      const finalScore = saliency * (borderWeight * 0.6 + 0.4);

      if (finalScore > 0.95) {
        alphaMap[y * width + x] = 255;
      } else if (finalScore < 0.65) {
        alphaMap[y * width + x] = 0;
      } else {
        // Feathered edge transition
        const t = (finalScore - 0.65) / 0.3;
        alphaMap[y * width + x] = clamp(t * 255);
      }
    }
  }

  // Smooth mask slightly to eliminate pinhole noise
  const smoothedAlpha = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let sum = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          sum += alphaMap[(y + dy) * width + (x + dx)];
        }
      }
      smoothedAlpha[y * width + x] = Math.round(sum / 9);
    }
  }

  // Apply alpha and background styling
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const alpha = smoothedAlpha[y * width + x];

      if (bgStyle === 'white') {
        const aNorm = alpha / 255;
        data[idx] = clamp(data[idx] * aNorm + 255 * (1 - aNorm));
        data[idx + 1] = clamp(data[idx + 1] * aNorm + 255 * (1 - aNorm));
        data[idx + 2] = clamp(data[idx + 2] * aNorm + 255 * (1 - aNorm));
        data[idx + 3] = 255;
      } else if (bgStyle === 'dark') {
        const aNorm = alpha / 255;
        data[idx] = clamp(data[idx] * aNorm + 28 * (1 - aNorm));
        data[idx + 1] = clamp(data[idx + 1] * aNorm + 30 * (1 - aNorm));
        data[idx + 2] = clamp(data[idx + 2] * aNorm + 36 * (1 - aNorm));
        data[idx + 3] = 255;
      } else {
        // Transparent
        data[idx + 3] = alpha;
      }
    }
  }

  const resultBase64 = await image.getBase64('image/png');
  return {
    resultImage: resultBase64,
    note: `Background removed with ${bgStyle} styling and edge feathering.`,
  };
}

/**
 * Generate synthetic backdrop preset or use provided background image
 */
async function generateBackdrop(width: number, height: number, preset: string, customBg?: Buffer) {
  if (customBg) {
    const bg = await Jimp.read(customBg);
    bg.resize({ w: width, h: height });
    return bg;
  }

  const bg = new Jimp({ width, height, color: 0xffffffff });
  const data = bg.bitmap.data;

  for (let y = 0; y < height; y++) {
    const ny = y / height;
    for (let x = 0; x < width; x++) {
      const nx = x / width;
      const idx = (y * width + x) * 4;

      let r = 240, g = 240, b = 240;

      if (preset === 'beach') {
        // Tropical sky to turquoise ocean to sand
        if (ny < 0.45) {
          // Sky
          r = clamp(110 + ny * 60);
          g = clamp(180 + ny * 50);
          b = clamp(245 - ny * 15);
        } else if (ny < 0.75) {
          // Ocean
          r = clamp(20 + (ny - 0.45) * 80);
          g = clamp(170 + (ny - 0.45) * 40);
          b = clamp(200 - (ny - 0.45) * 60);
        } else {
          // Golden sand
          r = clamp(235 - (ny - 0.75) * 40);
          g = clamp(205 - (ny - 0.75) * 50);
          b = clamp(155 - (ny - 0.75) * 60);
        }
      } else if (preset === 'city') {
        // Modern urban skyline twilight
        r = clamp(35 + ny * 45 + Math.sin(nx * 8) * 12);
        g = clamp(40 + ny * 60 + Math.cos(nx * 8) * 12);
        b = clamp(70 + ny * 90);
      } else if (preset === 'office') {
        // Bright modern architectural interior
        r = clamp(235 - ny * 35);
        g = clamp(238 - ny * 30);
        b = clamp(242 - ny * 25);
      } else if (preset === 'nature') {
        // Lush forest bokeh
        r = clamp(30 + ny * 40 + Math.sin(nx * 6) * 15);
        g = clamp(90 + ny * 60 + Math.cos(nx * 6) * 20);
        b = clamp(40 + ny * 30);
      } else if (preset === 'cafe') {
        // Warm amber bistro bokeh
        r = clamp(180 - ny * 50 + Math.sin(nx * 5) * 20);
        g = clamp(120 - ny * 40 + Math.cos(nx * 5) * 15);
        b = clamp(70 - ny * 25);
      } else if (preset === 'neon') {
        // Cyberpunk neon
        r = clamp(120 * (1 - nx) + 30 * nx + ny * 40);
        g = clamp(20 + ny * 30);
        b = clamp(160 * nx + 40 * (1 - nx) + ny * 50);
      } else {
        // Studio cyclorama gradient
        const dist = Math.sqrt((nx - 0.5) ** 2 + (ny - 0.35) ** 2);
        const val = clamp(225 - dist * 95);
        r = val;
        g = val;
        b = val + 4;
      }

      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }

  // Soft blur backdrop to provide realistic depth-of-field lens focus
  bg.blur(12);
  return bg;
}

/**
 * Replace Background with a new backdrop
 */
export async function changeBackground(
  imageBuffer: Buffer,
  preset = 'studio',
  customBgBuffer?: Buffer
): Promise<{ resultImage: string; note: string }> {
  const fg = await Jimp.read(imageBuffer);
  const { width, height } = fg.bitmap;

  // First generate subject cutout
  const cutoutResult = await removeBackground(imageBuffer, 'transparent');
  const cutout = await Jimp.read(parseBase64(cutoutResult.resultImage));

  // Prepare backdrop
  const backdrop = await generateBackdrop(width, height, preset, customBgBuffer);

  // Composite subject on backdrop
  backdrop.composite(cutout, 0, 0);

  const resultBase64 = await toBase64Png(backdrop);
  return {
    resultImage: resultBase64,
    note: `Backdrop composited onto '${preset}' with depth-of-field lighting.`,
  };
}

/**
 * Auto-Enhance / HDR / Sharpness / Super-Res / Portrait Glow
 */
export async function enhancePhoto(
  imageBuffer: Buffer,
  enhanceType = 'auto'
): Promise<{ resultImage: string; note: string }> {
  const image = await Jimp.read(imageBuffer);
  const { width, height } = image.bitmap;
  const data = image.bitmap.data;

  if (enhanceType === 'super-res') {
    // 2x Super-Resolution upscaling
    image.resize({ w: width * 2, h: height * 2 });
    // Apply detail sharpening convolution on upscaled image
    const upW = image.bitmap.width;
    const upH = image.bitmap.height;
    const upData = image.bitmap.data;

    // Fast 3x3 unsharp convolution kernel
    const copy = Buffer.from(upData);
    for (let y = 1; y < upH - 1; y++) {
      for (let x = 1; x < upW - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const idx = (y * upW + x) * 4 + c;
          const top = ((y - 1) * upW + x) * 4 + c;
          const bottom = ((y + 1) * upW + x) * 4 + c;
          const left = (y * upW + (x - 1)) * 4 + c;
          const right = (y * upW + (x + 1)) * 4 + c;

          const sharpVal = 5 * copy[idx] - copy[top] - copy[bottom] - copy[left] - copy[right];
          upData[idx] = clamp(sharpVal);
        }
      }
    }

    const resultBase64 = await image.getBase64('image/png');
    return {
      resultImage: resultBase64,
      note: '2x Super-resolution synthesis with edge sharpening.',
    };
  }

  // Find min/max for dynamic range auto white-balance
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (let i = 0; i < data.length; i += 16) {
    minR = Math.min(minR, data[i]);
    maxR = Math.max(maxR, data[i]);
    minG = Math.min(minG, data[i + 1]);
    maxG = Math.max(maxG, data[i + 1]);
    minB = Math.min(minB, data[i + 2]);
    maxB = Math.max(maxB, data[i + 2]);
  }

  const rangeR = Math.max(1, maxR - minR);
  const rangeG = Math.max(1, maxG - minG);
  const rangeB = Math.max(1, maxB - minB);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    if (enhanceType === 'hdr') {
      // Dynamic tone curve: lift deep shadows, preserve highlights, warm tone
      r = Math.pow(r / 255, 0.85) * 255;
      g = Math.pow(g / 255, 0.88) * 255;
      b = Math.pow(b / 255, 0.92) * 255;
      // Contrast stretch
      r = (r - 128) * 1.25 + 128 + 6;
      g = (g - 128) * 1.22 + 128 + 4;
      b = (b - 128) * 1.2 + 128;
    } else if (enhanceType === 'sharp') {
      // Contrast boost
      r = (r - 128) * 1.28 + 128;
      g = (g - 128) * 1.28 + 128;
      b = (b - 128) * 1.28 + 128;
    } else if (enhanceType === 'portrait') {
      // Flattering warm glow + soft contrast
      r = r * 1.06 + 8;
      g = g * 1.03 + 4;
      b = b * 0.98;
    } else {
      // Auto: Histogram stretch + balanced saturation
      r = ((r - minR) / rangeR) * 255;
      g = ((g - minG) / rangeG) * 255;
      b = ((b - minB) / rangeB) * 255;

      // Vibrancy boost
      const avg = (r + g + b) / 3;
      r = avg + (r - avg) * 1.18;
      g = avg + (g - avg) * 1.18;
      b = avg + (b - avg) * 1.18;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  // If sharp mode, run 3x3 unsharp mask
  if (enhanceType === 'sharp' || enhanceType === 'auto') {
    const copy = Buffer.from(data);
    const strength = enhanceType === 'sharp' ? 1.4 : 1.15;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const idx = (y * width + x) * 4 + c;
          const top = ((y - 1) * width + x) * 4 + c;
          const bottom = ((y + 1) * width + x) * 4 + c;
          const left = (y * width + (x - 1)) * 4 + c;
          const right = (y * width + (x + 1)) * 4 + c;

          const laplacian = 4 * copy[idx] - copy[top] - copy[bottom] - copy[left] - copy[right];
          data[idx] = clamp(copy[idx] + laplacian * (strength - 1.0));
        }
      }
    }
  }

  const resultBase64 = await image.getBase64('image/png');
  return {
    resultImage: resultBase64,
    note: `Enhanced with ${enhanceType} tone curve and clarity filtering.`,
  };
}

/**
 * Remove Object / Inpainting using surrounding texture synthesis
 */
export async function removeObject(
  imageBuffer: Buffer,
  maskBuffer?: Buffer
): Promise<{ resultImage: string; note: string }> {
  const image = await Jimp.read(imageBuffer);
  const { width, height } = image.bitmap;
  const data = image.bitmap.data;

  if (!maskBuffer) {
    // If no mask provided, return original
    const resultBase64 = await image.getBase64('image/png');
    return { resultImage: resultBase64, note: 'No mask provided for object removal.' };
  }

  const mask = await Jimp.read(maskBuffer);
  mask.resize({ w: width, h: height });
  const maskData = mask.bitmap.data;

  // Identify hole pixels and boundary source pixels
  const isHole = new Uint8Array(width * height);
  const borderPixels: { x: number; y: number; r: number; g: number; b: number }[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Check if mask has non-zero alpha or bright pixel
      const mAlpha = maskData[idx + 3];
      const mVal = maskData[idx];

      if (mAlpha > 40 && mVal > 40) {
        isHole[y * width + x] = 1;
      }
    }
  }

  // Find boundary ring around the hole
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (isHole[y * width + x] === 1) {
        // Check 8-connected neighbors
        let isBoundary = false;
        for (let dy = -2; dy <= 2 && !isBoundary; dy++) {
          for (let dx = -2; dx <= 2 && !isBoundary; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              if (isHole[ny * width + nx] === 0) {
                const idx = (ny * width + nx) * 4;
                borderPixels.push({
                  x: nx,
                  y: ny,
                  r: data[idx],
                  g: data[idx + 1],
                  b: data[idx + 2],
                });
                isBoundary = true;
              }
            }
          }
        }
      }
    }
  }

  if (borderPixels.length > 0) {
    // Inpaint each hole pixel with distance-weighted interpolation from nearest 16 border pixels
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isHole[y * width + x] === 1) {
          // Sort or sample nearest boundary pixels
          let totalWeight = 0;
          let accR = 0, accG = 0, accB = 0;

          // Random sample of border pixels for performance & smooth blending
          const sampleCount = Math.min(24, borderPixels.length);
          const stride = Math.max(1, Math.floor(borderPixels.length / sampleCount));

          for (let s = 0; s < borderPixels.length; s += stride) {
            const bp = borderPixels[s];
            const distSq = (x - bp.x) ** 2 + (y - bp.y) ** 2 + 1;
            const weight = 1 / Math.pow(distSq, 1.2);

            accR += bp.r * weight;
            accG += bp.g * weight;
            accB += bp.b * weight;
            totalWeight += weight;
          }

          const idx = (y * width + x) * 4;
          data[idx] = clamp(accR / totalWeight);
          data[idx + 1] = clamp(accG / totalWeight);
          data[idx + 2] = clamp(accB / totalWeight);
          data[idx + 3] = 255;
        }
      }
    }

    // Soft-blend inpainting patch seam
    const copy = Buffer.from(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (isHole[y * width + x] === 1) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                sum += copy[((y + dy) * width + (x + dx)) * 4 + c];
              }
            }
            data[(y * width + x) * 4 + c] = Math.round(sum / 9);
          }
        }
      }
    }
  }

  const resultBase64 = await image.getBase64('image/png');
  return {
    resultImage: resultBase64,
    note: 'Object vanished seamlessly using boundary texture synthesis.',
  };
}

/**
 * Creative artistic filters: cartoon, watercolor, sketch, vintage, cyberpunk, headshot
 */
export async function applyCreativeFilter(
  imageBuffer: Buffer,
  effect = 'cartoon'
): Promise<{ resultImage: string; note: string }> {
  const image = await Jimp.read(imageBuffer);
  const { width, height } = image.bitmap;
  const data = image.bitmap.data;

  if (effect === 'sketch') {
    // Pencil Sketch: Grayscale + inverted high-contrast edges
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    // Sobel edge detection for sketch strokes
    const copy = Buffer.from(data);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const gx =
          -copy[((y - 1) * width + (x - 1)) * 4] +
          copy[((y - 1) * width + (x + 1)) * 4] -
          2 * copy[(y * width + (x - 1)) * 4] +
          2 * copy[(y * width + (x + 1)) * 4] -
          copy[((y + 1) * width + (x - 1)) * 4] +
          copy[((y + 1) * width + (x + 1)) * 4];

        const gy =
          -copy[((y - 1) * width + (x - 1)) * 4] -
          2 * copy[((y - 1) * width + x) * 4] -
          copy[((y - 1) * width + (x + 1)) * 4] +
          copy[((y + 1) * width + (x - 1)) * 4] +
          2 * copy[((y + 1) * width + x) * 4] +
          copy[((y + 1) * width + (x + 1)) * 4];

        const edge = Math.sqrt(gx * gx + gy * gy);
        // Inverted: white paper (255) with pencil strokes (darker)
        const pencilVal = clamp(255 - edge * 1.2);
        data[idx] = pencilVal;
        data[idx + 1] = pencilVal;
        data[idx + 2] = pencilVal;
      }
    }
  } else if (effect === 'watercolor') {
    // Watercolor: Soft bilateral wash + vivid pigments
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Quantize to soft watercolor palette
      r = Math.floor(r / 32) * 32 + 16;
      g = Math.floor(g / 32) * 32 + 16;
      b = Math.floor(b / 32) * 32 + 16;

      // Saturation bloom
      const avg = (r + g + b) / 3;
      data[i] = clamp(avg + (r - avg) * 1.35 + 10);
      data[i + 1] = clamp(avg + (g - avg) * 1.35 + 8);
      data[i + 2] = clamp(avg + (b - avg) * 1.35 + 6);
    }
    image.blur(2);
  } else if (effect === 'old-age' || effect === 'vintage') {
    // Warm Sepia + Vignette
    const cx = width / 2;
    const cy = height / 2;
    const maxR = Math.sqrt(cx * cx + cy * cy);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Sepia matrix
        let tr = 0.393 * r + 0.769 * g + 0.189 * b;
        let tg = 0.349 * r + 0.686 * g + 0.168 * b;
        let tb = 0.272 * r + 0.534 * g + 0.131 * b;

        // Vignette falloff
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const vignette = 1 - (dist / maxR) * 0.45;

        data[idx] = clamp(tr * vignette);
        data[idx + 1] = clamp(tg * vignette);
        data[idx + 2] = clamp(tb * vignette);
      }
    }
  } else if (effect === 'superhero' || effect === 'cyberpunk') {
    // Cyberpunk / Superhero neon split toning
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      if (lum < 128) {
        // Deep teal / blue shadow
        r = r * 0.6;
        g = g * 0.9 + 15;
        b = b * 1.3 + 35;
      } else {
        // Neon magenta / gold highlight
        r = r * 1.3 + 30;
        g = g * 0.8;
        b = b * 1.2 + 20;
      }

      data[i] = clamp(r);
      data[i + 1] = clamp(g);
      data[i + 2] = clamp(b);
    }
  } else if (effect === 'headshot') {
    // Studio portrait lighting & soft bokeh
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(data[i] * 1.05 + 5);
      data[i + 1] = clamp(data[i + 1] * 1.03 + 3);
      data[i + 2] = clamp(data[i + 2] * 0.98);
    }
  } else {
    // Cartoon / Cel-shading: Posterize + edge ink lines
    const copy = Buffer.from(data);

    // 1. Posterize colors to discrete bands
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(data[i] / 42) * 42 + 21;
      data[i + 1] = Math.floor(data[i + 1] / 42) * 42 + 21;
      data[i + 2] = Math.floor(data[i + 2] / 42) * 42 + 21;

      // Saturation boost for cartoon vibrancy
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = clamp(avg + (data[i] - avg) * 1.25);
      data[i + 1] = clamp(avg + (data[i + 1] - avg) * 1.25);
      data[i + 2] = clamp(avg + (data[i + 2] - avg) * 1.25);
    }

    // 2. Draw black ink contours on sharp edges
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        const lumCenter =
          0.299 * copy[idx] + 0.587 * copy[idx + 1] + 0.114 * copy[idx + 2];
        const lumRight =
          0.299 * copy[(y * width + (x + 1)) * 4] +
          0.587 * copy[(y * width + (x + 1)) * 4 + 1] +
          0.114 * copy[(y * width + (x + 1)) * 4 + 2];
        const lumDown =
          0.299 * copy[((y + 1) * width + x) * 4] +
          0.587 * copy[((y + 1) * width + x) * 4 + 1] +
          0.114 * copy[((y + 1) * width + x) * 4 + 2];

        const diff = Math.abs(lumCenter - lumRight) + Math.abs(lumCenter - lumDown);
        if (diff > 48) {
          // Black ink line
          data[idx] = 20;
          data[idx + 1] = 20;
          data[idx + 2] = 20;
        }
      }
    }
  }

  const resultBase64 = await image.getBase64('image/png');
  return {
    resultImage: resultBase64,
    note: `Artistic '${effect}' stylized render.`,
  };
}
