import { Children, isValidElement, useMemo, type ReactNode } from 'react';
import {
    FlowConfigModal,
    FlowStepsIndicator,
    VirtualCursor,
    describeStep,
    generateFullExample,
} from 'react-flowcase';
import { CodeBlock } from './CodeBlock';
import { ConceptCallout } from './ConceptCallout';
import { DemoPageHeader } from './DemoPageHeader';
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

    const copyExample = async () => {
        try {
            await navigator.clipboard.writeText(generatedCode);
        } catch {
            /* clipboard blocked — user can select manually */
        }
    };

    const resultsNode =
        pageOutcome || flowResult ? (
            <div
                className={`demo-results${
                    pageOutcome && flowResult ? ' demo-results-split' : ''
                }`}
            >
                {pageOutcome}
                {flowResult ? (
                    <div className="demo-card">
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
                            <pre className="outcome">
                                {JSON.stringify(
                                    flowResult.lastOutcome,
                                    null,
                                    2,
                                )}
                            </pre>
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

            <div className="demo-page-form">{resolvedChildren}</div>

            <aside className="demo-page-aside">
                <div className="demo-card indicator-card">
                    <FlowStepsIndicator
                        flow={flow}
                        statuses={stepStatuses}
                        title="Flow steps"
                    />
                </div>
            </aside>

            {resultsNode ? (
                <div className="demo-page-results">{resultsNode}</div>
            ) : null}

            {flowResultExtra ? (
                <div className="demo-page-results-extra">
                    {flowResultExtra}
                </div>
            ) : null}

            <section className="demo-page-code">
                <div className="demo-example">
                    <div className="demo-example-header">
                        <div>
                            <span className="demo-example-eyebrow">
                                Example
                            </span>
                            <span className="demo-example-path">
                                {filename}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="demo-example-copy"
                            onClick={copyExample}
                        >
                            Copy
                        </button>
                    </div>
                    <p className="demo-example-hint">
                        Live preview of what an integration with this demo
                        looks like. Edits in the flow editor regenerate the
                        code below.
                    </p>
                    <CodeBlock code={generatedCode} language="tsx" />
                </div>
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
            />

            <VirtualCursor
                position={cursor.position}
                visible={cursor.visible}
                cursor={cursor.appearance}
                loading={cursorLoading}
            />
        </div>
    );
}
