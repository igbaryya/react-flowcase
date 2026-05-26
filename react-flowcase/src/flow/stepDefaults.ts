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

/**
 * Optional metadata describing a single prop in a configuration schema.
 * - `enumValues` (string props) — renders a `<select>` constrained to these.
 * - `valueKinds` — renders a kind-toggle for union props (e.g. `wait` is
 *   `boolean | number`), letting the user switch the value's type from the UI.
 */
export interface ConfigPropSchema {
    key: string;
    enumValues?: ReadonlyArray<string>;
    valueKinds?: ReadonlyArray<'boolean' | 'number' | 'string'>;
}

/**
 * Ordered list of editable property schemas per step type. The editor uses
 * this to render a complete set of inputs (including currently-undefined
 * optional props), so "Add step" + edit gives full coverage of the prop
 * surface.
 *
 * `type` is intentionally excluded — it drives the discriminated union and
 * cannot be edited in place. To change a step's type, delete and re-add.
 */
export const STEP_SCHEMAS: Readonly<
    Record<StepType, ReadonlyArray<ConfigPropSchema>>
> = {
    click: [
        { key: 'element' },
        { key: 'index' },
        { key: 'wait', valueKinds: ['boolean', 'number'] },
        { key: 'move' },
        { key: 'moveOnFailure' },
        { key: 'assert' },
    ],
    input: [
        { key: 'element' },
        { key: 'index' },
        { key: 'value' },
        { key: 'charDelayMs' },
        { key: 'append' },
        { key: 'move' },
        { key: 'moveOnFailure' },
        { key: 'assert' },
    ],
    select: [
        { key: 'element' },
        { key: 'index' },
        { key: 'value' },
        { key: 'move' },
        { key: 'moveOnFailure' },
        { key: 'assert' },
    ],
    delay: [{ key: 'duration' }],
    waitFor: [
        { key: 'element' },
        {
            key: 'state',
            enumValues: ['attached', 'visible', 'enabled', 'detached'],
        },
        { key: 'condition' },
        { key: 'timeout' },
        { key: 'pollInterval' },
        { key: 'index' },
        { key: 'moveTo' },
        { key: 'move' },
        { key: 'moveOnFailure' },
    ],
    hover: [
        { key: 'element' },
        { key: 'index' },
        { key: 'duration' },
        { key: 'move' },
        { key: 'moveOnFailure' },
    ],
    keypress: [
        { key: 'element' },
        { key: 'index' },
        { key: 'key' },
        { key: 'modifiers' },
        { key: 'repeat' },
        { key: 'interval' },
        { key: 'moveTo' },
        { key: 'move' },
        { key: 'moveOnFailure' },
    ],
    scroll: [
        { key: 'element' },
        { key: 'index' },
        { key: 'container' },
        { key: 'by' },
        { key: 'to' },
        { key: 'behavior', enumValues: ['auto', 'smooth'] },
        {
            key: 'block',
            enumValues: ['start', 'center', 'end', 'nearest'],
        },
        { key: 'settleMs' },
        { key: 'moveOnFailure' },
    ],
};

/** Editable schemas on `FlowRunOptions`. */
export const RUN_OPTIONS_SCHEMA: ReadonlyArray<ConfigPropSchema> = [
    { key: 'onStep' },
    { key: 'onAssertFail' },
    { key: 'autoScroll' },
];

/**
 * Editable schemas on `UseVirtualCursorOptions`. `visibility` carries enum
 * metadata so the editor renders it as a `<select>`.
 */
export const CURSOR_OPTIONS_SCHEMA: ReadonlyArray<ConfigPropSchema> = [
    { key: 'visibility', enumValues: ['always', 'onStart', 'never'] },
    { key: 'autoHide' },
    { key: 'appearance' },
];

/**
 * Returns a fresh step of the given type populated with sensible defaults -
 * just the props the discriminated union requires, so generated code stays
 * minimal.
 */
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
