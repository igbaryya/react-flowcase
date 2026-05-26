import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

interface VerifyOutcome {
    ok: boolean;
    code?: string;
    reason?: string;
}

const isVerified = (out: unknown): boolean => {
    if (typeof out !== 'object' || out === null) return false;
    return (out as Partial<VerifyOutcome>).ok === true;
};

/**
 * Three verification attempts:
 *
 *  1-2: Bad codes. The submit handler resolves with `{ ok: false }`. The
 *       step's `assert` returns false → `failure.reason: 'assertion-failed'`.
 *       `moveOnFailure: true` lets the run continue. `onAssertFail` (wired in
 *       run options) fires for observability.
 *  3:   The correct code. The assertion passes and the flow completes.
 *
 * The same `assert` function is used on all three submit clicks — it's the
 * outcome data that differs.
 */
export const assertionsFlow: FlowStep[] = [
    {
        type: 'input',
        element: '#verify-code',
        value: 'WRONG-1',
    },
    {
        type: 'click',
        element: '#verify-submit',
        wait: true,
        assert: isVerified,
        moveOnFailure: true,
    },
    {
        type: 'input',
        element: '#verify-code',
        value: 'WRONG-2',
    },
    {
        type: 'click',
        element: '#verify-submit',
        wait: true,
        assert: isVerified,
        moveOnFailure: true,
    },
    {
        type: 'input',
        element: '#verify-code',
        value: 'CURSOR-2026',
    },
    {
        type: 'click',
        element: '#verify-submit',
        wait: true,
        assert: isVerified,
    },
];

/**
 * Wraps the shared run options to add an `onAssertFail` handler. The handler
 * is editable from the gear icon's Run options tab so users can swap it for
 * their own telemetry / retry logic.
 */
export const assertionsFlowOptions: FlowRunOptions = {
    ...createFlowRunOptions('[assertions]'),
    onAssertFail: (step, outcome) => {
        // eslint-disable-next-line no-console
        console.warn('[assertions] assert returned false', {
            step: step.type,
            outcome,
        });
    },
};
