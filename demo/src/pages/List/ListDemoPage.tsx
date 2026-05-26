import { useMemo, useState } from 'react';
import { useAwaitableClick } from 'react-flowcase';
import { ConceptCallout } from '../common/ConceptCallout';
import { DemoPageShell } from '../common/DemoPageShell';
import { useDemoFlow, DEFAULT_CURSOR_OPTIONS } from '../common/useDemoFlow';
import { todoListFlow, todoListFlowOptions } from './automationFlow';
import './list-demo.css';

interface TodoItem {
    id: number;
    text: string;
    done: boolean;
}

const INITIAL_TODOS: TodoItem[] = [
    { id: 1, text: 'Read the README', done: false },
    { id: 2, text: 'Wire up a flow', done: false },
    { id: 3, text: 'Play with custom cursors', done: false },
];

/**
 * A vivid purple arrow cursor encoded as a data URL — proof you don't need
 * a custom asset to swap the cursor. Editable live from the Overall tab in
 * the config modal.
 */
const PURPLE_ARROW_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M6 4 L26 16 L17 18 L13 28 Z" fill="%239d6bff" stroke="white" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
const CUSTOM_CURSOR_URL = `data:image/svg+xml;utf8,${PURPLE_ARROW_SVG}`;

export function ListDemoPage() {
    const [todos, setTodos] = useState<TodoItem[]>(INITIAL_TODOS);
    const [newText, setNewText] = useState('');

    const initialCursorOptions = useMemo(
        () => ({ ...DEFAULT_CURSOR_OPTIONS, appearance: CUSTOM_CURSOR_URL }),
        [],
    );

    const flowState = useDemoFlow({
        initialFlow: todoListFlow,
        initialRunOptions: todoListFlowOptions,
        defaultCursorOptions: initialCursorOptions,
        onBeforeStart: () => {
            setTodos(INITIAL_TODOS);
            setNewText('');
        },
    });
    const { running, clearRunState } = flowState;

    const handleToggle = useAwaitableClick(async (event) => {
        const target = event.currentTarget as HTMLInputElement;
        const id = Number(target.dataset.id);
        setTodos((prev) =>
            prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        );
        return { id, toggled: true };
    });

    const handleAdd = useAwaitableClick(async () => {
        const trimmed = newText.trim();
        if (!trimmed) return { ok: false, reason: 'empty' as const };
        const id = Date.now();
        setTodos((prev) => [...prev, { id, text: trimmed, done: false }]);
        setNewText('');
        return { ok: true, id, text: trimmed };
    });

    const reset = () => {
        setTodos(INITIAL_TODOS);
        setNewText('');
        clearRunState();
    };

    const doneCount = todos.filter((t) => t.done).length;

    return (
        <DemoPageShell
            title="Lists, multi-match & custom cursor"
            description={
                <>
                    The class <code>.todo-toggle</code> matches every checkbox
                    in the list. We use <code>index</code> on each step to
                    pick exactly which one to click. The cursor is a purple
                    arrow loaded from an inline SVG data URL — editable live
                    from the gear &rarr; Overall tab.
                </>
            }
            flowState={flowState}
            codePreview={{
                componentName: 'TodoListAutomation',
                flowVariableName: 'todoListFlow',
                optionsVariableName: 'todoListFlowOptions',
                viewSource: `<button type="button" onClick={start}>
    Run automation
</button>

<ul>
    {items.map((item) => (
        <li key={item.id}>
            {/* One class, many matches — flow uses { element: '.todo-toggle', index } */}
            <input
                className="todo-toggle"
                type="checkbox"
                checked={item.done}
                onChange={() => toggle(item.id)}
            />
            <span>{item.label}</span>
        </li>
    ))}
</ul>

<input id="todo-new" placeholder="New todo" />
<button id="todo-add" type="button" onClick={add}>
    Add
</button>`,
            }}
        >
            <ConceptCallout
                headline="Targeting many elements, and theming the cursor itself."
                points={[
                    {
                        api: 'index: N',
                        description: (
                            <>
                                When a selector matches multiple elements,{' '}
                                <code>index</code> picks the one to act on
                                (zero-based) and silences the multi-match
                                warning. Every step here uses it.
                            </>
                        ),
                    },
                    {
                        api: 'useAwaitableClick',
                        description: (
                            <>
                                Inflight promises are keyed by the actual{' '}
                                <code>event.currentTarget</code>, not by id —
                                so <strong>one</strong> wrapped handler powers{' '}
                                <strong>every</strong> checkbox in the list,
                                yet each click still settles independently.
                            </>
                        ),
                    },
                    {
                        api: 'cursor.appearance',
                        description: (
                            <>
                                A primitive string on the cursor hook. We pass
                                a <code>data:image/svg+xml</code> URL to swap
                                the cursor. Try editing it from the gear icon
                                — paste any URL, including another data URL.
                            </>
                        ),
                    },
                ]}
            />

            <div className="demo-card todo-card">
                <div className="todo-header">
                    <h2>Today</h2>
                    <span className="todo-meta">
                        {doneCount} / {todos.length} done
                    </span>
                </div>
                <ul className="todo-list">
                    {todos.map((t) => (
                        <li
                            key={t.id}
                            className={`todo-item${t.done ? ' done' : ''}`}
                        >
                            <input
                                type="checkbox"
                                className="todo-toggle"
                                data-id={t.id}
                                checked={t.done}
                                onChange={() => {
                                    /* state owned by handler via awaitable click */
                                }}
                                onClick={handleToggle}
                                aria-label={`Toggle ${t.text}`}
                            />
                            <span className="todo-text">{t.text}</span>
                        </li>
                    ))}
                </ul>

                <div className="todo-add-row">
                    <input
                        id="todo-new"
                        className="todo-input"
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        placeholder="Add a todo…"
                        autoComplete="off"
                    />
                    <button
                        id="todo-add"
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAdd}
                    >
                        Add
                    </button>
                </div>

                <div className="demo-actions">
                    <button
                        type="button"
                        className="btn"
                        onClick={reset}
                        disabled={running}
                    >
                        Reset list
                    </button>
                    <span className="todo-hint">
                        Tip: omitting <code>index</code> would log a multi-match{' '}
                        <code>console.warn</code> and silently use the first
                        match — explicit is better.
                    </span>
                </div>
            </div>
        </DemoPageShell>
    );
}
