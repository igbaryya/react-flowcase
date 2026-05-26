import type { FlowRunOptions, FlowStep } from 'react-flowcase';

export const customCursorFlow: FlowStep[] = [
    { type: 'click', element: '#cursor-pick-local-1', wait: false },
    { type: 'delay', duration: 700 },
    { type: 'click', element: '#cursor-pick-local-2', wait: false },
    { type: 'delay', duration: 700 },
    { type: 'click', element: '#cursor-pick-local-3', wait: false },
    { type: 'delay', duration: 700 },
    { type: 'click', element: '#cursor-pick-react', wait: false },
    { type: 'delay', duration: 700 },
    { type: 'click', element: '#cursor-pick-external', wait: false },
    { type: 'delay', duration: 700 },
    { type: 'click', element: '#cursor-pick-default', wait: false },
];

export const customCursorFlowOptions: FlowRunOptions = {
    onStepEvent: undefined,
};
