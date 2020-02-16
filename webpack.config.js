module.exports = {
  entry: './client/Main.ts',
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
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
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
  }
}