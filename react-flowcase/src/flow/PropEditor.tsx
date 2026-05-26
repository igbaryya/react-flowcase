import { useEffect, useState } from 'react';
import type {
    ChangeEvent,
    CSSProperties,
    ReactNode,
} from 'react';
import { CodeEditorBox } from './CodeEditorBox';
import { formatFunctionSource } from './functionSource';
import { JsonObjectEditor } from './JsonObjectEditor';
import type { JsonObjectEditorConfig } from './stepDefaults';

export const propEditorStyles = {
    textInput: {
        background: 'rgba(127, 127, 127, 0.12)',
        border: '1px solid rgba(127, 127, 127, 0.25)',
        borderRadius: 6,
        padding: '6px 9px',
        fontSize: 12,
        fontFamily: 'inherit',
        color: 'inherit',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
    } as CSSProperties,
    textarea: {
        background: 'rgba(127, 127, 127, 0.12)',
        border: '1px solid rgba(127, 127, 127, 0.25)',
        borderRadius: 6,
        padding: '8px 10px',
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: 'inherit',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
        minHeight: 70,
        resize: 'vertical',
    } as CSSProperties,
    codeEditorWrap: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
        width: '100%',
    } as CSSProperties,
    error: {
        color: '#ef5b6b',
        fontSize: 10,
        marginTop: 4,
    } as CSSProperties,
    helpText: {
        display: 'block',
        opacity: 0.45,
        fontSize: 10,
        marginTop: 2,
    } as CSSProperties,
    readonlyBlock: {
        display: 'block',
        background: 'rgba(127, 127, 127, 0.1)',
        padding: '6px 8px',
        borderRadius: 4,
        fontSize: 10,
        whiteSpace: 'pre',
        overflowX: 'auto',
        margin: 0,
    } as CSSProperties,
    readonlyCodeShell: {
        maxHeight: 160,
        minHeight: 48,
        resize: 'none',
    } as CSSProperties,
    defaultMark: {
        opacity: 0.45,
        fontStyle: 'italic',
    } as CSSProperties,
};

/** Primitive kinds a prop can accept. Used by union editors. */
export type PropValueKind = 'boolean' | 'number' | 'string';

export type PropValueType = PropValueKind | 'function' | 'object';

export interface MsSliderConfig {
    min: number;
    max: number;
    step: number;
    /** Runtime default shown on the slider when the prop is unset. */
    defaultMs: number;
}

const KIND_LABELS: Record<PropValueKind, string> = {
    boolean: 'bool',
    number: 'num',
    string: 'str',
};

const KIND_DEFAULTS: Record<PropValueKind, boolean | number | string> = {
    boolean: false,
    number: 0,
    string: '',
};

const unionStyles = {
    wrap: {
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
    } as CSSProperties,
    kindBar: {
        display: 'inline-flex',
        gap: 2,
        alignSelf: 'flex-start',
    } as CSSProperties,
    kindBtn: (active: boolean): CSSProperties => ({
        background: active
            ? 'rgba(106, 169, 255, 0.18)'
            : 'rgba(127, 127, 127, 0.1)',
        border: `1px solid ${active ? 'rgba(106, 169, 255, 0.5)' : 'rgba(127, 127, 127, 0.25)'}`,
        color: active ? '#6aa9ff' : 'inherit',
        opacity: active ? 1 : 0.65,
        borderRadius: 4,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: 1.6,
    }),
};

function valueKind(value: unknown): PropValueKind | undefined {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string') return 'string';
    return undefined;
}

