import type { Position } from '../cursor/types';

/**
 * State persisted between page loads so a flow can resume after navigation.
 * The flow definition itself isn't stored (functions aren't serializable) —
 * only the position within it.
 */
export interface PersistedFlowState {
    /** Zero-based index of the step to resume from. */
    stepIndex: number;
    /**
     * Outcome of the last completed step. Only serializable values survive;
     * if your step produced a non-JSON value, this will be `undefined` or
     * partially lossy after round-trip.
     */
    lastOutcome?: unknown;
    /** Unix ms timestamp when the flow started. Useful for stale-detection. */
    startedAt: number;
    /**
     * Cursor screen position at the moment of the last successful step.
     * `useCursorFlow` writes this; consumers can read it on mount to seed
     * `useVirtualCursor`'s `initial` so the cursor doesn't "rejump" to (0,0)
     * after a page reload.
     */
    cursorPosition?: Position;
}

/**
 * Pluggable persistence backend. The library ships with sessionStorage /
 * localStorage factories; implement this interface for custom backends
 * (IndexedDB, server-side, etc.).
 */
export interface FlowPersistence {
    save(state: PersistedFlowState): void;
    load(): PersistedFlowState | null;
    clear(): void;
}

function createWebStoragePersistence(
    storage: Storage,
    key: string,
): FlowPersistence {
    return {
        save(state) {
            try {
                storage.setItem(key, JSON.stringify(state));
            } catch {
                // Storage full or unavailable — fail silently.
            }
        },
        load() {
            try {
                const raw = storage.getItem(key);
                return raw ? (JSON.parse(raw) as PersistedFlowState) : null;
            } catch {
                return null;
            }
        },
        clear() {
            try {
                storage.removeItem(key);
            } catch {
                // Ignore.
            }
        },
    };
}

/**
 * Persists flow state to `sessionStorage` under the given key. State is
 * cleared when the browser tab closes — ideal for flows that span page
 * navigations within a single session (e.g. Login → Dashboard).
 */
export function createSessionStoragePersistence(key: string): FlowPersistence {
    if (typeof sessionStorage === 'undefined') {
        // SSR or non-browser environment — return no-op persistence.
        return { save() {}, load: () => null, clear() {} };
    }
    return createWebStoragePersistence(sessionStorage, key);
}

/**
 * Persists flow state to `localStorage` under the given key. State survives
 * browser restarts — use when the flow may span separate sessions.
 */
export function createLocalStoragePersistence(key: string): FlowPersistence {
    if (typeof localStorage === 'undefined') {
        return { save() {}, load: () => null, clear() {} };
    }
    return createWebStoragePersistence(localStorage, key);
}
