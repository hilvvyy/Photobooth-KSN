/**
 * Chroma Key / Green Screen Processor for HTML5 Canvas
 * Detects target color (default pure green #00FF00) and turns it transparent (alpha = 0)
 * with optional smoothing and color despill.
 */

export interface ChromaKeyOptions {
  enabled: boolean;
  keyColor: string; // Hex string e.g. '#00FF00'
  tolerance: number; // 0.05 to 0.8
  smoothing: number; // 0.0 to 0.3
  despill: boolean;
}

export interface ChromaKeyResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  transparentRatio: number; // 0 to 1
}

/**
 * Convert Hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 0, g: 255, b: 0 }; // default pure green
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Process an image and generate a canvas with Chroma Key transparency applied
 */
export function processChromaKey(
  sourceImage: HTMLImageElement | HTMLCanvasElement,
  options: ChromaKeyOptions
): ChromaKeyResult {
  const width = sourceImage instanceof HTMLImageElement ? sourceImage.naturalWidth || sourceImage.width : sourceImage.width;
  const height = sourceImage instanceof HTMLImageElement ? sourceImage.naturalHeight || sourceImage.height : sourceImage.height;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return { canvas, width, height, transparentRatio: 0 };
  }

  // Draw original image
  ctx.drawImage(sourceImage, 0, 0, width, height);

  // If chroma key is disabled, return as-is
  if (!options.enabled) {
    return { canvas, width, height, transparentRatio: 0 };
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const totalPixels = width * height;
  let transparentCount = 0;

  const target = hexToRgb(options.keyColor);
  const isTargetGreen = target.g > target.r * 1.3 && target.g > target.b * 1.3;

  const tolerance = Math.max(0.01, options.tolerance);
  const smoothing = Math.max(0.001, options.smoothing);

  // Max Euclidean distance in RGB space is sqrt(255^2 * 3) ~= 441.67
  const maxDist = 441.67295593;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Already fully transparent
    if (a === 0) {
      transparentCount++;
      continue;
    }

    // Euclidean color distance normalized to [0, 1]
    const dr = r - target.r;
    const dg = g - target.g;
    const db = b - target.b;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db) / maxDist;

    // Green dominance boost for standard chroma green
    let matchScore = dist;
    if (isTargetGreen) {
      const greenDominance = g - Math.max(r, b);
      if (greenDominance > 40) {
        // Boost detection for green dominance
        matchScore = Math.min(matchScore, Math.max(0, 1 - (greenDominance / 200)));
      }
    }

    if (matchScore < tolerance) {
      // Exactly within tolerance -> completely transparent
      data[i + 3] = 0;
      transparentCount++;
    } else if (matchScore < tolerance + smoothing) {
      // Within smoothing range -> feathering alpha
      const factor = (matchScore - tolerance) / smoothing;
      const newAlpha = Math.floor(a * Math.min(1, Math.max(0, factor)));
      data[i + 3] = newAlpha;

      if (newAlpha < 30) {
        transparentCount++;
      }

      // Edge despill: reduce excess green tint on fringe pixels
      if (options.despill && isTargetGreen) {
        const avgOther = (r + b) / 2;
        if (g > avgOther) {
          data[i + 1] = Math.round(avgOther);
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return {
    canvas,
    width,
    height,
    transparentRatio: transparentCount / totalPixels,
  };
}
