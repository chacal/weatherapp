var express = require('express')

var app = express()
app.set('port', (process.env.PORT || 8005))

console.log("Starting weatherapp..")

app.use(express.static(__dirname + '/../public'))

app.listen(app.get('port'), function() {
  console.log("Weather app is running at localhost:" + app.get('port'))
})

app.use(function (err, req, res, next) {
  console.log(err)
  res.status(err.status || 500)
  res.json({
    message: err.message,
    error: err
  })
})
