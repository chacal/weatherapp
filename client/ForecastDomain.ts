import R = require('ramda')

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

  static hasSameLocation = (location: Coords) => (marker: WindMarker) => R.equals(marker.location, location)
  static hasSameItem = (item: ForecastItem) => (marker: WindMarker) => R.equals(marker.forecastItem, item)

  static drawGoogleMapsMarker(map: google.maps.Map, location: Coords, forecastItem: ForecastItem): google.maps.Marker {
    return new google.maps.Marker({
      position: location,
      map: map,
      icon: {
        anchor: new google.maps.Point(50, 50),
        url: 'data:image/svg+xml;charset=UTF-8;base64,' + btoa(getWindMarkerSVG(forecastItem.windSpeedMs, forecastItem.windDir))
      },
      clickable: false
    })

    function getWindMarkerSVG(windSpeed: number, windDir: number): string {
      const windSpeedInt = Math.round(windSpeed)
      const oppositeWindDir = windDir - 180
      const markerColor = getMarkerColor(windSpeedInt)

      return `<?xml version="1.0"?>
            <svg width="100px" height="100px" version="1.1" xmlns="http://www.w3.org/2000/svg">
            <g transform="scale(0.8)">
              <path d="M 50 60 m -10 -30 l 10 -20 10 20 z" fill="${markerColor}" stroke="none" transform="rotate(${oppositeWindDir} 50 50)"/>
              <circle stroke="${markerColor}" fill="#fff" cx="50" cy="50" r="16" stroke-width="3"/>
              <g font-family="Open Sans, Verdana, sans serif" font-size="20" fill="#000">
                <text x="50" y="57" font-weight="bold" text-anchor="middle">${windSpeedInt}</text>
              </g>
            </g>
          </svg>`
    }

    function getMarkerColor(windSpeed: number): string {
      if(windSpeed < 4)
        return '#2DC22F'
      else if(windSpeed < 7)
        return '#0099FF'
      else if(windSpeed < 10)
        return '#5852CC'
      else if(windSpeed < 14)
        return '#FF00FF'
      else
        return '#FF5050'
    }
  }
}
