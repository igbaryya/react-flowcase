import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * When ids/names aren't available — or when you want a selector that's
 * decoupled from styling/structure — use a custom attribute. `data-testid`
 * is the de-facto testing hook; `aria-label` doubles as accessibility +
 * automation metadata.
 *
 * Any `[attr="value"]` selector resolves the same way as `#id` or
 * `[name="..."]`. No special-case code in the library.
 */
export const selectorByAttrFlow: FlowStep[] = [
    {
        type: 'click',
        element: '[data-testid="theme-toggle"]',
    },
    {
        type: 'input',
        element: '[data-testid="search-input"]',
        value: 'react-flowcase',
    },
    {
        type: 'click',
        element: '[aria-label="Run search"]',
        wait: true,
        assert: (out) =>
            typeof out === 'object' && out !== null && 'ok' in out
                ? Boolean((out as { ok: unknown }).ok)
                : false,
    },
];

export const selectorByAttrFlowOptions: FlowRunOptions = createFlowRunOptions(
    '[selector:attr]',
);
