import '../public/css/main.css'
import Map from './Map'
import FMIProxy from './FMIProxy'
import { AreaForecast } from './ForecastDomain'
import NavigationSlider from './NavigationSlider'
import { format, parseISO } from 'date-fns'
import { EventStream, fromEvent, fromPromise } from 'baconjs'
import { LeafletMouseEvent } from 'leaflet'
import $ from 'jquery'
import { showPointForecastLoadingPopup, showPointForecastPopup } from './ForecastRendering'

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

const currentLocation = { lat: 59.8, lng: 24 }
const fmiProxyUrl = 'https://www.tuuleeko.fi/fmiproxy'

const fmiProxy = new FMIProxy(fmiProxyUrl)
const map = new Map('map', currentLocation)
const slider = new NavigationSlider('slider')


fmiProxy.getAreaForecastForEveryThirdHour()
  .then(f => initializeUI(f))


function initializeUI(forecast: AreaForecast) {
  const items = forecast.pointForecasts[0].forecastItems
  const firsItemTime = parseISO(items[0].time)
  const lastItemTime = parseISO(items[items.length - 1].time)

  initializeSlider(firsItemTime, lastItemTime, forecast)
  initializeNavigationButtons()
  initializeInfoButton()
  initializeForecastPopup()

  renderForecastForTime(forecast, firsItemTime)
}

function renderForecastForTime(forecast: AreaForecast, time: Date) {
  map.renderMarkersForTime(forecast, time)
  updateTimeField(time)
}

function updateTimeField(time: Date) {
  $('#renderedTime').text(format(time, 'EEE HH:mm'))
}

function initializeSlider(firsItemTime: Date, lastItemTime: Date, forecast: AreaForecast) {
  const s = slider.initialize(firsItemTime.getTime(), lastItemTime.getTime(), THREE_HOURS_MS)
  s.on('update', ([ts]) => renderForecastForTime(forecast, new Date(ts)))
}

function initializeNavigationButtons() {
  $('#previousForecast').on('click', () => slider.setValue(slider.getValue() - THREE_HOURS_MS))
  $('#nextForecast').on('click', () => slider.setValue(slider.getValue() + THREE_HOURS_MS))
}

function initializeForecastPopup() {
  const clicks: EventStream<LeafletMouseEvent> = fromEvent(map.map, 'click')

  const singleClicks = clicks
    .bufferWithTime(200)
    .filter(events => events.length === 1)
    .map(events => events[0].latlng)

  singleClicks
    .onValue(() => showPointForecastLoadingPopup())

  singleClicks
    .flatMapLatest(latLng => fromPromise(fmiProxy.getPointForecast(latLng)))
    .map(pf => pf.forecastItems)
    .onValue(forecastItems => showPointForecastPopup(forecastItems))

  $('#popupContainer a').on('click', e => e.stopPropagation())  // Prevent link clicks from closing the popup

  $('#popupContainer').on('click', () => {
    $('#popupContainer').css('display', 'none')
    $('#popupContainer #infoPopup').css('display', 'none')
    $('#popupContainer #forecastPopup').css('display', 'none')
  })
}

function initializeInfoButton() {
  $('#infoButton').on('click', showInfoPopup)

  function showInfoPopup() {
    $('#popupContainer').css('display', '-webkit-flex')
    $('#popupContainer').css('display', 'flex')
    $('#popupContainer #infoPopup').css('display', '-webkit-flex')
    $('#popupContainer #infoPopup').css('display', 'flex')
  }
}
