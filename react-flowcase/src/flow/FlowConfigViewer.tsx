import { useRef, useState } from 'react';
import type {
    CSSProperties,
    DragEvent as ReactDragEvent,
    ChangeEvent,
    ReactNode,
} from 'react';
import type { UseVirtualCursorOptions } from '../cursor/useVirtualCursor';
import { PropCell, type MsSliderConfig, type PropValueKind, type PropValueType } from './PropEditor';
import { PropHelpTooltip } from './PropHelpTooltip';
import {
    CURSOR_OPTIONS_SCHEMA,
    RUN_OPTIONS_SCHEMA,
    STEP_SCHEMAS,
    STEP_TYPES,
    createDefaultStep,
    type JsonObjectEditorConfig,
    type StepType,
} from './stepDefaults';
import { describeStep, type FlowRunOptions, type FlowStep } from './types';

export type ConfigTabId = 'overall' | 'flow' | 'runOptions';

export type FlowEditMode = 'form' | 'json';

export interface FlowJsonEditorRenderProps {
    flow: FlowStep[];
    editable: boolean;
    onChange: (next: FlowStep[]) => void;
    /** Called by the JSON editor to register an apply-before-unmount hook. */
    registerFlush?: (flush: (() => void) | null) => void;
}

export interface FlowConfigViewerProps {
    /** The flow definition to visualize. */
    flow: FlowStep[];
    /** Optional run options to render alongside the steps. */
    runOptions?: FlowRunOptions;
    /** Optional cursor options to render in the "Overall" tab. */
    cursorOptions?: UseVirtualCursorOptions;
    /** Heading rendered at the top. Pass empty string to hide. */
    title?: string;
    /**
     * When true, values become editable, add/delete/reorder controls appear.
     * Each section also needs its corresponding `on*Change` handler to be wired.
     */
    editable?: boolean;
    /** Called with the updated flow whenever a step is edited / added / deleted / reordered. */
    onChange?: (next: FlowStep[]) => void;
    /** Called with the updated run options when edited. */
    onRunOptionsChange?: (next: FlowRunOptions) => void;
    /** Called with the updated cursor options when edited. */
    onCursorOptionsChange?: (next: UseVirtualCursorOptions) => void;
    /** Initially active tab. Defaults to `'overall'`. */
    initialTab?: ConfigTabId;
    /** Override the root element's className for external styling. */
    className?: string;
    /** Override or extend the root element's inline styles. */
    style?: CSSProperties;
    /**
     * When set, the Flow tab shows a Form | JSON toggle. JSON mode renders
     * this slot (e.g. Monaco in the demo app).
     */
    renderFlowJsonEditor?: (props: FlowJsonEditorRenderProps) => ReactNode;
}

const STEP_COLORS: Record<
    StepType,
    { fg: string; bg: string; border: string }
> = {
    click: {
        fg: '#6aa9ff',
        bg: 'rgba(106, 169, 255, 0.12)',
        border: 'rgba(106, 169, 255, 0.3)',
    },
    input: {
        fg: '#b084fc',
        bg: 'rgba(176, 132, 252, 0.12)',
        border: 'rgba(176, 132, 252, 0.3)',
    },
    select: {
        fg: '#fab259',
        bg: 'rgba(250, 178, 89, 0.12)',
        border: 'rgba(250, 178, 89, 0.3)',
    },
    delay: {
        fg: '#8a93a6',
        bg: 'rgba(138, 147, 166, 0.12)',
        border: 'rgba(138, 147, 166, 0.3)',
    },
    waitFor: {
        fg: '#5ed3d6',
        bg: 'rgba(94, 211, 214, 0.12)',
        border: 'rgba(94, 211, 214, 0.3)',
    },
    hover: {
        fg: '#ff8c42',
        bg: 'rgba(255, 140, 66, 0.12)',
        border: 'rgba(255, 140, 66, 0.3)',
    },
    keypress: {
        fg: '#ef93b9',
        bg: 'rgba(239, 147, 185, 0.12)',
        border: 'rgba(239, 147, 185, 0.3)',
    },
    scroll: {
        fg: '#52c691',
        bg: 'rgba(82, 198, 145, 0.12)',
        border: 'rgba(82, 198, 145, 0.3)',
    },
};

