import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

interface FinishOutcome {
    ok: boolean;
}

const isFinishOk = (result: unknown): boolean => {
    if (typeof result !== 'object' || result === null) return false;
    return (result as Partial<FinishOutcome>).ok === true;
};

/**
 * Three things go wrong in this flow — each one tests a different recovery
 * primitive. Steps are arranged so the indicator paints orange / red / green
 * in sequence, visually telling the story.
 *
 *  1. Type the username (happy path).
 *  2. Click "Generate avatar". The handler intentionally sleeps 3000ms but
 *     the step gives it only `wait: 1500` ms. The numeric timeout fires:
 *     `failure.reason === 'timeout'`. With `moveOnFailure: true`, the
 *     runner continues to the next step.
 *  3. Select a country (happy path).
 *  4. Click "Skip onboarding". The button doesn't render (it's only shown to
 *     returning users). The runner hits `element-not-found`, then continues
 *     thanks to `moveOnFailure: true`.
 *  5. Type a bio (happy path).
 *  6. Click "Finish setup" — wait for the handler and assert success.
 *
 * The Stop button in the header demonstrates `cancel()` at any moment.
 */
export const resilienceFlow: FlowStep[] = [
    {
        type: 'input',
        element: '#res-username',
        value: 'ada_lovelace',
    },
    {
        type: 'click',
        element: '#res-generate-avatar',
        wait: 1500,
        moveOnFailure: true,
    },
    {
        type: 'select',
        element: '#res-country',
        value: 'UK',
    },
    {
        type: 'click',
        element: '#res-skip-onboarding',
        moveOnFailure: true,
    },
    {
        type: 'input',
        element: '#res-bio',
        value: 'Building tools so cursors never have to lie about delays.',
    },
    {
        type: 'click',
        element: '#res-finish',
        wait: true,
        assert: isFinishOk,
    },
];

export const resilienceFlowOptions: FlowRunOptions =
    createFlowRunOptions('[resilience]');
