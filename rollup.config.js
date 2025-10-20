import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'webview/main.js',
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'dist/webview.js'
  },
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
      compilerOptions: {
        dev: !production
      },
      emitCss: true
    }),
    css({ output: 'webview.css' }),
    resolve({
      browser: true,
      dedupe: ['svelte']
    }),
    commonjs(),
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};
