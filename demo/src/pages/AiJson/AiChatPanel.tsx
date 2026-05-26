import type { AiFlowResponse, SimulationPhase } from './types';

export interface AiChatPanelProps {
    phase: SimulationPhase;
    userDraft: string;
    assistantFlow: AiFlowResponse | null;
    flowRunning: boolean;
}

export function AiChatPanel({
    phase,
    userDraft,
    assistantFlow,
    flowRunning,
}: AiChatPanelProps) {
    const showUser =
        phase !== 'idle' &&
        (userDraft.length > 0 || phase === 'typing-user');
    const thinking = phase === 'thinking';
    const showAssistant =
        assistantFlow !== null &&
        (phase === 'assistant-json' ||
            phase === 'running-flow' ||
            phase === 'done');

    const stepCount = assistantFlow?.flow.length ?? 0;

    return (
        <section className="ai-chat-panel" aria-label="AI assistant chat">
            <header className="ai-chat-panel-header">
                <span className="ai-chat-panel-avatar" aria-hidden>
                    AI
                </span>
                <div className="ai-chat-panel-header-text">
                    <strong>Flow generator</strong>
                    <span className="ai-chat-panel-status">
                        {flowRunning
                            ? 'Running flow…'
                            : thinking
                              ? 'Generating…'
                              : phase === 'done'
                                ? 'Done'
                                : 'Chat'}
                    </span>
                </div>
            </header>

            <div className="ai-chat-panel-messages">
                {phase === 'idle' && (
                    <p className="ai-chat-panel-empty">
                        Press <strong>Run demo</strong> — your message appears
                        here, then the model returns a{' '}
                        <code>FlowStep[]</code> for{' '}
                        <code>runFlow</code>.
                    </p>
                )}

                {showUser && (
                    <div className="ai-chat-bubble ai-chat-bubble--user">
                        <span className="ai-chat-bubble-label">You</span>
                        <p>
                            {userDraft}
                            {phase === 'typing-user' && (
                                <span className="ai-chat-caret" aria-hidden />
                            )}
                        </p>
                    </div>
                )}

                {thinking && (
                    <div className="ai-chat-bubble ai-chat-bubble--assistant">
                        <span className="ai-chat-bubble-label">Assistant</span>
                        <div className="ai-chat-typing" aria-live="polite">
                            <span />
                            <span />
                            <span />
                        </div>
                    </div>
                )}

                {showAssistant && assistantFlow && (
                    <div className="ai-chat-bubble ai-chat-bubble--assistant">
                        <span className="ai-chat-bubble-label">Assistant</span>
                        <div className="ai-chat-flow-summary">
                            <span className="ai-chat-flow-badge">
                                FlowStep[] · {stepCount} steps
                            </span>
                            <p>
                                Input steps for Mon–Fri (Tue ends 17:00).
                                Full JSON and live progress are in the panel
                                on the right.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
