import Bacon = require('baconjs')
import moment = require('moment')
import $ = require('jquery')

import {AreaForecast, PointForecast} from "./ForecastDomain"

export default class FMIProxy {
  constructor(private fmiProxyUrl: string) {}

  getAreaForecast(): Bacon.EventStream<any, AreaForecast> {
    return Bacon.fromPromise($.get(`${this.fmiProxyUrl}/hirlam-forecast`))
  }

  getPointForecast(coords: google.maps.LatLng): Bacon.EventStream<any, PointForecast> {
    const startTime = encodeURIComponent(moment().format())
    return Bacon.fromPromise($.get(`${this.fmiProxyUrl}/hirlam-forecast?lat=${coords.lat()}&lon=${coords.lng()}&startTime=${startTime}`))
  }
}
