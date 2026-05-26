import Editor from '@monaco-editor/react';
import { useMemo } from 'react';
import './json-readonly-viewer.css';

export interface JsonReadonlyViewerProps {
    value: unknown;
    /** Max editor height in px. Defaults to 280. */
    maxHeight?: number;
}

function toJsonText(value: unknown): string {
    if (value === undefined) return '';
    try {
        return JSON.stringify(
            value,
            (_key, v) => (typeof v === 'function' ? undefined : v),
            2,
        );
    } catch {
        return String(value);
    }
}

const LINE_HEIGHT = 17;
const EDITOR_PADDING_Y = 10;

export function JsonReadonlyViewer({
    value,
    maxHeight = 220,
}: JsonReadonlyViewerProps) {
    const text = useMemo(() => toJsonText(value), [value]);
    const { height, scrollable } = useMemo(() => {
        const lines = Math.max(1, text.split('\n').length);
        const natural = lines * LINE_HEIGHT + EDITOR_PADDING_Y;
        return {
            height: Math.min(maxHeight, natural),
            scrollable: natural > maxHeight,
        };
    }, [text, maxHeight]);

    if (!text) {
        return null;
    }

    return (
        <div className="json-readonly-viewer">
            <Editor
                height={`${height}px`}
                language="json"
                theme="vs-dark"
                value={text}
                options={{
                    readOnly: true,
                    domReadOnly: true,
                    minimap: { enabled: false },
                    fontSize: 12,
                    lineHeight: LINE_HEIGHT,
                    padding: { top: 6, bottom: 4 },
                    lineNumbers: 'off',
                    glyphMargin: false,
                    folding: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: 'on',
                    contextmenu: false,
                    scrollbar: {
                        vertical: scrollable ? 'auto' : 'hidden',
                        horizontal: 'hidden',
                        handleMouseWheel: scrollable,
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    renderLineHighlight: 'none',
                    selectionHighlight: false,
                    occurrencesHighlight: 'off',
                }}
            />
        </div>
    );
}
