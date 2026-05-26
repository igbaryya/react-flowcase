import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { scrollFlow, scrollFlowOptions } from './automationFlow';
import './scroll-demo.css';

interface ItemOutcome {
    ok: boolean;
    itemId: string;
    label: string;
}

const ITEMS = Array.from({ length: 24 }, (_, i) => {
    const num = i + 1;
    return {
        id: `scroll-item-${num}`,
        title: `Release v0.${num}.0`,
        subtitle: `Build #${1000 + num * 17}`,
        meta:
            num === 7
                ? 'Highlighted by automation'
                : num % 3 === 0
                  ? 'Patch'
                  : 'Minor',
    };
});

export function ScrollDemoPage() {
    const [outcome, setOutcome] = useState<ItemOutcome | null>(null);
    const [highlighted, setHighlighted] = useState<string | null>(null);

    const flowState = useDemoFlow({
        initialFlow: scrollFlow,
        initialRunOptions: scrollFlowOptions,
        onBeforeStart: () => {
            setOutcome(null);
            setHighlighted(null);
        },
    });

    const pickItem = useAwaitableClick(
        async (event: React.MouseEvent<Element>): Promise<ItemOutcome> => {
            const target = event.currentTarget as HTMLElement;
            const itemId = target.id;
            const label = target.dataset.label ?? itemId;
            await new Promise((r) => setTimeout(r, 120));
            const result: ItemOutcome = { ok: true, itemId, label };
            setOutcome(result);
            setHighlighted(itemId);
            return result;
        },
    );

    return (
        <DemoPageShell
            title="Scroll & viewport"
            description={
                <>
                    Real apps lazy-load lists, hide content below the fold,
                    and put critical actions inside scrollable dialogs. The{' '}
                    <code>scroll</code> step and{' '}
                    <code>runFlow({'{ autoScroll: true }'})</code> make sure
                    off-screen targets are reachable before the cursor tries
                    to interact with them.
                </>
            }
            flowState={flowState}
            pageOutcome={
                outcome ? (
                    <OutcomePanel
                        ok={outcome.ok}
                        message={`Picked "${outcome.label}"`}
                        data={outcome}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'ScrollAutomation',
                flowVariableName: 'scrollFlow',
                optionsVariableName: 'scrollFlowOptions',
                viewSource: `<div id="scroll-list" className="scroll-list">
    {items.map((item) => (
        <button
            key={item.id}
            id={item.id}
            data-label={item.title}
            onClick={pickItem}
        >
            {item.title}
        </button>
    ))}
</div>`,
            }}
        >
            <ConceptCallout
                headline="Bring off-screen targets into view — explicitly or automatically."
                points={[
                    {
                        api: "type: 'scroll', container, by",
                        description: (
                            <>
                                Scroll a specific element. <code>by</code>{' '}
                                applies a delta, <code>to</code> sets an
                                absolute position. Skip <code>container</code>{' '}
                                to scroll the window instead.
                            </>
                        ),
                    },
                    {
                        api: "type: 'scroll', element, block: 'center'",
                        description: (
                            <>
                                Brings an element into view via{' '}
                                <code>scrollIntoView</code>. Configurable{' '}
                                <code>block</code>, <code>behavior</code>,
                                and a <code>settleMs</code> pause so the next
                                step starts on a stable layout.
                            </>
                        ),
                    },
                    {
                        api: 'autoScroll: true',
                        description: (
                            <>
                                A flag on <code>FlowRunOptions</code>. When
                                set, every targeting step checks viewport
                                visibility and calls{' '}
                                <code>scrollIntoView</code> first — no extra
                                scroll steps required. Off by default to
                                preserve existing behavior.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card scroll-card">
                <div id="scroll-list" className="scroll-list">
                    {ITEMS.map((item) => (
                        <button
                            key={item.id}
                            id={item.id}
                            type="button"
                            data-label={item.title}
                            className={`scroll-item${
                                highlighted === item.id
                                    ? ' scroll-item-active'
                                    : ''
                            }`}
                            onClick={pickItem}
                        >
                            <div className="scroll-item-main">
                                <span className="scroll-item-title">
                                    {item.title}
                                </span>
                                <span className="scroll-item-sub">
                                    {item.subtitle}
                                </span>
                            </div>
                            <span
                                className={`scroll-item-meta${
                                    item.meta === 'Highlighted by automation'
                                        ? ' scroll-item-meta-accent'
                                        : ''
                                }`}
                            >
                                {item.meta}
                            </span>
                        </button>
                    ))}
                </div>
                <p className="scroll-list-hint">
                    The flow scrolls this container — not the page. It also
                    uses <code>autoScroll</code>, so the click step would
                    work even without the explicit scroll-to step before it.
                </p>
            </div>
        </DemoPageShell>
    );
}
