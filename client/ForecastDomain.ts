export interface Coords {
  lat: number,
  lng: number
}

export interface PointForecast extends Coords {
  publishTime: Date,
  forecastItems: ForecastItem[]
}

export interface ForecastItem {
  prate: number,
  windSpeedMs: number,
  windDir: number,
  pressureMbar: number,
  time: Date
}

export class WindMarker {
  constructor(public location: Coords, public forecastItem: ForecastItem, public mapMarker: google.maps.Marker) {}
}
