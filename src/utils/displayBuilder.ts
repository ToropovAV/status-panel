import { MetricHint, DisplayDataItem, StatusLevel, RuleConfig } from '../types';
import { RuleItemType } from '../components/editor/RuleEditor.types';
import { resolveWorstStatus } from './statusResolver';
import { formatValue } from './processor';
import { compareValues } from './comparisonFunctions';

/**
 * Builds the list of display items from metric hints and RuleConfig.
 */
export function buildDisplayItems(
  hints: MetricHint[],
  config: RuleConfig
): DisplayDataItem[] {
  const rules = config.rules;

  if (!rules || rules.length === 0) {
    return [];
  }

  const result: DisplayDataItem[] = [];

  for (const rule of rules) {
    if (!rule.seriesMatch) {
      continue;
    }

    let regex: RegExp;
    try {
      regex = new RegExp(rule.seriesMatch);
    } catch {
      continue;
    }

    for (const hint of hints) {
      if (!regex.test(hint.label)) {
        continue;
      }

      if (
        (rule.displayMode === 'number' || rule.displayMode === 'string') &&
        rule.showOnlyOnThreshold &&
        resolveWorstStatus([hint], [rule]) === 'ok'
      ) {
        continue;
      }

      if (rule.displayMode === 'show' && rule.logicExpress) {
        const shouldShow = compareValues(hint.value, rule.logicExpressValue, rule.logicalMode);
        if (!shouldShow) {
          continue;
        }
      }

      const item = buildItem(hint, rule);
      if (item) {
        result.push(item);
      }
    }
  }

  return result;
}

function buildItem(hint: MetricHint, rule: RuleItemType): DisplayDataItem | null {
  const { showName, showValue } = rule;
  if (!showName && !showValue) {
    return null;
  }

  const displayName = showName ? (rule.alias || hint.label) : '';
  const displayValue = showValue ? formatDisplayValue(hint.value, rule) : '';

  let text: string;
  if (showName && showValue) {
    text = displayName ? `${displayName}: ${displayValue}` : displayValue;
  } else if (showName) {
    text = displayName;
  } else {
    text = displayValue;
  }

  const status: StatusLevel = resolveWorstStatus([hint], [rule]);

  return {
    text,
    url: rule.metricURL || undefined,
    tooltip: rule.description || undefined,
    status,
  };
}

function formatDisplayValue(value: number | string | null, rule: RuleItemType): string {
  if (value === null) {
    return 'N/A';
  }
  if (typeof value === 'number') {
    return formatValue(value, rule.unit, rule.decimalPlaces ?? 2);
  }
  return String(value);
}
