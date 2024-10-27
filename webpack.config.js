const HtmlBundlerPlugin = require('html-bundler-webpack-plugin');

const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  mode: 'production',
  devServer: {
    static: './dist',
    port: 1337,
  },
  plugins: [
    new HtmlBundlerPlugin({
      entry: {
        index: 'src/index.html',
      },
      js: {
        filename: 'src/index.js',
      },
      css: {
        filename: 'src/styles.css',
      },
    }),
    new webpack.DefinePlugin({
      'WS_SERVER_ADDRESS': JSON.stringify(process.env.WS_SERVER_ADDRESS),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['css-loader'],
      },
      {
        test: /\.(ico|png|jp?g|webp|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name].[hash:8][ext][query]',
        },
      },
    ],
  },
};
