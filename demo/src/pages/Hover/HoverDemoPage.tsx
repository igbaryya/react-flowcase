import { useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { hoverFlow, hoverFlowOptions } from './automationFlow';
import './hover-demo.css';

interface MenuOutcome {
    ok: boolean;
    item: string;
}

export function HoverDemoPage() {
    const [open, setOpen] = useState(false);
    const [outcome, setOutcome] = useState<MenuOutcome | null>(null);

    const flowState = useDemoFlow({
        initialFlow: hoverFlow,
        initialRunOptions: hoverFlowOptions,
        onBeforeStart: () => {
            setOpen(false);
            setOutcome(null);
        },
    });

    const selectItem = useAwaitableClick(
        async (event: React.MouseEvent<Element>): Promise<MenuOutcome> => {
            const target = event.currentTarget as HTMLElement;
            const item = target.dataset.hoverItem ?? 'unknown';
            await new Promise((r) => setTimeout(r, 150));
            const result: MenuOutcome = { ok: true, item };
            setOutcome(result);
            return result;
        },
    );

    return (
        <DemoPageShell
            title="Hover menus & tooltips"
            description={
                <>
                    The <code>hover</code> step moves the cursor over an
                    element and fires the full mouse-arrival sequence (
                    <code>pointerenter</code>, <code>mouseover</code>,{' '}
                    <code>mouseenter</code>) — without clicking. Pair it with{' '}
                    <code>duration</code> so popover UI has time to render
                    and you can actually watch what happens.
                </>
            }
            flowState={flowState}
            pageOutcome={
                outcome ? (
                    <OutcomePanel
                        ok={outcome.ok}
                        message={`Opened "${outcome.item}"`}
                        data={outcome}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'HoverMenuAutomation',
                flowVariableName: 'hoverFlow',
                optionsVariableName: 'hoverFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<button
    id="hover-avatar"
    onMouseEnter={() => setOpen(true)}
    onMouseLeave={() => setOpen(false)}
>
    <img src={avatarSrc} alt="Open user menu" />
</button>

{/* Revealed by the first hover step; auto-dismisses on mouseleave */}
{open ? (
    <div className="hover-popover">
        <button data-hover-item="account" onClick={openAccount}>
            Account settings
        </button>
        <button data-hover-item="billing" onClick={openBilling}>
            Billing
        </button>
    </div>
) : null}`,
            }}
        >
            <ConceptCallout
                headline="A new step type for mouse-arrival-without-click."
                points={[
                    {
                        api: "type: 'hover'",
                        description: (
                            <>
                                The runner moves the cursor to the element,
                                dispatches{' '}
                                <code>pointerover</code> →{' '}
                                <code>mouseover</code> →{' '}
                                <code>pointerenter</code> →{' '}
                                <code>mouseenter</code> →{' '}
                                <code>mousemove</code>, then waits for the{' '}
                                <code>duration</code>. No click is dispatched.
                            </>
                        ),
                    },
                    {
                        api: 'duration: 900',
                        description: (
                            <>
                                Holds the cursor over the element for
                                900&nbsp;ms before continuing — long enough
                                for transitions to settle and for the demo
                                to be watchable. Defaults to 600&nbsp;ms.
                            </>
                        ),
                    },
                    {
                        api: 'works with onMouseEnter / :hover',
                        description: (
                            <>
                                Because the synthesized events bubble like
                                real ones, React&rsquo;s{' '}
                                <code>onMouseEnter</code> handlers and
                                CSS&nbsp;<code>:hover</code> rules both
                                respond — no special &ldquo;automation
                                mode&rdquo; needed.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card hover-card">
                <div className="hover-stage">
                    <button
                        id="hover-avatar"
                        type="button"
                        className="hover-avatar"
                        onMouseEnter={() => setOpen(true)}
                        onMouseLeave={() => setOpen(false)}
                        aria-haspopup="menu"
                        aria-expanded={open}
                    >
                        <span className="hover-avatar-initial">A</span>
                    </button>

                    {open ? (
                        <div
                            className="hover-popover"
                            onMouseEnter={() => setOpen(true)}
                            onMouseLeave={() => setOpen(false)}
                            role="menu"
                        >
                            <div className="hover-popover-header">
                                Ada Lovelace
                                <span>ada@example.com</span>
                            </div>
                            <button
                                type="button"
                                data-hover-item="account"
                                className="hover-popover-row"
                                onClick={selectItem}
                            >
                                <span>Account settings</span>
                                <span aria-hidden>↗</span>
                            </button>
                            <button
                                type="button"
                                data-hover-item="billing"
                                className="hover-popover-row"
                                onClick={selectItem}
                            >
                                <span>Billing</span>
                                <span aria-hidden>↗</span>
                            </button>
                            <button
                                type="button"
                                data-hover-item="signout"
                                className="hover-popover-row hover-popover-row-danger"
                                onClick={selectItem}
                            >
                                <span>Sign out</span>
                                <span aria-hidden>→</span>
                            </button>
                        </div>
                    ) : null}
                </div>
            </div>
        </DemoPageShell>
    );
}
