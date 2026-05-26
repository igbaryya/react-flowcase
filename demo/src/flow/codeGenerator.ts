import {
    describeElement,
    type FlowRunOptions,
    type FlowStep,
    type UseVirtualCursorOptions,
} from 'react-flowcase';

const INDENT = '    ';

function pad(level: number): string {
    return INDENT.repeat(level);
}

function formatString(s: string): string {
    if (!s.includes("'") && !/[\n\r\\]/.test(s)) {
        return `'${s}'`;
    }
    return JSON.stringify(s);
}

function formatFunction(
    fn: (...args: unknown[]) => unknown,
    level: number,
): string {
    const source = fn.toString();
    const lines = source.split('\n');
    if (lines.length === 1) return source;
    const indent = pad(level);
    return lines
        .map((line, i) => (i === 0 ? line : indent + line.replace(/^\s+/, '')))
        .join('\n');
}

export function formatValue(value: unknown, level: number): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return formatString(value);
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'function') {
        return formatFunction(
            value as (...args: unknown[]) => unknown,
            level,
        );
    }
    // Non-serializable element targets: emit a TODO placeholder so the
    // generated source still compiles and points the reader at the fix.
    if (typeof Element !== 'undefined' && value instanceof Element) {
        return `'' /* TODO: replace with a selector for ${describeElement(value as HTMLElement)} */`;
    }
    if (
        value !== null &&
        typeof value === 'object' &&
        'current' in (value as Record<string, unknown>)
    ) {
        return `'' /* TODO: replace this ref with a selector string */`;
    }
    if (Array.isArray(value)) return formatArray(value, level);
    if (typeof value === 'object') {
        return formatObject(value as Record<string, unknown>, level);
    }
    return String(value);
}

export function formatObject(
    obj: Record<string, unknown>,
    level: number,
): string {
    const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return '{}';
    const inner = entries
        .map(
            ([k, v]) =>
                `${pad(level + 1)}${k}: ${formatValue(v, level + 1)}`,
        )
        .join(',\n');
    return `{\n${inner},\n${pad(level)}}`;
}

export function formatArray(arr: unknown[], level: number): string {
    if (arr.length === 0) return '[]';
    const inner = arr
        .map((item) => `${pad(level + 1)}${formatValue(item, level + 1)}`)
        .join(',\n');
    return `[\n${inner},\n${pad(level)}]`;
}

export interface GenerateFlowCodeOptions {
    flow: FlowStep[];
    runOptions?: FlowRunOptions;
    flowVariableName?: string;
    optionsVariableName?: string;
    includeImports?: boolean;
    importSource?: string;
}

/**
 * Serializes a flow + optional run options into a self-contained TypeScript
 * source string. Functions are rendered verbatim via `Function.prototype.toString`.
 */
export function generateFlowCode({
    flow,
    runOptions,
    flowVariableName = 'flow',
    optionsVariableName = 'flowOptions',
    includeImports = true,
    importSource = 'react-flowcase',
}: GenerateFlowCodeOptions): string {
    const parts: string[] = [];
    const hasOptions =
        runOptions !== undefined &&
        Object.entries(runOptions).some(([, v]) => v !== undefined);

    if (includeImports) {
        const importedTypes = ['FlowStep'];
        if (hasOptions) importedTypes.push('FlowRunOptions');
        parts.push(
            `import type { ${importedTypes.join(', ')} } from '${importSource}';`,
        );
    }

    parts.push(
        `const ${flowVariableName}: FlowStep[] = ${formatArray(flow, 0)};`,
    );

    if (hasOptions) {
        parts.push(
            `const ${optionsVariableName}: FlowRunOptions = ${formatObject(
                runOptions as Record<string, unknown>,
                0,
            )};`,
        );
    }

    return parts.join('\n\n') + '\n';
}

export interface GenerateFullExampleOptions extends GenerateFlowCodeOptions {
    /** Name of the component emitted by the example. */
    componentName?: string;
    /** Cursor options to render inside the `useVirtualCursor({...})` call. */
    cursorOptions?: UseVirtualCursorOptions;
    /**
     * Extra code (e.g. `useRef` declarations, an inline `flow: FlowStep[]`)
     * inserted into the component body after the standard hooks but before
     * the `start` handler. Each non-empty line is re-indented to match the
     * body's 4-space indent.
     */
    componentBody?: string;
    /**
     * When true, skip emitting the top-level `const flowVariableName = [...]`
     * declaration. Use this when `componentBody` declares its own flow inline
     * — e.g. for ref-based flows that can't serialize cleanly into a const.
     */
    skipFlowDeclaration?: boolean;
    /**
     * JSX content to render inside the example's `<>...</>`, replacing the
     * default "form fields placeholder + Run automation button". Each non-empty
     * line is re-indented to match the JSX position. `<VirtualCursor />` is
     * always rendered after this content.
     *
     * The output is illustrative — it does NOT need to compile in isolation.
     */
    viewSource?: string;
}

