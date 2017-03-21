import Bacon = require('baconjs')
import moment = require('moment')
import $ = require('jquery')

import {AreaForecast, PointForecast} from "./ForecastDomain"

export default class FMIProxy {
  constructor(private fmiProxyUrl: string) {}

  getAreaForecast(bounds: google.maps.LatLngBounds): Bacon.EventStream<any, AreaForecast> {
    const boundsParam = [bounds.getSouthWest().lat(), bounds.getSouthWest().lng(), bounds.getNorthEast().lat(), bounds.getNorthEast().lng()].join(',')
    const startTime = encodeURIComponent(moment().format())
    return Bacon.fromPromise($.get(`${this.fmiProxyUrl}/hirlam-forecast?bounds=${boundsParam}&startTime=${startTime}`))
  }

  getPointForecast(coords: google.maps.LatLng): Bacon.EventStream<any, PointForecast> {
    const startTime = encodeURIComponent(moment().format())
    return Bacon.fromPromise($.get(`${this.fmiProxyUrl}/hirlam-forecast?lat=${coords.lat()}&lon=${coords.lng()}&startTime=${startTime}`))
  }
}
