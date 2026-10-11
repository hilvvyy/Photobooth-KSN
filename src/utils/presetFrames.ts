/**
 * High-definition Preset Frames with authentic #00FF00 Chroma Key zones
 * Supports both Landscape (600px x 500px, 6:5 ratio) and Portrait (500px x 600px / 4:5 ratio).
 * Rendered client-side via Canvas API to ensure zero external network latency.
 */

export type PhotoOrientation = 'landscape' | 'portrait';

export interface PresetFrame {
  id: string;
  name: string;
  category: string;
  orientation: PhotoOrientation;
  width: number;
  height: number;
  description: string;
  dataUrl: string;
}

/* =====================================================================
   LANDSCAPE FRAMES (1200 x 1000 px -> Native 6:5 / 600 x 500 px)
   ===================================================================== */

function createPolaroidLandscape(): string {
  const width = 1200;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  // Card body
  const marginX = 60;
  const marginTop = 50;
  const cardW = width - marginX * 2;
  const cardH = height - marginTop * 2;

  ctx.fillStyle = '#faf8f5';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  ctx.roundRect(marginX, marginTop, cardW, cardH, 20);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  // Chroma Key Green Cutout (Landscape window)
  const cutX = marginX + 50;
  const cutY = marginTop + 45;
  const cutW = cardW - 100;
  const cutH = cardH - 180;

  // Inner border
  ctx.fillStyle = '#e2ded5';
  ctx.fillRect(cutX - 4, cutY - 4, cutW + 8, cutH + 8);

  // Pure #00FF00
  ctx.fillStyle = '#00FF00';
  ctx.fillRect(cutX, cutY, cutW, cutH);

  // Cyan tape on top corner
  ctx.save();
  ctx.translate(cutX + cutW - 50, marginTop - 12);
  ctx.rotate((15 * Math.PI) / 180);
  ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
  ctx.fillRect(-60, -16, 120, 32);
  ctx.restore();

  // Bottom Handwritten Caption
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PHOTOBOOTH MOMENTS · 2026', width / 2, cutY + cutH + 68);

  ctx.fillStyle = '#64748b';
  ctx.font = '22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('LANDSCAPE EDITION · 600 × 500 PX', width / 2, cutY + cutH + 110);

  return canvas.toDataURL('image/png');
}

function createCyberNeonLandscape(): string {
  const width = 1200;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
  ctx.lineWidth = 2;
  for (let x = 40; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Chroma Key Green Cutout Window (Wide)
  const cutX = 80;
  const cutY = 120;
  const cutW = width - cutX * 2;
  const cutH = 740;

  ctx.fillStyle = '#00FF00';
  ctx.fillRect(cutX, cutY, cutW, cutH);

  // Neon Double Borders
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 4;
  ctx.strokeRect(cutX, cutY, cutW, cutH);

  ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cutX - 10, cutY - 10, cutW + 20, cutH + 20);

  // Corner Brackets
  const cornerSize = 45;
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 6;

  // Top Left
  ctx.beginPath();
  ctx.moveTo(cutX - 25, cutY + cornerSize);
  ctx.lineTo(cutX - 25, cutY - 25);
  ctx.lineTo(cutX + cornerSize, cutY - 25);
  ctx.stroke();

  // Top Right
  ctx.beginPath();
  ctx.moveTo(cutX + cutW + 25 - cornerSize, cutY - 25);
  ctx.lineTo(cutX + cutW + 25, cutY - 25);
  ctx.lineTo(cutX + cutW + 25, cutY + cornerSize);
  ctx.stroke();

  // Bottom Left
  ctx.beginPath();
  ctx.moveTo(cutX - 25, cutY + cutH - cornerSize);
  ctx.lineTo(cutX - 25, cutY + cutH + 25);
  ctx.lineTo(cutX + cornerSize, cutY + cutH + 25);
  ctx.stroke();

  // Bottom Right
  ctx.beginPath();
  ctx.moveTo(cutX + cutW + 25 - cornerSize, cutY + cutH + 25);
  ctx.lineTo(cutX + cutW + 25, cutY + cutH + 25);
  ctx.lineTo(cutX + cutW + 25, cutY + cutH - cornerSize);
  ctx.stroke();

  // Header HUD
  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('REC [WIDE_CAM] :: 60 FPS', cutX, 75);

  ctx.fillStyle = '#ec4899';
  ctx.textAlign = 'right';
  ctx.fillText('CYBER_BOOTH // WIDE-VIEW', width - cutX, 75);

  // Footer HUD
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 28px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NEO TOKYO PHOTOBOOTH · WIDE 6:5', width / 2, cutY + cutH + 70);

  return canvas.toDataURL('image/png');
}

