import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

interface SaveOutcome {
    ok: boolean;
}

const isSaveSuccess = (result: unknown): boolean => {
    if (typeof result !== 'object' || result === null) return false;
    return (result as Partial<SaveOutcome>).ok === true;
};

/**
 * Showcases `waitFor`:
 *  1. Click "Load profile" — fire-and-forget. The handler kicks off a 1.5s
 *     simulated fetch and then mounts the form.
 *  2. Wait for the lazily-rendered name input to appear. No fixed delay.
 *  3. Type into the inputs as soon as they exist.
 *  4. Wait for the Save button to flip from disabled → enabled (it requires
 *     both fields to be non-empty, so this is a real "wait for the UI to
 *     decide it's ready" moment).
 *  5. Click Save and assert the resolved payload.
 */
export const asyncProfileFlow: FlowStep[] = [
    {
        type: 'click',
        element: '#load-profile',
        wait: false,
    },
    {
        type: 'waitFor',
        element: '#profile-name',
        state: 'visible',
        timeout: 5000,
        moveTo: true,
    },
    {
        type: 'input',
        element: '#profile-name',
        value: 'Ada Lovelace',
    },
    {
        type: 'input',
        element: '#profile-bio',
        value: 'First programmer. Patron saint of analytical engines.',
    },
    {
        type: 'waitFor',
        element: '#profile-save',
        state: 'enabled',
        timeout: 2000,
    },
    {
        type: 'click',
        element: '#profile-save',
        wait: true,
        assert: isSaveSuccess,
    },
];

export const asyncProfileFlowOptions: FlowRunOptions =
    createFlowRunOptions('[async-profile]');