function MsSlider({
    value,
    onChange,
    config,
}: {
    value: number | undefined;
    onChange: (next: number | undefined) => void;
    config: MsSliderConfig;
}) {
    const isDefault = value === undefined;
    const displayValue =
        value !== undefined
            ? value
            : config.defaultMs;

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minWidth: 0,
                width: '100%',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                }}
            >
                <span
                    style={{
                        fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, monospace',
                        fontSize: 12,
                        fontWeight: 600,
                        color: isDefault ? 'inherit' : '#6aa9ff',
                        opacity: isDefault ? 0.7 : 1,
                    }}
                >
                    {displayValue} ms
                </span>
                {isDefault ? (
                    <span
                        style={{
                            fontSize: 10,
                            opacity: 0.5,
                            fontStyle: 'italic',
                        }}
                    >
                        default
                    </span>
                ) : (
                    <button
                        type="button"
                        onClick={() => onChange(undefined)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'inherit',
                            opacity: 0.45,
                            fontSize: 10,
                            cursor: 'pointer',
                            padding: '0 2px',
                            textDecoration: 'underline',
                        }}
                        title="Reset to default"
                    >
                        reset
                    </button>
                )}
            </div>
            <input
                type="range"
                min={config.min}
                max={config.max}
                step={config.step}
                value={displayValue}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onChange(Number(e.target.value))
                }
                style={{
                    width: '100%',
                    accentColor: '#6aa9ff',
                    cursor: 'pointer',
                }}
            />
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9,
                    opacity: 0.4,
                    fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, monospace',
                }}
            >
                <span>{config.min} ms</span>
                <span>{config.max} ms</span>
            </div>
        </div>
    );
}

function NumberInput({
    value,
    onChange,
    placeholder = 'default',
}: {
    value: number | undefined;
    onChange: (next: number | undefined) => void;
    placeholder?: string;
}) {
    return (
        <input
            type="number"
            style={propEditorStyles.textInput}
            value={value ?? ''}
            placeholder={placeholder}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;
                onChange(raw === '' ? undefined : Number(raw));
            }}
        />
    );
}

function EnumSelect({
    value,
    onChange,
    enumValues,
}: {
    value: string | undefined;
    onChange: (next: string | undefined) => void;
    enumValues: ReadonlyArray<string>;
}) {
    const selectValue =
        value !== undefined && enumValues.includes(value) ? value : '';
    return (
        <select
            style={propEditorStyles.textInput}
            value={selectValue}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                const raw = e.target.value;
                onChange(raw === '' ? undefined : raw);
            }}
        >
            <option value="">default</option>
            {enumValues.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );
}

function BooleanToggle({
    value,
    onChange,
}: {
    value: boolean | undefined;
    onChange: (next: boolean | undefined) => void;
}) {
    const isDefault = value === undefined;
    const checked = value === true;

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={isDefault ? 'Use default' : checked ? 'On' : 'Off'}
                onClick={() => {
                    if (isDefault) onChange(true);
                    else if (checked) onChange(false);
                    else onChange(true);
                }}
                style={{
                    position: 'relative',
                    width: 36,
                    height: 20,
                    borderRadius: 999,
                    border: `1px solid ${
                        checked
                            ? 'rgba(88, 200, 123, 0.6)'
                            : 'rgba(127, 127, 127, 0.35)'
                    }`,
                    background: checked
                        ? 'rgba(88, 200, 123, 0.35)'
                        : 'rgba(127, 127, 127, 0.18)',
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    transition: 'background 0.15s, border-color 0.15s',
                }}
            >
                <span
                    style={{
                        position: 'absolute',
                        top: 2,
                        left: checked ? 18 : 2,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: checked ? '#58c87b' : '#8a93a6',
                        transition: 'left 0.15s, background 0.15s',
                    }}
                />
            </button>
            <span
                style={{
                    fontSize: 11,
                    opacity: isDefault ? 0.5 : 0.85,
                    fontStyle: isDefault ? 'italic' : 'normal',
                }}
            >
                {isDefault ? 'default' : checked ? 'true' : 'false'}
            </span>
            {!isDefault ? (
                <button
                    type="button"
                    onClick={() => onChange(undefined)}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        opacity: 0.45,
                        fontSize: 10,
                        cursor: 'pointer',
                        padding: '0 2px',
                        textDecoration: 'underline',
                    }}
                    title="Reset to default"
                >
                    reset
                </button>
            ) : null}
        </div>
    );
}

