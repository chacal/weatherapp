import L, { Point } from 'leaflet'

L.Canvas.include({
  _updateWindMarkerPath: function (layer: any) {
    if (!this._drawing || layer._empty()) {
      return
    }

    this._layers[layer._leaflet_id] = layer

    const f = layer.options.forecastItem
    const windSpeed = Math.round(f.windSpeedMs)
    const windDir = Math.round(f.windDir)
    renderMarker(this._ctx, layer._point, windSpeed, windDir)
  }
})

function renderMarker(ctx: CanvasRenderingContext2D, p: Point, windSpeed: number, windDir: number) {
  const oppositeWindDir = windDir - 180
  const markerColor = getMarkerColor(windSpeed)

  // Render filled circle
  ctx.save()
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = markerColor
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(p.x, p.y, 14, 0, 2 * Math.PI)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Render wind arrow
  ctx.fillStyle = markerColor
  ctx.translate(p.x, p.y)
  ctx.rotate(oppositeWindDir * Math.PI / 180)
  ctx.translate(-p.x, -p.y)
  ctx.fill(new Path2D(`M ${p.x - 7} ${p.y - 17} l 7 -8 l 7 8 z`))
  ctx.restore()

  // Render wind speed text
  ctx.font = 'bold 14px Open Sans, Verdana, sans serif'
  ctx.fillStyle = '#000000'
  const measurements = ctx.measureText(String(windSpeed))
  ctx.fillText(String(windSpeed), p.x - measurements.width / 2, p.y + 5)
}

function getMarkerColor(windSpeed: number): string {
  if (windSpeed < 4)
    return '#2DC22F'
  else if (windSpeed < 7)
    return '#0099FF'
  else if (windSpeed < 10)
    return '#5852CC'
  else if (windSpeed < 14)
    return '#FF00FF'
  else
    return '#FF5050'
}

export const WindMarker: any = L.CircleMarker.extend({
  _updatePath: function () {
    this._renderer._updateWindMarkerPath(this)
  },
  options: {
    radius: 20,
    interactive: false
  }
})
