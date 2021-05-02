export interface Coords {
  latitude: number,
  longitude: number
}

export interface AreaForecast {
  publishTime: Date,
  pointForecasts: PointForecast[]
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
  time: string
}
