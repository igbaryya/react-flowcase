import { useEffect, useState } from 'react';
import type {
    ChangeEvent,
    CSSProperties,
    FocusEvent,
    ReactNode,
} from 'react';

export const propEditorStyles = {
    textInput: {
        background: 'rgba(127, 127, 127, 0.12)',
        border: '1px solid rgba(127, 127, 127, 0.25)',
        borderRadius: 4,
        padding: '4px 7px',
        fontSize: 11,
        fontFamily: 'inherit',
        color: 'inherit',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
    } as CSSProperties,
    textarea: {
        background: 'rgba(127, 127, 127, 0.12)',
        border: '1px solid rgba(127, 127, 127, 0.25)',
        borderRadius: 4,
        padding: '6px 8px',
        fontSize: 11,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: 'inherit',
        width: '100%',
        boxSizing: 'border-box',
        outline: 'none',
        minHeight: 70,
        resize: 'vertical',
    } as CSSProperties,
    checkbox: {
        margin: 0,
        verticalAlign: 'middle',
        cursor: 'pointer',
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
    defaultMark: {
        opacity: 0.45,
        fontStyle: 'italic',
    } as CSSProperties,
};

/**
 * Edits a function value via its `.toString()` source. Parses with
 * `new Function(...)` on blur; on parse failure, the prop is left at its
 * previous value and an inline error is shown.
 *
 * WARNING: this evaluates arbitrary JavaScript. Only use in trusted contexts
 * (developer tools, internal automation editors). Never expose this editor
 * to untrusted user input.
 */
function FunctionEditor({
    value,
    onChange,
}: {
    value: ((...args: unknown[]) => unknown) | undefined;
    onChange: (next: ((...args: unknown[]) => unknown) | undefined) => void;
}) {
    const [source, setSource] = useState<string>(value ? value.toString() : '');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSource(value ? value.toString() : '');
        setError(null);
    }, [value]);

    const handleBlur = (_e: FocusEvent<HTMLTextAreaElement>) => {
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
        <>
            <textarea
                style={propEditorStyles.textarea}
                value={source}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setSource(e.target.value)
                }
                onBlur={handleBlur}
                spellCheck={false}
                placeholder="(prev) => 'derived value'"
            />
            {error ? <div style={propEditorStyles.error}>{error}</div> : null}
            <span style={propEditorStyles.helpText}>
                Evaluated on blur. Functions only.
            </span>
        </>
    );
}

function ObjectEditor({
    value,
    onChange,
}: {
    value: Record<string, unknown>;
    onChange: (next: Record<string, unknown> | undefined) => void;
}) {
    const [source, setSource] = useState<string>(
        JSON.stringify(value, null, 2),
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setSource(JSON.stringify(value, null, 2));
        setError(null);
    }, [value]);

    const handleBlur = () => {
        const trimmed = source.trim();
        if (trimmed === '' || trimmed === '{}') {
            setError(null);
            onChange(trimmed === '{}' ? {} : undefined);
            return;
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed !== 'object' || parsed === null) {
                throw new Error('Value must be a JSON object.');
            }
            setError(null);
            onChange(parsed as Record<string, unknown>);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    };

    return (
        <>
            <textarea
                style={propEditorStyles.textarea}
                value={source}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                    setSource(e.target.value)
                }
                onBlur={handleBlur}
                spellCheck={false}
            />
            {error ? <div style={propEditorStyles.error}>{error}</div> : null}
            <span style={propEditorStyles.helpText}>
                JSON. Functions inside objects can only be edited in code.
            </span>
        </>
    );
}

/** Primitive kinds a prop can accept. Used by union editors. */
export type PropValueKind = 'boolean' | 'number' | 'string';

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
        gap: 4,
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
        padding: '1px 7px',
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

/**
 * Edits a value that can be one of several primitive kinds (e.g. `wait` is
 * `boolean | number`). Renders a small kind-toggle plus the appropriate
 * sub-editor (delegating back to `PropCell` for the chosen kind).
 */
function UnionEditor({
    value,
    onChange,
    kinds,
}: {
    value: unknown;
    onChange: (next: unknown) => void;
    kinds: ReadonlyArray<PropValueKind>;
}) {
    const currentKind = valueKind(value);
    const handleKind = (k: PropValueKind | undefined) => {
        if (k === currentKind) return;
        if (k === undefined) {
            onChange(undefined);
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
            ) : (
                <PropCell value={value} editable onChange={onChange} />
            )}
        </div>
    );
}

export interface PropCellProps {
    value: unknown;
    editable: boolean;
    onChange?: (next: unknown) => void;
    /**
     * When provided and the value is a string, the editor renders a
     * `<select>` constrained to these options instead of a free-text input.
     * Falls back to text input if the current value is not in the enum.
     */
    enumValues?: ReadonlyArray<string>;
    /**
     * Allowed primitive kinds for this prop. When provided AND editable, the
     * cell renders a small kind-toggle so the user can switch the value's
     * type (e.g. `boolean ↔ number` for `wait`). The "—" button clears to
     * `undefined` (default).
     */
    valueKinds?: ReadonlyArray<PropValueKind>;
}

/**
 * Renders a value as either a read-only display or a type-appropriate editor.
 * Type-driven, not key-driven, so it works for any prop in any schema.
 */
export function PropCell({
    value,
    editable,
    onChange,
    enumValues,
    valueKinds,
}: PropCellProps): ReactNode {
    if (editable && valueKinds && valueKinds.length > 0) {
        return (
            <UnionEditor
                value={value}
                kinds={valueKinds}
                onChange={(next) => onChange?.(next)}
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
            <pre style={propEditorStyles.readonlyBlock}>
                {(value as () => unknown).toString()}
            </pre>
        );
    }

    if (typeof value === 'object' && value !== null) {
        if (editable) {
            return (
                <ObjectEditor
                    value={value as Record<string, unknown>}
                    onChange={(next) => onChange?.(next)}
                />
            );
        }
        return (
            <pre style={propEditorStyles.readonlyBlock}>
                {JSON.stringify(value, null, 2)}
            </pre>
        );
    }

    if (typeof value === 'boolean') {
        if (!editable) return <code>{String(value)}</code>;
        return (
            <input
                type="checkbox"
                style={propEditorStyles.checkbox}
                checked={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onChange?.(e.target.checked)
                }
            />
        );
    }

    if (typeof value === 'number') {
        if (!editable) return <code>{String(value)}</code>;
        return (
            <input
                type="number"
                style={propEditorStyles.textInput}
                value={value}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const raw = e.target.value;
                    onChange?.(raw === '' ? undefined : Number(raw));
                }}
            />
        );
    }

    if (typeof value === 'string') {
        if (!editable) return <code>{JSON.stringify(value)}</code>;
        if (enumValues && enumValues.includes(value)) {
            return (
                <select
                    style={propEditorStyles.textInput}
                    value={value}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                        onChange?.(e.target.value)
                    }
                >
                    {enumValues.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }
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

    // value === undefined
    if (!editable) {
        return <span style={propEditorStyles.defaultMark}>default</span>;
    }
    if (enumValues) {
        return (
            <select
                style={propEditorStyles.textInput}
                value=""
                onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    const raw = e.target.value;
                    onChange?.(raw === '' ? undefined : raw);
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
