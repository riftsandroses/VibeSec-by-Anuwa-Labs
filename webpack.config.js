const path = require('path');
const sveltePreprocess = require('svelte-preprocess');

const extensionConfig = {
    target: 'node',
    mode: 'none',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode'
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: path.resolve(__dirname, 'tsconfig.json')
                        }
                    }
                ]
            }
        ]
    },
    devtool: 'source-map',
    infrastructureLogging: {
        level: "log"
    }
};

const webviewConfig = {
    target: 'web',
    mode: 'development',
    entry: './src/webview/main.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webview.js',
        clean: false
    },
    resolve: {
        alias: {
            svelte: path.resolve('node_modules', 'svelte'),
            'svelte/internal': path.resolve('node_modules', 'svelte/src/internal'),
            'svelte/internal/disclose-version': path.resolve('node_modules', 'svelte/src/internal/client/dev/hmr.js')
        },
        extensions: ['.mjs', '.js', '.ts', '.svelte'],
        mainFields: ['svelte', 'browser', 'module', 'main'],
        conditionNames: ['svelte', 'browser'],
        fallback: {
            'svelte/internal/disclose-version': false
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        configFile: path.resolve(__dirname, 'tsconfig.json'),
                        transpileOnly: true
                    }
                }
            },
            {
                test: /\.svelte$/,
                use: {
                    loader: 'svelte-loader',
                    options: {
                        compilerOptions: {
                            dev: true,
                            css: 'injected',
                            hydratable: false,
                            runes: true
                        },
                        emitCss: false,
                        hotReload: false,
                        preprocess: sveltePreprocess({
                            sourceMap: true,
                            typescript: {
                                tsconfigFile: './tsconfig.json'
                            }
                        })
                    }
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /node_modules\/svelte\/.*\.(mjs|js)$/,
                resolve: {
                    fullySpecified: false
                }
            }
        ]
    },
    devtool: 'source-map'
};

module.exports = [extensionConfig, webviewConfig];