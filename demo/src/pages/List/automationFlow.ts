import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * Demonstrates multi-match selectors with `index`. The class `.todo-toggle`
 * matches three (then four) checkboxes — we pick a specific one each time.
 * Indices are arranged so no step mutates the list ordering of later steps.
 */
export const todoListFlow: FlowStep[] = [
    // Mark the first item done.
    {
        type: 'click',
        element: '.todo-toggle',
        index: 0,
    },
    // Mark the third item done.
    {
        type: 'click',
        element: '.todo-toggle',
        index: 2,
    },
    // Type a new item.
    {
        type: 'input',
        element: '#todo-new',
        value: 'Use react-flowcase',
    },
    // Append it.
    {
        type: 'click',
        element: '#todo-add',
    },
    // The new (4th) item is at index 3 — mark it done.
    {
        type: 'click',
        element: '.todo-toggle',
        index: 3,
    },
];

export const todoListFlowOptions: FlowRunOptions =
    createFlowRunOptions('[todo-list]');
