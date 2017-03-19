var modernizr = require('exports-loader?window.Modernizr!./modernizr-custom')
var bgMap = require('./background_map')
var googleMaps = require('google').maps
var Bacon = require('baconjs')
var $ = require('jquery')
var moment = require('moment')
var _ = require('lodash')

import NavigationSlider from './NavigationSlider'

require('normalize.css')
require('../node_modules/nouislider/distribute/nouislider.min.css')
require('../public/css/main.css')

import ForecastRendering from './forecast_rendering'

const HOURS_PER_SLIDER_STEP = 3
var currentLocation = {lat: 60, lng: 25}

const map = bgMap.init(currentLocation)
const navigationSlider = new NavigationSlider('slider', HOURS_PER_SLIDER_STEP)
const fmiProxyUrl = 'https://www.tuuleeko.fi/fmiproxy'

initializeNavigationButtons()
initializeInfoButton()
initializeEventStreams()
initializeForecastTimePanel()


function initializeNavigationButtons() {
  var $navigationContainer = $(`<div id="navigationContainer">
    <button id="previousForecast" class="navigationButton mapControl"><</button>
    <button id="nextForecast" class="navigationButton mapControl">></button>
  </div>`)

  map.controls[googleMaps.ControlPosition.RIGHT_BOTTOM].push($navigationContainer.get(0))

  const buttonEvent = modernizr.touchevents ? 'touchend' : 'click'
  $('#map').on(buttonEvent, '#previousForecast', () => {
    const adjustment = navigationSlider.getValue() % HOURS_PER_SLIDER_STEP === 0 ? HOURS_PER_SLIDER_STEP : navigationSlider.getValue() % HOURS_PER_SLIDER_STEP
    navigationSlider.setValue(navigationSlider.getValue() - adjustment)
  })
  $('#map').on(buttonEvent, '#nextForecast', () => navigationSlider.setValue(navigationSlider.getValue() + HOURS_PER_SLIDER_STEP))
}


function initializeInfoButton() {
  var infoButton = $(`<button id="infoButton" class="mapControl">i</button>`)
  map.controls[googleMaps.ControlPosition.LEFT_TOP].push(infoButton.get(0))

  $('#map').on('click', '#infoButton', showInfoPopup)

  function showInfoPopup() {
    $('#popupContainer').css('display', '-webkit-flex')
    $('#popupContainer').css('display', 'flex')
    $('#popupContainer #infoPopup').css('display', '-webkit-flex')
    $('#popupContainer #infoPopup').css('display', 'flex')
  }
}


function initializeEventStreams() {
  const forecastRendering = new ForecastRendering(map)
  const boundsChanges = Bacon.fromEvent(map, 'idle', () => map.getBounds())

  // Render wind markers when map bounds change
  boundsChanges
    .flatMapLatest(getAreaForecast)
    .map('.pointForecasts')
    .filter(pointForecasts => pointForecasts.length > 0)
    .map(pointForecasts => {
      const availableForecastItems = pointForecasts[0].forecastItems.length
      return { forecasts: pointForecasts, slider: navigationSlider.initialize(availableForecastItems - 1) }
    })
    .flatMapLatest(forecastAndSlider => {
      return Bacon.once(parseInt(forecastAndSlider.slider.get()))
        .merge(sliderChanges(forecastAndSlider.slider))
        .map(sliderValue => ({ forecasts: forecastAndSlider.forecasts, sliderValue: sliderValue }))
    })
    .onValue(forecastAndSliderValue => {
      forecastRendering.renderSelectedForecastItems(forecastAndSliderValue.forecasts, forecastAndSliderValue.sliderValue)
      updateForecastTime(forecastAndSliderValue.forecasts, forecastAndSliderValue.sliderValue)
    })

  const mapClicks = function() {  // Only for namespacing, called immediately
    const delayedClicks = Bacon.fromEvent(map, 'click').delay(200)
    const dblClicks = Bacon.fromEvent(map, 'dblclick').map(() => 'dblClick')
    return delayedClicks.merge(dblClicks)
      .slidingWindow(2)
      .filter(events => !_.includes(events, 'dblClick'))  // Click happens only if double click has not happened
      .map(events => _.last(events))
      .filter(_.identity)
  }()

  // Show forecast popup when point on map is clicked
  mapClicks
    .map(e => e.latLng)
    .onValue(latLng => {
      var startTime = encodeURIComponent(moment().format())
      var forecastItemsE = Bacon.fromPromise($.get(`${fmiProxyUrl}/hirlam-forecast?lat=${latLng.lat()}&lon=${latLng.lng()}&startTime=${startTime}`))
        .map(pointForecast => _.dropWhile(pointForecast.forecastItems, item => new Date(item.time).getHours() % HOURS_PER_SLIDER_STEP !== 0).filter((item, idx) => idx % HOURS_PER_SLIDER_STEP === 0))
      forecastRendering.showPointForecastPopup(forecastItemsE)
    })

  $('#popupContainer a').click(e => e.stopPropagation())  // Prevent link clicks from closing the popup

  $('#popupContainer').click(() => {
    $('#popupContainer').css('display', 'none')
    $('#popupContainer #infoPopup').css('display', 'none')
    $('#popupContainer #forecastPopup').css('display', 'none')
  })


  function sliderChanges(slider) {
    return sliderEvents(slider, 'slide').debounceImmediate(300).merge(sliderEvents(slider, 'set')).skipDuplicates()
  }

  function sliderEvents(slider, eventName) {
    return Bacon.fromEvent(slider, eventName, (values, handle) => values[handle])
  }

  function getAreaForecast(bounds) {
    var boundsParam = [bounds.getSouthWest().lat(), bounds.getSouthWest().lng(), bounds.getNorthEast().lat(), bounds.getNorthEast().lng()].join(',')
    var startTime = encodeURIComponent(moment().format())
    return Bacon.fromPromise($.get(`${fmiProxyUrl}/hirlam-forecast?bounds=${boundsParam}&startTime=${startTime}`))
  }

  function updateForecastTime(forecasts, forecastItemIndex) {
    $('#renderedTime').empty().append(moment(forecasts[0].forecastItems[forecastItemIndex].time).format("ddd HH:mm"))
  }
}

function initializeForecastTimePanel() {
  var $renderedTime = $(`<div id="renderedTime" class="mapControl">-</div>`)
  map.controls[googleMaps.ControlPosition.TOP_CENTER].push($renderedTime.get(0))
}
