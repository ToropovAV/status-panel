import { compareValues } from '../utils/comparisonFunctions';

describe('compareValues', () => {
  describe('eq (equal)', () => {
    it('returns true for equal values', () => {
      expect(compareValues(5, 5, 'eq')).toBe(true);
      expect(compareValues('ok', 'ok', 'eq')).toBe(true);
    });
    it('returns false for unequal values', () => {
      expect(compareValues(5, 6, 'eq')).toBe(false);
    });
  });

  describe('ne (not equal)', () => {
    it('returns true when not equal', () => {
      expect(compareValues(5, 6, 'ne')).toBe(true);
    });
    it('returns false when equal', () => {
      expect(compareValues(5, 5, 'ne')).toBe(false);
    });
  });

  describe('gt (greater than)', () => {
    it('returns true when a > b', () => {
      expect(compareValues(10, 5, 'gt')).toBe(true);
    });
    it('returns false when a === b', () => {
      expect(compareValues(5, 5, 'gt')).toBe(false);
    });
    it('returns false when a < b', () => {
      expect(compareValues(3, 5, 'gt')).toBe(false);
    });
  });

  describe('gte (greater than or equal)', () => {
    it('returns true when a > b', () => {
      expect(compareValues(10, 5, 'gte')).toBe(true);
    });
    it('returns true when a === b', () => {
      expect(compareValues(5, 5, 'gte')).toBe(true);
    });
    it('returns false when a < b', () => {
      expect(compareValues(3, 5, 'gte')).toBe(false);
    });
  });

  describe('lt (less than)', () => {
    it('returns true when a < b', () => {
      expect(compareValues(3, 5, 'lt')).toBe(true);
    });
    it('returns false when equal', () => {
      expect(compareValues(5, 5, 'lt')).toBe(false);
    });
  });

  describe('lte (less than or equal)', () => {
    it('returns true when a < b', () => {
      expect(compareValues(3, 5, 'lte')).toBe(true);
    });
    it('returns true when a === b', () => {
      expect(compareValues(5, 5, 'lte')).toBe(true);
    });
    it('returns false when a > b', () => {
      expect(compareValues(7, 5, 'lte')).toBe(false);
    });
  });

  it('returns false for unknown operator', () => {
    expect(compareValues(5, 5, 'unknown' as any)).toBe(false);
  });
});