function createY2kLandscape(): string {
  const width = 1200;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#fbcfe8');
  grad.addColorStop(0.3, '#c7d2fe');
  grad.addColorStop(0.7, '#a5f3fc');
  grad.addColorStop(1, '#fef08a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const pad = 50;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, 28);
  ctx.fill();

  const cutX = 90;
  const cutY = 130;
  const cutW = width - cutX * 2;
  const cutH = 720;

  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.roundRect(cutX, cutY, cutW, cutH, 20);
  ctx.fill();

  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(cutX, cutY, cutW, cutH, 20);
  ctx.stroke();

  ctx.fillStyle = '#ec4899';
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✧ IDOL PHOTO BOOTH · WIDE EDITION ✧', width / 2, 95);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('★ SUPERSTAR MOMENTS · 600 × 500 ★', width / 2, cutY + cutH + 68);

  ctx.fillStyle = '#f43f5e';
  ctx.font = '36px sans-serif';
  ctx.fillText('💖', cutX + 35, cutY + 50);
  ctx.fillText('✨', cutX + cutW - 35, cutY + 50);
  ctx.fillText('🎀', cutX + 35, cutY + cutH - 30);
  ctx.fillText('🌸', cutX + cutW - 35, cutY + cutH - 30);

  return canvas.toDataURL('image/png');
}

function createFloralGoldLandscape(): string {
  const width = 1200;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(40, 40, width - 80, height - 80);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(55, 55, width - 110, height - 110);

  const cutX = 90;
  const cutY = 130;
  const cutW = width - cutX * 2;
  const cutH = 720;

  ctx.fillStyle = '#00FF00';
  ctx.fillRect(cutX, cutY, cutW, cutH);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.strokeRect(cutX, cutY, cutW, cutH);

  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('C E L E B R A T I O N · W I D E', width / 2, 95);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TIMELESS MEMORIES · 600 × 500 PX', width / 2, cutY + cutH + 68);

  return canvas.toDataURL('image/png');
}

function createRetroArcadeLandscape(): string {
  const width = 1200;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, width, height);

  // Marquee
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(50, 30, width - 100, 70);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 38px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ ARCADE BOOTH WIDE ★', width / 2, 78);

  const cutX = 70;
  const cutY = 120;
  const cutW = width - cutX * 2;
  const cutH = 720;

  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.roundRect(cutX, cutY, cutW, cutH, 20);
  ctx.fill();

  ctx.strokeStyle = '#312e81';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.roundRect(cutX, cutY, cutW, cutH, 20);
  ctx.stroke();

  // Bottom arcade controls strip
  ctx.fillStyle = '#111827';
  ctx.fillRect(50, cutY + cutH + 18, width - 100, 110);

  // Buttons
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cutX + 70, cutY + cutH + 72, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(cutX + 130, cutY + cutH + 72, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(cutX + 190, cutY + cutH + 72, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('INSERT COIN 99', width - cutX - 40, cutY + cutH + 65);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText('PLAYER 1 READY', width - cutX - 40, cutY + cutH + 95);

  return canvas.toDataURL('image/png');
}

/* =====================================================================
   PORTRAIT FRAMES (1000 x 1200 px -> Native 5:6 / 500 x 600 px or 4:5)
   ===================================================================== */

function createPolaroidPortrait(): string {
  const width = 1000;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  const marginX = 70;
  const marginTop = 65;
  const cardW = width - marginX * 2;
  const cardH = height - marginTop * 2;

  ctx.fillStyle = '#faf8f5';
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 12;
  ctx.beginPath();
  ctx.roundRect(marginX, marginTop, cardW, cardH, 20);
  ctx.fill();
  ctx.shadowColor = 'transparent';

  const photoMargin = 50;
  const photoX = marginX + photoMargin;
  const photoY = marginTop + photoMargin;
  const photoW = cardW - photoMargin * 2;
  const photoH = 800;

  ctx.fillStyle = '#e2ded5';
  ctx.fillRect(photoX - 4, photoY - 4, photoW + 8, photoH + 8);

  ctx.fillStyle = '#00FF00';
  ctx.fillRect(photoX, photoY, photoW, photoH);

  // Washi tape
  ctx.save();
  ctx.translate(photoX + photoW - 50, marginTop - 15);
  ctx.rotate((15 * Math.PI) / 180);
  ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
  ctx.fillRect(-60, -16, 120, 32);
  ctx.restore();

  // Bottom text
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PHOTOBOOTH MOMENTS · 2026', width / 2, photoY + photoH + 100);

  ctx.fillStyle = '#64748b';
  ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PORTRAIT EDITION · 500 × 600 PX', width / 2, photoY + photoH + 150);

  return canvas.toDataURL('image/png');
}

function createCyberNeonPortrait(): string {
  const width = 1000;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
  ctx.lineWidth = 2;
  for (let x = 40; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 40; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const cutX = 80;
  const cutY = 140;
  const cutW = width - cutX * 2;
  const cutH = 840;

  ctx.fillStyle = '#00FF00';
  ctx.fillRect(cutX, cutY, cutW, cutH);

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 4;
  ctx.strokeRect(cutX, cutY, cutW, cutH);

  ctx.strokeStyle = 'rgba(236, 72, 153, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(cutX - 10, cutY - 10, cutW + 20, cutH + 20);

  // Corner Brackets
  const cornerSize = 40;
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 6;

  ctx.beginPath();
  ctx.moveTo(cutX - 25, cutY + cornerSize);
  ctx.lineTo(cutX - 25, cutY - 25);
  ctx.lineTo(cutX + cornerSize, cutY - 25);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cutX + cutW + 25 - cornerSize, cutY - 25);
  ctx.lineTo(cutX + cutW + 25, cutY - 25);
  ctx.lineTo(cutX + cutW + 25, cutY + cornerSize);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cutX - 25, cutY + cutH - cornerSize);
  ctx.lineTo(cutX - 25, cutY + cutH + 25);
  ctx.lineTo(cutX + cornerSize, cutY + cutH + 25);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cutX + cutW + 25 - cornerSize, cutY + cutH + 25);
  ctx.lineTo(cutX + cutW + 25, cutY + cutH + 25);
  ctx.lineTo(cutX + cutW + 25, cutY + cutH - cornerSize);
  ctx.stroke();

  ctx.fillStyle = '#06b6d4';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('REC [PORTRAIT_CAM] :: 60 FPS', cutX, 85);

  ctx.fillStyle = '#ec4899';
  ctx.textAlign = 'right';
  ctx.fillText('CYBER_BOOTH // 5:6', width - cutX, 85);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 30px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NEO TOKYO PHOTOBOOTH', width / 2, cutY + cutH + 75);

  return canvas.toDataURL('image/png');
}

