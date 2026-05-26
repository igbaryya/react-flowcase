import { describeStep, type FlowRunOptions } from 'react-flowcase';

/** Shared console logging for demo flows (editable in FlowConfigModal). */
export function createFlowRunOptions(logPrefix: string): FlowRunOptions {
    return {
        onStep: (step, outcome) => {
            // eslint-disable-next-line no-console
            console.log(
                logPrefix,
                step.type,
                describeStep(step),
                '->',
                outcome,
            );
        },
        onAssertFail: (step, outcome) => {
            // eslint-disable-next-line no-console
            console.error(
                logPrefix,
                'assertion failed',
                step.type,
                describeStep(step),
                outcome,
            );
        },
    };
}
