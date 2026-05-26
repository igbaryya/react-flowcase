import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * Scroll demo flow:
 *
 *   1. Scroll the list container to the very bottom using `scrollBy`.
 *   2. Jump back to a specific item by id — `scrollIntoView` style.
 *   3. Click that item.
 *   4. Smooth-scroll back to the top.
 *
 * `autoScroll: true` on the run options means even without explicit scroll
 * steps, the runner would bring off-screen targets into view before
 * clicking them — flip it off in the editor to see the difference.
 */
export const scrollFlow: FlowStep[] = [
    {
        type: 'scroll',
        container: '#scroll-list',
        by: { y: 9999 },
        behavior: 'smooth',
        settleMs: 500,
    },
    {
        type: 'scroll',
        element: '#scroll-item-7',
        behavior: 'smooth',
        block: 'center',
        settleMs: 450,
    },
    {
        type: 'click',
        element: '#scroll-item-7',
        wait: true,
    },
    {
        type: 'scroll',
        container: '#scroll-list',
        to: { y: 0 },
        behavior: 'smooth',
        settleMs: 500,
    },
];

export const scrollFlowOptions: FlowRunOptions = {
    ...createFlowRunOptions('[scroll]'),
    autoScroll: true,
};
