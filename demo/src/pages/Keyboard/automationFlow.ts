import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * Keyboard-driven command palette flow:
 *
 *   1. Cmd/Ctrl+K opens the palette (`document.body` is the natural target
 *      for global shortcuts).
 *   2. Type into the focused search field.
 *   3. ArrowDown twice to skip the first match.
 *   4. Enter to commit the selection.
 *   5. Escape on body to close the palette afterwards.
 *
 * Notice that several steps have no `element` — the keypress falls back
 * to the focused element, which is exactly how a real keyboard works.
 */
export const keyboardFlow: FlowStep[] = [
    {
        type: 'keypress',
        key: 'k',
        modifiers: ['meta'],
        moveTo: false,
    },
    {
        type: 'waitFor',
        element: '#palette-search',
        state: 'visible',
        timeout: 2000,
    },
    {
        type: 'input',
        element: '#palette-search',
        value: 'set',
        charDelayMs: 70,
    },
    {
        type: 'keypress',
        key: 'ArrowDown',
        repeat: 2,
        interval: 120,
    },
    {
        type: 'keypress',
        key: 'Enter',
    },
    {
        type: 'delay',
        duration: 400,
    },
    {
        type: 'keypress',
        key: 'Escape',
        moveTo: false,
    },
];

export const keyboardFlowOptions: FlowRunOptions =
    createFlowRunOptions('[keyboard]');
