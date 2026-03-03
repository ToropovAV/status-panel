import React, { useState, useMemo, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { Button, Collapse, Icon, Input } from '@grafana/ui';
import { StandardEditorProps } from '@grafana/data';
import { v4 as uuidv4 } from 'uuid';
import { css } from '@emotion/css';

import { RuleItem } from './RuleItem';
import { DEFAULT_RULE, RuleItemType } from './RuleEditor.types';
import { RuleConfig } from '../../types';

// ── Sortable wrapper with drag handle ──────────────────────────────────────────

interface SortableRuleWrapperProps {
  id: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const dragHandleStyles = css`
  cursor: grab;
  display: flex;
  align-items: center;
  padding: 4px 6px;
  color: var(--text-secondary);
  font-size: 16px;
  user-select: none;
  &:active {
    cursor: grabbing;
  }
`;

const SortableRuleWrapper: React.FC<SortableRuleWrapperProps> = ({
  id,
  label,
  isOpen,
  onToggle,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 4 }}>
        <span
          className={dragHandleStyles}
          {...attributes}
          {...listeners}
          title="Drag to reorder"
          style={{ marginTop: 6 }}
        >
          ⠿
        </span>
        <div style={{ flex: 1 }}>
          <Collapse
            label={label}
            isOpen={isOpen}
            onToggle={onToggle}
            collapsible
          >
            {children}
          </Collapse>
        </div>
      </div>
    </div>
  );
};

// ── Import error banner ────────────────────────────────────────────────────────

interface ImportErrorProps {
  message: string;
  onDismiss: () => void;
}

const ImportError: React.FC<ImportErrorProps> = ({ message, onDismiss }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    marginBottom: 12,
    background: 'var(--error-transparent, rgba(224,47,68,0.15))',
    border: '1px solid var(--error-border, #e02f44)',
    borderRadius: 4,
    fontSize: '0.85rem',
    color: 'var(--error-text, #e02f44)',
  }}>
    <Icon name="exclamation-triangle" />
    <span style={{ flex: 1 }}>{message}</span>
    <Icon name="times" style={{ cursor: 'pointer' }} onClick={onDismiss} />
  </div>
);

// ── Rule Editor ────────────────────────────────────────────────────────────────

type Props = StandardEditorProps<RuleConfig>;

