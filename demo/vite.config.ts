import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    // For GitHub Pages: set BASE_URL env var to /<repo-name>/
    // Locally this defaults to '/' (root)
    base: process.env.BASE_URL || '/',
    plugins: [react()],
    resolve: {
        alias: {
            // Dev: pull library source directly so HMR works across the
            // package boundary. Published consumers hit dist/ via the
            // library package.json `exports` field.
            'react-flowcase': path.resolve(
                here,
                '../react-flowcase/src/index.ts',
            ),
        },
    },
});
