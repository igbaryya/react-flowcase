import type { CSSProperties } from 'react';

/** Token colors aligned with the demo site palette. */
export const flowcasePrismCss = `
.flowcase-code-editor .token.comment,
.flowcase-code-editor .token.prolog,
.flowcase-code-editor .token.doctype,
.flowcase-code-editor .token.cdata {
    color: #6a7385;
    font-style: italic;
}
.flowcase-code-editor .token.namespace {
    opacity: 0.7;
}
.flowcase-code-editor .token.string,
.flowcase-code-editor .token.char,
.flowcase-code-editor .token.attr-value,
.flowcase-code-editor .token.regex {
    color: #58c87b;
}
.flowcase-code-editor .token.number,
.flowcase-code-editor .token.boolean,
.flowcase-code-editor .token.constant,
.flowcase-code-editor .token.symbol {
    color: #fab259;
}
.flowcase-code-editor .token.keyword,
.flowcase-code-editor .token.builtin,
.flowcase-code-editor .token.important {
    color: #b084fc;
}
.flowcase-code-editor .token.function,
.flowcase-code-editor .token.class-name,
.flowcase-code-editor .token.tag,
.flowcase-code-editor .token.selector {
    color: #6aa9ff;
}
.flowcase-code-editor .token.operator,
.flowcase-code-editor .token.punctuation,
.flowcase-code-editor .token.entity {
    color: #9aa1b1;
}
.flowcase-code-editor .token.property,
.flowcase-code-editor .token.attr-name,
.flowcase-code-editor .token.variable {
    color: #5ed3d6;
}
.flowcase-code-editor .token.deleted {
    color: #ef5b6b;
}
.flowcase-code-editor .token.inserted {
    color: #58c87b;
}
`;

/** Layered textarea + highlighted pre (editable mode). */
export const flowcaseEditorLayoutCss = `
.flowcase-code-editor-host {
    position: relative;
    text-align: left;
    box-sizing: border-box;
    width: 100%;
}
.flowcase-code-editor-pre {
    margin: 0;
    padding: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    color: #e6e8ee;
    pointer-events: none;
}
.flowcase-code-editor-textarea {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 10px;
    border: 0;
    background: transparent;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    line-height: 1.55;
    white-space: pre-wrap;
    word-break: break-word;
    resize: none;
    color: transparent;
    -webkit-text-fill-color: transparent;
    caret-color: #e6e8ee;
    outline: none;
    overflow: hidden;
    box-sizing: border-box;
}
.flowcase-code-editor-textarea::placeholder {
    color: rgba(230, 232, 238, 0.4);
    -webkit-text-fill-color: rgba(230, 232, 238, 0.4);
}
.flowcase-code-editor-textarea::selection {
    background: rgba(106, 169, 255, 0.45);
}
`;

export const codeEditorShellStyle: CSSProperties = {
    background: '#12151c',
    border: '1px solid rgba(127, 127, 127, 0.28)',
    borderRadius: 8,
    overflow: 'auto',
    minHeight: 72,
    maxHeight: 220,
    resize: 'vertical',
    width: '100%',
    boxSizing: 'border-box',
};

export const codeEditorPreStyle: CSSProperties = {
    margin: 0,
    padding: '8px 10px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 11,
    lineHeight: 1.55,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: '#e6e8ee',
};