const styles = {
    root: {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        minWidth: 0,
    } as CSSProperties,
    header: {
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
    } as CSSProperties,
    title: {
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        opacity: 0.6,
        margin: 0,
    } as CSSProperties,
    summary: {
        fontSize: 11,
        opacity: 0.5,
    } as CSSProperties,
    editingMark: {
        background: 'rgba(250, 178, 89, 0.15)',
        color: '#fab259',
        border: '1px solid rgba(250, 178, 89, 0.35)',
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    } as CSSProperties,
    tabStrip: {
        display: 'flex',
        gap: 4,
        padding: 4,
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 10,
        marginBottom: 8,
    } as CSSProperties,
    tab: (active: boolean): CSSProperties => ({
        background: active ? 'rgba(106, 169, 255, 0.15)' : 'transparent',
        border: active
            ? '1px solid rgba(106, 169, 255, 0.35)'
            : '1px solid transparent',
        borderRadius: 7,
        color: active ? '#6aa9ff' : 'inherit',
        opacity: active ? 1 : 0.6,
        padding: '7px 14px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    }),
    pane: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
    } as CSSProperties,
    emptyHint: {
        fontSize: 11,
        opacity: 0.5,
        padding: '12px 4px',
    } as CSSProperties,
    step: (isDragging: boolean, isDropTarget: boolean): CSSProperties => ({
        border: `1px solid ${
            isDropTarget ? '#6aa9ff' : 'rgba(127, 127, 127, 0.2)'
        }`,
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
        opacity: isDragging ? 0.45 : 1,
        background: isDropTarget
            ? 'rgba(106, 169, 255, 0.04)'
            : 'transparent',
        transition: 'border-color 0.12s, background 0.12s',
    }),
    stepHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        flexWrap: 'wrap',
    } as CSSProperties,
    stepIndex: {
        opacity: 0.45,
        minWidth: 18,
        textAlign: 'right',
    } as CSSProperties,
    elementId: {
        fontFamily: 'inherit',
        opacity: 0.9,
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    } as CSSProperties,
    badge: (fg: string, bg: string, border: string): CSSProperties => ({
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    }),
    dragHandle: {
        cursor: 'grab',
        opacity: 0.5,
        userSelect: 'none',
        padding: '0 4px',
        fontSize: 14,
        lineHeight: 1,
        letterSpacing: '-2px',
    } as CSSProperties,
    iconBtn: {
        background: 'transparent',
        border: '1px solid rgba(127, 127, 127, 0.25)',
        color: 'inherit',
        opacity: 0.6,
        borderRadius: 4,
        width: 22,
        height: 22,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        fontSize: 14,
        lineHeight: 1,
    } as CSSProperties,
    propsGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
    } as CSSProperties,
    propRow: {
        display: 'grid',
        gridTemplateColumns: 'minmax(88px, 110px) minmax(0, 1fr)',
        gap: '6px 12px',
        alignItems: 'center',
        minWidth: 0,
    } as CSSProperties,
    propKey: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        opacity: 0.65,
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    } as CSSProperties,
    propValue: {
        fontFamily: 'inherit',
        wordBreak: 'break-word',
        minWidth: 0,
    } as CSSProperties,
    sectionCard: {
        border: '1px solid rgba(127, 127, 127, 0.2)',
        borderRadius: 8,
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: 0,
    } as CSSProperties,
    sectionLabel: {
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        opacity: 0.55,
    } as CSSProperties,
    addRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        border: '1px dashed rgba(127, 127, 127, 0.3)',
        borderRadius: 8,
    } as CSSProperties,
    addLabel: {
        opacity: 0.55,
        fontSize: 11,
    } as CSSProperties,
    addSelect: {
        background: 'rgba(127, 127, 127, 0.12)',
        border: '1px solid rgba(127, 127, 127, 0.25)',
        borderRadius: 4,
        padding: '3px 6px',
        fontSize: 11,
        fontFamily: 'inherit',
        color: 'inherit',
    } as CSSProperties,
    addBtn: {
        background: 'rgba(106, 169, 255, 0.15)',
        border: '1px solid rgba(106, 169, 255, 0.35)',
        color: '#6aa9ff',
        borderRadius: 4,
        padding: '3px 10px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
    } as CSSProperties,
    flowEditModeBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexWrap: 'wrap',
    } as CSSProperties,
    flowEditModeToggle: {
        display: 'inline-flex',
        gap: 2,
        padding: 3,
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: 8,
    } as CSSProperties,
    flowEditModeBtn: (active: boolean): CSSProperties => ({
        background: active ? 'rgba(106, 169, 255, 0.18)' : 'transparent',
        border: active
            ? '1px solid rgba(106, 169, 255, 0.45)'
            : '1px solid transparent',
        borderRadius: 6,
        color: active ? '#6aa9ff' : 'inherit',
        opacity: active ? 1 : 0.65,
        padding: '5px 12px',
        fontSize: 10,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    }),
    flowEditModeHint: {
        fontSize: 10,
        opacity: 0.45,
        fontFamily:
            'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    } as CSSProperties,
};

