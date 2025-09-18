/* eslint-disable prefer-template */

process.env.NODE_ENV = process.env.NODE_ENV || 'development' // set a default NODE_ENV

const path = require('path')
const fs = require('fs')

const webpack = require('webpack')
const TerserPlugin = require('terser-webpack-plugin')
const LodashWebpackPlugin = require('lodash-webpack-plugin')
const { merge } = require('webpack-merge')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
const { GitRevisionPlugin } = require('git-revision-webpack-plugin')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const pkg = require('./package.json')

const gitRevisionPlugin = new GitRevisionPlugin()

const libraryName = pkg.name

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production' || process.env.NODE_ENV === 'production'

    const analyze = !!process.env.BUNDLE_ANALYSIS

    const commonConfig = {
        cache: {
            type: 'filesystem',
        },
        name: libraryName,
        mode: isProduction ? 'production' : 'development',
        entry: {
            [libraryName]: path.join(__dirname, 'src', 'exports-browser.ts'),
        },
        devtool: 'source-map',
        output: {
            umdNamedDefine: true,
        },
        optimization: {
            minimize: false,
            moduleIds: 'named',
        },
        module: {
            rules: [
                {
                    test: /(\.jsx|\.js|\.ts)$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            configFile: path.resolve(__dirname, '.babel.browser.config.js'),
                            babelrc: false,
                            cacheDirectory: true,
                        }
                    }
                }
            ]
        },
        resolve: {
            modules: ['node_modules', ...require.resolve.paths(''), path.resolve('./vendor')],
            extensions: ['.json', '.js', '.ts'],
        },
        plugins: [
            gitRevisionPlugin,
            new webpack.EnvironmentPlugin({
                NODE_ENV: process.env.NODE_ENV,
                version: pkg.version,
                GIT_VERSION: gitRevisionPlugin.version(),
                GIT_COMMITHASH: gitRevisionPlugin.commithash(),
                GIT_BRANCH: gitRevisionPlugin.branch(),
            })
        ],
        performance: {
            hints: 'warning',
        },
    }

    const clientConfig = merge({}, commonConfig, {
        target: 'web',
        output: {
            filename: '[name].web.js',
            libraryTarget: 'umd',
            library: 'EthWatch',
            // NOTE:
            // exporting the class directly
            // `export default class EthWatch {}`
            // becomes:
            // `window.EthWatch === EthWatch`
            // which is correct, but if we define the class and export separately,
            // which is required if we do interface EthWatch extends …:
            // `class EthWatch {}; export default EthWatch;`
            // becomes:
            // `window.EthWatch = { default: EthWatch, … }`
            // which is wrong for browser builds.
            // see: https://github.com/webpack/webpack/issues/706#issuecomment-438007763
            // libraryExport: 'EthWatch', // This fixes the above.
            globalObject: 'globalThis',
        },
        resolve: {
            mainFields: ['browser', 'module', 'main'],
            alias: {
                // Replace Node-only DHT server connector with a browser no-op shim (also reinforced by NormalModuleReplacementPlugin)
                '@streamr/dht/dist/src/connection/websocket/WebsocketServerConnector.js': path.resolve(__dirname, 'src/shim/WebsocketServerConnector.js'),
                // Exclude Node-only libs pulled indirectly
                '@streamr/autocertifier-client': false,
            },
            fallback: {
                // Explicitly stub Node-only core modules for browser builds
                fs: false,
                net: false,
                tls: false,
                http: false,
                https: false,
                module: false,
                express: false,
                child_process: false,
                worker_threads: false,
                dns: false,
            }
        },
        plugins: [
            new webpack.NormalModuleReplacementPlugin(
                /@streamr\/dht\/dist\/src\/connection\/websocket\/WebsocketServerConnector\.js$/,
                path.resolve(__dirname, 'src/shim/WebsocketServerConnector.js')
            ),
            new NodePolyfillPlugin({
                excludeAliases: ['console'],
            }),
            new LodashWebpackPlugin(),
            ...(analyze ? [
                new BundleAnalyzerPlugin({
                    analyzerMode: 'static',
                    openAnalyzer: false,
                    generateStatsFile: true,
                })
            ] : [])
        ]
    })

    let clientMinifiedConfig

    if (isProduction) {
        clientMinifiedConfig = merge({}, clientConfig, {
            cache: false,
            optimization: {
                minimize: true,
                minimizer: [
                    new TerserPlugin({
                        parallel: true,
                        terserOptions: {
                            ecma: 2018,
                            output: {
                                comments: false,
                            },
                        },
                    }),
                ],
            },
            output: {
                filename: '[name].web.min.js',
            },
        })
    }
    return [clientConfig, clientMinifiedConfig].filter(Boolean)
}
