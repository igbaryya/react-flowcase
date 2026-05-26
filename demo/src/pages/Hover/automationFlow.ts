import { type FlowRunOptions, type FlowStep } from 'react-flowcase';
import { createFlowRunOptions } from '../common/createFlowRunOptions';

/**
 * Hover demonstrates "the cursor is over me, no click" interactions. The
 * avatar reveals a popover via `:hover` / `onMouseEnter`; the menu items
 * stay mounted for a beat (`duration`) before the cursor moves on.
 *
 * 1. Hover the avatar → popover slides in.
 * 2. Hover the "Account settings" row → row highlights.
 * 3. Click it → outcome fires.
 */
export const hoverFlow: FlowStep[] = [
    {
        type: 'hover',
        element: '#hover-avatar',
        duration: 900,
    },
    {
        type: 'hover',
        element: '[data-hover-item="account"]',
        duration: 700,
    },
    {
        type: 'click',
        element: '[data-hover-item="account"]',
        wait: true,
        assert: (out) =>
            typeof out === 'object' && out !== null && 'ok' in out
                ? Boolean((out as { ok: unknown }).ok)
                : false,
    },
];

export const hoverFlowOptions: FlowRunOptions = createFlowRunOptions('[hover]');
