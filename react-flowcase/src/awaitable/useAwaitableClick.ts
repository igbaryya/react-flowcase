import { useCallback } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { trackInvocation } from './registry';

/**
 * Wraps a click handler so its return value (sync or async) is exposed to
 * automation code via the awaitable-events registry, keyed by the element
 * that was clicked (`event.currentTarget`).
 *
 * No id required: the registry uses the DOM element reference itself, so
 * `useAwaitableClick(handler)` works for any element, with or without an
 * `id` attribute. As long as you target the same element from your flow
 * (`element: '#submit'`, `'.submit'`, a ref, etc.), `wait` will see its
 * inflight promise.
 *
 * The returned handler is meant to be passed as a React `onClick` prop. When
 * `runFlow` triggers a click via `element.click()`, React dispatches the
 * synthetic event with `currentTarget` set to that element, so the inflight
 * promise lands under the right key.
 */
export function useAwaitableClick<T>(
    handler: (event: ReactMouseEvent<Element>) => T | Promise<T>,
): (event: ReactMouseEvent<Element>) => T | Promise<T> {
    return useCallback(
        (event: ReactMouseEvent<Element>) =>
            trackInvocation(event.currentTarget as Element, () =>
                handler(event),
            ),
        [handler],
    );
}
