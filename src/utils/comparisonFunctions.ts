import { LogicalMode } from '../components/editor/RuleEditor.types';

type Comparable = number | string | null;

const OPERATORS: Record<LogicalMode, (a: Comparable, b: Comparable) => boolean> = {
  eq:  (a, b) => a === b,
  ne:  (a, b) => a !== b,
  gt:  (a, b) => Number(a) > Number(b),
  gte: (a, b) => Number(a) >= Number(b),
  lt:  (a, b) => Number(a) < Number(b),
  lte: (a, b) => Number(a) <= Number(b),
};

export function compareValues(
  value: Comparable,
  threshold: Comparable,
  operator: LogicalMode
): boolean {
  const op = OPERATORS[operator];
  return op ? op(value, threshold) : false;
}
