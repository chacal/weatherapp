var bgMap = require('./background_map.js')
var googleMaps = require('google-maps')
var Bacon = require('baconjs')
var $ = require('jquery')
var moment = require('moment')
var _ = require('lodash')

var currentLocation = {lat: 60, lng: 22}

bgMap.init(currentLocation)

var boundsChanges = Bacon.fromBinder(function(sink) {
  bgMap.getMap().addListener('idle', function() { sink(bgMap.getMap().getBounds()) })
})

boundsChanges.flatMapLatest(getCurrentForecasts).onValue(renderForecasts)


function getCurrentForecasts(bounds) {
  var boundsParam = [bounds.getSouthWest().lat(), bounds.getSouthWest().lng(), bounds.getNorthEast().lat(), bounds.getNorthEast().lng()].join(',')
  var now = moment()
  return Bacon.fromPromise($.get('http://46.101.215.154:8000/hirlam-forecast?bounds=' + boundsParam))
    .map(function(forecastsAndLocations) {
      return _.map(forecastsAndLocations, function(forecastAndLocation) {
        var currentForecast = _.find(forecastAndLocation.forecasts, function(forecast) { return moment(forecast.time).isAfter(now) })
        return { lat: forecastAndLocation.lat, lng: forecastAndLocation.lng, forecast: currentForecast }
      })
    })
}

function renderForecasts(forecasts) {
  forecasts.forEach(function(forecastAndLocation) {
    drawWindMarker({lat: forecastAndLocation.lat, lng: forecastAndLocation.lng}, forecastAndLocation.forecast)
  })
}

function drawWindMarker(location, forecast) {
  new googleMaps.Marker({
    position: location,
    map: bgMap.getMap(),
    icon: {
      anchor: new google.maps.Point(50, 50),
      url: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa(getWindMarkerSVG(forecast.windSpeedMs, forecast.windDir))
    }
  })

  function getWindMarkerSVG(windSpeed, windDir) {
    var template = [
      '<?xml version="1.0"?>',
      '<svg width="100px" height="100px" version="1.1" xmlns="http://www.w3.org/2000/svg">',
      '<g transform="scale(0.8)">',
      '<path d="M 50 50 m -10 -30 l 10 -20 10 20 m -10 -20 l 0 95" fill="none" stroke="#6E35CC" stroke-width="2.3" transform="rotate({{ windDir }} 50 50)"/>',
      '<circle stroke="#222" fill="#7C3BE6" cx="50" cy="50" r="20" fill-opacity="0.9"/>',
      '<g font-family="Open Sans, Verdana, sans serif" font-size="20" fill="#fff"><text x="50" y="58" text-anchor="middle">{{ windSpeedMs }}<tspan font-size="16" >.{{ windSpeedMsDecimal }}</tspan></text></g>',
      '</g>',
      '</svg>'
    ].join('\n')
    return template
      .replace('{{ windSpeedMs }}', Math.floor(windSpeed))
      .replace('{{ windSpeedMsDecimal }}', (windSpeed % 1).toFixed(1) * 10)
      .replace('{{ windDir }}', windDir - 180)
  }
}
