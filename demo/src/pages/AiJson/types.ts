import type { FlowStep } from 'react-flowcase';

/** JSON shape the assistant returns — passed straight to `runFlow`. */
export interface AiFlowResponse {
    flow: FlowStep[];
}

export type SimulationPhase =
    | 'idle'
    | 'typing-user'
    | 'thinking'
    | 'assistant-json'
    | 'running-flow'
    | 'done';
