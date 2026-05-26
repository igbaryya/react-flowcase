import Editor, { type OnMount } from '@monaco-editor/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FlowJsonEditorRenderProps } from 'react-flowcase';
import { flowToJsonText, parseFlowJsonText } from './flowJson';
import './flow-json-editor.css';

export function FlowJsonMonacoEditor({
    flow,
    editable,
    onChange,
    registerFlush,
}: FlowJsonEditorRenderProps) {
    const [text, setText] = useState(() => flowToJsonText(flow));
    const [error, setError] = useState<string | null>(null);
    const rootRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const flowRef = useRef(flow);
    const dirtyRef = useRef(false);
    const flushRef = useRef<() => void>(() => {});

    flowRef.current = flow;

    useEffect(() => {
        if (dirtyRef.current) return;
        setText(flowToJsonText(flow));
        setError(null);
    }, [flow]);

    const applyText = useCallback(
        (nextText: string): boolean => {
            const result = parseFlowJsonText(nextText, flowRef.current);
            if (result.error) {
                setError(result.error);
                return false;
            }
            setError(null);
            dirtyRef.current = false;
            if (result.flow) {
                onChange(result.flow);
                setText(flowToJsonText(result.flow));
            }
            return true;
        },
        [onChange],
    );

    const flushEditor = useCallback(() => {
        if (!editable) return;
        const value = editorRef.current?.getValue();
        if (value === undefined) return;
        if (value === flowToJsonText(flowRef.current)) {
            dirtyRef.current = false;
            return;
        }
        applyText(value);
    }, [applyText, editable]);

    flushRef.current = flushEditor;

    useEffect(() => {
        registerFlush?.(flushEditor);
        return () => registerFlush?.(null);
    }, [flushEditor, registerFlush]);

    const handleMount: OnMount = (monacoEditor) => {
        editorRef.current = monacoEditor;
        monacoEditor.onDidBlurEditorText(() => {
            flushRef.current();
        });
    };

    useEffect(() => {
        return () => {
            flushRef.current();
        };
    }, []);

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

    const handleFormat = () => {
        editorRef.current
            ?.getAction('editor.action.formatDocument')
            ?.run()
            .then(() => {
                const formatted = editorRef.current?.getValue() ?? '';
                dirtyRef.current = true;
                setText(formatted);
                applyText(formatted);
            });
    };

    const handleChange = (value: string | undefined) => {
        dirtyRef.current = true;
        setText(value ?? '');
        setError(null);
    };

    return (
        <div ref={rootRef} className="flow-json-editor">
            <div className="flow-json-editor-toolbar">
                <button
                    type="button"
                    className="flow-json-editor-btn"
                    onClick={handleFormat}
                    disabled={!editable}
                >
                    Format JSON
                </button>
                <span className="flow-json-editor-toolbar-hint">
                    Applies when you click outside or switch to Form. Omitted{' '}
                    <code>assert</code> / <code>condition</code> /{' '}
                    <code>value</code> restore functions from Form mode;
                    explicit JSON overrides.
                </span>
            </div>
            <div className="flow-json-editor-surface">
                <Editor
                    height="360px"
                    language="json"
                    theme="vs-dark"
                    value={text}
                    onChange={handleChange}
                    onMount={handleMount}
                    options={{
                        readOnly: !editable,
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: 'on',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        formatOnPaste: true,
                    }}
                />
            </div>
            {error ? (
                <p className="flow-json-editor-error" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}
