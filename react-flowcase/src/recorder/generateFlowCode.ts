import { describeElement } from '../cursor/target';
import type { FlowRunOptions, FlowStep } from '../flow/types';

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

function formatValue(value: unknown, level: number): string {
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

function formatObject(
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

function formatArray(arr: unknown[], level: number): string {
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

/** Serializes a flow into a TypeScript source string (used by FlowRecorder). */
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
