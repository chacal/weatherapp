const {CheckerPlugin} = require('awesome-typescript-loader')

module.exports = {
  entry: './client/main.js',
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
        loader: 'awesome-typescript-loader'
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