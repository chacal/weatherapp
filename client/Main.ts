import '../public/css/main.css'
import initMap from './Map'
import FMIProxy from './FMIProxy'
import { AreaForecast } from './ForecastDomain'
import { WindMarker } from './WindMarker'

const currentLocation = { lat: 60, lng: 24 }
const fmiProxyUrl = 'https://www.tuuleeko.fi/fmiproxy'


const fmiProxy = new FMIProxy(fmiProxyUrl)
const map = initMap(currentLocation)

fmiProxy.getAreaForecast().then(f => renderForecastMarkers(f))


function renderForecastMarkers(forecast: AreaForecast) {
  forecast.pointForecasts.forEach(point => {
    const m = new WindMarker({ lat: point.latitude, lng: point.longitude }, { forecastItem: point.forecastItems[0] })
    m.addTo(map)
  })
}
