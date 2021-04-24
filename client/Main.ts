import '../public/css/main.css'
import Map from './Map'
import FMIProxy from './FMIProxy'
import { AreaForecast } from './ForecastDomain'
import NavigationSlider from './NavigationSlider'
import { format, parseISO } from 'date-fns'

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

const currentLocation = { lat: 60, lng: 24 }
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

  renderForecastForTime(forecast, firsItemTime)
}

function renderForecastForTime(forecast: AreaForecast, time: Date) {
  map.renderMarkersForTime(forecast, time)
  updateTimeField(time)
}

function updateTimeField(time: Date) {
  const timeField = document.getElementById('renderedTime')
  if (timeField) {
    timeField.innerText = format(time, 'EEE HH:mm')
  }
}

function initializeSlider(firsItemTime: Date, lastItemTime: Date, forecast: AreaForecast) {
  const s = slider.initialize(firsItemTime.getTime(), lastItemTime.getTime(), THREE_HOURS_MS)
  s.on('update', ([ts]) => renderForecastForTime(forecast, new Date(ts)))
}

function initializeNavigationButtons() {
  const prevForecastBtn = document.getElementById('previousForecast')
  if (prevForecastBtn) {
    prevForecastBtn.addEventListener('click', event => {
      slider.setValue(slider.getValue() - THREE_HOURS_MS)
    })
  }

  const nextForecastBtn = document.getElementById('nextForecast')
  if (nextForecastBtn) {
    nextForecastBtn.addEventListener('click', event => {
      slider.setValue(slider.getValue() + THREE_HOURS_MS)
    })
  }
}

