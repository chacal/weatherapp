import {Coords} from "./ForecastDomain"
import TaustakarttaMapType from "./TaustakarttaMapType"


export function initMap(location: Coords): google.maps.Map {
  const map = new google.maps.Map(document.getElementById('map'), {
    center: location,
    zoom: 5,
    streetViewControl: false,
    mapTypeControl: false,
    scaleControl: true,
    zoomControl: true,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
    backgroundColor: 'none',
    draggableCursor: 'pointer'
  })

  const customMapType = new TaustakarttaMapType({
    getTileUrl: getTaustaKarttaTile,
    tileSize: new google.maps.Size(256, 256),
    maxZoom: 15,
    minZoom: 0,
    name: 'Taustakartta'
  })

  map.mapTypes.set('taustakartta', customMapType)
  map.setMapTypeId('taustakartta')
  return map
}



function getTaustaKarttaTile(coord, zoom) {
  var normalizedCoord = getNormalizedCoord(coord, zoom)
  if (!normalizedCoord) {
    return null
  }
  var tileX = normalizedCoord.x
  var tileY = normalizedCoord.y
  return 'http://avoindata.maanmittauslaitos.fi/mapcache/wmts?layer=taustakartta&style=default&tilematrixset=ETRS-TM35FIN&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=' + zoom + '&TileCol=' + tileX + '&TileRow=' + tileY

  function getNormalizedCoord(coord, zoom) {
    var y = coord.y
    var x = coord.x

    var tileRange = 1 << zoom

    // don't repeat across y-axis (vertically)
    if (y < 0 || y >= tileRange) {
      return null
    }

    // repeat across x-axis
    if (x < 0 || x >= tileRange) {
      return null
    }

    return {x: x, y: y}
  }
}

module.exports = {
  init: initMap
}