export const RuleEditor: React.FC<Props> = ({ value, onChange, context }) => {
  const rules: RuleItemType[] = useMemo(
    () => value?.rules ?? [],
    [value?.rules]
  );

  const [openStates, setOpenStates]   = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Hidden file input for import
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // ── Search / Filter ──────────────────────────────────────────────────────────

  const filteredRules = useMemo(() => {
    if (!searchQuery.trim()) {
      return rules;
    }
    const query = searchQuery.toLowerCase();
    return rules.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.seriesMatch.toLowerCase().includes(query) ||
        r.alias.toLowerCase().includes(query)
    );
  }, [rules, searchQuery]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const commit = (updatedRules: RuleItemType[]) => {
    const reindexed = updatedRules.map((r, i) => ({ ...r, order: i }));
    onChange({ rules: reindexed });
  };

  const toggleOpen = (id: string) => {
    setOpenStates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const addRule = () => {
    const id = uuidv4();
    const newRule: RuleItemType = {
      ...DEFAULT_RULE,
      id,
      name: `Rule ${rules.length + 1}`,
      order: rules.length,
    };
    setOpenStates((prev) => ({ ...prev, [id]: true }));
    commit([...rules, newRule]);
  };

  const updateRule = (id: string, updated: RuleItemType) => {
    commit(rules.map((r) => (r.id === id ? updated : r)));
  };

  const removeRule = (id: string) => {
    commit(rules.filter((r) => r.id !== id));
  };

  const duplicateRule = (id: string) => {
    const original = rules.find((r) => r.id === id);
    if (!original) {
      return;
    }
    const newId = uuidv4();
    const duplicate: RuleItemType = {
      ...original,
      id: newId,
      name: `${original.name} Copy`,
      order: rules.length,
    };
    setOpenStates((prev) => ({ ...prev, [newId]: true }));
    commit([...rules, duplicate]);
  };

  const moveUp = (id: string) => {
    const index = rules.findIndex((r) => r.id === id);
    if (index > 0) {
      commit(arrayMove(rules, index, index - 1));
    }
  };

  const moveDown = (id: string) => {
    const index = rules.findIndex((r) => r.id === id);
    if (index < rules.length - 1) {
      commit(arrayMove(rules, index, index + 1));
    }
  };

  // ── Export ───────────────────────────────────────────────────────────────────

  const handleExport = () => {
    const json = JSON.stringify({ rules }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'status-panel-rules.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import ───────────────────────────────────────────────────────────────────

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);

        // Validate basic structure
        if (!parsed || !Array.isArray(parsed.rules)) {
          setImportError('Invalid file format: expected { "rules": [...] }');
          return;
        }

        // Re-assign fresh UUIDs to avoid ID collisions with existing rules
        const imported: RuleItemType[] = parsed.rules.map((r: RuleItemType) => ({
          ...DEFAULT_RULE,
          ...r,
          id: uuidv4(),
        }));

        // Merge with existing rules (append after current)
        commit([...rules, ...imported]);

        // Open all freshly imported rules for review
        const newOpenStates: Record<string, boolean> = {};
        imported.forEach((r) => { newOpenStates[r.id] = true; });
        setOpenStates((prev) => ({ ...prev, ...newOpenStates }));

      } catch {
        setImportError('Failed to parse file. Make sure it is a valid JSON exported from this plugin.');
      }
    };

    reader.readAsText(file);

    // Reset input so the same file can be re-imported if needed
    e.target.value = '';
  };

  // ── Drag End ─────────────────────────────────────────────────────────────────

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = rules.findIndex((r) => r.id === active.id);
      const newIndex = rules.findIndex((r) => r.id === over.id);
      commit(arrayMove(rules, oldIndex, newIndex));
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Action buttons row ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <Button fill="solid" variant="primary" icon="plus" onClick={addRule}>
          Add Rule
        </Button>
        <Button
          fill="outline"
          variant="secondary"
          icon={"file-export" as unknown as import('@grafana/ui').IconName}
          onClick={handleExport}
          disabled={rules.length === 0}
          tooltip={rules.length === 0 ? 'No rules to export' : `Export ${rules.length} rule${rules.length !== 1 ? 's' : ''} to JSON`}
        >
          Export
        </Button>
        <Button
          fill="outline"
          variant="secondary"
          icon="import"
          onClick={handleImportClick}
          tooltip="Import rules from a JSON file (appends to existing rules)"
        >
          Import
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Import error banner */}
      {importError && (
        <ImportError message={importError} onDismiss={() => setImportError(null)} />
      )}

      {/* Search — shown when there are more than 3 rules */}
      {rules.length > 3 && (
        <div style={{ marginBottom: 12 }}>
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            placeholder="Search rules by name, metric, or alias..."
            prefix={<Icon name="search" />}
          />
          {searchQuery.trim() && (
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 4 }}>
              Found {filteredRules.length} of {rules.length} rules
            </div>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={filteredRules.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredRules.map((rule, index) => (
            <SortableRuleWrapper
              key={rule.id}
              id={rule.id}
              label={rule.name || `Rule ${index + 1}`}
              isOpen={openStates[rule.id] ?? false}
              onToggle={() => toggleOpen(rule.id)}
            >
              <RuleItem
                rule={rule}
                onUpdate={(updated) => updateRule(rule.id, updated)}
                onRemove={() => removeRule(rule.id)}
                onMoveUp={() => moveUp(rule.id)}
                onMoveDown={() => moveDown(rule.id)}
                onDuplicate={() => duplicateRule(rule.id)}
                context={context}
              />
            </SortableRuleWrapper>
          ))}
        </SortableContext>
      </DndContext>
    </>
  );
};
