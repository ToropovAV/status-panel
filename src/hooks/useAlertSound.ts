import { useEffect, useRef } from 'react';
import { StatusLevel, SoundConfig } from '../types';
import { DEFAULT_SOUND_CONFIG } from '../constants';
import { playStatusSound } from '../utils/soundPlayer';

/**
 * Plays a sound when the status changes.
 * Only triggers on actual transitions (not on mount).
 * Respects per-status SoundConfig — each status can be off / builtin / custom.
 */
export function useAlertSound(
  status: StatusLevel,
  soundEnabled: boolean,
  volume: number,
  soundConfig: SoundConfig
): void {
  const prevStatusRef = useRef<StatusLevel | null>(null);

  useEffect(() => {
    const prev = prevStatusRef.current;

    if (prev === null) {
      prevStatusRef.current = status;
      return;
    }

    if (status !== prev) {
      prevStatusRef.current = status;

      if (soundEnabled) {
        // Resolve config for the new status level (only alert levels have config entries)
        const levelConfig = (soundConfig ?? DEFAULT_SOUND_CONFIG)[
          status as keyof SoundConfig
        ];
        playStatusSound(status, volume, levelConfig).catch(() => {});
      }
    } else {
      prevStatusRef.current = status;
    }
  }, [status, soundEnabled, volume, soundConfig]);
}
