import { sleep } from './dom';
import { WaitTimeoutError } from './errors';

export interface WaitForOptions {
    /** Max time to wait in ms. Defaults to 5000. */
    timeout?: number;
    /** How often to re-evaluate the predicate in ms. Defaults to 50. */
    pollInterval?: number;
    /** Aborts the wait. The returned promise resolves (does not reject). */
    signal?: AbortSignal;
    /**
     * Short label used in the timeout error message. Helps diagnose which
     * `waitFor` call failed when several are queued.
     */
    description?: string;
}

/**
 * Polls `predicate` until it returns truthy (or its promise resolves to true),
 * then resolves. If `timeout` elapses first, throws `WaitTimeoutError`. If the
 * provided `AbortSignal` fires, resolves without throwing — callers can check
 * `signal.aborted` after `await`.
 *
 * Used by the `waitFor` flow step but exposed as a general async helper so
 * consumers can integrate it into custom flows or non-flow code.
 */
export async function waitFor(
    predicate: () => boolean | Promise<boolean>,
    options: WaitForOptions = {},
): Promise<void> {
    const {
        timeout = 5000,
        pollInterval = 50,
        signal,
        description = 'condition',
    } = options;

    if (signal?.aborted) return;

    const start = Date.now();
    while (true) {
        const ok = await predicate();
        if (signal?.aborted) return;
        if (ok) return;
        if (Date.now() - start >= timeout) {
            throw new WaitTimeoutError(description, timeout);
        }
        await sleep(pollInterval, signal);
        if (signal?.aborted) return;
    }
}
