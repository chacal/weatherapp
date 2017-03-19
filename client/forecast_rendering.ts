import moment = require('moment')
import _ = require('lodash')
import ChartJs = require('chart.js')
import $ = require('jquery')

import {PointForecast, Coords, ForecastItem} from "./ForecastDomain"


let markers = []

export namespace ForecastRendering {

  export function initialize(map: google.maps.Map) {

    return {
      renderSelectedForecastItems: renderSelectedForecastItems,
      showPointForecastPopup: showPointForecastPopup
    }

    function renderSelectedForecastItems(forecasts: PointForecast[], forecastItemIndex: number) {
      forecasts.forEach(forecast => drawWindMarkerIfNotAlreadyShown({lat: forecast.lat, lng: forecast.lng}, forecast.forecastItems[forecastItemIndex]))
    }

    function drawWindMarkerIfNotAlreadyShown(location: Coords, forecastItem: ForecastItem) {
      if(! sameMarkerAlreadyDrawn()) {
        var marker = drawWindMarker(location, forecastItem)
        setTimeout(() => {
          removeMarkerFromLocation(location)
          markers.push({ location: location, forecastItem: forecastItem, marker: marker })
        }, 200)
      }

      function sameMarkerAlreadyDrawn(): boolean {
        return markers.find(marker => _.isEqual(marker.location, location) && _.isEqual(marker.forecastItem, forecastItem))
      }

      function removeMarkerFromLocation(location) {
        const toBeDeleted = markers.find(marker => _.isEqual(marker.location, location))
        if(toBeDeleted) {
          toBeDeleted.marker.setMap(null)
          _.pull(markers, toBeDeleted)
        }
      }
    }

    function drawWindMarker(location: Coords, forecastItem: ForecastItem): google.maps.Marker {
      return new google.maps.Marker({
        position: location,
        map: map,
        icon: {
          anchor: new google.maps.Point(50, 50),
          url: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa(getWindMarkerSVG(forecastItem.windSpeedMs, forecastItem.windDir))
        },
        clickable: false
      })

      function getWindMarkerSVG(windSpeed: number, windDir: number): string {
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

      function getMarkerColor(windSpeed: number): string {
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

        var ctx = $forecastChart.get(0).getContext("2d")
        var windSpeeds = forecastItems.map(item => item.windSpeedMs)
        var windDirs = forecastItems.map(item => item.windDir)
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

