/**
 * Client-side Web Audio API sound synthesizer
 * Zero external audio files required, 100% reliable in any browser.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Play a short countdown beep (high pitched beep for 3, 2, 1)
 */
export function playBeep(freq = 880, duration = 0.09) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio failures if browser blocks autoplay
  }
}

/**
 * Play authentic camera shutter click sound
 */
export function playShutterSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // First click sound
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(320, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);

    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.05);

    // Second shutter click after 60ms
    setTimeout(() => {
      try {
        if (!ctx) return;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(540, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.08);

        gain2.gain.setValueAtTime(0.25, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start();
        osc2.stop(ctx.currentTime + 0.08);
      } catch {
        // ignore
      }
    }, 60);
  } catch {
    // Ignore audio failures
  }
}
