import { getColorForStatus } from '../utils/colorResolver';
import { StatusPanelOptions } from '../types';
import { DEFAULT_COLORS } from '../constants';

const mockOptions: Partial<StatusPanelOptions> = {
  colorOK:          DEFAULT_COLORS.ok,
  colorInformation: DEFAULT_COLORS.information,
  colorWarning:     DEFAULT_COLORS.warning,
  colorAverage:     DEFAULT_COLORS.average,
  colorHigh:        DEFAULT_COLORS.high,
  colorDisaster:    DEFAULT_COLORS.disaster,
  colorDisable:     DEFAULT_COLORS.disable,
  colorNa:          DEFAULT_COLORS.na,
};

describe('getColorForStatus', () => {
  const opts = mockOptions as StatusPanelOptions;

  it.each([
    ['ok',          DEFAULT_COLORS.ok],
    ['information', DEFAULT_COLORS.information],
    ['warning',     DEFAULT_COLORS.warning],
    ['average',     DEFAULT_COLORS.average],
    ['high',        DEFAULT_COLORS.high],
    ['disaster',    DEFAULT_COLORS.disaster],
    ['disable',     DEFAULT_COLORS.disable],
    ['na',          DEFAULT_COLORS.na],
  ] as const)('returns correct color for "%s"', (status, expected) => {
    expect(getColorForStatus(status, opts)).toBe(expected);
  });

  it('returns transparent for unknown status', () => {
    expect(getColorForStatus('unknown' as any, opts)).toBe('transparent');
  });
});
