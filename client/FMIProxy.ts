import { AreaForecast, PointForecast } from './ForecastDomain'
import { LatLng } from 'leaflet'

export default class FMIProxy {
  constructor(private fmiProxyUrl: string) {
  }

  getAreaForecast(): Promise<AreaForecast> {
    return fetch(`${this.fmiProxyUrl}/hirlam-forecast`)
      .then(res => res.json()
      )
  }

  getPointForecast(coords: LatLng): Promise<PointForecast> {
    const startTime = encodeURIComponent(new Date().toISOString())
    return fetch(`${this.fmiProxyUrl}/hirlam-forecast?lat=${coords.lat}&lon=${coords.lng}&startTime=${startTime}`)
      .then(res => res.json())
  }
}
