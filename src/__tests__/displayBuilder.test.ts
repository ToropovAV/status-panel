import { buildDisplayItems } from '../utils/displayBuilder';
import { RuleItemType, DEFAULT_RULE } from '../components/editor/RuleEditor.types';
import { MetricHint, RuleConfig } from '../types';

const makeRule = (overrides: Partial<RuleItemType>): RuleItemType => ({
  ...DEFAULT_RULE,
  id: 'test-id',
  order: 0,
  name: 'Test Rule',
  ...overrides,
});

const hint = (label: string, value: number | string | null): MetricHint => ({ label, value });

/** Wraps an array of rules into a RuleConfig. */
const toConfig = (rules: RuleItemType[]): RuleConfig => ({ rules });

describe('buildDisplayItems', () => {
  it('returns empty array when no rules', () => {
    expect(buildDisplayItems([hint('cpu', 50)], toConfig([]))).toEqual([]);
  });

  it('shows name and value by default', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      displayMode: 'number',
      showName: true,
      showValue: true,
      unit: '',
      decimalPlaces: 0,
    });
    const items = buildDisplayItems([hint('cpu', 75)], toConfig([rule]));
    expect(items).toHaveLength(1);
    expect(items[0].text).toContain('cpu');
    expect(items[0].text).toContain('75');
  });

  it('uses alias instead of metric name when set', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      alias: 'CPU Usage',
      showName: true,
      showValue: false,
      displayMode: 'number',
    });
    const items = buildDisplayItems([hint('cpu', 75)], toConfig([rule]));
    expect(items[0].text).toBe('CPU Usage');
  });

  it('shows only value when showName=false', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      showName: false,
      showValue: true,
      displayMode: 'number',
      unit: '',
      decimalPlaces: 0,
    });
    const items = buildDisplayItems([hint('cpu', 42)], toConfig([rule]));
    expect(items[0].text).toBe('42');
  });

  it('returns nothing when both showName and showValue are false', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      showName: false,
      showValue: false,
      displayMode: 'number',
    });
    const items = buildDisplayItems([hint('cpu', 42)], toConfig([rule]));
    expect(items).toHaveLength(0);
  });

  it('respects showOnlyOnThreshold — hides when ok', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      displayMode: 'number',
      showOnlyOnThreshold: true,
      numberThreshold: { information: '80', warning: '', average: '', high: '', disaster: '' },
      showName: true,
      showValue: true,
    });
    // value < threshold → ok → should not display
    expect(buildDisplayItems([hint('cpu', 50)], toConfig([rule]))).toHaveLength(0);
    // value >= threshold → information → should display
    expect(buildDisplayItems([hint('cpu', 85)], toConfig([rule]))).toHaveLength(1);
  });

  it('includes tooltip from description', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      description: 'CPU load on main server',
      showName: true,
      showValue: false,
      displayMode: 'number',
    });
    const items = buildDisplayItems([hint('cpu', 50)], toConfig([rule]));
    expect(items[0].tooltip).toBe('CPU load on main server');
  });

  it('includes URL from metricURL', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      metricURL: 'https://example.com',
      showName: true,
      showValue: false,
      displayMode: 'number',
    });
    const items = buildDisplayItems([hint('cpu', 50)], toConfig([rule]));
    expect(items[0].url).toBe('https://example.com');
  });

  it('filters by show mode with logical expression', () => {
    const rule = makeRule({
      seriesMatch: 'flag',
      displayMode: 'show',
      logicExpress: true,
      logicalMode: 'eq',
      logicExpressValue: '1',
      showName: true,
      showValue: false,
    });
    expect(buildDisplayItems([hint('flag', '1')], toConfig([rule]))).toHaveLength(1);
    expect(buildDisplayItems([hint('flag', '0')], toConfig([rule]))).toHaveLength(0);
  });
});
