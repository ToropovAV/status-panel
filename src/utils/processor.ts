import {
  DataFrame,
  Field,
  FieldType,
  getFieldDisplayName,
  getValueFormat,
  formattedValueToString,
  reduceField,
  ReducerID,
} from '@grafana/data';
import { MetricHint } from '../types';

/**
 * Converts an array of DataFrames into a flat list of MetricHints.
 * Each numeric or string field in each frame becomes one MetricHint.
 * Uses the `last` reducer to get the current value.
 */
export function dataFramesToMetricHints(frames: DataFrame[]): MetricHint[] {
  const hints: MetricHint[] = [];
  const seen = new Set<string>();

  for (const frame of frames) {
    for (const field of frame.fields) {
      if (field.type !== FieldType.number && field.type !== FieldType.string) {
        continue;
      }

      const label = getFieldDisplayName(field, frame);

      // Warn about duplicates (same label from multiple frames)
      if (seen.has(label)) {
        console.warn(`[StatusPanel] Duplicate metric label detected: "${label}"`);
      }
      seen.add(label);

      const value = getLastValue(field);
      hints.push({ label, value });
    }
  }

  return hints;
}

/**
 * Gets the last non-null value from a field, falling back to the raw last value.
 */
function getLastValue(field: Field): number | string | null {
  const calcs = reduceField({ field, reducers: [ReducerID.lastNotNull, ReducerID.last] });
  const value = calcs[ReducerID.lastNotNull] ?? calcs[ReducerID.last] ?? null;
  return value as number | string | null;
}

/**
 * Formats a numeric value using Grafana's built-in unit formatter.
 */
export function formatValue(value: number, unit: string, decimals: number): string {
  if (!unit) {
    return value.toFixed(decimals);
  }
  const formatter = getValueFormat(unit);
  const result = formatter(value, decimals);
  return formattedValueToString(result);
}
