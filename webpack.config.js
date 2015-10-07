require('es6-promise').polyfill()  // Needed for older Node.js versions

module.exports = {
  entry: './client/main.js',
  output: {
    path: __dirname + '/public/js',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css' },
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      }
    ]
  },
  externals: [ 'google' ]
}