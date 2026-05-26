import { useEffect, useState } from 'react';
import type { PropEditorRenderProps } from '../flow';
import { CodeEditorBox } from './CodeEditorBox';
import { formatFunctionSource } from './functionSource';
import { JsonObjectEditor } from './JsonObjectEditor';
import { PROP_JSON_CONFIG } from './propEditorConfig';

const wrapStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
    minWidth: 0,
    width: '100%',
};

const errorStyle = {
    color: '#ef5b6b',
    fontSize: 10,
    marginTop: 4,
};

const helpStyle = {
    display: 'block',
    opacity: 0.45,
    fontSize: 10,
    marginTop: 2,
};

function DemoFunctionEditor({
    value,
    onChange,
    editable,
}: {
    value: ((...args: unknown[]) => unknown) | undefined;
    onChange: (next: ((...args: unknown[]) => unknown) | undefined) => void;
    editable: boolean;
}) {
    const [source, setSource] = useState(() =>
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

    if (!editable) {
        return (
            <CodeEditorBox
                value={source}
                onChange={() => {}}
                language="javascript"
                readOnly
                minHeight={88}
            />
        );
    }

    return (
        <div style={wrapStyle}>
            <CodeEditorBox
                value={source}
                onChange={setSource}
                onBlur={handleBlur}
                language="javascript"
                placeholder="(prev) => 'derived value'"
                minHeight={88}
                maxHeight={240}
            />
            {error ? (
                <div style={errorStyle} role="alert">
                    {error}
                </div>
            ) : null}
            <span style={helpStyle}>Evaluated on blur. Functions only.</span>
        </div>
    );
}

function jsonText(value: unknown): string {
    if (value === undefined) return '';
    return JSON.stringify(
        value,
        (_key, v) => (typeof v === 'function' ? undefined : v),
        2,
    );
}

/**
 * Demo-only rich editors for function / JSON object flow props (move, assert, …).
 * Wired via FlowConfigModal `renderPropEditor`.
 */
export function DemoPropEditor({
    propKey,
    value,
    valueType,
    editable,
    onChange,
}: PropEditorRenderProps) {
    if (valueType === 'function' || typeof value === 'function') {
        return (
            <DemoFunctionEditor
                value={
                    typeof value === 'function'
                        ? (value as (...args: unknown[]) => unknown)
                        : undefined
                }
                onChange={onChange}
                editable={editable}
            />
        );
    }

    if (
        valueType === 'object' ||
        (typeof value === 'object' && value !== null)
    ) {
        if (!editable) {
            return (
                <CodeEditorBox
                    value={jsonText(value)}
                    onChange={() => {}}
                    language="json"
                    readOnly
                    minHeight={72}
                />
            );
        }
        return (
            <JsonObjectEditor
                value={value}
                onChange={onChange}
                config={PROP_JSON_CONFIG[propKey]}
            />
        );
    }

    return null;
}