function createY2kPortrait(): string {
  const width = 1000;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#fbcfe8');
  grad.addColorStop(0.3, '#c7d2fe');
  grad.addColorStop(0.7, '#a5f3fc');
  grad.addColorStop(1, '#fef08a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  const pad = 60;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(pad, pad, width - pad * 2, height - pad * 2, 28);
  ctx.fill();

  const cutX = 95;
  const cutY = 145;
  const cutW = width - cutX * 2;
  const cutH = 820;

  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.roundRect(cutX, cutY, cutW, cutH, 20);
  ctx.fill();

  ctx.strokeStyle = '#ec4899';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(cutX, cutY, cutW, cutH, 20);
  ctx.stroke();

  ctx.fillStyle = '#ec4899';
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✧ IDOL PHOTO BOOTH ✧', width / 2, 105);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('★ SUPERSTAR MOMENT ★', width / 2, cutY + cutH + 80);

  ctx.fillStyle = '#64748b';
  ctx.font = '20px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('PORTRAIT EDITION · 500 × 600', width / 2, cutY + cutH + 120);

  ctx.fillStyle = '#f43f5e';
  ctx.font = '36px sans-serif';
  ctx.fillText('💖', cutX + 35, cutY + 50);
  ctx.fillText('✨', cutX + cutW - 35, cutY + 50);
  ctx.fillText('🎀', cutX + 35, cutY + cutH - 35);
  ctx.fillText('🌸', cutX + cutW - 35, cutY + cutH - 35);

  return canvas.toDataURL('image/png');
}

function createFloralGoldPortrait(): string {
  const width = 1000;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 4;
  ctx.strokeRect(45, 45, width - 90, height - 90);

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, width - 120, height - 120);

  const cutX = 95;
  const cutY = 150;
  const cutW = width - cutX * 2;
  const cutH = 800;

  ctx.fillStyle = '#00FF00';
  ctx.fillRect(cutX, cutY, cutW, cutH);

  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 3;
  ctx.strokeRect(cutX, cutY, cutW, cutH);

  ctx.fillStyle = '#d4af37';
  ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('C E L E B R A T I O N', width / 2, 105);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TIMELESS MEMORIES · 500 × 600', width / 2, cutY + cutH + 75);

  return canvas.toDataURL('image/png');
}

