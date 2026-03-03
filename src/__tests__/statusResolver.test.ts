import { resolveWorstStatus } from '../utils/statusResolver';
import { RuleItemType, DEFAULT_RULE } from '../components/editor/RuleEditor.types';
import { MetricHint } from '../types';

const makeRule = (overrides: Partial<RuleItemType>): RuleItemType => ({
  ...DEFAULT_RULE,
  id: 'test-id',
  order: 0,
  name: 'Test Rule',
  ...overrides,
});

const hint = (label: string, value: number | string | null): MetricHint => ({ label, value });

describe('resolveWorstStatus', () => {
  it('returns ok when no rules', () => {
    expect(resolveWorstStatus([hint('cpu', 99)], [])).toBe('ok');
  });

  it('returns ok when no thresholds are breached', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      displayMode: 'number',
      numberThreshold: { information: '80', warning: '', average: '', high: '', disaster: '' },
    });
    expect(resolveWorstStatus([hint('cpu', 50)], [rule])).toBe('ok');
  });

  it('returns information when value meets information threshold', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      displayMode: 'number',
      numberThreshold: { information: '80', warning: '', average: '', high: '', disaster: '' },
    });
    expect(resolveWorstStatus([hint('cpu', 80)], [rule])).toBe('information');
  });

  it('escalates to the highest breached threshold', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      displayMode: 'number',
      numberThreshold: { information: '50', warning: '70', average: '80', high: '90', disaster: '95' },
    });
    expect(resolveWorstStatus([hint('cpu', 92)], [rule])).toBe('high');
  });

  it('returns disaster when disaster threshold breached', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      displayMode: 'number',
      numberThreshold: { information: '50', warning: '70', average: '80', high: '90', disaster: '95' },
    });
    expect(resolveWorstStatus([hint('cpu', 96)], [rule])).toBe('disaster');
  });

  it('respects reverse logic (≤ triggers)', () => {
    const rule = makeRule({
      seriesMatch: 'uptime',
      displayMode: 'number',
      reverseLogic: true,
      numberThreshold: { information: '', warning: '60', average: '', high: '', disaster: '' },
    });
    expect(resolveWorstStatus([hint('uptime', 55)], [rule])).toBe('warning');
    expect(resolveWorstStatus([hint('uptime', 61)], [rule])).toBe('ok');
  });

  it('handles string thresholds', () => {
    const rule = makeRule({
      seriesMatch: 'status',
      displayMode: 'string',
      stringThreshold: { information: '', warning: 'degraded', average: '', high: '', disaster: 'down' },
    });
    expect(resolveWorstStatus([hint('status', 'degraded')], [rule])).toBe('warning');
    expect(resolveWorstStatus([hint('status', 'down')], [rule])).toBe('disaster');
    expect(resolveWorstStatus([hint('status', 'up')], [rule])).toBe('ok');
  });

  it('uses worst across multiple hints and rules', () => {
    const ruleA = makeRule({
      id: 'a',
      seriesMatch: 'cpu',
      displayMode: 'number',
      numberThreshold: { information: '50', warning: '', average: '', high: '', disaster: '' },
    });
    const ruleB = makeRule({
      id: 'b',
      seriesMatch: 'mem',
      displayMode: 'number',
      numberThreshold: { information: '', warning: '', average: '', high: '90', disaster: '' },
    });
    const hints = [hint('cpu', 60), hint('mem', 95)];
    expect(resolveWorstStatus(hints, [ruleA, ruleB])).toBe('high');
  });

  it('matches metric using regex', () => {
    const rule = makeRule({
      seriesMatch: '^cpu_.*',
      displayMode: 'number',
      numberThreshold: { information: '', warning: '80', average: '', high: '', disaster: '' },
    });
    expect(resolveWorstStatus([hint('cpu_core0', 85)], [rule])).toBe('warning');
    expect(resolveWorstStatus([hint('mem_used', 85)], [rule])).toBe('ok');
  });

  it('handles invalid regex gracefully', () => {
    const rule = makeRule({
      seriesMatch: '[invalid',
      displayMode: 'number',
      numberThreshold: { information: '', warning: '10', average: '', high: '', disaster: '' },
    });
    expect(() => resolveWorstStatus([hint('cpu', 99)], [rule])).not.toThrow();
    expect(resolveWorstStatus([hint('cpu', 99)], [rule])).toBe('ok');
  });

  it('returns ok when hint value is null', () => {
    const rule = makeRule({
      seriesMatch: 'cpu',
      displayMode: 'number',
      numberThreshold: { information: '10', warning: '', average: '', high: '', disaster: '' },
    });
    expect(resolveWorstStatus([hint('cpu', null)], [rule])).toBe('ok');
  });
});