function summarize(flow: FlowStep[]): string {
    const counts: Record<StepType, number> = {
        click: 0,
        input: 0,
        select: 0,
        delay: 0,
        waitFor: 0,
        hover: 0,
        keypress: 0,
        scroll: 0,
    };
    for (const step of flow) counts[step.type] += 1;
    const parts: string[] = [
        `${flow.length} step${flow.length === 1 ? '' : 's'}`,
    ];
    for (const [type, n] of Object.entries(counts)) {
        if (n > 0) parts.push(`${n} ${type}`);
    }
    return parts.join(' · ');
}

interface PropsGridEntry {
    key: string;
    value: unknown;
    description?: string;
    valueType?: PropValueType;
    enumValues?: ReadonlyArray<string>;
    valueKinds?: ReadonlyArray<PropValueKind>;
    msSlider?: MsSliderConfig;
    jsonObject?: JsonObjectEditorConfig;
}

function getStepEntries(
    step: FlowStep,
    editable: boolean,
): PropsGridEntry[] {
    const stepRecord = step as unknown as Record<string, unknown>;
    if (editable) {
        return STEP_SCHEMAS[step.type].map((schema) => ({
            key: schema.key,
            value: stepRecord[schema.key],
            description: schema.description,
            valueType: schema.valueType,
            enumValues: schema.enumValues,
            valueKinds: schema.valueKinds,
            msSlider: schema.msSlider,
            jsonObject: schema.jsonObject,
        }));
    }
    return Object.entries(step)
        .filter(([k]) => k !== 'type')
        .map(([k, v]) => {
            const meta = STEP_SCHEMAS[step.type].find((s) => s.key === k);
            return {
                key: k,
                value: v,
                description: meta?.description,
                valueType: meta?.valueType,
                enumValues: meta?.enumValues,
                valueKinds: meta?.valueKinds,
                msSlider: meta?.msSlider,
                jsonObject: meta?.jsonObject,
            };
        });
}

function patchRecord(
    record: Record<string, unknown> | undefined,
    key: string,
    value: unknown,
): Record<string, unknown> {
    const next = { ...(record ?? {}) };
    if (value === undefined) {
        delete next[key];
    } else {
        next[key] = value;
    }
    return next;
}

function patchStep(
    flow: FlowStep[],
    index: number,
    key: string,
    value: unknown,
): FlowStep[] {
    return flow.map((step, idx) =>
        idx === index
            ? (patchRecord(
                  step as unknown as Record<string, unknown>,
                  key,
                  value,
              ) as unknown as FlowStep)
            : step,
    );
}

function moveItem<T>(arr: T[], from: number, to: number): T[] {
    if (from === to || from < 0 || to < 0 || from >= arr.length) return arr;
    const next = [...arr];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    return next;
}

interface PropsGridProps {
    entries: PropsGridEntry[];
    editable: boolean;
    idPrefix?: string;
    onPropChange?: (key: string, value: unknown) => void;
}

function PropsGrid({
    entries,
    editable,
    idPrefix = '',
    onPropChange,
}: PropsGridProps) {
    if (entries.length === 0) return null;
    return (
        <div style={styles.propsGrid}>
            {entries.map(
                ({
                    key,
                    value,
                    description,
                    valueType,
                    enumValues,
                    valueKinds,
                    msSlider,
                    jsonObject,
                }) => (
                        <div
                            key={`${idPrefix}${key}`}
                            style={{
                                ...styles.propRow,
                                ...(msSlider || valueType === 'object'
                                    ? { alignItems: 'start' as const }
                                    : {}),
                            }}
                        >
                            <span style={styles.propKey}>
                                <span>{key}</span>
                                {description ? (
                                    <PropHelpTooltip text={description} />
                                ) : null}
                            </span>
                            <span style={styles.propValue}>
                                <PropCell
                                    value={value}
                                    editable={editable}
                                    valueType={valueType}
                                    enumValues={enumValues}
                                    valueKinds={valueKinds}
                                    msSlider={msSlider}
                                    jsonObject={jsonObject}
                                    onChange={(next) =>
                                        onPropChange?.(key, next)
                                    }
                                />
                            </span>
                        </div>
                ),
            )}
        </div>
    );
}

