import type { FlowStep } from 'react-flowcase';

const FUNCTION_PROP_KEYS = ['assert', 'condition', 'value'] as const;

/** JSON text for the flow editor (functions omitted — not JSON-serializable). */
export function flowToJsonText(flow: FlowStep[]): string {
    return `${JSON.stringify(
        flow,
        (_key, value) => (typeof value === 'function' ? undefined : value),
        2,
    )}\n`;
}

export interface ParseFlowJsonResult {
    flow?: FlowStep[];
    error?: string;
}

/** Parse JSON and merge function props from the previous flow by step index. */
export function parseFlowJsonText(
    text: string,
    previous: FlowStep[],
): ParseFlowJsonResult {
    try {
        const parsed: unknown = JSON.parse(text);
        if (!Array.isArray(parsed)) {
            return { error: 'Flow must be a JSON array of steps.' };
        }
        return {
            flow: mergeFlowWithPreservedFunctions(
                parsed as FlowStep[],
                previous,
            ),
        };
    } catch (e) {
        return {
            error: e instanceof Error ? e.message : String(e),
        };
    }
}

function mergeFlowWithPreservedFunctions(
    next: FlowStep[],
    previous: FlowStep[],
): FlowStep[] {
    return next.map((step, index) => {
        const prev = previous[index];
        if (!prev || prev.type !== step.type) return step;

        const merged: Record<string, unknown> = { ...step };
        const stepRecord = step as unknown as Record<string, unknown>;
        const prevRecord = prev as unknown as Record<string, unknown>;
        for (const key of FUNCTION_PROP_KEYS) {
            if (typeof prevRecord[key] !== 'function') continue;
            // Explicit JSON keys win (e.g. `"value": "test"` overrides fn value).
            if (key in stepRecord) continue;
            merged[key] = prevRecord[key];
        }
        return merged as unknown as FlowStep;
    });
}
