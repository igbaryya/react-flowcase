import {
    type FlowRunOptions,
    type FlowStep,
} from 'react-flowcase';
import { type RefObject } from 'react';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * Refs unblock the cases where no stable CSS selector exists — third-party
 * widgets, portals, dynamically-mounted dialogs, or components whose ids are
 * generated at runtime (e.g. `useId()`).
 *
 * Because refs don't exist until the component mounts, the flow is built
 * inside the component and the refs are passed into this factory. The shape
 * accepted by `ElementTarget` is `{ readonly current: HTMLElement | null }`,
 * which matches React's `RefObject` exactly.
 */
export function buildSelectorByRefFlow(refs: {
    fullNameRef: RefObject<HTMLInputElement | null>;
    bioRef: RefObject<HTMLTextAreaElement | null>;
    saveRef: RefObject<HTMLButtonElement | null>;
}): FlowStep[] {
    return [
        {
            type: 'input',
            element: refs.fullNameRef,
            value: 'Alex Chen',
        },
        {
            type: 'input',
            element: refs.bioRef,
            value: 'Loves declarative automation.',
        },
        {
            type: 'click',
            element: refs.saveRef,
            wait: true,
            assert: (out) =>
                typeof out === 'object' && out !== null && 'ok' in out
                    ? Boolean((out as { ok: unknown }).ok)
                    : false,
        },
    ];
}

export const selectorByRefFlowOptions: FlowRunOptions = createFlowRunOptions(
    '[selector:ref]',
);
