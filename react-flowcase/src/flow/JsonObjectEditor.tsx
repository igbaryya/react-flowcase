import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { CodeEditorBox } from './CodeEditorBox';
import type { JsonObjectEditorConfig } from './stepDefaults';

const toolbarStyles = {
    wrap: {
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
        width: '100%',
    } as CSSProperties,
    bar: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    } as CSSProperties,
    btn: {
        background: 'rgba(106, 169, 255, 0.15)',
        border: '1px solid rgba(106, 169, 255, 0.35)',
        color: '#6aa9ff',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 10,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
    } as CSSProperties,
    hint: {
        fontSize: 10,
        opacity: 0.45,
    } as CSSProperties,
    error: {
        color: '#ef5b6b',
        fontSize: 10,
        marginTop: 4,
    } as CSSProperties,
};

type JsonKind = NonNullable<JsonObjectEditorConfig['kind']>;

function valueToJsonText(value: unknown): string {
    if (value === undefined) return '';
    return JSON.stringify(
        value,
        (_key, v) => (typeof v === 'function' ? undefined : v),
        2,
    );
}

function parseJsonValue(
    text: string,
    kind: JsonKind,
): { value?: unknown; error?: string } {
    const trimmed = text.trim();
    if (trimmed === '') {
        return { value: undefined };
    }
    try {
        const parsed: unknown = JSON.parse(trimmed);
        if (kind === 'array') {
            if (!Array.isArray(parsed)) {
                return { error: 'Value must be a JSON array.' };
            }
            return { value: parsed };
        }
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
            return { error: 'Value must be a JSON object.' };
        }
        return { value: parsed };
    } catch (e) {
        return {
            error: e instanceof Error ? e.message : String(e),
        };
    }
}

export interface JsonObjectEditorProps {
    value: unknown;
    onChange: (next: unknown) => void;
    config?: JsonObjectEditorConfig;
}

export function JsonObjectEditor({
    value,
    onChange,
    config,
}: JsonObjectEditorProps) {
    const kind = config?.kind ?? 'object';
    const placeholder =
        config?.placeholder ?? (kind === 'array' ? '[]' : '{\n  \n}');
    const minHeight = config?.minHeight ?? 96;
    const maxHeight = config?.maxHeight ?? 200;
    const helpText =
        config?.helpText ??
        (kind === 'array'
            ? 'JSON array. Leave empty for default. Applies on blur.'
            : 'JSON object. Leave empty for default. Applies on blur.');

    const [source, setSource] = useState(() => valueToJsonText(value));
    const [error, setError] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const dirtyRef = useRef(false);
    const valueRef = useRef(value);

    valueRef.current = value;

    useEffect(() => {
        if (dirtyRef.current) return;
        setSource(valueToJsonText(value));
        setError(null);
    }, [value]);

    const applySource = useCallback(
        (text: string): boolean => {
            const canonical = valueToJsonText(valueRef.current);
            const trimmed = text.trim();
            if (trimmed === '' && valueRef.current === undefined) {
                dirtyRef.current = false;
                return true;
            }
            if (trimmed !== '' && text === canonical) {
                dirtyRef.current = false;
                return true;
            }

            const result = parseJsonValue(text, kind);
            if (result.error) {
                setError(result.error);
                return false;
            }
            setError(null);
            dirtyRef.current = false;
            onChange(result.value);
            setSource(
                result.value !== undefined ? valueToJsonText(result.value) : '',
            );
            return true;
        },
        [kind, onChange],
    );

    const flush = useCallback(() => {
        applySource(source);
    }, [applySource, source]);

    const flushRef = useRef(flush);
    flushRef.current = flush;

    useEffect(() => {
        const onPointerDown = (event: PointerEvent) => {
            if (!dirtyRef.current) return;
            const root = rootRef.current;
            if (!root || root.contains(event.target as Node)) return;
            flushRef.current();
        };
        document.addEventListener('pointerdown', onPointerDown, true);
        return () =>
            document.removeEventListener('pointerdown', onPointerDown, true);
    }, []);

    const handleChange = (next: string) => {
        dirtyRef.current = true;
        setSource(next);
        setError(null);
    };

    const handleBlur = () => {
        applySource(source);
    };

    const handleFormat = () => {
        const result = parseJsonValue(source, kind);
        if (result.error && source.trim() !== '') {
            setError(result.error);
            return;
        }
        const formatted =
            result.value !== undefined ? valueToJsonText(result.value) : '';
        dirtyRef.current = true;
        setSource(formatted);
        applySource(formatted);
    };

    return (
        <div ref={rootRef} style={toolbarStyles.wrap}>
            <div style={toolbarStyles.bar}>
                <button
                    type="button"
                    style={toolbarStyles.btn}
                    onClick={handleFormat}
                >
                    Format JSON
                </button>
                <span style={toolbarStyles.hint}>{helpText}</span>
            </div>
            <CodeEditorBox
                value={source}
                onChange={handleChange}
                onBlur={handleBlur}
                language="json"
                placeholder={placeholder}
                minHeight={minHeight}
                maxHeight={maxHeight}
            />
            {error ? (
                <div style={toolbarStyles.error} role="alert">
                    {error}
                </div>
            ) : null}
        </div>
    );
}
