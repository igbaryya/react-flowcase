/**
 * Pretty-print a function for display in the config editor.
 * Strips leading indentation copied from the file where the function was defined.
 */
export function formatFunctionSource(fn: (...args: unknown[]) => unknown): string {
    return dedentSource(fn.toString());
}

/** Remove common leading whitespace from multi-line source text. */
export function dedentSource(source: string): string {
    const normalized = source.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    if (lines.length <= 1) return normalized.trimEnd();

    let minIndent = Infinity;
    for (let i = 1; i < lines.length; i += 1) {
        const line = lines[i];
        if (line.trim() === '') continue;
        const match = /^(\s*)/.exec(line);
        const indent = match?.[1].length ?? 0;
        minIndent = Math.min(minIndent, indent);
    }

    if (!Number.isFinite(minIndent) || minIndent === 0) {
        return normalized.trimEnd();
    }

    const dedented = lines.map((line, index) => {
        if (index === 0 || line.trim() === '') return line;
        return line.slice(Math.min(minIndent, line.length));
    });

    return dedented.join('\n').trimEnd();
}
