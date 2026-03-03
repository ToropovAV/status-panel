// Стало:
import { MetricHint, StatusLevel } from '../types';
import { STATUS_SEVERITY_ORDER } from '../constants';
import { RuleItemType, NumberThreshold, StringThreshold } from '../components/editor/RuleEditor.types';

/**
 * Finds the worst (most severe) status across all metric hints and rules.
 * Returns 'ok' if no threshold is breached.
 */
export function resolveWorstStatus(
  hints: MetricHint[],
  rules: RuleItemType[]
): StatusLevel {
  if (!rules || rules.length === 0) {
    return 'ok';
  }

  let worstIndex = -1;

  for (const rule of rules) {
    if (!rule.seriesMatch) {
      continue;
    }

    // Cache compiled regex per rule to avoid recompiling on every hint
    let regex: RegExp;
    try {
      regex = new RegExp(rule.seriesMatch);
    } catch {
      console.warn(`[StatusPanel] Invalid regex in rule "${rule.name}": ${rule.seriesMatch}`);
      continue;
    }

    for (const hint of hints) {
      if (!regex.test(hint.label)) {
        continue;
      }

      const statusIndex = getStatusIndex(hint.value, rule);
      if (statusIndex > worstIndex) {
        worstIndex = statusIndex;
      }

      // Short-circuit: can't get worse than disaster
      if (worstIndex === STATUS_SEVERITY_ORDER.length - 1) {
        return 'disaster';
      }
    }
  }

  return worstIndex >= 0 ? STATUS_SEVERITY_ORDER[worstIndex] : 'ok';
}

/**
 * Returns the severity index for a given value + rule combination.
 * Returns -1 if no threshold is breached.
 */
function getStatusIndex(value: number | string | null, rule: RuleItemType): number {
  if (value === null) {
    return -1;
  }

  if (rule.displayMode === 'number' && typeof value === 'number') {
    return resolveNumberThreshold(value, rule.numberThreshold, rule.reverseLogic);
  }

  if (rule.displayMode === 'string') {
    return resolveStringThreshold(String(value), rule.stringThreshold);
  }

  return -1;
}

function resolveNumberThreshold(
  value: number,
  thresholds: NumberThreshold,
  reverse: boolean
): number {
  let worstIndex = -1;

  const levels = STATUS_SEVERITY_ORDER;
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const rawThreshold = thresholds[level as keyof NumberThreshold];

    if (rawThreshold === '' || rawThreshold === null || rawThreshold === undefined) {
      continue;
    }

    const threshold = parseFloat(rawThreshold);
    if (isNaN(threshold)) {
      continue;
    }

    const breached = reverse ? value <= threshold : value >= threshold;
    if (breached && i > worstIndex) {
      worstIndex = i;
    }
  }

  return worstIndex;
}

function resolveStringThreshold(
  value: string,
  thresholds: StringThreshold
): number {
  const levels = STATUS_SEVERITY_ORDER;
  for (let i = levels.length - 1; i >= 0; i--) {
    const level = levels[i];
    const thresholdValue = thresholds[level as keyof StringThreshold];
    if (thresholdValue && value === thresholdValue) {
      return i;
    }
  }
  return -1;
}
