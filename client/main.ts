import Bacon = require('baconjs')
import $ = require('jquery')
import moment = require('moment')

var modernizr = require('exports-loader?window.Modernizr!./modernizr-custom')
var _ = require('lodash')

import NavigationSlider from './NavigationSlider'
import FMIProxy from './FMIProxy'
import initBgMap from './BackgroundMap'
import ForecastRendering from './ForecastRendering'
import {PointForecast, ForecastItem} from "./ForecastDomain"

declare module 'baconjs' {
  function fromEvent<E, A>(target: noUiSlider.noUiSlider, eventName: string, eventTransformer: (t: number[], m: number) => A): Bacon.EventStream<E, A>;
}

require('normalize.css')
require('../node_modules/nouislider/distribute/nouislider.min.css')
require('../public/css/main.css')

const HOURS_PER_SLIDER_STEP = 3
const currentLocation = {lat: 60, lng: 25}
const fmiProxyUrl = 'https://www.tuuleeko.fi/fmiproxy'

const map = initBgMap(currentLocation)
const navigationSlider = new NavigationSlider('slider', HOURS_PER_SLIDER_STEP)
const fmiProxy = new FMIProxy(fmiProxyUrl)


initializeNavigationButtons()
initializeInfoButton()
initializeEventStreams()
initializeForecastTimePanel()


function initializeNavigationButtons(): void {
  const $navigationContainer = $(`<div id="navigationContainer">
    <button id="previousForecast" class="navigationButton mapControl"><</button>
    <button id="nextForecast" class="navigationButton mapControl">></button>
  </div>`)

  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push($navigationContainer.get(0))

  const buttonEvent = modernizr.touchevents ? 'touchend' : 'click'
  $('#map').on(buttonEvent, '#previousForecast', () => {
    const adjustment = navigationSlider.getValue() % HOURS_PER_SLIDER_STEP === 0 ? HOURS_PER_SLIDER_STEP : navigationSlider.getValue() % HOURS_PER_SLIDER_STEP
    navigationSlider.setValue(navigationSlider.getValue() - adjustment)
  })
  $('#map').on(buttonEvent, '#nextForecast', () => navigationSlider.setValue(navigationSlider.getValue() + HOURS_PER_SLIDER_STEP))
}


function initializeInfoButton(): void {
  const infoButton = $(`<button id="infoButton" class="mapControl">i</button>`)
  map.controls[google.maps.ControlPosition.LEFT_TOP].push(infoButton.get(0))

  $('#map').on('click', '#infoButton', showInfoPopup)

  function showInfoPopup() {
    $('#popupContainer').css('display', '-webkit-flex')
    $('#popupContainer').css('display', 'flex')
    $('#popupContainer #infoPopup').css('display', '-webkit-flex')
    $('#popupContainer #infoPopup').css('display', 'flex')
  }
}


function initializeEventStreams(): void {
  const forecastRendering = new ForecastRendering(map)
  renderAreaForecastOnMapBoundsChange()
  showPointForecastOnMapClick()


  function renderAreaForecastOnMapBoundsChange(): void {
    const boundsChanges: Bacon.EventStream<any, google.maps.LatLngBounds> = Bacon.fromEvent(map as any, 'idle').map(() => map.getBounds())

    // Render wind markers when map bounds change
    boundsChanges
      .flatMapLatest(bounds => fmiProxy.getAreaForecast(bounds))
      .map(af => af.pointForecasts)
      .filter(pointForecasts => pointForecasts.length > 0)
      .map(pointForecasts => {
        const availableForecastItems = pointForecasts[0].forecastItems.length
        return {forecasts: pointForecasts, slider: navigationSlider.initialize(availableForecastItems - 1)}
      })
      .flatMapLatest(({forecasts, slider}) => {
        return Bacon.once(slider.get() as number)
          .merge(sliderChanges(slider))
          .map(sliderValue => ({forecasts, sliderValue}))
      })
      .onValue(({forecasts, sliderValue}) => {
        forecastRendering.renderSelectedForecastItems(forecasts, sliderValue)
        updateForecastTime(forecasts, sliderValue)
      })

    function sliderChanges(slider: noUiSlider.noUiSlider) {
      return sliderValues('slide').debounceImmediate(300).merge(sliderValues('set')).skipDuplicates()

      function sliderValues(eventName: string): Bacon.EventStream<any, number> {
        return Bacon.fromEvent(slider, eventName, (values: number[], handle: number) => values[handle])
      }
    }
  }

  function showPointForecastOnMapClick() {
    const mapClicks: Bacon.Property<any, google.maps.MouseEvent> = function() {  // Only for namespacing, called immediately
      const delayedClicks = Bacon.fromEvent(map as any, 'click').delay(200)
      const dblClicks = Bacon.fromEvent(map as any, 'dblclick').map('dblClick')
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
        const forecastItemsE: Bacon.EventStream<any, ForecastItem[]> = fmiProxy.getPointForecast(latLng)
          .map(pointForecast => _.dropWhile(pointForecast.forecastItems, item => new Date(item.time).getHours() % HOURS_PER_SLIDER_STEP !== 0).filter((item, idx) => idx % HOURS_PER_SLIDER_STEP === 0))
        forecastRendering.showPointForecastPopup(forecastItemsE)
      })

    $('#popupContainer a').click(e => e.stopPropagation())  // Prevent link clicks from closing the popup

    $('#popupContainer').click(() => {
      $('#popupContainer').css('display', 'none')
      $('#popupContainer #infoPopup').css('display', 'none')
      $('#popupContainer #forecastPopup').css('display', 'none')
    })
  }

  function updateForecastTime(forecasts: PointForecast[], forecastItemIndex: number) {
    $('#renderedTime').empty().append(moment(forecasts[0].forecastItems[forecastItemIndex].time).format("ddd HH:mm"))
  }
}

function initializeForecastTimePanel(): void {
  const $renderedTime = $(`<div id="renderedTime" class="mapControl">-</div>`)
  map.controls[google.maps.ControlPosition.TOP_CENTER].push($renderedTime.get(0))
}


