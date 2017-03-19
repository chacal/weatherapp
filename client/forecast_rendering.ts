import moment = require('moment')
import _ = require('lodash')
import ChartJs = require('chart.js')
import $ = require('jquery')
import R = require('ramda')
import L = require('partial.lenses')

import {PointForecast, Coords, ForecastItem, ForecastMarker} from "./ForecastDomain"


let markers: ForecastMarker[] = []

export namespace ForecastRendering {

  export function initialize(map: google.maps.Map) {

    return {
      renderSelectedForecastItems: renderSelectedForecastItems,
      showPointForecastPopup: showPointForecastPopup
    }

    function renderSelectedForecastItems(forecasts: PointForecast[], forecastItemIndex: number) {
      forecasts.forEach(forecast => drawForecastMarkerIfNotAlreadyShown({lat: forecast.lat, lng: forecast.lng}, forecast.forecastItems[forecastItemIndex]))


      function drawForecastMarkerIfNotAlreadyShown(location: Coords, forecastItem: ForecastItem) {
        if(! sameMarkerAlreadyDrawn()) {
          const googleMapsMarker = ForecastMarker.drawGoogleMapsMarker(map, location, forecastItem)
          setTimeout(() => {
            markers = L.modify(L.find(ForecastMarker.hasSameLocation(location)), replaceMarker, markers)

            function replaceMarker(old: ForecastMarker) {
              if(old) { old.mapMarker.setMap(null) }
              return new ForecastMarker(location, forecastItem, googleMapsMarker)
            }
          }, 200)
        }

        function sameMarkerAlreadyDrawn(): boolean {
          return R.find(R.both(ForecastMarker.hasSameLocation(location), ForecastMarker.hasSameItem(forecastItem)), markers) !== undefined
        }
      }
    }

    function showPointForecastPopup(forecastItemsE) {
      $('#popupContainer').css('display', '-webkit-flex')
      $('#popupContainer').css('display', 'flex')
      $('#popupContainer #forecastPopup').css('display', '-webkit-flex')
      $('#popupContainer #forecastPopup').css('display', 'flex')
      $('#popupContainer .spinner').show()
      $(".forecastData").empty().hide()
      $(".forecastHeader").hide()
      forecastItemsE.onValue(forecastItems => {
        $(".forecastData").empty().show()
        $(".forecastHeader").show()
        $('#popupContainer .spinner').hide()
        const $forecastChart = $('<canvas class="forecastChart">')
        $('#forecastPopup .forecastData').append($forecastChart)

        const ctx = $forecastChart.get(0).getContext("2d")
        const windSpeeds = forecastItems.map(item => item.windSpeedMs)
        const windDirs = forecastItems.map(item => item.windDir)
        const labels = forecastItems.map(item => moment(item.time).format("HH:mm"))

        const data = {
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
          pointDot: false,
          scaleBeginAtZero: true,
          responsive: true,
          maintainAspectRatio: false
        }

        new ChartJs(ctx).Line(data, options)

        const $windDirContainer = $('<div class="windDirContainer">')
        windDirs.forEach(windDir => {
          $windDirContainer.append($('<span class="windDir">').text('\u2193')
            .css({
              '-webkit-transform': 'rotate(' + windDir + 'deg)',
              'transform': 'rotate(' + windDir + 'deg)'
            })
          )
        })
        $('.forecastData').append($windDirContainer)

      })
    }
  }
}

