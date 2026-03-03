import { SelectableValue } from '@grafana/data';

export type DisplayMode = 'number' | 'string' | 'show';
export type LogicalMode = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte';

export const DISPLAY_MODES: SelectableValue[] = [
  { value: 'number', label: 'Number threshold' },
  { value: 'string', label: 'String threshold' },
  { value: 'show',   label: 'Show only' },
];

export const LOGICAL_MODES: SelectableValue[] = [
  { value: 'eq',  label: '= Equal' },
  { value: 'ne',  label: '≠ Not equal' },
  { value: 'gt',  label: '> Greater than' },
  { value: 'gte', label: '≥ Greater than or equal' },
  { value: 'lt',  label: '< Less than' },
  { value: 'lte', label: '≤ Less than or equal' },
];

export interface NumberThreshold {
  information: string;
  warning: string;
  average: string;
  high: string;
  disaster: string;
}

export interface StringThreshold {
  information: string;
  warning: string;
  average: string;
  high: string;
  disaster: string;
}

export interface RuleItemType {
  id: string;
  name: string;
  order: number;

  // Metric matching
  seriesMatch: string;
  alias: string;
  description: string;
  metricURL: string;

  // Display
  displayMode: DisplayMode;
  showName: boolean;
  showValue: boolean;
  showRule: boolean;
  showOnlyOnThreshold: boolean;
  reverseLogic: boolean;

  // Formatting
  unit: string;
  decimalPlaces: number;

  // Thresholds
  numberThreshold: NumberThreshold;
  stringThreshold: StringThreshold;

  // Show mode logic
  logicExpress: boolean;
  logicalMode: LogicalMode;
  logicExpressValue: string;
}

export interface RuleItemTracker {
  rule: RuleItemType;
  id: string;
}

export const DEFAULT_RULE: Omit<RuleItemType, 'id' | 'order'> = {
  name: '',
  seriesMatch: '',
  alias: '',
  description: '',
  metricURL: '',
  displayMode: 'number',
  showName: true,
  showValue: true,
  showRule: true,
  showOnlyOnThreshold: false,
  reverseLogic: false,
  unit: '',
  decimalPlaces: 2,
  numberThreshold: {
    information: '',
    warning: '',
    average: '',
    high: '',
    disaster: '',
  },
  stringThreshold: {
    information: '',
    warning: '',
    average: '',
    high: '',
    disaster: '',
  },
  logicExpress: false,
  logicalMode: 'eq',
  logicExpressValue: '',
};
