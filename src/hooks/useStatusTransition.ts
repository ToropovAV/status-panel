import { useEffect, useRef, useState } from 'react';
import { StatusLevel } from '../types';

interface UseStatusTransitionResult {
  isBlinking: boolean;
  lastChangedAt: Date | null;
}

/**
 * Detects status transitions and triggers a blink for `durationSec` seconds.
 * Uses useRef to track previous state without causing extra renders.
 * Also tracks the timestamp of the last status change.
 */
export function useStatusTransition(
  status: StatusLevel,
  blinkEnabled: boolean,
  durationSec: number
): UseStatusTransitionResult {
  const prevStatusRef = useRef<StatusLevel | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [lastChangedAt, setLastChangedAt] = useState<Date | null>(null);

  useEffect(() => {
    const prev = prevStatusRef.current;

    // On first render — just record the initial state, don't blink
    if (prev === null) {
      prevStatusRef.current = status;
      return;
    }

    // Status changed — trigger blink and record timestamp
    if (status !== prev) {
      prevStatusRef.current = status;
      setLastChangedAt(new Date());

      if (blinkEnabled) {
        // Clear any existing timer
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        setIsBlinking(true);

        timerRef.current = setTimeout(() => {
          setIsBlinking(false);
          timerRef.current = null;
        }, durationSec * 1000);
      }
    } else {
      prevStatusRef.current = status;
    }
  }, [status, blinkEnabled, durationSec]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { isBlinking, lastChangedAt };
}