function FunctionEditor({
    value,
    onChange,
}: {
    value: ((...args: unknown[]) => unknown) | undefined;
    onChange: (next: ((...args: unknown[]) => unknown) | undefined) => void;
}) {
    const [source, setSource] = useState<string>(
        value ? formatFunctionSource(value) : '',
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSource(value ? formatFunctionSource(value) : '');
        setError(null);
    }, [value]);

    const handleBlur = () => {
        const trimmed = source.trim();
        if (trimmed === '') {
            setError(null);
            if (value !== undefined) onChange(undefined);
            return;
        }
        try {
            const factory = new Function(`return (${trimmed});`);
            const fn = factory() as unknown;
            if (typeof fn !== 'function') {
                throw new Error('Expression does not evaluate to a function.');
            }
            setError(null);
            onChange(fn as (...args: unknown[]) => unknown);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    return (
        <div style={propEditorStyles.codeEditorWrap}>
            <CodeEditorBox
                value={source}
                onChange={setSource}
                onBlur={handleBlur}
                language="javascript"
                placeholder="(prev) => 'derived value'"
                minHeight={88}
                maxHeight={240}
            />
            {error ? <div style={propEditorStyles.error}>{error}</div> : null}
            <span style={propEditorStyles.helpText}>
                Evaluated on blur. Functions only.
            </span>
        </div>
    );
}

function UnionEditor({
    value,
    onChange,
    kinds,
    msSlider,
}: {
    value: unknown;
    onChange: (next: unknown) => void;
    kinds: ReadonlyArray<PropValueKind>;
    msSlider?: MsSliderConfig;
}) {
    const currentKind = valueKind(value);
    const handleKind = (k: PropValueKind | undefined) => {
        if (k === currentKind) return;
        if (k === undefined) {
            onChange(undefined);
            return;
        }
        if (k === 'number' && msSlider) {
            onChange(msSlider.defaultMs);
            return;
        }
        onChange(KIND_DEFAULTS[k]);
    };
    return (
        <div style={unionStyles.wrap}>
            <div style={unionStyles.kindBar} role="tablist">
                {kinds.map((k) => (
                    <button
                        key={k}
                        type="button"
                        role="tab"
                        aria-selected={currentKind === k}
                        style={unionStyles.kindBtn(currentKind === k)}
                        onClick={() => handleKind(k)}
                        title={`Use ${k}`}
                    >
                        {KIND_LABELS[k]}
                    </button>
                ))}
                <button
                    type="button"
                    role="tab"
                    aria-selected={currentKind === undefined}
                    style={unionStyles.kindBtn(currentKind === undefined)}
                    onClick={() => handleKind(undefined)}
                    title="Use default"
                >
                    —
                </button>
            </div>
            {currentKind === undefined ? (
                <span style={propEditorStyles.defaultMark}>default</span>
            ) : currentKind === 'boolean' ? (
                <BooleanToggle
                    value={value as boolean | undefined}
                    onChange={onChange}
                />
            ) : currentKind === 'number' ? (
                msSlider ? (
                    <MsSlider
                        value={value as number | undefined}
                        onChange={onChange}
                        config={msSlider}
                    />
                ) : (
                    <NumberInput
                        value={value as number | undefined}
                        onChange={onChange}
                    />
                )
            ) : (
                <input
                    type="text"
                    style={propEditorStyles.textInput}
                    value={(value as string) ?? ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        onChange(e.target.value)
                    }
                />
            )}
        </div>
    );
}

export interface PropCellProps {
    value: unknown;
    editable: boolean;
    onChange?: (next: unknown) => void;
    enumValues?: ReadonlyArray<string>;
    valueType?: PropValueType;
    valueKinds?: ReadonlyArray<PropValueKind>;
    msSlider?: MsSliderConfig;
    jsonObject?: JsonObjectEditorConfig;
}

export function PropCell({
    value,
    editable,
    onChange,
    enumValues,
    valueType,
    valueKinds,
    msSlider,
    jsonObject,
}: PropCellProps): ReactNode {
    if (editable && valueKinds && valueKinds.length > 0) {
        return (
            <UnionEditor
                value={value}
                kinds={valueKinds}
                msSlider={msSlider}
                onChange={(next) => onChange?.(next)}
            />
        );
    }

    if (editable && enumValues && enumValues.length > 0) {
        return (
            <EnumSelect
                value={typeof value === 'string' ? value : undefined}
                enumValues={enumValues}
                onChange={(next) => onChange?.(next)}
            />
        );
    }

    if (editable && valueType === 'boolean') {
        return (
            <BooleanToggle
                value={typeof value === 'boolean' ? value : undefined}
                onChange={(next) => onChange?.(next)}
            />
        );
    }

    if (editable && valueType === 'number' && msSlider) {
        return (
            <MsSlider
                value={typeof value === 'number' ? value : undefined}
                onChange={(next) => onChange?.(next)}
                config={msSlider}
            />
        );
    }

    if (editable && valueType === 'number') {
        return (
            <NumberInput
                value={typeof value === 'number' ? value : undefined}
                onChange={(next) => onChange?.(next)}
            />
        );
    }

    if (editable && valueType === 'string') {
        return (
            <input
                type="text"
                style={propEditorStyles.textInput}
                value={typeof value === 'string' ? value : ''}
                placeholder="default"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const raw = e.target.value;
                    onChange?.(raw === '' ? undefined : raw);
                }}
            />
        );
    }

    if (editable && valueType === 'function') {
        return (
            <FunctionEditor
                value={
                    typeof value === 'function'
                        ? (value as (...args: unknown[]) => unknown)
                        : undefined
                }
                onChange={(fn) => onChange?.(fn)}
            />
        );
    }

    if (editable && valueType === 'object') {
        return (
            <JsonObjectEditor
                value={value}
                onChange={(next) => onChange?.(next)}
                config={jsonObject}
            />
        );
    }

    if (typeof value === 'function') {
        if (editable) {
            return (
                <FunctionEditor
                    value={value as (...args: unknown[]) => unknown}
                    onChange={(fn) => onChange?.(fn)}
                />
            );
        }
        return (
            <CodeEditorBox
                value={formatFunctionSource(
                    value as (...args: unknown[]) => unknown,
                )}
                onChange={() => {}}
                language="javascript"
                readOnly
                shellStyle={propEditorStyles.readonlyCodeShell}
            />
        );
    }

    if (typeof value === 'object' && value !== null) {
        if (editable) {
            return (
                <JsonObjectEditor
                    value={value}
                    onChange={(next) => onChange?.(next)}
                    config={jsonObject}
                />
            );
        }
        return (
            <CodeEditorBox
                value={JSON.stringify(value, null, 2)}
                onChange={() => {}}
                language="json"
                readOnly
                shellStyle={propEditorStyles.readonlyCodeShell}
            />
        );
    }

    if (typeof value === 'boolean') {
        if (!editable) return <code>{String(value)}</code>;
        return (
            <BooleanToggle value={value} onChange={(next) => onChange?.(next)} />
        );
    }

    if (typeof value === 'number') {
        if (!editable) return <code>{String(value)}</code>;
        if (msSlider) {
            return (
                <MsSlider
                    value={value}
                    onChange={(next) => onChange?.(next)}
                    config={msSlider}
                />
            );
        }
        return (
            <NumberInput value={value} onChange={(next) => onChange?.(next)} />
        );
    }

    if (typeof value === 'string') {
        if (!editable) return <code>{JSON.stringify(value)}</code>;
        return (
            <input
                type="text"
                style={propEditorStyles.textInput}
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onChange?.(e.target.value)
                }
            />
        );
    }

    if (!editable) {
        if (msSlider && value === undefined) {
            return (
                <span style={propEditorStyles.defaultMark}>
                    default · {msSlider.defaultMs} ms
                </span>
            );
        }
        return <span style={propEditorStyles.defaultMark}>default</span>;
    }

    return (
        <input
            type="text"
            style={propEditorStyles.textInput}
            value=""
            placeholder="default"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;
                onChange?.(raw === '' ? undefined : raw);
            }}
        />
    );
}
