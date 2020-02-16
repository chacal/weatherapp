import Bacon = require('baconjs')
import moment = require('moment')

import {AreaForecast, PointForecast} from "./ForecastDomain"

export default class FMIProxy {
  constructor(private fmiProxyUrl: string) {}

  getAreaForecast(): Bacon.EventStream<AreaForecast> {
    return Bacon.fromPromise(fetch(`${this.fmiProxyUrl}/hirlam-forecast`)
      .then(res => res.json())
    )
  }

  getPointForecast(coords: google.maps.LatLng): Bacon.EventStream<PointForecast> {
    const startTime = encodeURIComponent(moment().format())
    return Bacon.fromPromise(fetch(`${this.fmiProxyUrl}/hirlam-forecast?lat=${coords.lat()}&lon=${coords.lng()}&startTime=${startTime}`)
      .then(res => res.json()))
  }
}
