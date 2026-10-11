/**
 * Generates an aesthetic sample portrait photo on canvas
 * Used as an instant fallback when camera is inaccessible or for quick demonstration.
 */

export function createSamplePortrait(orientation: 'landscape' | 'portrait' = 'portrait'): string {
  const width = orientation === 'landscape' ? 1200 : 1000;
  const height = orientation === 'landscape' ? 1000 : 1200;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Studio background gradient
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.45,
    100,
    width / 2,
    height * 0.45,
    width * 0.75
  );
  bgGrad.addColorStop(0, '#1e293b');
  bgGrad.addColorStop(0.6, '#0f172a');
  bgGrad.addColorStop(1, '#020617');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle ambient studio rim light glow
  ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.45, 380, 0, Math.PI * 2);
  ctx.fill();

  // Draw stylish photobooth silhouette
  const centerY = height * 0.46;
  const headRadiusX = orientation === 'landscape' ? 140 : 150;
  const headRadiusY = orientation === 'landscape' ? 165 : 180;

  // Shoulders & torso
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(width / 2, height * 0.95, 360, 360, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck
  ctx.fillStyle = '#e2b192';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 55, centerY + headRadiusY * 0.6, 110, 140, 16);
  ctx.fill();

  // Head
  ctx.fillStyle = '#f6cbb0';
  ctx.beginPath();
  ctx.ellipse(width / 2, centerY, headRadiusX, headRadiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(width / 2, centerY - 20, headRadiusX + 15, Math.PI * 0.8, Math.PI * 2.2);
  ctx.fill();

  // Sunglasses / Cool shades
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(width / 2 - 105, centerY - 15, 85, 48, 12);
  ctx.roundRect(width / 2 + 20, centerY - 15, 85, 48, 12);
  ctx.fill();

  // Sunglass bridge
  ctx.fillRect(width / 2 - 20, centerY + 3, 40, 8);

  // Sunglass reflection (cyan highlight)
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 95, centerY + 5);
  ctx.lineTo(width / 2 - 40, centerY + 1);
  ctx.moveTo(width / 2 + 30, centerY + 5);
  ctx.lineTo(width / 2 + 85, centerY + 1);
  ctx.stroke();

  // Smile
  ctx.strokeStyle = '#c2410c';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(width / 2, centerY + 65, 32, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // Peace sign hand (Photobooth pose)
  ctx.save();
  ctx.translate(width / 2 + (orientation === 'landscape' ? 240 : 200), height * 0.65);
  ctx.rotate((-20 * Math.PI) / 180);
  ctx.fillStyle = '#f6cbb0';
  ctx.beginPath();
  ctx.ellipse(0, 40, 45, 55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(-25, -60, 22, 90, 10);
  ctx.roundRect(5, -65, 22, 95, 10);
  ctx.fill();
  ctx.restore();

  // Studio badge
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    `SAMPLE CAPTURE · ${orientation === 'landscape' ? 'LANDSCAPE 600×500' : 'PORTRAIT 500×600'}`,
    width / 2,
    height * 0.95
  );

  return canvas.toDataURL('image/png');
}
