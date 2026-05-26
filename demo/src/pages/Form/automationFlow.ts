import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * Structural view of what the submit handler resolves with. We only depend on
 * `.ok` here so the assertion stays decoupled from the form component.
 */
interface SubmitOutcome {
    ok: boolean;
}

const isSubmitSuccess = (result: unknown): boolean => {
    if (typeof result !== 'object' || result === null) return false;
    return (result as Partial<SubmitOutcome>).ok === true;
};

export const registrationFlow: FlowStep[] = [
    {
        type: 'input',
        element: '#reg-fullName',
        value: 'Ada Lovelace',
    },
    {
        type: 'input',
        element: '#reg-email',
        value: 'ada@example.com',
    },
    {
        type: 'input',
        element: '#reg-password',
        value: 'analytical-engine-1843',
    },
    {
        type: 'input',
        element: '#reg-confirmPassword',
        value: (prev) => String(prev ?? ''),
    },
    {
        type: 'select',
        element: '#reg-country',
        value: 'UK',
    },
    {
        type: 'click',
        element: '#reg-submit',
        wait: true,
        assert: isSubmitSuccess,
    },
];

export const registrationFlowOptions: FlowRunOptions =
    createFlowRunOptions('[registration]');
