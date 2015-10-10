var moment = require('moment')
var _ = require('lodash')
var googleMaps = require('google').maps
var ChartJs = require('chart.js')
var $ = require('jquery')


var markers = []

module.exports = function(map) {

  function renderSelectedForecastItems(forecasts, forecastItemIndex) {
    forecasts.forEach(forecast => drawWindMarkerIfNotAlreadyShown({lat: forecast.lat, lng: forecast.lng}, forecast.items[forecastItemIndex]))
  }

  function drawWindMarkerIfNotAlreadyShown(location, forecastItem) {
    if(! sameMarkerAlreadyDrawn()) {
      var marker = drawWindMarker(location, forecastItem)
      setTimeout(() => {
        removeMarkerFromLocation(location)
        markers.push({ location: location, forecastItem: forecastItem, marker: marker })
      }, 200)
    }

    function sameMarkerAlreadyDrawn() {
      return _.find(markers, marker => _.isEqual(marker.location, location) && _.isEqual(marker.forecastItem, forecastItem))
    }

    function removeMarkerFromLocation(location) {
      const toBeDeleted = markers.find(marker => _.isEqual(marker.location, location))
      if(toBeDeleted) {
        toBeDeleted.marker.setMap(null)
        _.pull(markers, toBeDeleted)
      }
    }
  }

  function drawWindMarker(location, forecastItem) {
    return new googleMaps.Marker({
      position: location,
      map: map,
      icon: {
        anchor: new google.maps.Point(50, 50),
        url: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa(getWindMarkerSVG(forecastItem.windSpeedMs, forecastItem.windDir))
      },
      clickable: false
    })

    function getWindMarkerSVG(windSpeed, windDir) {
      const windSpeedInt = Math.trunc(windSpeed)
      const oppositeWindDir = windDir - 180
      const markerColor = getMarkerColor(windSpeedInt)

      return `<?xml version="1.0"?>
      <svg width="100px" height="100px" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <g transform="scale(0.8)">
        <path d="M 50 60 m -10 -30 l 10 -20 10 20 z" fill="${markerColor}" stroke="none" transform="rotate(${oppositeWindDir} 50 50)"/>
        <circle stroke="${markerColor}" fill="#fff" cx="50" cy="50" r="16" stroke-width="3"/>
        <g font-family="Open Sans, Verdana, sans serif" font-size="20" fill="#000">
          <text x="50" y="57" font-weight="bold" text-anchor="middle">${windSpeedInt}</text>
        </g>
      </g>
    </svg>`
    }

    function getMarkerColor(windSpeed) {
      if(windSpeed < 4)
        return '#2DC22F'
      else if(windSpeed < 7)
        return '#0099FF'
      else if(windSpeed < 10)
        return '#5852CC'
      else if(windSpeed < 14)
        return '#FF00FF'
      else
        return '#FF5050'
    }
  }

  function showPointForecastPopup(forecastItemsE) {
    $('#popupContainer').css('display', 'flex')
    $("#forecastChart").hide()
    $('#popupContainer .spinner').show()
    forecastItemsE.onValue(forecastItems => {
      $('#popupContainer .spinner').hide()
      $("#forecastChart").show()

      var ctx = $("#forecastChart").get(0).getContext("2d")
      var windSpeeds = forecastItems.map(item => item.windSpeedMs)
      var labels = forecastItems.map(item => moment(item.time).format("HH:mm"))

      var data = {
        labels: labels,
        datasets: [{
          fillColor: "rgba(0,153,255,0.2)",
          strokeColor: "rgba(0,153,255,0.9)",
          data: windSpeeds
        }]
      }

      const options = {
        animation: false,
        showTooltips: false,
        bezierCurveTension : 0.3,
        pointDot: false
      }

      new ChartJs(ctx).Line(data, options)
    })
  }

  return {
    renderSelectedForecastItems: renderSelectedForecastItems,
    showPointForecastPopup: showPointForecastPopup
  }
}
