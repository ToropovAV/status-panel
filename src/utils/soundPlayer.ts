import { StatusLevel, StatusSoundConfig } from '../types';
import { SOUNDS, STATUS_SEVERITY_ORDER } from '../constants';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioContext || audioContext.state === 'closed') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioContext = new AudioContextClass();
    }
    return audioContext;
  } catch {
    console.warn('[StatusPanel] Web Audio API not available');
    return null;
  }
}

async function ensureAudioContextReady(): Promise<AudioContext | null> {
  const ctx = getAudioContext();
  if (!ctx) { return null; }
  if (ctx.state === 'suspended') {
    try {
      await ctx.resume();
    } catch {
      return null;
    }
  }
  return ctx;
}

/**
 * Plays a built-in Web Audio tone for the given status level.
 */
async function playBuiltinSound(level: StatusLevel, volume: number): Promise<void> {
  const ctx = await ensureAudioContextReady();
  if (!ctx) { return; }

  const sound = SOUNDS.find((s) => s.level === level);
  if (sound) {
    sound.play(ctx, volume);
  }
}

/**
 * Plays audio from a user-provided URL using an HTMLAudioElement.
 * Volume is normalised from 0–100 to 0.0–1.0.
 */
async function playCustomSound(url: string, volume: number): Promise<void> {
  if (!url) { return; }
  try {
    const audio = new Audio(url);
    audio.volume = Math.min(1, Math.max(0, volume / 100));
    await audio.play();
  } catch (e) {
    console.warn('[StatusPanel] Failed to play custom sound:', e);
  }
}

/**
 * Plays the sound for the given status level according to its StatusSoundConfig.
 *
 * @param level  - The status level that was just entered.
 * @param volume - Master volume 0–100.
 * @param config - Per-status sound configuration. If omitted, plays builtin.
 */
export async function playStatusSound(
  level: StatusLevel,
  volume: number,
  config?: StatusSoundConfig
): Promise<void> {
  // Only alert statuses produce sounds
  if (!(STATUS_SEVERITY_ORDER as readonly string[]).includes(level)) {
    return;
  }

  const mode = config?.mode ?? 'builtin';

  if (mode === 'off') {
    return;
  }

  if (mode === 'custom') {
    await playCustomSound(config?.customUrl ?? '', volume);
    return;
  }

  // mode === 'builtin'
  await playBuiltinSound(level, volume);
}
