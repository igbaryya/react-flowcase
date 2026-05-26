import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import type { ChangeEvent, CSSProperties } from 'react';
import {
    codeEditorPreStyle,
    codeEditorShellStyle,
    flowcaseEditorLayoutCss,
    flowcasePrismCss,
} from './codeEditorTheme';

export type CodeEditorLanguage = 'javascript' | 'json';

function highlightCode(code: string, language: CodeEditorLanguage): string {
    const grammar =
        language === 'json' ? languages.json : languages.javascript;
    if (!grammar) return code;
    return highlight(code, grammar, language);
}

export interface CodeEditorBoxProps {
    value: string;
    onChange: (next: string) => void;
    onBlur?: () => void;
    language?: CodeEditorLanguage;
    placeholder?: string;
    readOnly?: boolean;
    minHeight?: number;
    maxHeight?: number;
    shellStyle?: CSSProperties;
}

export function CodeEditorBox({
    value,
    onChange,
    onBlur,
    language = 'javascript',
    placeholder,
    readOnly = false,
    minHeight = 72,
    maxHeight = 220,
    shellStyle,
}: CodeEditorBoxProps) {
    const shell: CSSProperties = {
        ...codeEditorShellStyle,
        minHeight,
        maxHeight,
        ...shellStyle,
        ...(readOnly ? { resize: 'none' } : {}),
    };

    const hostStyle: CSSProperties = {
        minHeight,
    };

    const highlighted =
        (value ? highlightCode(value, language) : '') + '<br />';

    if (readOnly) {
        return (
            <div className="flowcase-code-editor" style={shell}>
                <style>{flowcasePrismCss}</style>
                <pre
                    className="flowcase-code-editor-pre"
                    style={codeEditorPreStyle}
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
            </div>
        );
    }

    return (
        <div className="flowcase-code-editor" style={shell}>
            <style>{flowcasePrismCss}</style>
            <style>{flowcaseEditorLayoutCss}</style>
            <div className="flowcase-code-editor-host" style={hostStyle}>
                <pre
                    className="flowcase-code-editor-pre"
                    aria-hidden
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                />
                <textarea
                    className="flowcase-code-editor-textarea"
                    value={value}
                    placeholder={placeholder}
                    spellCheck={false}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        onChange(e.target.value)
                    }
                    onBlur={() => onBlur?.()}
                />
            </div>
        </div>
    );
}
