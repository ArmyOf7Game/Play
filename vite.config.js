import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';
export default defineConfig({
    // React plugin for JSX and React features
    plugins: [
        viteCommonjs(),
        react()
    ],
    // Base path for GitHub Pages deployment
    base: '/Play/',
    // Global definitions for browser environment
    define: {
        global: 'globalThis',
        'process.env': {},
    },
    // Module resolution aliases for Node.js compatibility
    resolve: {
        alias: {
            buffer: 'buffer',
            process: 'process/browser',
            stream: 'stream-browserify',
            util: 'util',
        }
    },
    // Optimize dependencies with Node.js polyfills
    optimizeDeps: {
        esbuildOptions: {
            define: {
                global: 'globalThis'
            },
            plugins: [
                // Polyfill Node.js globals (buffer, process, etc.)
                NodeGlobalsPolyfillPlugin({
                    buffer: true,
                    process: true
                }),
                // Polyfill Node.js modules
                NodeModulesPolyfillPlugin()
            ]
        }
    },
    // Build configuration
    build: {
        // Output directory for the build
        outDir: 'dist',
        // Rollup-specific options
        rollupOptions: {
            plugins: [
                // Polyfill Node.js modules in the browser
                rollupNodePolyFill()
            ]
        },
        // Prevent inlining of assets (important for correct path references)
        assetsInlineLimit: 0,
        chunkSizeWarningLimit: 2048
    }
});
