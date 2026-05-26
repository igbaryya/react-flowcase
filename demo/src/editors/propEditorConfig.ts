export interface JsonObjectEditorConfig {
    kind?: 'object' | 'array';
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    helpText?: string;
}

const MOVE_JSON: JsonObjectEditorConfig = {
    placeholder: '{\n  "duration": 600\n}',
    minHeight: 100,
    helpText: 'MoveOptions JSON — e.g. duration (ms). Applies on blur.',
};

const SCROLL_DELTA_JSON: JsonObjectEditorConfig = {
    placeholder: '{\n  "x": 0,\n  "y": 120\n}',
    minHeight: 88,
};

const MODIFIERS_JSON: JsonObjectEditorConfig = {
    kind: 'array',
    placeholder: '["shift"]',
    minHeight: 72,
    helpText: 'JSON array of modifier keys. Applies on blur.',
};

/** Per-prop JSON editor defaults for the demo config modal. */
export const PROP_JSON_CONFIG: Record<string, JsonObjectEditorConfig> = {
    move: MOVE_JSON,
    by: SCROLL_DELTA_JSON,
    to: SCROLL_DELTA_JSON,
    modifiers: MODIFIERS_JSON,
};
