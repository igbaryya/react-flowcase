import type { PrismTheme } from 'prism-react-renderer';

/** Dark theme aligned with the demo site palette. */
export const demoCodeTheme: PrismTheme = {
    plain: {
        color: '#e6e8ee',
        backgroundColor: '#12151c',
    },
    styles: [
        {
            types: ['comment', 'prolog', 'doctype', 'cdata'],
            style: { color: '#6a7385', fontStyle: 'italic' },
        },
        {
            types: ['namespace'],
            style: { opacity: 0.7 },
        },
        {
            types: ['string', 'char', 'attr-value', 'regex'],
            style: { color: '#58c87b' },
        },
        {
            types: ['number', 'boolean', 'constant', 'symbol'],
            style: { color: '#fab259' },
        },
        {
            types: ['keyword', 'builtin', 'important'],
            style: { color: '#b084fc' },
        },
        {
            types: ['function', 'class-name', 'tag', 'selector'],
            style: { color: '#6aa9ff' },
        },
        {
            types: ['operator', 'punctuation', 'entity'],
            style: { color: '#9aa1b1' },
        },
        {
            types: ['property', 'attr-name', 'variable'],
            style: { color: '#5ed3d6' },
        },
        {
            types: ['deleted'],
            style: { color: '#ef5b6b' },
        },
        {
            types: ['inserted'],
            style: { color: '#58c87b' },
        },
    ],
};
