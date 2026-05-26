import { useCallback, useEffect, useRef, useState } from 'react';
import {
    useCursorFlow,
    useVirtualCursor,
    type FlowResult,
    type FlowStep,
    type StepEvent,
} from 'react-flowcase';
import { applyStepEvent, type StepStatus } from '../../flow';
import { createFlowRunOptions } from '../common/createFlowRunOptions';
import { DEFAULT_CURSOR_OPTIONS } from '../common/useDemoFlow';
import {
    DEMO_USER_MESSAGE,
    MOCK_AI_FLOW_RESPONSE,
} from './constants';
import type { AiFlowResponse, SimulationPhase } from './types';

const CHAR_MS = 28;
const THINK_MS = 1400;
const JSON_REVEAL_MS = 2000;

const flowRunOptions = createFlowRunOptions('[ai-flow]');

export interface UseAiFlowDemoResult {
    phase: SimulationPhase;
    simRunning: boolean;
    flowRunning: boolean;
    userDraft: string;
    assistantFlow: AiFlowResponse | null;
    flow: FlowStep[];
    stepStatuses: Record<number, StepStatus>;
    flowResult: FlowResult | null;
    cursor: ReturnType<typeof useVirtualCursor>;
    start: () => void;
    reset: () => void;
    cancelFlow: () => void;
}

export function useAiFlowDemo(): UseAiFlowDemoResult {
    const cursor = useVirtualCursor(DEFAULT_CURSOR_OPTIONS);
    const { run: runFlow, cancel: cancelFlow, running: flowRunning } =
        useCursorFlow(cursor);

    const [phase, setPhase] = useState<SimulationPhase>('idle');
    const [userDraft, setUserDraft] = useState('');
    const [assistantFlow, setAssistantFlow] = useState<AiFlowResponse | null>(
        null,
    );
    const [flow, setFlow] = useState<FlowStep[]>([]);
    const [stepStatuses, setStepStatuses] = useState<
        Record<number, StepStatus>
    >({});
    const [flowResult, setFlowResult] = useState<FlowResult | null>(null);

    const timersRef = useRef<number[]>([]);
    const flowStartedRef = useRef(false);

    const clearTimers = useCallback(() => {
        for (const id of timersRef.current) window.clearTimeout(id);
        timersRef.current = [];
    }, []);

    const schedule = useCallback((fn: () => void, ms: number) => {
        const id = window.setTimeout(fn, ms);
        timersRef.current.push(id);
    }, []);

    const handleStepEvent = useCallback((event: StepEvent) => {
        setStepStatuses((prev) => applyStepEvent(prev, event));
    }, []);

    const executeFlow = useCallback(
        async (steps: FlowStep[]) => {
            setFlow(steps);
            setStepStatuses({});
            setFlowResult(null);
            setPhase('running-flow');
            const result = await runFlow(steps, {
                ...flowRunOptions,
                onStepEvent: (event) => {
                    flowRunOptions.onStepEvent?.(event);
                    handleStepEvent(event);
                },
            });
            setFlowResult(result);
            setPhase('done');
        },
        [runFlow, handleStepEvent],
    );

    const reset = useCallback(() => {
        clearTimers();
        flowStartedRef.current = false;
        if (flowRunning) cancelFlow();
        setPhase('idle');
        setUserDraft('');
        setAssistantFlow(null);
        setFlow([]);
        setStepStatuses({});
        setFlowResult(null);
    }, [clearTimers, cancelFlow, flowRunning]);

    const start = useCallback(() => {
        clearTimers();
        flowStartedRef.current = false;
        cancelFlow();
        setPhase('typing-user');
        setUserDraft('');
        setAssistantFlow(null);
        setFlow([]);
        setStepStatuses({});
        setFlowResult(null);

        let i = 0;
        const typeNext = () => {
            i += 1;
            setUserDraft(DEMO_USER_MESSAGE.slice(0, i));
            if (i < DEMO_USER_MESSAGE.length) {
                schedule(typeNext, CHAR_MS);
            } else {
                schedule(() => setPhase('thinking'), 320);
            }
        };
        schedule(typeNext, CHAR_MS);
    }, [clearTimers, cancelFlow, schedule]);

    useEffect(() => {
        if (phase !== 'thinking') return;
        schedule(() => {
            setAssistantFlow(MOCK_AI_FLOW_RESPONSE);
            setPhase('assistant-json');
        }, THINK_MS);
    }, [phase, schedule]);

    useEffect(() => {
        if (phase !== 'assistant-json') return;
        schedule(() => {
            if (flowStartedRef.current) return;
            flowStartedRef.current = true;
            void executeFlow(MOCK_AI_FLOW_RESPONSE.flow);
        }, JSON_REVEAL_MS);
    }, [phase, schedule, executeFlow]);

    useEffect(() => () => clearTimers(), [clearTimers]);

    const simRunning = phase !== 'idle' && phase !== 'done' && phase !== 'running-flow';

    return {
        phase,
        simRunning,
        flowRunning,
        userDraft,
        assistantFlow,
        flow,
        stepStatuses,
        flowResult,
        cursor,
        start,
        reset,
        cancelFlow,
    };
}
