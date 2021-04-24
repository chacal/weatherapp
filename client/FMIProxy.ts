import { AreaForecast, PointForecast } from './ForecastDomain'
import { LatLng } from 'leaflet'
import { isAfter, isEqual, parseISO, startOfHour, subHours } from 'date-fns'

export default class FMIProxy {
  constructor(private fmiProxyUrl: string) {
  }

  getAreaForecast(): Promise<AreaForecast> {
    return fetch(`${this.fmiProxyUrl}/hirlam-forecast`)
      .then(res => res.json()
      )
  }

  getAreaForecastForEveryThirdHour(): Promise<AreaForecast> {
    const now = new Date()
    const lastThirdHourMoment = startOfHour(subHours(now, now.getHours() % 3))

    return this.getAreaForecast()
      .then(af => {
        return {
          publishTime: af.publishTime,
          pointForecasts: af.pointForecasts.map(pf => ({
            publishTime: pf.publishTime,
            longitude: pf.longitude,
            latitude: pf.latitude,
            forecastItems: pf.forecastItems.filter(item => isMostRecentOrFutureEveryThirdHour(parseISO(item.time)))
          }))
        }
      })

    function isMostRecentOrFutureEveryThirdHour(date: Date) {
      return isEqual(date, lastThirdHourMoment) || isAfter(date, lastThirdHourMoment) && date.getHours() % 3 == 0
    }
  }

  getPointForecast(coords: LatLng): Promise<PointForecast> {
    const startTime = encodeURIComponent(new Date().toISOString())
    return fetch(`${this.fmiProxyUrl}/hirlam-forecast?lat=${coords.lat}&lon=${coords.lng}&startTime=${startTime}`)
      .then(res => res.json())
  }
}
