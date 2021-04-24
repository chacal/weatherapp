import '../public/css/main.css'
import Map from './Map'
import FMIProxy from './FMIProxy'
import { AreaForecast } from './ForecastDomain'
import NavigationSlider from './NavigationSlider'
import { parseISO } from 'date-fns'

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

const currentLocation = { lat: 60, lng: 24 }
const fmiProxyUrl = 'https://www.tuuleeko.fi/fmiproxy'

const fmiProxy = new FMIProxy(fmiProxyUrl)
const map = new Map('map', currentLocation)

fmiProxy.getAreaForecastForEveryThirdHour()
  .then(f => initializeUI(f))


function initializeUI(forecast: AreaForecast) {
  const items = forecast.pointForecasts[0].forecastItems
  const firsItemTime = parseISO(items[0].time)
  const lastItemTime = parseISO(items[items.length - 1].time)

  map.renderMarkersForTime(forecast, firsItemTime)
  initializeSlider(firsItemTime, lastItemTime, forecast)
}

function initializeSlider(firsItemTime: Date, lastItemTime: Date, forecast: AreaForecast) {
  const slider = new NavigationSlider('slider')
  const s = slider.initialize(firsItemTime.getTime(), lastItemTime.getTime(), THREE_HOURS_MS)
  s.on('slide', ([ts]) => map.renderMarkersForTime(forecast, new Date(ts)))
}