interface StepCardProps {
    step: FlowStep;
    index: number;
    editable: boolean;
    isDragging: boolean;
    isDropTarget: boolean;
    onPropChange?: (key: string, value: unknown) => void;
    onDelete?: () => void;
    onDragHandleMouseDown?: () => void;
    onDragHandleMouseUp?: () => void;
    onDragStart?: (e: ReactDragEvent<HTMLDivElement>) => void;
    onDragEnd?: () => void;
    onDragOver?: (e: ReactDragEvent<HTMLDivElement>) => void;
    onDragLeave?: () => void;
    onDrop?: (e: ReactDragEvent<HTMLDivElement>) => void;
    draggable: boolean;
}

function StepCard({
    step,
    index,
    editable,
    isDragging,
    isDropTarget,
    onPropChange,
    onDelete,
    onDragHandleMouseDown,
    onDragHandleMouseUp,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragLeave,
    onDrop,
    draggable,
}: StepCardProps) {
    const colors = STEP_COLORS[step.type];
    const entries = getStepEntries(step, editable);
    return (
        <div
            style={styles.step(isDragging, isDropTarget)}
            draggable={draggable}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            <div style={styles.stepHeader}>
                {editable ? (
                    <span
                        style={styles.dragHandle}
                        title="Drag to reorder"
                        onMouseDown={onDragHandleMouseDown}
                        onMouseUp={onDragHandleMouseUp}
                        onMouseLeave={onDragHandleMouseUp}
                    >
                        ⋮⋮
                    </span>
                ) : null}
                <span style={styles.stepIndex}>{index + 1}</span>
                <span
                    style={styles.badge(colors.fg, colors.bg, colors.border)}
                >
                    {step.type}
                </span>
                <code style={styles.elementId}>
                    {describeStep(step)}
                </code>
                {editable ? (
                    <button
                        type="button"
                        style={styles.iconBtn}
                        aria-label="Delete step"
                        title="Delete step"
                        onClick={onDelete}
                    >
                        ×
                    </button>
                ) : null}
            </div>
            <PropsGrid
                entries={entries}
                editable={editable}
                idPrefix={`step-${index}-`}
                onPropChange={onPropChange}
            />
        </div>
    );
}

interface AddStepRowProps {
    onAdd: (type: StepType) => void;
}

