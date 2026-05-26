import { useMemo, useRef, useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import {
    buildSelectorByRefFlow,
    selectorByRefFlowOptions,
} from './automationFlow';
interface ProfileOutcome {
    ok: boolean;
    fullName: string;
    bio: string;
}

export function SelectorByRefDemoPage() {
    const fullNameRef = useRef<HTMLInputElement | null>(null);
    const bioRef = useRef<HTMLTextAreaElement | null>(null);
    const saveRef = useRef<HTMLButtonElement | null>(null);

    const [outcome, setOutcome] = useState<ProfileOutcome | null>(null);

    const initialFlow = useMemo(
        () => buildSelectorByRefFlow({ fullNameRef, bioRef, saveRef }),
        [],
    );

    const flowState = useDemoFlow({
        initialFlow,
        initialRunOptions: selectorByRefFlowOptions,
        onBeforeStart: () => setOutcome(null),
    });

    const save = useAwaitableClick(async (): Promise<ProfileOutcome> => {
        await new Promise((r) => setTimeout(r, 200));
        const result: ProfileOutcome = {
            ok:
                (fullNameRef.current?.value.trim().length ?? 0) > 0 &&
                (bioRef.current?.value.trim().length ?? 0) > 0,
            fullName: fullNameRef.current?.value ?? '',
            bio: bioRef.current?.value ?? '',
        };
        setOutcome(result);
        return result;
    });

    return (
        <DemoPageShell
            title="Targeting by React ref"
            description={
                <>
                    Sometimes there is no stable selector — third-party
                    widgets, portals, dialogs, or generated ids from{' '}
                    <code>useId()</code>. Pass a <code>RefObject</code>{' '}
                    directly as the <code>element</code> and the library
                    reads <code>ref.current</code> at run time.
                </>
            }
            flowState={flowState}
            pageOutcome={
                outcome ? (
                    <OutcomePanel
                        ok={outcome.ok}
                        message={
                            outcome.ok
                                ? `Saved profile for ${outcome.fullName}`
                                : 'Validation failed — fill both fields'
                        }
                        data={outcome}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'SelectorByRefAutomation',
                flowVariableName: 'selectorByRefFlow',
                optionsVariableName: 'selectorByRefFlowOptions',
                skipFlowDeclaration: true,
                componentBody: `// Refs only exist after mount, so the flow is built inline.
const fullNameRef = useRef<HTMLInputElement>(null);
const bioRef = useRef<HTMLTextAreaElement>(null);
const saveRef = useRef<HTMLButtonElement>(null);

const flow: FlowStep[] = [
    { type: 'input', element: fullNameRef, value: 'Alex Chen' },
    { type: 'input', element: bioRef, value: 'Loves declarative automation.' },
    { type: 'click', element: saveRef, wait: true, assert: (o) => Boolean(o?.ok) },
];`,
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<input ref={fullNameRef} />
<textarea ref={bioRef} />
<button ref={saveRef} type="button" onClick={save}>
    Save profile
</button>`,
            }}
        >
            <ConceptCallout
                headline="ElementTarget accepts anything with a `current` field."
                points={[
                    {
                        api: 'element: fullNameRef',
                        description: (
                            <>
                                The library&rsquo;s ElementTarget union
                                accepts{' '}
                                <code>
                                    {'{ readonly current: HTMLElement | null }'}
                                </code>{' '}
                                — which is exactly React&rsquo;s{' '}
                                <code>RefObject</code> type. No casts, no
                                wrapper objects.
                            </>
                        ),
                    },
                    {
                        api: 'resolved on each step',
                        description: (
                            <>
                                The ref is read when the step runs, not when
                                the flow is defined — so refs that mount
                                later (lazy dialogs, portals) still work. If{' '}
                                <code>current</code> is null when the step
                                executes, you get{' '}
                                <code>failure.reason: &lsquo;element-not-found&rsquo;</code>
                                .
                            </>
                        ),
                    },
                    {
                        api: 'flow defined inside the component',
                        description: (
                            <>
                                Refs only exist after the component renders,
                                so the flow has to be built where the refs
                                live. Note how this demo passes the refs to
                                a factory in <code>automationFlow.ts</code>{' '}
                                rather than exporting a static{' '}
                                <code>FlowStep[]</code>.
                            </>
                        ),
                    },
                    {
                        api: "doesn't round-trip to JSON",
                        description: (
                            <>
                                Refs are runtime-only — they can&rsquo;t be
                                serialized into the flow editor or the
                                &ldquo;Generated from flow&rdquo; file. For
                                copy-pastable code, prefer string selectors
                                where possible.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card">
                <div className="demo-row">
                    <label htmlFor="sref-fullname">Full name</label>
                    <input ref={fullNameRef} id="sref-fullname" />
                </div>
                <div className="demo-row">
                    <label htmlFor="sref-bio">Bio</label>
                    <textarea ref={bioRef} id="sref-bio" />
                </div>
                <div className="demo-actions">
                    <button
                        ref={saveRef}
                        type="button"
                        className="btn btn-primary"
                        onClick={save}
                    >
                        Save profile
                    </button>
                </div>
            </div>

        </DemoPageShell>
    );
}
