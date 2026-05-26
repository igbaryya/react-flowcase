import { Children, isValidElement, useMemo, useState, type ReactNode } from 'react';
import {
    VirtualCursor,
    describeStep,
    type CursorSource,
} from 'react-flowcase';
import {
    FlowConfigModal,
    FlowStepsIndicator,
    generateFullExample,
} from '../../flow';
import { CodeBlock } from './CodeBlock';
import { ConceptCallout } from './ConceptCallout';
import { DemoPageHeader } from './DemoPageHeader';
import { DemoPropEditor } from '../../editors/DemoPropEditor';
import { FlowJsonMonacoEditor } from './FlowJsonMonacoEditor';
import { JsonReadonlyViewer } from './JsonReadonlyViewer';
import { PlayIcon, StopIcon } from './icons';
import type { useDemoFlow } from './useDemoFlow';
import './demo-page.css';

export interface DemoPageShellProps {
    title: string;
    description: ReactNode;
    flowState: ReturnType<typeof useDemoFlow>;
    /**
     * Inputs for the live "Generated from flow" example. The example shown in
     * the code panel is illustrative of *this* demo (real selectors, real
     * JSX) — it does not need to compile in isolation.
     */
    codePreview: {
        componentName: string;
        flowVariableName: string;
        optionsVariableName: string;
        /** JSX content (without `<VirtualCursor />`) that the example should render. */
        viewSource?: string;
        /** Extra body code (e.g. `useRef` declarations) inserted before the JSX. */
        componentBody?: string;
        /** Skip the top-level `const flow = [...]` (e.g. for ref-based flows). */
        skipFlowDeclaration?: boolean;
        /** Header label shown above the code block. */
        filename?: string;
    };
    /**
     * "What this demo teaches" block (typically a `<ConceptCallout />`).
     * Rendered full-width directly under the page header so the Flow Steps
     * aside only sits beside the actual interactive form below.
     */
    concept?: ReactNode;
    /**
     * The interactive form / playground for the demo. Sits in a 2-column
     * row with the Flow Steps indicator on the right.
     */
    children: ReactNode;
    /**
     * Per-page outcome panel (e.g. `<OutcomePanel />`). When provided
     * alongside a `flowResult`, the two are laid out side-by-side; when
     * one is missing the other spans the row. Rendered full-width.
     */
    pageOutcome?: ReactNode;
    flowResultExtra?: ReactNode;
    /**
     * Override `VirtualCursor` visual (ReactNode / render fn). When omitted,
     * uses `cursor.appearance` from the hook (image URL / data URL).
     */
    cursorVisual?: CursorSource;
    /** Pixel size passed to `VirtualCursor` (default 28). */
    cursorSize?: number;
}

