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
