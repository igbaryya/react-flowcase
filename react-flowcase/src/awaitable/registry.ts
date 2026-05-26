/**
 * Tracks in-flight async invocations keyed by their originating DOM element so
 * an automation runner can `await` work kicked off by an unrelated code path
 * (e.g. a React event handler) without coupling the two together.
 *
 * Keying by element reference (rather than by string id) means consumers no
 * longer need to assign DOM ids just to opt in to awaitable clicks — the same
 * `ElementTarget` you point a flow step at also identifies its inflight
 * promise.
 *
 * Synchronous return values are NOT tracked — no entry is registered.
 */
const registry = new WeakMap<Element, Promise<unknown>>();

export function trackInvocation<T>(
    element: Element,
    exec: () => T | Promise<T>,
): T | Promise<T> {
    const result = exec();
    if (!(result instanceof Promise)) return result;

    const tracked = result as Promise<T>;
    registry.set(element, tracked);
    void tracked.finally(() => {
        // Only clear if we're still the latest invocation for this element.
        if (registry.get(element) === tracked) registry.delete(element);
    });
    return tracked;
}

export function getInflight<T = unknown>(
    element: Element,
): Promise<T> | undefined {
    return registry.get(element) as Promise<T> | undefined;
}

export function clearInflight(element: Element): void {
    registry.delete(element);
}
