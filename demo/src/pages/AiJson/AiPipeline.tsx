import type { SimulationPhase } from './types';

const PIPELINE = [
    { key: 'chat', label: 'Chat', phases: ['typing-user', 'thinking'] },
    { key: 'json', label: 'JSON', phases: ['assistant-json'] },
    { key: 'run', label: 'Run', phases: ['running-flow'] },
    { key: 'done', label: 'Done', phases: ['done'] },
] as const;

function stateForPhase(
    phase: SimulationPhase,
    stepPhases: readonly SimulationPhase[],
): 'pending' | 'active' | 'done' {
    if (phase === 'idle') return 'pending';
    const order: SimulationPhase[] = [
        'idle',
        'typing-user',
        'thinking',
        'assistant-json',
        'running-flow',
        'done',
    ];
    const current = order.indexOf(phase);
    const stepStart = Math.min(
        ...stepPhases.map((p) => order.indexOf(p)),
    );
    const stepEnd = Math.max(
        ...stepPhases.map((p) => order.indexOf(p)),
    );
    if (current > stepEnd) return 'done';
    if (current >= stepStart && current <= stepEnd) return 'active';
    return 'pending';
}

export interface AiPipelineProps {
    phase: SimulationPhase;
}

export function AiPipeline({ phase }: AiPipelineProps) {
    return (
        <div
            className="ai-pipeline"
            role="list"
            aria-label="Demo pipeline"
        >
            {PIPELINE.map((step, i) => {
                const state = stateForPhase(phase, step.phases);
                return (
                    <div key={step.key} className="ai-pipeline-item" role="listitem">
                        {i > 0 && (
                            <span className="ai-pipeline-connector" aria-hidden />
                        )}
                        <span
                            className={`ai-pipeline-pill ai-pipeline-pill--${state}`}
                        >
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