function AddStepRow({ onAdd }: AddStepRowProps) {
    const [type, setType] = useState<StepType>('input');
    return (
        <div style={styles.addRow}>
            <span style={styles.addLabel}>Add step</span>
            <select
                style={styles.addSelect}
                value={type}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setType(e.target.value as StepType)
                }
            >
                {STEP_TYPES.map((t) => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>
            <button
                type="button"
                style={styles.addBtn}
                onClick={() => onAdd(type)}
            >
                + Add
            </button>
        </div>
    );
}

interface TabDef {
    id: ConfigTabId;
    label: string;
    available: boolean;
}

interface TabStripProps {
    tabs: TabDef[];
    active: ConfigTabId;
    onChange: (id: ConfigTabId) => void;
}

interface FlowEditModeBarProps {
    mode: FlowEditMode;
    onChange: (mode: FlowEditMode) => void;
    jsonAvailable: boolean;
}

function FlowEditModeBar({ mode, onChange, jsonAvailable }: FlowEditModeBarProps) {
    if (!jsonAvailable) return null;
    return (
        <div style={styles.flowEditModeBar}>
            <div
                style={styles.flowEditModeToggle}
                role="group"
                aria-label="Flow edit mode"
            >
                <button
                    type="button"
                    style={styles.flowEditModeBtn(mode === 'form')}
                    aria-pressed={mode === 'form'}
                    onClick={() => onChange('form')}
                >
                    Form
                </button>
                <button
                    type="button"
                    style={styles.flowEditModeBtn(mode === 'json')}
                    aria-pressed={mode === 'json'}
                    onClick={() => onChange('json')}
                >
                    JSON
                </button>
            </div>
            <span style={styles.flowEditModeHint}>
                {mode === 'json'
                    ? 'Function props (assert, condition) stay in Form mode.'
                    : 'Step-by-step fields'}
            </span>
        </div>
    );
}

function TabStrip({ tabs, active, onChange }: TabStripProps) {
    return (
        <div style={styles.tabStrip} role="tablist">
            {tabs
                .filter((t) => t.available)
                .map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        role="tab"
                        aria-selected={active === t.id}
                        style={styles.tab(active === t.id)}
                        onClick={() => onChange(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
        </div>
    );
}

export function FlowConfigViewer({
    flow,
    runOptions,
    cursorOptions,
    title = 'Flow configuration',
    editable = false,
    onChange,
    onRunOptionsChange,
    onCursorOptionsChange,
    initialTab = 'flow',
    className,
    style,
    renderFlowJsonEditor,
}: FlowConfigViewerProps) {
    const isStepEditable = editable && typeof onChange === 'function';
    const isRunOptionsEditable =
        editable && typeof onRunOptionsChange === 'function';
    const isCursorOptionsEditable =
        editable && typeof onCursorOptionsChange === 'function';

    const [activeTab, setActiveTab] = useState<ConfigTabId>(initialTab);
    const [flowEditMode, setFlowEditMode] = useState<FlowEditMode>('form');
    const flowJsonFlushRef = useRef<(() => void) | null>(null);
    const flowJsonEditorAvailable =
        Boolean(renderFlowJsonEditor) && isStepEditable;

    const handleFlowEditModeChange = (mode: FlowEditMode) => {
        if (flowEditMode === 'json' && mode === 'form') {
            flowJsonFlushRef.current?.();
        }
        setFlowEditMode(mode);
    };

    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [dragArmedIndex, setDragArmedIndex] = useState<number | null>(null);

    const handlePropChange = (
        stepIndex: number,
        key: string,
        value: unknown,
    ) => {
        if (!onChange) return;
        onChange(patchStep(flow, stepIndex, key, value));
    };

    const handleDelete = (index: number) => {
        if (!onChange) return;
        onChange(flow.filter((_, i) => i !== index));
    };

    const handleAdd = (type: StepType) => {
        if (!onChange) return;
        onChange([...flow, createDefaultStep(type)]);
    };

    const handleDragStart =
        (index: number) => (e: ReactDragEvent<HTMLDivElement>) => {
            setDraggedIndex(index);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(index));
        };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
        setDragArmedIndex(null);
    };

    const handleDragOver =
        (index: number) => (e: ReactDragEvent<HTMLDivElement>) => {
            if (draggedIndex === null || draggedIndex === index) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragOverIndex !== index) setDragOverIndex(index);
        };

    const handleDragLeave = (index: number) => () => {
        if (dragOverIndex === index) setDragOverIndex(null);
    };

    const handleDrop =
        (index: number) => (e: ReactDragEvent<HTMLDivElement>) => {
            e.preventDefault();
            if (draggedIndex === null || draggedIndex === index) {
                handleDragEnd();
                return;
            }
            if (onChange) onChange(moveItem(flow, draggedIndex, index));
            handleDragEnd();
        };

    const handleRunOptionChange = (key: string, value: unknown) => {
        if (!onRunOptionsChange) return;
        onRunOptionsChange(
            patchRecord(
                runOptions as unknown as
                    | Record<string, unknown>
                    | undefined,
                key,
                value,
            ) as FlowRunOptions,
        );
    };

    const handleCursorOptionChange = (key: string, value: unknown) => {
        if (!onCursorOptionsChange) return;
        onCursorOptionsChange(
            patchRecord(
                cursorOptions as Record<string, unknown> | undefined,
                key,
                value,
            ) as UseVirtualCursorOptions,
        );
    };

    const cursorEntries: PropsGridEntry[] = isCursorOptionsEditable
        ? CURSOR_OPTIONS_SCHEMA.map(
              ({ key, description, valueType, enumValues }) => ({
                  key,
                  value: (
                      cursorOptions as Record<string, unknown> | undefined
                  )?.[key],
                  description,
                  valueType,
                  enumValues,
              }),
          )
        : cursorOptions
          ? Object.entries(cursorOptions)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => {
                    const meta = CURSOR_OPTIONS_SCHEMA.find(
                        (s) => s.key === k,
                    );
                    return {
                        key: k,
                        value: v,
                        description: meta?.description,
                        valueType: meta?.valueType,
                        enumValues: meta?.enumValues,
                    };
                })
          : [];

    const runOptionsEntries: PropsGridEntry[] = isRunOptionsEditable
        ? RUN_OPTIONS_SCHEMA.map((schema) => ({
              key: schema.key,
              value: (runOptions as Record<string, unknown> | undefined)?.[
                  schema.key
              ],
              description: schema.description,
              valueType: schema.valueType,
              enumValues: schema.enumValues,
              valueKinds: schema.valueKinds,
          }))
        : runOptions
          ? Object.entries(runOptions)
                .filter(([, v]) => v !== undefined)
                .map(([k, v]) => {
                    const meta = RUN_OPTIONS_SCHEMA.find((s) => s.key === k);
                    return {
                        key: k,
                        value: v,
                        description: meta?.description,
                        valueType: meta?.valueType,
                        enumValues: meta?.enumValues,
                    };
                })
          : [];

    const tabs: TabDef[] = [
        { id: 'flow', label: 'Flow', available: true },
        {
            id: 'runOptions',
            label: 'Run options',
            available: isRunOptionsEditable || runOptionsEntries.length > 0,
        },
        {
            id: 'overall',
            label: 'Cursor',
            available: isCursorOptionsEditable || cursorEntries.length > 0,
        },
    ];

    // Fall back if the requested tab isn't actually available
    const resolvedActiveTab: ConfigTabId =
        tabs.find((t) => t.id === activeTab && t.available)?.id ?? 'flow';

    return (
        <div className={className} style={{ ...styles.root, ...style }}>
            {title || isStepEditable ? (
                <div style={styles.header}>
                    {title ? (
                        <h4 style={styles.title}>{title}</h4>
                    ) : (
                        <span />
                    )}
                    <span style={styles.summary}>
                        {summarize(flow)}
                        {isStepEditable ? (
                            <>
                                {' · '}
                                <span style={styles.editingMark}>
                                    editing
                                </span>
                            </>
                        ) : null}
                    </span>
                </div>
            ) : null}

            <TabStrip
                tabs={tabs}
                active={resolvedActiveTab}
                onChange={setActiveTab}
            />

            {resolvedActiveTab === 'overall' ? (
                <div style={styles.pane}>
                    {cursorEntries.length > 0 ? (
                        <div style={styles.sectionCard}>
                            <span style={styles.sectionLabel}>
                                Cursor options
                            </span>
                            <PropsGrid
                                entries={cursorEntries}
                                editable={isCursorOptionsEditable}
                                idPrefix="cursor-"
                                onPropChange={handleCursorOptionChange}
                            />
                        </div>
                    ) : (
                        <div style={styles.emptyHint}>
                            No primitive settings to configure.
                        </div>
                    )}
                </div>
            ) : null}

            {resolvedActiveTab === 'flow' ? (
                <div style={styles.pane}>
                    <FlowEditModeBar
                        mode={flowEditMode}
                        onChange={handleFlowEditModeChange}
                        jsonAvailable={flowJsonEditorAvailable}
                    />
                    {flowEditMode === 'json' &&
                    renderFlowJsonEditor &&
                    onChange ? (
                        renderFlowJsonEditor({
                            flow,
                            editable: isStepEditable,
                            onChange,
                            registerFlush: (flush) => {
                                flowJsonFlushRef.current = flush;
                            },
                        })
                    ) : (
                        <>
                    {flow.map((step, idx) => (
                        <StepCard
                            key={idx}
                            step={step}
                            index={idx}
                            editable={isStepEditable}
                            isDragging={draggedIndex === idx}
                            isDropTarget={
                                dragOverIndex === idx &&
                                draggedIndex !== idx
                            }
                            draggable={
                                isStepEditable && dragArmedIndex === idx
                            }
                            onPropChange={(key, value) =>
                                handlePropChange(idx, key, value)
                            }
                            onDelete={() => handleDelete(idx)}
                            onDragHandleMouseDown={() =>
                                setDragArmedIndex(idx)
                            }
                            onDragHandleMouseUp={() => {
                                if (draggedIndex === null) {
                                    setDragArmedIndex(null);
                                }
                            }}
                            onDragStart={handleDragStart(idx)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver(idx)}
                            onDragLeave={handleDragLeave(idx)}
                            onDrop={handleDrop(idx)}
                        />
                    ))}
                    {isStepEditable ? <AddStepRow onAdd={handleAdd} /> : null}
                        </>
                    )}
                </div>
            ) : null}

            {resolvedActiveTab === 'runOptions' ? (
                <div style={styles.pane}>
                    {runOptionsEntries.length > 0 ? (
                        <div style={styles.sectionCard}>
                            <span style={styles.sectionLabel}>
                                Run options
                            </span>
                            <PropsGrid
                                entries={runOptionsEntries}
                                editable={isRunOptionsEditable}
                                idPrefix="run-"
                                onPropChange={handleRunOptionChange}
                            />
                        </div>
                    ) : (
                        <div style={styles.emptyHint}>
                            No run options configured.
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
