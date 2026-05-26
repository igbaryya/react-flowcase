import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
    generateFlowCode,
    generateFullExample,
    type GenerateFlowCodeOptions,
} from './codeGenerator';
import type {
    FlowRunOptions,
    FlowStep,
    UseVirtualCursorOptions,
} from 'react-flowcase';

export type FlowCodeTemplate = 'minimal' | 'full';

export interface FlowCodePreviewProps {
    flow: FlowStep[];
    runOptions?: FlowRunOptions;
    /** Cursor options to include in the generated example (full template only). */
    cursorOptions?: UseVirtualCursorOptions;
    flowVariableName?: string;
    optionsVariableName?: string;
    includeImports?: boolean;
    importSource?: string;
    /**
     * `'minimal'` (default) outputs just the flow + options.
     * `'full'` outputs a complete React component scaffold using the library.
     */
    template?: FlowCodeTemplate;
    /** Name of the component emitted by the `'full'` template. */
    componentName?: string;
    /**
     * Custom renderer for the code body. Use this to plug in syntax
     * highlighting (e.g. Prism, Shiki). Receives the generated source string;
     * must return the full `<pre>` block (own styling). Default: plain `<pre><code>`.
     */
    renderCode?: (code: string) => ReactNode;
    title?: string;
    className?: string;
    style?: CSSProperties;
}

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 12,
        minWidth: 0,
        width: '100%',
    } as CSSProperties,
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    } as CSSProperties,
    title: {
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        opacity: 0.6,
        margin: 0,
    } as CSSProperties,
    copyBtn: {
        background: 'transparent',
        border: '1px solid rgba(127, 127, 127, 0.25)',
        color: 'inherit',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11,
        cursor: 'pointer',
        opacity: 0.85,
    } as CSSProperties,
    code: {
        background: 'rgba(127, 127, 127, 0.08)',
        border: '1px solid rgba(127, 127, 127, 0.15)',
        borderRadius: 8,
        padding: 12,
        margin: 0,
        overflow: 'auto',
        fontSize: 11,
        lineHeight: 1.55,
        whiteSpace: 'pre',
        minWidth: 0,
    } as CSSProperties,
};

/**
 * Renders the TypeScript source that would recreate the given `flow` (and
 * optional `runOptions`). Read-only, updates live when the props change.
 */
export function FlowCodePreview({
    flow,
    runOptions,
    cursorOptions,
    flowVariableName,
    optionsVariableName,
    includeImports,
    importSource,
    template = 'minimal',
    componentName,
    renderCode,
    title = 'Generated code',
    className,
    style,
}: FlowCodePreviewProps) {
    const code = useMemo(() => {
        const opts: GenerateFlowCodeOptions = {
            flow,
            runOptions,
            flowVariableName,
            optionsVariableName,
            includeImports,
            importSource,
        };
        return template === 'full'
            ? generateFullExample({ ...opts, componentName, cursorOptions })
            : generateFlowCode(opts);
    }, [
        flow,
        runOptions,
        cursorOptions,
        flowVariableName,
        optionsVariableName,
        includeImports,
        importSource,
        template,
        componentName,
    ]);

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard API unavailable; user can still select & copy manually.
        }
    };

    return (
        <div className={className} style={{ ...styles.root, ...style }}>
            <div style={styles.header}>
                <h4 style={styles.title}>{title}</h4>
                <button
                    type="button"
                    style={styles.copyBtn}
                    onClick={handleCopy}
                >
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            {renderCode ? (
                renderCode(code)
            ) : (
                <pre style={styles.code}>
                    <code>{code}</code>
                </pre>
            )}
        </div>
    );
}