function indentLines(source: string, indent: string): string {
    return source
        .replace(/^\n+|\n+$/g, '')
        .split('\n')
        .map((line) => (line.length === 0 ? '' : `${indent}${line}`))
        .join('\n');
}

function uniqueTargets(flow: FlowStep[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const step of flow) {
        // Delay steps don't have elements.
        if (step.type === 'delay') continue;
        // Only string selectors are listed — refs / raw elements can't be
        // surfaced as setup instructions.
        if (typeof step.element !== 'string') continue;
        if (!seen.has(step.element)) {
            seen.add(step.element);
            result.push(step.element);
        }
    }
    return result;
}

/**
 * Emits a complete, copy-pastable TS/TSX example that defines the flow,
 * wires `useVirtualCursor` + `useCursorFlow`, and renders `<VirtualCursor />`.
 * The required element IDs are listed in a doc-comment.
 */
export function generateFullExample({
    flow,
    runOptions,
    cursorOptions,
    flowVariableName = 'flow',
    optionsVariableName = 'flowOptions',
    componentName = 'AutomatedForm',
    importSource = 'react-flowcase',
    componentBody,
    viewSource,
    skipFlowDeclaration = false,
}: GenerateFullExampleOptions): string {
    const hasOptions =
        runOptions !== undefined &&
        Object.entries(runOptions).some(([, v]) => v !== undefined);
    const hasCursorOptions =
        cursorOptions !== undefined &&
        Object.entries(cursorOptions).some(([, v]) => v !== undefined);

    const typeImports = ['FlowResult', 'FlowStep'];
    if (hasOptions) typeImports.push('FlowRunOptions');
    typeImports.sort();

    const runtimeImports = [
        'VirtualCursor',
        'useCursorFlow',
        'useVirtualCursor',
    ];

    const targetsList = uniqueTargets(flow);
    const idsBlock =
        targetsList.length > 0
            ? `\n *\n * Required targets (wire to your form):\n${targetsList
                  .map((sel) => ` *   - ${sel}`)
                  .join('\n')}\n`
            : '\n';

    const runCall = hasOptions
        ? `runFlow(${flowVariableName}, ${optionsVariableName})`
        : `runFlow(${flowVariableName})`;

    const lines: string[] = [];
    lines.push(`import { useState } from 'react';`);
    lines.push(
        `import {\n    ${runtimeImports.join(',\n    ')},\n} from '${importSource}';`,
    );
    lines.push(
        `import type {\n    ${typeImports.join(',\n    ')},\n} from '${importSource}';`,
    );
    lines.push('');
    if (!skipFlowDeclaration) {
        lines.push(
            `const ${flowVariableName}: FlowStep[] = ${formatArray(flow, 0)};`,
        );
    }
    if (hasOptions) {
        lines.push('');
        lines.push(
            `const ${optionsVariableName}: FlowRunOptions = ${formatObject(
                runOptions as Record<string, unknown>,
                0,
            )};`,
        );
    }
    lines.push('');
    lines.push(`/**\n * Drop-in component generated from the current flow.${idsBlock} */`);
    lines.push(`export function ${componentName}() {`);
    if (hasCursorOptions) {
        const cursorOptionsSrc = formatObject(
            cursorOptions as Record<string, unknown>,
            1,
        );
        lines.push(`    const cursor = useVirtualCursor(${cursorOptionsSrc});`);
    } else {
        lines.push(`    const cursor = useVirtualCursor();`);
    }
    lines.push(`    const runFlow = useCursorFlow(cursor);`);
    lines.push(`    const [result, setResult] = useState<FlowResult | null>(null);`);

    if (componentBody && componentBody.trim().length > 0) {
        lines.push('');
        lines.push(indentLines(componentBody, '    '));
    }

    lines.push('');
    lines.push(`    const start = async () => {`);
    lines.push(`        setResult(await ${runCall});`);
    lines.push(`    };`);
    lines.push('');
    lines.push(`    return (`);
    lines.push(`        <>`);

    if (viewSource && viewSource.trim().length > 0) {
        lines.push(indentLines(viewSource, '            '));
    } else {
        lines.push(
            `            {/* Render your form fields here - selectors must match the flow's element targets. */}`,
        );
        lines.push(`            <button type="button" onClick={start}>`);
        lines.push(`                Run automation`);
        lines.push(`            </button>`);
        lines.push(`            {result?.failure ? (`);
        lines.push(`                <p>Failed: {result.failure.reason}</p>`);
        lines.push(`            ) : null}`);
    }

    lines.push(`            <VirtualCursor`);
    lines.push(`                position={cursor.position}`);
    lines.push(`                visible={cursor.visible}`);
    lines.push(`                cursor={cursor.appearance}`);
    lines.push(`            />`);
    lines.push(`        </>`);
    lines.push(`    );`);
    lines.push(`}`);

    return lines.join('\n') + '\n';
}
