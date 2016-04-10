var express = require('express')
var compression = require('compression')
var morgan = require('morgan')
var logging = require('./logging.js')
var logger = logging.console

var app = express()
app.set('port', (process.env.PORT || 8005))
app.use(morgan('combined', { stream: logging.fileLoggerStream }))

logger.info("Starting weatherapp..")

app.use(compression())
app.use(express.static(__dirname + '/../public'))

app.listen(app.get('port'), function() {
  logger.info("Weather app is running at localhost:" + app.get('port'))
})

app.use(function (err, req, res, next) {
  logger.error(err)
  res.status(err.status || 500)
  res.json({
    message: err.message,
    error: err
  })
})
