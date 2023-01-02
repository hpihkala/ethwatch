const path              = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

const srcPath      = path.resolve(__dirname, 'src');
const buildPath    = path.resolve(__dirname, 'dist');

module.exports = {
  entry: path.join(srcPath, 'index.ts'),

  output: {
    path: buildPath,
    filename: 'bundle.js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      }
    ]
  },

  resolve: {
    extensions: ['*', '.js', '.ts'],
	fallback: {
		path: false,
		// stream: false, // maybe needed? stream-browserify
		// util: require.resolve("util/"), // adds 0.2MB
		// crypto: require.resolve('crypto-browserify'), // adds 2.5MB!
	}
  },

  devtool: 'inline-source-map',

  plugins: [
	new NodePolyfillPlugin({
		excludeAliases: ['console'],
	}),
  ]
};
