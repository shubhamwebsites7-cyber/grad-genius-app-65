// Plays a short ringtone and triggers device vibration.
// Safe on browsers without WebAudio or Vibration API.

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(freq: number, startOffset: number, duration: number) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.35, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function vibrate(pattern: number | number[]) {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {}
}

/** Cheerful ascending chime + vibration buzz when focus completes. */
export function playFocusCompleteAlert() {
  // Ascending arpeggio C5 -> E5 -> G5
  playTone(523.25, 0, 0.25);
  playTone(659.25, 0.22, 0.25);
  playTone(783.99, 0.44, 0.45);
  vibrate([300, 120, 300, 120, 500]);
}

/** Mellow descending chime + short vibration when break completes. */
export function playBreakCompleteAlert() {
  // Descending G5 -> E5 -> C5
  playTone(783.99, 0, 0.22);
  playTone(659.25, 0.2, 0.22);
  playTone(523.25, 0.4, 0.4);
  vibrate([200, 100, 200]);
}