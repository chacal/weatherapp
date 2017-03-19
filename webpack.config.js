const {CheckerPlugin} = require('awesome-typescript-loader')

module.exports = {
  entry: './client/main.ts',
  output: {
    path: __dirname + '/public/js',
    publicPath: "/js/",
    filename: 'bundle.js'
  },
  devtool: 'source-map',
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        loader: "source-map-loader"
      },
      {
        test: /\.tsx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['es2015']
            }
          },
          {
            loader: 'awesome-typescript-loader'
          }
        ]
      },
      {
        test: /\.jsx?$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['es2015']
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      }
    ]
  },
  externals: ['google'],
  devServer: {
    contentBase: __dirname + '/public'
  },
  plugins: [
    new CheckerPlugin()
  ]
}