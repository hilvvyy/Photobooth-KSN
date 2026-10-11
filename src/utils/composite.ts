/**
 * Composite Engine
 * Merges captured photo and chroma-keyed frame onto a single high-definition HTML5 canvas.
 */

export interface PhotoTransform {
  zoom: number; // 0.5 to 3.0
  panX: number; // in pixels relative to center
  panY: number; // in pixels relative to center
  rotate: number; // -180 to 180 degrees
  mirror: boolean;
  filter: 'normal' | 'bw' | 'vintage' | 'warm' | 'cyber' | 'vivid' | 'sepia';
  brightness: number; // 0.5 to 1.5, default 1
  contrast: number; // 0.5 to 1.5, default 1
}

export const FILTER_STYLES: Record<PhotoTransform['filter'], string> = {
  normal: 'none',
  bw: 'grayscale(100%) contrast(115%)',
  vintage: 'sepia(40%) contrast(110%) brightness(95%) saturate(85%)',
  warm: 'sepia(25%) saturate(130%) brightness(105%) hue-rotate(-10deg)',
  cyber: 'contrast(125%) saturate(140%) hue-rotate(185deg)',
  vivid: 'saturate(150%) contrast(110%) brightness(102%)',
  sepia: 'sepia(90%) contrast(95%) brightness(90%)',
};

/**
 * Render the final composite onto a destination canvas
 */
export function renderComposite(
  targetCanvas: HTMLCanvasElement,
  photoImage: HTMLImageElement | HTMLCanvasElement,
  processedFrameCanvas: HTMLCanvasElement,
  transform: PhotoTransform
): void {
  const width = processedFrameCanvas.width;
  const height = processedFrameCanvas.height;

  targetCanvas.width = width;
  targetCanvas.height = height;
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Background fallback color (dark neutral behind photo)
  ctx.fillStyle = '#0a0f1d';
  ctx.fillRect(0, 0, width, height);

  // 1. LAYER 1: USER PHOTO (Rendered behind the frame)
  ctx.save();

  // Calculate photo source dimensions
  const photoW = photoImage instanceof HTMLImageElement ? photoImage.naturalWidth || photoImage.width : photoImage.width;
  const photoH = photoImage instanceof HTMLImageElement ? photoImage.naturalHeight || photoImage.height : photoImage.height;

  // Scale photo to cover the frame container by default, then multiply by user zoom
  const baseScale = Math.max(width / photoW, height / photoH);
  const finalScale = baseScale * transform.zoom;

  const drawW = photoW * finalScale;
  const drawH = photoH * finalScale;

  // Center photo and apply pan offsets
  const centerX = width / 2 + transform.panX;
  const centerY = height / 2 + transform.panY;

  ctx.translate(centerX, centerY);

  // Apply rotation
  if (transform.rotate !== 0) {
    ctx.rotate((transform.rotate * Math.PI) / 180);
  }

  // Apply mirror / horizontal flip
  if (transform.mirror) {
    ctx.scale(-1, 1);
  }

  // Apply CSS Filter string to Canvas Context
  const filterPreset = FILTER_STYLES[transform.filter] || 'none';
  const customFilters = `brightness(${transform.brightness}) contrast(${transform.contrast})`;
  ctx.filter = filterPreset === 'none' ? customFilters : `${filterPreset} ${customFilters}`;

  // Draw photo centered
  ctx.drawImage(photoImage, -drawW / 2, -drawH / 2, drawW, drawH);

  ctx.restore();

  // 2. LAYER 2: PROCESSED CHROMA KEY FRAME (Overlay on top)
  // Green screen areas are alpha=0, so photo shines through cleanly!
  ctx.save();
  ctx.filter = 'none';
  ctx.drawImage(processedFrameCanvas, 0, 0, width, height);
  ctx.restore();
}

/**
 * Trigger browser download for the composite image
 * Optionally re-samples to exact target dimensions (e.g. 600x500 or 500x600)
 */
export function downloadCanvasAsPng(
  canvas: HTMLCanvasElement,
  filename = 'photobooth-capture.png',
  targetSize?: { width: number; height: number }
): void {
  try {
    let exportCanvas = canvas;

    if (targetSize && (canvas.width !== targetSize.width || canvas.height !== targetSize.height)) {
      exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetSize.width;
      exportCanvas.height = targetSize.height;
      const ctx = exportCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, targetSize.width, targetSize.height);
      }
    }

    const dataUrl = exportCanvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download error:', error);
  }
}

/**
 * Copy canvas content to system clipboard as PNG image
 */
export async function copyCanvasToClipboard(
  canvas: HTMLCanvasElement,
  targetSize?: { width: number; height: number }
): Promise<boolean> {
  try {
    if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
      return false;
    }

    let exportCanvas = canvas;
    if (targetSize && (canvas.width !== targetSize.width || canvas.height !== targetSize.height)) {
      exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetSize.width;
      exportCanvas.height = targetSize.height;
      const ctx = exportCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, targetSize.width, targetSize.height);
      }
    }

    return new Promise((resolve) => {
      exportCanvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          resolve(true);
        } catch {
          resolve(false);
        }
      }, 'image/png');
    });
  } catch {
    return false;
  }
}
