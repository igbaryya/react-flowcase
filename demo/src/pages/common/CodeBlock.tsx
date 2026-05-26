import { Highlight, themes } from 'prism-react-renderer';

export interface CodeBlockProps {
    code: string;
    language?: string;
}

/**
 * Demo-side Prism renderer plugged into `<FlowCodePreview renderCode={...} />`.
 * The library itself stays dependency-free; consumers choose their highlighter.
 */
export function CodeBlock({ code, language = 'tsx' }: CodeBlockProps) {
    return (
        <Highlight
            code={code.replace(/\n$/, '')}
            language={language}
            theme={themes.nightOwl}
        >
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
                <pre
                    className={className}
                    style={{
                        ...style,
                        margin: 0,
                        padding: '16px 18px',
                        borderRadius: 10,
                        fontSize: 12,
                        lineHeight: 1.6,
                        overflow: 'auto',
                        maxHeight: 540,
                    }}
                >
                    {tokens.map((line, i) => {
                        const lineProps = getLineProps({ line });
                        return (
                            <div
                                key={i}
                                {...lineProps}
                                style={{
                                    ...lineProps.style,
                                    display: 'table-row',
                                }}
                            >
                                <span
                                    style={{
                                        display: 'table-cell',
                                        textAlign: 'right',
                                        paddingRight: 14,
                                        userSelect: 'none',
                                        opacity: 0.35,
                                        fontVariantNumeric: 'tabular-nums',
                                        minWidth: 28,
                                    }}
                                >
                                    {i + 1}
                                </span>
                                <span style={{ display: 'table-cell' }}>
                                    {line.map((token, key) => {
                                        const tp = getTokenProps({ token });
                                        return <span key={key} {...tp} />;
                                    })}
                                </span>
                            </div>
                        );
                    })}
                </pre>
            )}
        </Highlight>
    );
}
