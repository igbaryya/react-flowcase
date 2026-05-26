import Prism from 'prismjs';

/**
 * prismjs language components register on the global `Prism` object.
 * Bundlers (Vite/esbuild) do not expose that global unless we set it.
 */
const globalScope = globalThis as typeof globalThis & {
    Prism?: typeof Prism;
};

if (!globalScope.Prism) {
    globalScope.Prism = Prism;
}

import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';

export { Prism };
