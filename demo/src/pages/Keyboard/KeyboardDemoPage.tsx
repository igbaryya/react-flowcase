import { useEffect, useRef, useState } from 'react';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { OutcomePanel } from '../common/OutcomePanel';
import { useDemoFlow } from '../common/useDemoFlow';
import { keyboardFlow, keyboardFlowOptions } from './automationFlow';
import './keyboard-demo.css';

interface CommandItem {
    id: string;
    title: string;
    hint: string;
}

const COMMANDS: CommandItem[] = [
    { id: 'profile', title: 'Edit profile', hint: 'Personal info & avatar' },
    { id: 'settings', title: 'Open settings', hint: 'Theme, language, shortcuts' },
    { id: 'security', title: 'Security & sessions', hint: 'Devices, passwords' },
    { id: 'invite', title: 'Invite teammates', hint: 'Send an invite email' },
    { id: 'logout', title: 'Sign out', hint: 'End the current session' },
];

interface CommandOutcome {
    ok: boolean;
    item: CommandItem;
}

export function KeyboardDemoPage() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const [outcome, setOutcome] = useState<CommandOutcome | null>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const filtered = COMMANDS.filter((c) =>
        c.title.toLowerCase().includes(query.toLowerCase()),
    );

    useEffect(() => {
        // Cmd/Ctrl+K opens the palette. This is the global shortcut the
        // automation's first keypress targets.
        const handler = (event: KeyboardEvent) => {
            const isPalette =
                (event.key === 'k' || event.key === 'K') &&
                (event.metaKey || event.ctrlKey);
            if (isPalette) {
                event.preventDefault();
                setOpen(true);
                setQuery('');
                setActiveIdx(0);
                setTimeout(() => searchRef.current?.focus(), 0);
                return;
            }
            if (event.key === 'Escape' && open) {
                setOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [open]);

    const onSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
            return;
        }
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            const picked = filtered[activeIdx];
            if (picked) {
                setOutcome({ ok: true, item: picked });
                setOpen(false);
            }
        }
    };

    const flowState = useDemoFlow({
        initialFlow: keyboardFlow,
        initialRunOptions: keyboardFlowOptions,
        onBeforeStart: () => {
            setOpen(false);
            setQuery('');
            setActiveIdx(0);
            setOutcome(null);
        },
    });

    return (
        <DemoPageShell
            title="Keyboard navigation"
            description={
                <>
                    The <code>keypress</code> step dispatches a real{' '}
                    <code>keydown</code> → <code>keypress</code> →{' '}
                    <code>keyup</code> sequence on the target. Use it for
                    global shortcuts, modal dismissal, autocomplete
                    navigation — anything keyboard-driven. When no{' '}
                    <code>element</code> is set, the event fires on{' '}
                    <code>document.activeElement</code>, just like a real
                    keystroke.
                </>
            }
            flowState={flowState}
            pageOutcome={
                outcome ? (
                    <OutcomePanel
                        ok={outcome.ok}
                        message={`Selected "${outcome.item.title}"`}
                        data={outcome}
                    />
                ) : undefined
            }
            codePreview={{
                componentName: 'CommandPaletteAutomation',
                flowVariableName: 'keyboardFlow',
                optionsVariableName: 'keyboardFlowOptions',
                viewSource: `{/* The palette listens to window keydown for Cmd+K */}
{open ? (
    <div role="dialog" className="palette">
        <input
            id="palette-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            autoFocus
        />
        <ul>
            {commands.map((cmd, i) => (
                <li
                    key={cmd.id}
                    aria-selected={i === activeIdx}
                    data-active={i === activeIdx}
                >
                    {cmd.title}
                </li>
            ))}
        </ul>
    </div>
) : null}`,
            }}
        >
            <ConceptCallout
                headline="Mouse-free flows: shortcuts, modals, autocomplete."
                points={[
                    {
                        api: "key: 'k', modifiers: ['meta']",
                        description: (
                            <>
                                Sends <kbd>Cmd</kbd> + <kbd>K</kbd> to the
                                document so the global shortcut listener
                                fires. <code>modifiers</code> support{' '}
                                <code>shift</code>, <code>ctrl</code>,{' '}
                                <code>alt</code>, <code>meta</code>.
                            </>
                        ),
                    },
                    {
                        api: "key: 'ArrowDown', repeat: 2",
                        description: (
                            <>
                                Presses arrow keys multiple times with an
                                adjustable <code>interval</code>. Drives
                                autocomplete-style lists where each press
                                advances a highlight.
                            </>
                        ),
                    },
                    {
                        api: 'element omitted ⇒ active element',
                        description: (
                            <>
                                When you skip <code>element</code> the
                                keypress targets{' '}
                                <code>document.activeElement</code> — so the
                                flow follows focus the way a real user
                                would, without selectors.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card keyboard-card">
                <p className="keyboard-hint">
                    Press <kbd>⌘</kbd>+<kbd>K</kbd> (or run the flow) to open
                    the palette. The automation types, navigates with arrows,
                    and confirms with <kbd>Enter</kbd>.
                </p>

                {open ? (
                    <div className="palette-backdrop" role="dialog">
                        <div className="palette">
                            <div className="palette-search-row">
                                <span aria-hidden>⌕</span>
                                <input
                                    id="palette-search"
                                    ref={searchRef}
                                    type="text"
                                    placeholder="Type a command…"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setActiveIdx(0);
                                    }}
                                    onKeyDown={onSearchKey}
                                    autoFocus
                                />
                                <kbd className="palette-kbd">esc</kbd>
                            </div>
                            <ul className="palette-list" role="listbox">
                                {filtered.length === 0 ? (
                                    <li className="palette-empty">
                                        No commands match
                                    </li>
                                ) : (
                                    filtered.map((cmd, i) => (
                                        <li
                                            key={cmd.id}
                                            role="option"
                                            aria-selected={i === activeIdx}
                                            data-active={
                                                i === activeIdx
                                                    ? 'true'
                                                    : undefined
                                            }
                                            className="palette-item"
                                            onMouseEnter={() =>
                                                setActiveIdx(i)
                                            }
                                            onClick={() => {
                                                setOutcome({
                                                    ok: true,
                                                    item: cmd,
                                                });
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="palette-item-title">
                                                {cmd.title}
                                            </div>
                                            <div className="palette-item-hint">
                                                {cmd.hint}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                            <div className="palette-footer">
                                <span>
                                    <kbd>↑</kbd>
                                    <kbd>↓</kbd> navigate
                                </span>
                                <span>
                                    <kbd>↵</kbd> select
                                </span>
                                <span>
                                    <kbd>esc</kbd> close
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="palette-closed">
                        <span aria-hidden>⌘</span>
                        <span aria-hidden>K</span>
                    </div>
                )}
            </div>

        </DemoPageShell>
    );
}
