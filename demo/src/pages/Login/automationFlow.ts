import {
    createSessionStoragePersistence,
    type FlowRunOptions,
    type FlowStep,
} from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';


interface LoginOutcome {
    ok: boolean;
}

const isLoginSuccess = (result: unknown): boolean => {
    if (typeof result !== 'object' || result === null) return false;
    return (result as Partial<LoginOutcome>).ok === true;
};

/**
 * Full Login → Dashboard flow. Spans two pages:
 * 1. Login form (steps 0-2): fill email, password, click submit
 * 2. Dashboard (steps 3-4): wait 3s, click signout
 *
 * The flow persists to sessionStorage so it resumes after page navigation.
 */
export const loginFlow: FlowStep[] = [
    // Login page
    {
        type: 'input',
        element: '#login-email',
        value: 'demo@react-cursor.dev',
    },
    {
        type: 'input',
        element: '#login-password',
        value: 'cursor-flow-42',
    },
    {
        type: 'click',
        element: '#login-submit',
        wait: true,
        assert: isLoginSuccess,
    },
    // Dashboard page (after redirect)
    {
        type: 'delay',
        duration: 3000, // wait 3 seconds
    },
    {
        type: 'click',
        element: '#signout-btn',
        wait: false, // fire-and-forget, page will navigate away
    },
];

export const loginFlowOptions: FlowRunOptions =
    createFlowRunOptions('[login]');

/** Persistence for cross-page flow resumption. */
export const loginPersistence = createSessionStoragePersistence(
    'login-automation-flow',
);
