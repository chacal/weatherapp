module.exports = {
  entry: './client/main.js',
  output: {
    path: __dirname + '/public/js',
    publicPath: "/js/",
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [{
          loader: 'babel-loader',
          options: { presets: ['es2015'] }
        }],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ]
  },
  externals: [ 'google' ],
  devServer: {
    contentBase: __dirname + '/public'
  }
}