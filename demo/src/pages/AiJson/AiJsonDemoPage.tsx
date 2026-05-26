import {
    FlowStepsIndicator,
    VirtualCursor,
    describeStep,
} from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { CodeBlock } from '../common/CodeBlock';
import { JsonReadonlyViewer } from '../common/JsonReadonlyViewer';
import { PlayIcon, StopIcon } from '../common/icons';
import { AiChatPanel } from './AiChatPanel';
import { AiPipeline } from './AiPipeline';
import {
    MOCK_AI_FLOW_RESPONSE,
    SYSTEM_INSTRUCTION_PROMPT,
} from './constants';
import { useAiFlowDemo } from './useAiFlowDemo';
import { WorkingHoursForm } from './WorkingHoursForm';
import './ai-json-demo.css';

function resetWorkingHoursForm() {
    const form = document.getElementById(
        'working-hours-form',
    ) as HTMLFormElement | null;
    form?.reset();
}

export function AiJsonDemoPage() {
    const {
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
    } = useAiFlowDemo();

    const busy = simRunning || flowRunning;
    const filledByFlow = phase === 'done' && (flowResult?.completed ?? false);

    const handleReset = () => {
        reset();
        resetWorkingHoursForm();
    };

    const handleStart = () => {
        resetWorkingHoursForm();
        start();
    };

    return (
        <div className="demo-page ai-json-page">
            <div className="demo-page-header">
                <div>
                    <h1>AI · FlowStep[] from chat</h1>
                    <p>
                        The assistant returns a react-flowcase{' '}
                        <code>FlowStep[]</code> as JSON; your app calls{' '}
                        <code>runFlow</code> and the virtual cursor fills the
                        form.
                    </p>
                </div>
                <div className="demo-page-header-actions">
                    <button
                        type="button"
                        className={`icon-btn ${
                            busy ? 'icon-btn-stop' : 'icon-btn-play'
                        }`}
                        aria-label={busy ? 'Stop' : 'Run simulation'}
                        title={busy ? 'Stop' : 'Run simulation'}
                        onClick={busy ? handleReset : handleStart}
                    >
                        {busy ? <StopIcon /> : <PlayIcon />}
                    </button>
                </div>
            </div>

            <ConceptCallout
                headline="Natural language in, declarative FlowStep[] out, react-flowcase runs it."
                points={[
                    {
                        api: 'System instruction',
                        description: (
                            <>
                                Pin the model to{' '}
                                <code>{'{ "flow": FlowStep[] }'}</code> with
                                your selector map — expand the prompt below to
                                copy it.
                            </>
                        ),
                    },
                    {
                        api: 'JSON.parse → runFlow',
                        description: (
                            <>
                                Parse the assistant reply, then{' '}
                                <code>runFlow(flow)</code> — same runner as
                                every other demo.
                            </>
                        ),
                    },
                    {
                        api: 'VirtualCursor',
                        description: (
                            <>
                                The returned flow drives the cursor on the
                                form; step progress shows in the right panel.
                            </>
                        ),
                    },
                ]}
            />

            <details className="ai-json-prompt-details">
                <summary>System instruction (copy into your AI)</summary>
                <div className="ai-json-prompt-details-body">
                    <p>
                        Serializable steps only — no functions. Includes the
                        working-hours selector map for this page.
                    </p>
                    <CodeBlock
                        code={SYSTEM_INSTRUCTION_PROMPT}
                        language="text"
                        filename="system-instruction.txt"
                        maxHeight={280}
                    />
                </div>
            </details>

            <div className="ai-json-playground">
                <div className="ai-json-playground-toolbar">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={busy ? handleReset : handleStart}
                    >
                        {busy ? 'Reset demo' : 'Run demo'}
                    </button>
                    <AiPipeline phase={phase} />
                    {flowRunning && (
                        <button
                            type="button"
                            className="btn"
                            onClick={() => {
                                cancelFlow();
                                handleReset();
                            }}
                        >
                            Cancel flow
                        </button>
                    )}
                    {phase === 'done' && flowResult && (
                        <span
                            className={`status ${
                                flowResult.completed ? 'success' : 'error'
                            }`}
                        >
                            {flowResult.completed
                                ? 'Flow completed'
                                : `Failed — ${flowResult.failure?.reason ?? 'unknown'}`}
                            {flowResult.failure
                                ? ` at ${describeStep(flowResult.failure.step)}`
                                : ''}
                        </span>
                    )}
                </div>

                <div className="ai-json-playground-grid">
                    <div className="ai-json-col ai-json-col-form">
                        <p className="ai-json-col-label">Target form</p>
                        <WorkingHoursForm filledByFlow={filledByFlow} />
                    </div>

                    <div className="ai-json-col ai-json-col-chat">
                        <p className="ai-json-col-label">Chat</p>
                        <AiChatPanel
                            phase={phase}
                            userDraft={userDraft}
                            assistantFlow={assistantFlow}
                            flowRunning={flowRunning}
                        />
                    </div>

                    <div className="ai-json-col ai-json-col-flow">
                        <p className="ai-json-col-label">Flow execution</p>
                        <div className="ai-json-flow-panel">
                            {flow.length > 0 ? (
                                <div className="demo-card indicator-card">
                                    <FlowStepsIndicator
                                        flow={flow}
                                        statuses={stepStatuses}
                                        title="AI-returned flow"
                                    />
                                </div>
                            ) : (
                                <div className="demo-card ai-json-flow-idle">
                                    <p>
                                        Step list appears when the assistant
                                        returns <code>flow</code> and{' '}
                                        <code>runFlow</code> starts.
                                    </p>
                                </div>
                            )}
                        </div>
                        {assistantFlow && (
                            <details className="ai-json-raw-json">
                                <summary>View raw JSON</summary>
                                <JsonReadonlyViewer
                                    value={MOCK_AI_FLOW_RESPONSE}
                                    maxHeight={200}
                                />
                            </details>
                        )}
                    </div>
                </div>
            </div>

            <VirtualCursor
                position={cursor.position}
                visible={cursor.visible}
                cursor={cursor.appearance}
            />
        </div>
    );
}
