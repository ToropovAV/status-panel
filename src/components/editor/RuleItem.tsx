import React, { useEffect, useMemo, useState } from 'react';
import {
  Cascader,
  CascaderOption,
  Card,
  Field,
  FieldSet,
  IconButton,
  Input,
  Select,
  Switch,
  TextArea,
  UnitPicker,
} from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { css } from '@emotion/css';

import { DISPLAY_MODES, LOGICAL_MODES, RuleItemType } from './RuleEditor.types';
import { dataFramesToMetricHints } from '../../utils/processor';

interface Props {
  rule: RuleItemType;
  onUpdate: (rule: RuleItemType) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any;
}

/**
 * Validates a regex string. Returns error message or empty string if valid.
 */
function validateRegex(pattern: string): string {
  if (!pattern) {
    return '';
  }
  try {
    new RegExp(pattern);
    return '';
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Invalid regular expression';
    // Strip the redundant "Invalid regular expression: " prefix that some browsers add
    return message.replace(/^Invalid regular expression:\s*/i, '');
  }
}

export const RuleItem: React.FC<Props> = ({
  rule,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  context,
}) => {
  const [metricHints, setMetricHints] = useState<CascaderOption[]>([]);

  // Build metric hints from panel data
  useEffect(() => {
    if (!context?.data) {
      return;
    }
    const hints = dataFramesToMetricHints(context.data);
    const uniqueLabels = Array.from(new Set(hints.map((h) => h.label)));
    setMetricHints(uniqueLabels.map((label) => ({ label, value: label })));
  }, [context?.data]);

  const set = (patch: Partial<RuleItemType>) => onUpdate({ ...rule, ...patch });

  // Regex validation — recomputed only when seriesMatch changes
  const regexError = useMemo(() => validateRegex(rule.seriesMatch), [rule.seriesMatch]);

  const cardStyles = css`
    margin-bottom: 8px;
  `;

  return (
    <div className={cardStyles}>
      <Card heading="">
        <Card.Meta>
          <FieldSet>
            {/* Rule Name */}
            <Field label="Rule Name" disabled={!rule.showRule}>
              <Input
                value={rule.name}
                placeholder="e.g. CPU Usage"
                disabled={!rule.showRule}
                onChange={(e) => set({ name: e.currentTarget.value })}
              />
            </Field>

            {/* Metric match */}
            <Field
              label="Metric"
              disabled={!rule.showRule}
              invalid={!!regexError}
              error={regexError || undefined}
            >
              <Cascader
                key={`cascader-${rule.id}`}
                initialValue={rule.seriesMatch}
                allowCustomValue
                placeholder="Choose a metric or enter a regular expression"
                options={metricHints}
                onSelect={(val: string) => set({ seriesMatch: val })}
              />
            </Field>

            {/* Alias */}
            <Field label="Alias" description="Displayed instead of metric name if set">
              <Input
                value={rule.alias}
                placeholder="e.g. CPU"
                disabled={!rule.showRule}
                onChange={(e) => set({ alias: e.currentTarget.value })}
              />
            </Field>

            {/* Description / Tooltip */}
            <Field label="Description" description="Shown in tooltip on hover">
              <TextArea
                value={rule.description}
                placeholder=""
                style={{ resize: 'vertical' }}
                disabled={!rule.showRule}
                onChange={(e) => set({ description: e.currentTarget.value })}
              />
            </Field>

            {/* Metric URL */}
            <Field label="Metric URL" description="Clicking the metric name opens this URL">
              <Input
                value={rule.metricURL}
                placeholder="https://..."
                disabled={!rule.showRule}
                onChange={(e) => set({ metricURL: e.currentTarget.value })}
              />
            </Field>

            {/* Show name / value toggles */}
            <Field label="Show metric name" disabled={!rule.showRule}>
              <Switch
                value={rule.showName}
                disabled={!rule.showRule}
                onChange={() => set({ showName: !rule.showName })}
              />
            </Field>
            <Field label="Show metric value" disabled={!rule.showRule}>
              <Switch
                value={rule.showValue}
                disabled={!rule.showRule}
                onChange={() => set({ showValue: !rule.showValue })}
              />
            </Field>

            {/* Display mode */}
            <Field label="Display Mode" disabled={!rule.showRule}>
              <Select
                menuShouldPortal
                value={DISPLAY_MODES.find((m) => m.value === rule.displayMode)}
                onChange={(v: SelectableValue) => set({ displayMode: v.value })}
                options={DISPLAY_MODES}
              />
            </Field>

            {/* ── Number threshold ── */}
            {rule.displayMode === 'number' && (
              <>
                <Field label="Unit" disabled={!rule.showRule}>
                  <UnitPicker
                    value={rule.unit}
                    onChange={(u) => set({ unit: u ?? '' })}
                  />
                </Field>

                <Field label="Decimal places" disabled={!rule.showRule}>
                  <Input
                    type="number"
                    value={rule.decimalPlaces}
                    min={0}
                    max={10}
                    disabled={!rule.showRule}
                    onChange={(e) =>
                      set({ decimalPlaces: parseInt(e.currentTarget.value, 10) || 0 })
                    }
                  />
                </Field>

                <Field label="Show only on threshold" disabled={!rule.showRule}>
                  <Switch
                    value={rule.showOnlyOnThreshold}
                    disabled={!rule.showRule}
                    onChange={() => set({ showOnlyOnThreshold: !rule.showOnlyOnThreshold })}
                  />
                </Field>

                <Field
                  label="Reverse logic"
                  description="Trigger threshold when value is ≤ threshold instead of ≥"
                  disabled={!rule.showRule}
                >
                  <Switch
                    value={rule.reverseLogic}
                    disabled={!rule.showRule}
                    onChange={() => set({ reverseLogic: !rule.reverseLogic })}
                  />
                </Field>

                {(['information', 'warning', 'average', 'high', 'disaster'] as const).map(
                  (level) => (
                    <Field
                      key={level}
                      label={`${level.charAt(0).toUpperCase() + level.slice(1)} threshold`}
                      disabled={!rule.showRule}
                    >
                      <Input
                        value={rule.numberThreshold[level] ?? ''}
                        placeholder="—"
                        type="number"
                        disabled={!rule.showRule}
                        onChange={(e) =>
                          set({
                            numberThreshold: {
                              ...rule.numberThreshold,
                              [level]: e.currentTarget.value,
                            },
                          })
                        }
                      />
                    </Field>
                  )
                )}
              </>
            )}

            {/* ── String threshold ── */}
            {rule.displayMode === 'string' && (
              <>
                <Field label="Show only on threshold" disabled={!rule.showRule}>
                  <Switch
                    value={rule.showOnlyOnThreshold}
                    disabled={!rule.showRule}
                    onChange={() => set({ showOnlyOnThreshold: !rule.showOnlyOnThreshold })}
                  />
                </Field>

                {(['information', 'warning', 'average', 'high', 'disaster'] as const).map(
                  (level) => (
                    <Field
                      key={level}
                      label={`${level.charAt(0).toUpperCase() + level.slice(1)} value`}
                      disabled={!rule.showRule}
                    >
                      <Input
                        value={rule.stringThreshold[level] ?? ''}
                        placeholder="—"
                        disabled={!rule.showRule}
                        onChange={(e) =>
                          set({
                            stringThreshold: {
                              ...rule.stringThreshold,
                              [level]: e.currentTarget.value,
                            },
                          })
                        }
                      />
                    </Field>
                  )
                )}
              </>
            )}

            {/* ── Show mode ── */}
            {rule.displayMode === 'show' && (
              <>
                <Field label="Use logical expression" disabled={!rule.showRule}>
                  <Switch
                    value={rule.logicExpress}
                    disabled={!rule.showRule}
                    onChange={() => set({ logicExpress: !rule.logicExpress })}
                  />
                </Field>

                {rule.logicExpress && (
                  <>
                    <Field label="Operator" disabled={!rule.showRule}>
                      <Select
                        menuShouldPortal
                        value={LOGICAL_MODES.find((m) => m.value === rule.logicalMode)}
                        onChange={(v: SelectableValue) => set({ logicalMode: v.value })}
                        options={LOGICAL_MODES}
                      />
                    </Field>
                    <Field label="Value" disabled={!rule.showRule}>
                      <Input
                        value={rule.logicExpressValue}
                        placeholder="e.g. 100"
                        disabled={!rule.showRule}
                        onChange={(e) => set({ logicExpressValue: e.currentTarget.value })}
                      />
                    </Field>
                  </>
                )}
              </>
            )}
          </FieldSet>
        </Card.Meta>

        <Card.Actions>
          <IconButton name="arrow-up"   tooltip="Move up"   onClick={onMoveUp} />
          <IconButton name="arrow-down" tooltip="Move down" onClick={onMoveDown} />
          <IconButton
            name={rule.showRule ? 'eye' : 'eye-slash'}
            tooltip="Show/Hide rule fields"
            onClick={() => set({ showRule: !rule.showRule })}
          />
          <IconButton name="copy"      tooltip="Duplicate"    onClick={onDuplicate} />
          <IconButton name="trash-alt" tooltip="Delete rule"  variant="destructive" onClick={onRemove} />
        </Card.Actions>
      </Card>
    </div>
  );
};
