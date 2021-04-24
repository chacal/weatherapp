const path = require('path')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin')

module.exports = {
  mode: 'development',
  entry: './client/Main.ts',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public', 'js'),
    publicPath: '/js/',
  },
  devServer: {
    contentBase: './public',
    port: 9000,
    hot: true,
  },
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ],
        include: /public/,
      }
    ],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new ForkTsCheckerNotifierWebpackPlugin({ title: 'Webpack' })
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
}
