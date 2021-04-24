import '../node_modules/leaflet/dist/leaflet.css'

import 'proj4leaflet'
import L, { LatLngExpression } from 'leaflet'
import { AreaForecast } from './ForecastDomain'
import { isEqual, parseISO } from 'date-fns'
import { WindMarker } from './WindMarker'

const NLS_API_KEY = '6a15e997-70e7-4de9-bfdc-f7cc7f52b6e5'

const proj3067 = new L.Proj.CRS('EPSG:3067', '+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs', {
  origin: [-548576, 8388608],
  bounds: L.bounds([-548576, 8388608], [1548576, 6291456]),
  resolutions: [
    8192,
    4096,
    2048,
    1024,
    512,
    256,
    128,
    64,
    32,
    16,
    8,
    4,
    2,
    1,
    0.5,
    0.25,
    0.125,
    0.0625,
    0.03125,
    0.015625
  ]
})

export default class Map {
  map: L.Map
  markersLayer = new L.LayerGroup()

  constructor(elementId: string, location: LatLngExpression) {
    this.map = L.map(elementId, {
      crs: proj3067,
      preferCanvas: true
    })
      .setView(location, 5)

    const url = `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/taustakartta/default/ETRS-TM35FIN/{z}/{y}/{x}.png?api-key=${NLS_API_KEY}`

    L.tileLayer(url, {
      maxZoom: 12,
      minZoom: 3,
      opacity: 0.6
    }).addTo(this.map)

    this.markersLayer.addTo(this.map)
  }

  renderMarkersForTime(forecast: AreaForecast, time: Date) {
    const index = forecast.pointForecasts[0].forecastItems.findIndex(item => isEqual(parseISO(item.time), time))

    this.markersLayer.clearLayers()
    forecast.pointForecasts.forEach(point => {
      const m = new WindMarker({
        lat: point.latitude,
        lng: point.longitude
      }, { forecastItem: point.forecastItems[index] })
      this.markersLayer.addLayer(m)
    })
  }
}