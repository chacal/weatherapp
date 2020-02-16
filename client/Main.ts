import Bacon = require('baconjs')
import $ = require('jquery')
import moment = require('moment')
import R = require('ramda')

import NavigationSlider from './NavigationSlider'
import FMIProxy from './FMIProxy'
import initBgMap from './BackgroundMap'
import ForecastRendering from './ForecastRendering'
import {PointForecast, ForecastItem} from "./ForecastDomain"

declare module 'baconjs' {
  function fromEvent<E, A>(target: noUiSlider.noUiSlider, eventName: string, eventTransformer: (t: number[], m: number) => A): Bacon.EventStream<A>;
}

const modernizr = require('exports-loader?window.Modernizr!./modernizr-custom')
require('normalize.css')
require('../node_modules/nouislider/distribute/nouislider.min.css')
require('../public/css/main.css')

const HOURS_PER_SLIDER_STEP = 3
const fmiProxyUrl = 'https://www.tuuleeko.fi/fmiproxy'
const currentLocation = {latitude: 60, longitude: 25}

const map = initBgMap(currentLocation)
const forecastRendering = new ForecastRendering(map)
const navigationSlider = new NavigationSlider('slider', HOURS_PER_SLIDER_STEP)
const fmiProxy = new FMIProxy(fmiProxyUrl)


initializeNavigationButtons()
initializeInfoButton()
initializeForecastTimePanel()
renderAreaForecastOnSliderChanges()
showPointForecastOnMapClick()


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


function renderAreaForecastOnSliderChanges(): void {
  type ForecastsWithSliderValuesStream = Bacon.EventStream<{forecasts: PointForecast[], sliderValue: number}>

  const forecastsWithSliderValues: ForecastsWithSliderValuesStream = fmiProxy.getAreaForecast()
    .map(af => af.pointForecasts)
    .filter(pointForecasts => pointForecasts.length > 0)
    .map(pointForecasts => {
      const indexOfFirstForecastItemAfterCurrentTime = pointForecasts[0].forecastItems.findIndex(item => moment(item.time).isAfter(moment()))
      const indexOfLastForecastItem = pointForecasts[0].forecastItems.length - 1
      return {forecasts: pointForecasts, slider: navigationSlider.initialize(indexOfFirstForecastItemAfterCurrentTime, indexOfLastForecastItem)}
    })
    .flatMapLatest(({forecasts, slider}) => {
      return Bacon.once(parseInt(slider.get() as string))
        .merge(sliderChanges(slider))
        .map(sliderValue => ({forecasts, sliderValue})) as ForecastsWithSliderValuesStream
    })

  forecastsWithSliderValues.onValue(({forecasts, sliderValue}) => {
    forecastRendering.renderSelectedForecastItems(forecasts, sliderValue)
    updateForecastTime(forecasts, sliderValue)
  })


  const forecastsWithSliderValuesWhenMapIsReady = forecastsWithSliderValues
    .toProperty()
    .sampledBy(Bacon.fromEvent(map as any, 'idle'))
    .first()

  forecastsWithSliderValuesWhenMapIsReady.onValue(({forecasts, sliderValue}) => updateForecastTime(forecasts, sliderValue))


  function sliderChanges(slider: noUiSlider.noUiSlider): Bacon.EventStream<number> {
    return sliderValues('slide').debounceImmediate(300).merge(sliderValues('set')).skipDuplicates()

    function sliderValues(eventName: string): Bacon.EventStream<number> {
      return Bacon.fromEvent(slider, eventName, (values: number[], handle: number) => values[handle])
    }
  }

  function updateForecastTime(forecasts: PointForecast[], forecastItemIndex: number) {
    $('#renderedTime').empty().append(moment(forecasts[0].forecastItems[forecastItemIndex].time).format("ddd HH:mm"))
  }
}


function showPointForecastOnMapClick(): void {
  const mapClicks: Bacon.Property<google.maps.MouseEvent> = function() {  // Only for namespacing, called immediately
    const delayedClicks = Bacon.fromEvent(map as any, 'click').delay(200)
    const dblClicks = Bacon.fromEvent(map as any, 'dblclick').map('dblClick')
    return delayedClicks.merge(dblClicks)
      .slidingWindow(2)
      .filter(events => !R.contains('dblClick', events))  // Click happens only if double click has not happened
      .map(events => R.last(events))
      .filter(e => !!R.identity(e)) as Bacon.Property<google.maps.MouseEvent>
  }()

  // Show forecast popup when point on map is clicked
  mapClicks
    .map(e => e.latLng)
    .doAction(() => forecastRendering.showPointForecastLoadingPopup())
    .flatMapLatest(latLng => fmiProxy.getPointForecast(latLng))
    .map(pf => pf.forecastItems)
    .map(forecastItems => forecastItems.filter(itemOnFixedSliderHours))
    .onValue(forecastItems => forecastRendering.showPointForecastPopup(forecastItems))

  $('#popupContainer a').click(e => e.stopPropagation())  // Prevent link clicks from closing the popup

  $('#popupContainer').click(() => {
    $('#popupContainer').css('display', 'none')
    $('#popupContainer #infoPopup').css('display', 'none')
    $('#popupContainer #forecastPopup').css('display', 'none')
  })

  function itemOnFixedSliderHours(item: ForecastItem): boolean { return  new Date(item.time).getHours() % HOURS_PER_SLIDER_STEP === 0 }
}


function initializeForecastTimePanel(): void {
  const $renderedTime = $(`<div id="renderedTime" class="mapControl">-</div>`)
  map.controls[google.maps.ControlPosition.TOP_CENTER].push($renderedTime.get(0))
}
