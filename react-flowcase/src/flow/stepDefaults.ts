import type { MsSliderConfig, PropValueType } from './PropEditor';
import { propDescription, type PropDescriptionKey } from './propDescriptions';
import type { FlowStep } from './types';

export type StepType = FlowStep['type'];

/** All step types known to the runner. Used by the editor's "Add step" picker. */
export const STEP_TYPES: ReadonlyArray<StepType> = [
    'click',
    'input',
    'select',
    'delay',
    'waitFor',
    'hover',
    'keypress',
    'scroll',
];

export interface JsonObjectEditorConfig {
    /** JSON object (default) or array (e.g. `modifiers`). */
    kind?: 'object' | 'array';
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    helpText?: string;
}

export interface ConfigPropSchema {
    key: string;
    description?: string;
    valueType?: PropValueType;
    enumValues?: ReadonlyArray<string>;
    valueKinds?: ReadonlyArray<'boolean' | 'number' | 'string'>;
    msSlider?: MsSliderConfig;
    /** Options when `valueType` is `'object'` (e.g. `move`, `by`, `to`). */
    jsonObject?: JsonObjectEditorConfig;
}

type SchemaRest = Omit<ConfigPropSchema, 'key' | 'description'>;

const MOVE_JSON_OBJECT: JsonObjectEditorConfig = {
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

function sp(
    key: PropDescriptionKey,
    rest: SchemaRest & { description?: string } = {},
): ConfigPropSchema {
    const { description, ...schemaRest } = rest;
    return {
        key,
        description: propDescription(key, description),
        ...schemaRest,
    };
}

export const STEP_SCHEMAS: Readonly<
    Record<StepType, ReadonlyArray<ConfigPropSchema>>
> = {
    click: [
        sp('element', { valueType: 'string' }),
        sp('index', { valueType: 'number' }),
        sp('wait', {
            valueKinds: ['boolean', 'number'],
            msSlider: { min: 0, max: 30000, step: 250, defaultMs: 5000 },
        }),
        sp('move', { valueType: 'object', jsonObject: MOVE_JSON_OBJECT }),
        sp('moveOnFailure', { valueType: 'boolean' }),
        sp('assert', { valueType: 'function' }),
    ],
    input: [
        sp('element', { valueType: 'string' }),
        sp('index', { valueType: 'number' }),
        sp('value', { valueType: 'string' }),
        sp('charDelayMs', {
            valueType: 'number',
            msSlider: { min: 0, max: 300, step: 5, defaultMs: 50 },
        }),
        sp('append', { valueType: 'boolean' }),
        sp('move', { valueType: 'object', jsonObject: MOVE_JSON_OBJECT }),
        sp('moveOnFailure', { valueType: 'boolean' }),
        sp('assert', { valueType: 'function' }),
    ],
    select: [
        sp('element', { valueType: 'string' }),
        sp('index', { valueType: 'number' }),
        sp('value', { valueType: 'string' }),
        sp('move', { valueType: 'object', jsonObject: MOVE_JSON_OBJECT }),
        sp('moveOnFailure', { valueType: 'boolean' }),
        sp('assert', { valueType: 'function' }),
    ],
    delay: [
        sp('duration', {
            valueType: 'number',
            msSlider: { min: 0, max: 15000, step: 50, defaultMs: 1000 },
            description:
                'Milliseconds to pause before the next step. No cursor movement.',
        }),
    ],
    waitFor: [
        sp('element', { valueType: 'string' }),
        sp('state', {
            valueType: 'string',
            enumValues: ['attached', 'visible', 'enabled', 'detached'],
        }),
        sp('condition', { valueType: 'function' }),
        sp('timeout', {
            valueType: 'number',
            msSlider: { min: 500, max: 30000, step: 250, defaultMs: 5000 },
        }),
        sp('pollInterval', {
            valueType: 'number',
            msSlider: { min: 10, max: 500, step: 10, defaultMs: 50 },
        }),
        sp('index', { valueType: 'number' }),
        sp('moveTo', { valueType: 'boolean' }),
        sp('move', { valueType: 'object', jsonObject: MOVE_JSON_OBJECT }),
        sp('moveOnFailure', { valueType: 'boolean' }),
    ],
    hover: [
        sp('element', { valueType: 'string' }),
        sp('index', { valueType: 'number' }),
        sp('duration', {
            valueType: 'number',
            msSlider: { min: 0, max: 5000, step: 50, defaultMs: 600 },
            description:
                'How long the cursor lingers on the element after arriving. Default 600ms.',
        }),
        sp('move', { valueType: 'object', jsonObject: MOVE_JSON_OBJECT }),
        sp('moveOnFailure', { valueType: 'boolean' }),
    ],
    keypress: [
        sp('element', { valueType: 'string' }),
        sp('index', { valueType: 'number' }),
        sp('key', { valueType: 'string' }),
        sp('modifiers', { valueType: 'object', jsonObject: MODIFIERS_JSON }),
        sp('repeat', { valueType: 'number' }),
        sp('interval', {
            valueType: 'number',
            msSlider: { min: 10, max: 500, step: 10, defaultMs: 80 },
        }),
        sp('moveTo', { valueType: 'boolean' }),
        sp('move', { valueType: 'object', jsonObject: MOVE_JSON_OBJECT }),
        sp('moveOnFailure', { valueType: 'boolean' }),
    ],
    scroll: [
        sp('element', { valueType: 'string' }),
        sp('index', { valueType: 'number' }),
        sp('container', { valueType: 'string' }),
        sp('by', { valueType: 'object', jsonObject: SCROLL_DELTA_JSON }),
        sp('to', { valueType: 'object', jsonObject: SCROLL_DELTA_JSON }),
        sp('behavior', {
            valueType: 'string',
            enumValues: ['auto', 'smooth'],
        }),
        sp('block', {
            valueType: 'string',
            enumValues: ['start', 'center', 'end', 'nearest'],
        }),
        sp('settleMs', {
            valueType: 'number',
            msSlider: { min: 0, max: 2000, step: 50, defaultMs: 350 },
        }),
        sp('moveOnFailure', { valueType: 'boolean' }),
    ],
};

export const RUN_OPTIONS_SCHEMA: ReadonlyArray<ConfigPropSchema> = [
    sp('onStep', { valueType: 'function' }),
    sp('onAssertFail', { valueType: 'function' }),
    sp('autoScroll', { valueType: 'boolean' }),
];

export const CURSOR_OPTIONS_SCHEMA: ReadonlyArray<ConfigPropSchema> = [
    sp('visibility', {
        valueType: 'string',
        enumValues: ['always', 'onStart', 'never'],
    }),
    sp('autoHide', { valueType: 'boolean' }),
    sp('appearance', { valueType: 'string' }),
];

export function createDefaultStep(type: StepType): FlowStep {
    switch (type) {
        case 'click':
            return { type: 'click', element: '' };
        case 'input':
            return { type: 'input', element: '', value: '' };
        case 'select':
            return { type: 'select', element: '', value: '' };
        case 'delay':
            return { type: 'delay', duration: 1000 };
        case 'waitFor':
            return {
                type: 'waitFor',
                element: '',
                state: 'visible',
                timeout: 5000,
            };
        case 'hover':
            return { type: 'hover', element: '', duration: 600 };
        case 'keypress':
            return { type: 'keypress', key: 'Enter' };
        case 'scroll':
            return { type: 'scroll', element: '', behavior: 'smooth' };
    }
}
