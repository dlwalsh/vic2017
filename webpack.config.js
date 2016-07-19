/* eslint-env node */

const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: [
    './src/index.js',
  ],
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: '/public/',
  },
  module: {
    preLoaders: [{
      test: /\.json$/,
      loader: 'json',
    }],
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel?presets[]=es2015&presets[]=react',
    }, {
      test: /\.css$/,
      loader: 'style!css',
    }, {
      test: /\.(png|jpg)$/,
      loader: 'url?limit=8192',
    }],
  },
  plugins: [
    new webpack.ProvidePlugin({
      fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
      Promise: 'imports?this=>global!exports?global.fetch!es6-promise',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
};
