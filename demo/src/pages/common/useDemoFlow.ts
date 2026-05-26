import { useCallback, useMemo, useRef, useState } from 'react';
import {
    applyStepEvent,
    useCursorFlow,
    useVirtualCursor,
    type FlowPersistence,
    type FlowResult,
    type FlowRunOptions,
    type FlowStep,
    type StepEvent,
    type StepStatus,
    type UseVirtualCursorOptions,
} from 'react-flowcase';

/** Step types that show the cursor loading spinner. */
const WAITING_STEP_TYPES = new Set<FlowStep['type']>(['waitFor', 'delay']);

export const DEFAULT_CURSOR_OPTIONS: UseVirtualCursorOptions = {
    visibility: 'onStart',
    autoHide: true,
};

export interface UseDemoFlowParams {
    initialFlow: FlowStep[];
    initialRunOptions: FlowRunOptions;
    defaultCursorOptions?: UseVirtualCursorOptions;
    /** Clears page-local outcome state before each run. */
    onBeforeStart?: () => void;
    /**
     * Persistence backend for cross-page flows. When set, the flow auto-resumes
     * after page navigation.
     */
    persistence?: FlowPersistence;
}

export function useDemoFlow({
    initialFlow,
    initialRunOptions,
    defaultCursorOptions = DEFAULT_CURSOR_OPTIONS,
    onBeforeStart,
    persistence,
}: UseDemoFlowParams) {
    // Read persistence ONCE on mount so we can seed cursor / status state.
    const initialPersistedState = useMemo(
        () => persistence?.load() ?? null,
        // Intentionally read-once on mount — subsequent saves should not
        // re-trigger this memo or fire React state setters.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    const isResuming =
        initialPersistedState !== null && initialPersistedState.stepIndex > 0;

    const [cursorOptions, setCursorOptions] = useState<UseVirtualCursorOptions>(
        () => ({
            ...defaultCursorOptions,
            // Seed the cursor at its persisted location and show it
            // immediately when resuming, otherwise it would briefly flash at
            // (0,0) before the first move.
            initial:
                initialPersistedState?.cursorPosition ??
                defaultCursorOptions.initial,
            visibility: isResuming
                ? 'always'
                : (defaultCursorOptions.visibility ?? 'onStart'),
        }),
    );
    const cursor = useVirtualCursor(cursorOptions);

    const [flow, setFlow] = useState<FlowStep[]>(initialFlow);
    const [runOptions, setRunOptions] =
        useState<FlowRunOptions>(initialRunOptions);
    // Initialize step statuses: if resuming, mark earlier steps as completed.
    const [stepStatuses, setStepStatuses] = useState<
        Record<number, StepStatus>
    >(() => {
        if (!isResuming) return {};
        const initial: Record<number, StepStatus> = {};
        for (let i = 0; i < initialPersistedState.stepIndex; i++) {
            initial[i] = 'success';
        }
        return initial;
    });
    const [configOpen, setConfigOpen] = useState(false);
    const [flowResult, setFlowResult] = useState<FlowResult | null>(null);
    const [cursorLoading, setCursorLoading] = useState(false);
    const activeWaitStepRef = useRef<number | null>(null);

    const handleStepEvent = useCallback((event: StepEvent) => {
        setStepStatuses((prev) => applyStepEvent(prev, event));

        // Show loading spinner during waitFor and delay steps
        if (event.phase === 'start' && WAITING_STEP_TYPES.has(event.step.type)) {
            activeWaitStepRef.current = event.index;
            setCursorLoading(true);
        } else if (
            event.phase !== 'start' &&
            activeWaitStepRef.current === event.index
        ) {
            activeWaitStepRef.current = null;
            setCursorLoading(false);
        }
    }, []);

    // Merge runOptions with our step status handler for auto-resume.
    const flowOptions = useMemo<FlowRunOptions>(
        () => ({
            ...runOptions,
            onStepEvent: (event) => {
                runOptions.onStepEvent?.(event);
                handleStepEvent(event);
            },
        }),
        [runOptions, handleStepEvent],
    );

    // Use flow and flowOptions from state so persistence can auto-resume with them.
    const {
        run: runFlow,
        cancel,
        running,
        pendingState,
        clearPersistence,
    } = useCursorFlow(cursor, {
        persistence,
        flow: persistence ? flow : undefined,
        flowOptions: persistence ? flowOptions : undefined,
    });

    const startAutomation = async () => {
        onBeforeStart?.();
        setFlowResult(null);
        setStepStatuses({});
        setCursorLoading(false);
        activeWaitStepRef.current = null;
        const result = await runFlow(flow, flowOptions);
        setCursorLoading(false);
        activeWaitStepRef.current = null;
        setFlowResult(result);
    };

    const resetFlow = () => {
        setFlow(initialFlow);
        setRunOptions(initialRunOptions);
        setCursorOptions(defaultCursorOptions);
        setStepStatuses({});
    };

    const clearRunState = () => {
        setFlowResult(null);
        setStepStatuses({});
        setCursorLoading(false);
        activeWaitStepRef.current = null;
    };

    return {
        cursor,
        cursorOptions,
        setCursorOptions,
        cursorLoading,
        flow,
        setFlow,
        runOptions,
        setRunOptions,
        stepStatuses,
        configOpen,
        setConfigOpen,
        flowResult,
        setFlowResult,
        running,
        startAutomation,
        resetFlow,
        clearRunState,
        cancel,
        pendingState,
        clearPersistence,
    };
}