function createRetroArcadePortrait(): string {
  const width = 1000;
  const height = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(50, 35, width - 100, 75);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 38px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ ARCADE BOOTH ★', width / 2, 86);

  const cutX = 75;
  const cutY = 145;
  const cutW = width - cutX * 2;
  const cutH = 800;

  ctx.fillStyle = '#00FF00';
  ctx.beginPath();
  ctx.roundRect(cutX, cutY, cutW, cutH, 20);
  ctx.fill();

  ctx.strokeStyle = '#312e81';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.roundRect(cutX, cutY, cutW, cutH, 20);
  ctx.stroke();

  // Bottom arcade controls strip
  ctx.fillStyle = '#111827';
  ctx.fillRect(50, cutY + cutH + 20, width - 100, 150);

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(cutX + 70, cutY + cutH + 95, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#eab308';
  ctx.beginPath();
  ctx.arc(cutX + 135, cutY + cutH + 95, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#06b6d4';
  ctx.beginPath();
  ctx.arc(cutX + 200, cutY + cutH + 95, 24, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 26px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('INSERT COIN 99', width - cutX - 40, cutY + cutH + 80);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '18px "JetBrains Mono", monospace';
  ctx.fillText('PLAYER 1 READY', width - cutX - 40, cutY + cutH + 115);

  return canvas.toDataURL('image/png');
}

/**
 * Cache preset frames per orientation
 */
const presetsCache: Record<PhotoOrientation, PresetFrame[] | null> = {
  landscape: null,
  portrait: null,
};

export function getPresetFrames(orientation: PhotoOrientation = 'portrait'): PresetFrame[] {
  if (presetsCache[orientation]) {
    return presetsCache[orientation]!;
  }

  if (orientation === 'landscape') {
    presetsCache.landscape = [
      {
        id: 'polaroid',
        name: 'Polaroid Classic',
        category: 'Vintage',
        orientation: 'landscape',
        width: 1200,
        height: 1000,
        description: 'Format Landscape (600 × 500 px) dengan nuansa foto polaroid klasik horizontal.',
        dataUrl: createPolaroidLandscape(),
      },
      {
        id: 'cyberpunk',
        name: 'Cyber Neon HUD',
        category: 'Sci-Fi',
        orientation: 'landscape',
        width: 1200,
        height: 1000,
        description: 'Format Landscape layar lebar futuristik dengan aksen neon cyan.',
        dataUrl: createCyberNeonLandscape(),
      },
      {
        id: 'y2k-idol',
        name: 'Y2K Idol Card',
        category: 'Pop & Y2K',
        orientation: 'landscape',
        width: 1200,
        height: 1000,
        description: 'Format Landscape pastel holographic bergaya idol card dengan stiker ceria.',
        dataUrl: createY2kLandscape(),
      },
      {
        id: 'floral-gold',
        name: 'Floral Gold Elegance',
        category: 'Celebration',
        orientation: 'landscape',
        width: 1200,
        height: 1000,
        description: 'Format Landscape berbingkai emas mewah untuk foto bersama / perayaan.',
        dataUrl: createFloralGoldLandscape(),
      },
      {
        id: 'arcade-90s',
        name: 'Retro Arcade 90s',
        category: 'Gaming',
        orientation: 'landscape',
        width: 1200,
        height: 1000,
        description: 'Format Landscape ala monitor dingdong mesin game arcade retro 90-an.',
        dataUrl: createRetroArcadeLandscape(),
      },
    ];
    return presetsCache.landscape;
  }

  // Portrait default
  presetsCache.portrait = [
    {
      id: 'polaroid',
      name: 'Polaroid Classic',
      category: 'Vintage',
      orientation: 'portrait',
      width: 1000,
      height: 1200,
      description: 'Format Portrait (500 × 600 px) dengan nuansa foto polaroid vertikal.',
      dataUrl: createPolaroidPortrait(),
    },
    {
      id: 'cyberpunk',
      name: 'Cyber Neon HUD',
      category: 'Sci-Fi',
      orientation: 'portrait',
      width: 1000,
      height: 1200,
      description: 'Format Portrait vertikal bernuansa gelap dengan aksen neon cyan.',
      dataUrl: createCyberNeonPortrait(),
    },
    {
      id: 'y2k-idol',
      name: 'Y2K Idol Card',
      category: 'Pop & Y2K',
      orientation: 'portrait',
      width: 1000,
      height: 1200,
      description: 'Format Portrait photocard idol dengan stiker bintang, hati, dan pastel cerah.',
      dataUrl: createY2kPortrait(),
    },
    {
      id: 'floral-gold',
      name: 'Floral Gold Elegance',
      category: 'Celebration',
      orientation: 'portrait',
      width: 1000,
      height: 1200,
      description: 'Format Portrait mewah aksen emas metalik untuk momen spesial.',
      dataUrl: createFloralGoldPortrait(),
    },
    {
      id: 'arcade-90s',
      name: 'Retro Arcade 90s',
      category: 'Gaming',
      orientation: 'portrait',
      width: 1000,
      height: 1200,
      description: 'Format Portrait monitor arcade vertikal bernuansa 90-an.',
      dataUrl: createRetroArcadePortrait(),
    },
  ];

  return presetsCache.portrait;
}
