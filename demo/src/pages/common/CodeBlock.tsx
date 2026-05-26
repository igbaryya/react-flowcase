import { useState, type CSSProperties } from 'react';
import { Highlight } from 'prism-react-renderer';
import { demoCodeTheme } from './demoCodeTheme';
import './code-block.css';

export interface CodeBlockProps {
    code: string;
    language?: string;
    /** Shown in the chrome bar (e.g. `LoginDemo.tsx`). */
    filename?: string;
    /** Show line numbers. Defaults to true. */
    lineNumbers?: boolean;
    /** Show copy button in chrome. Defaults to true. */
    showCopy?: boolean;
    /** Max height of scrollable code area. */
    maxHeight?: number | string;
}

const LANGUAGE_LABELS: Record<string, string> = {
    tsx: 'TSX',
    ts: 'TS',
    typescript: 'TS',
    javascript: 'JS',
    jsx: 'JSX',
    bash: 'Bash',
    shell: 'Shell',
    json: 'JSON',
    css: 'CSS',
};

function resolveLanguage(language: string): string {
    if (language === 'ts') return 'typescript';
    return language;
}

function languageLabel(language: string): string {
    return LANGUAGE_LABELS[language] ?? language.toUpperCase();
}

/**
 * Demo-side Prism renderer with chrome, syntax highlighting, and copy.
 * Plug into `<FlowCodePreview renderCode={...} />` in the demo flow UI.
 */
export function CodeBlock({
    code,
    language = 'tsx',
    filename,
    lineNumbers = true,
    showCopy = true,
    maxHeight = 540,
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const normalized = code.replace(/\n$/, '');
    const prismLanguage = resolveLanguage(language);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(normalized);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard blocked */
        }
    };

    return (
        <div
            className="code-block"
            style={
                {
                    '--code-block-max-height':
                        typeof maxHeight === 'number'
                            ? `${maxHeight}px`
                            : maxHeight,
                } as CSSProperties
            }
        >
            <div className="code-block-chrome">
                <div className="code-block-dots" aria-hidden>
                    <span />
                    <span />
                    <span />
                </div>
                <div className="code-block-meta">
                    <span className="code-block-lang">
                        {languageLabel(language)}
                    </span>
                    {filename ? (
                        <span className="code-block-filename">{filename}</span>
                    ) : null}
                </div>
                {showCopy ? (
                    <button
                        type="button"
                        className="code-block-copy"
                        onClick={handleCopy}
                    >
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                ) : null}
            </div>
            <div className="code-block-body">
                <Highlight
                    code={normalized}
                    language={prismLanguage}
                    theme={demoCodeTheme}
                >
                    {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre className={className} style={style}>
                            {tokens.map((line, i) => {
                                const lineProps = getLineProps({ line });
                                return (
                                    <div
                                        key={i}
                                        {...lineProps}
                                        className={`code-block-line ${lineProps.className ?? ''}`}
                                        style={lineProps.style}
                                    >
                                        {lineNumbers ? (
                                            <span className="code-block-line-no">
                                                {i + 1}
                                            </span>
                                        ) : null}
                                        <span className="code-block-line-content">
                                            {line.map((token, key) => {
                                                const tp = getTokenProps({
                                                    token,
                                                });
                                                return (
                                                    <span key={key} {...tp} />
                                                );
                                            })}
                                        </span>
                                    </div>
                                );
                            })}
                        </pre>
                    )}
                </Highlight>
            </div>
        </div>
    );
}