export function DemoPageShell({
    title,
    description,
    flowState,
    codePreview,
    concept,
    children,
    pageOutcome,
    flowResultExtra,
    cursorVisual,
    cursorSize,
}: DemoPageShellProps) {
    const {
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
        running,
        startAutomation,
        resetFlow,
        cancel,
    } = flowState;

    const [hasStarted, setHasStarted] = useState(false);

    const handleStart = () => {
        setHasStarted(true);
        startAutomation();
    };

    const generatedCode = useMemo(
        () =>
            generateFullExample({
                flow,
                runOptions,
                cursorOptions,
                componentName: codePreview.componentName,
                flowVariableName: codePreview.flowVariableName,
                optionsVariableName: codePreview.optionsVariableName,
                componentBody: codePreview.componentBody,
                viewSource: codePreview.viewSource,
                skipFlowDeclaration: codePreview.skipFlowDeclaration,
            }),
        [
            flow,
            runOptions,
            cursorOptions,
            codePreview.componentName,
            codePreview.flowVariableName,
            codePreview.optionsVariableName,
            codePreview.componentBody,
            codePreview.viewSource,
            codePreview.skipFlowDeclaration,
        ],
    );

    const filename = codePreview.filename ?? `${codePreview.componentName}.tsx`;

    // Convention: every demo's "what this teaches" block is the first
    // child (a `<ConceptCallout />`). To make it span full width — and
    // keep the Flow Steps aside next to just the form below — we hoist
    // that leading child out of `children` automatically unless the
    // caller passed `concept` explicitly.
    const { concept: resolvedConcept, children: resolvedChildren } =
        useMemo(() => {
            if (concept !== undefined) {
                return { concept, children };
            }
            const arr = Children.toArray(children);
            const first = arr[0];
            if (isValidElement(first) && first.type === ConceptCallout) {
                return { concept: first, children: arr.slice(1) };
            }
            return { concept: undefined, children };
        }, [concept, children]);

    const resultsNode =
        pageOutcome || flowResult ? (
            <div
                className={`demo-results${
                    pageOutcome && flowResult ? ' demo-results-split' : ''
                }`}
            >
                {pageOutcome}
                {flowResult ? (
                    <div className="demo-card demo-card--outcome">
                        <div
                            className={`status ${flowResult.completed ? 'success' : 'error'}`}
                        >
                            Flow{' '}
                            {flowResult.completed ? 'completed' : 'failed'}
                            {flowResult.failure
                                ? ` - ${flowResult.failure.reason} at ${describeStep(flowResult.failure.step)}`
                                : ''}
                        </div>
                        {flowResult.lastOutcome === undefined ? (
                            <p className="outcome-empty">
                                The final step{' '}
                                <code>
                                    {flow[flow.length - 1]?.type}
                                </code>{' '}
                                doesn&rsquo;t produce a return value &mdash;
                                only <code>click</code>, <code>input</code>,
                                and <code>select</code> steps do.
                            </p>
                        ) : (
                            <JsonReadonlyViewer
                                value={flowResult.lastOutcome}
                            />
                        )}
                    </div>
                ) : null}
            </div>
        ) : null;

    return (
        <div className="demo-page">
            <div className="demo-page-header-row">
                <DemoPageHeader
                    title={title}
                    description={description}
                    running={running}
                    onPlay={startAutomation}
                    onStop={cancel}
                    onOpenConfig={() => setConfigOpen(true)}
                />
            </div>

            {resolvedConcept ? (
                <div className="demo-page-concept">{resolvedConcept}</div>
            ) : null}

            <div className="demo-page-playground">
                <div className={`demo-page-form${!hasStarted ? ' demo-page-form--idle' : ''}`}>
                    {resolvedChildren}
                    {hasStarted && (
                        <button
                            type="button"
                            className={`demo-run-btn ${running ? 'demo-run-btn--stop' : ''}`}
                            onClick={running ? cancel : startAutomation}
                        >
                            {running ? <StopIcon /> : <PlayIcon />}
                            <span>{running ? 'Stop' : 'Run Flow'}</span>
                        </button>
                    )}
                    {!hasStarted && (
                        <button
                            type="button"
                            className="demo-start-overlay"
                            onClick={handleStart}
                        >
                            <span className="demo-start-overlay-btn">
                                <PlayIcon />
                                <span>Run Flow</span>
                            </span>
                            <span className="demo-start-overlay-hint">
                                Click to start the automation
                            </span>
                        </button>
                    )}
                </div>

                <aside className="demo-page-aside">
                    <div className="demo-card indicator-card">
                        <FlowStepsIndicator
                            flow={flow}
                            statuses={stepStatuses}
                            title="Flow steps"
                        />
                    </div>
                </aside>
            </div>

            {resultsNode ? (
                <div className="demo-page-results">{resultsNode}</div>
            ) : null}

            {flowResultExtra ? (
                <div className="demo-page-results-extra">
                    {flowResultExtra}
                </div>
            ) : null}

            <section className="demo-page-code">
                <p className="demo-example-hint">
                    Live preview of what an integration with this demo looks
                    like. Edits in the flow editor regenerate the code below.
                </p>
                <CodeBlock
                    code={generatedCode}
                    language="tsx"
                    filename={filename}
                />
            </section>

            <FlowConfigModal
                open={configOpen}
                onClose={() => setConfigOpen(false)}
                flow={flow}
                onChange={setFlow}
                runOptions={runOptions}
                onRunOptionsChange={setRunOptions}
                cursorOptions={cursorOptions}
                onCursorOptionsChange={setCursorOptions}
                editable
                onReset={resetFlow}
                renderFlowJsonEditor={(props) => (
                    <FlowJsonMonacoEditor {...props} />
                )}
                renderPropEditor={(props) => <DemoPropEditor {...props} />}
            />

            <VirtualCursor
                position={cursor.position}
                visible={cursor.visible}
                cursor={cursorVisual ?? cursor.appearance}
                size={cursorSize}
                loading={cursorLoading}
            />
        </div>
    );
}
