import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * Many form libraries (react-hook-form, formik, plain `<form>` submission)
 * don't add ids — they bind via the `name` attribute. The same CSS engine
 * matches `[name="..."]`, so flows can target those inputs directly without
 * sprinkling extra ids through the markup.
 */
export const selectorByNameFlow: FlowStep[] = [
    {
        type: 'input',
        element: 'input[name="username"]',
        value: 'alex_chen',
    },
    {
        type: 'input',
        element: 'input[name="password"]',
        value: 'hunter2!',
    },
    {
        type: 'click',
        element: 'button[name="signin"]',
        wait: true,
        assert: (out) =>
            typeof out === 'object' && out !== null && 'ok' in out
                ? Boolean((out as { ok: unknown }).ok)
                : false,
    },
];

export const selectorByNameFlowOptions: FlowRunOptions = createFlowRunOptions(
    '[selector:name]',
);
