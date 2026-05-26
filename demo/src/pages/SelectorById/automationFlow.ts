import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * `#fooId` is the canonical CSS shorthand for `[id="fooId"]`. The library's
 * ElementTarget accepts any CSS selector string, so id-based targeting is the
 * most direct mode: one element per id, no index, no ambiguity.
 */
export const selectorByIdFlow: FlowStep[] = [
    { type: 'input', element: '#sid-email', value: 'alex@example.com' },
    { type: 'input', element: '#sid-name', value: 'Alex Chen' },
    {
        type: 'click',
        element: '#sid-save',
        wait: true,
        assert: (out) =>
            typeof out === 'object' && out !== null && 'ok' in out
                ? Boolean((out as { ok: unknown }).ok)
                : false,
    },
];

export const selectorByIdFlowOptions: FlowRunOptions = createFlowRunOptions(
    '[selector:id]',
);
