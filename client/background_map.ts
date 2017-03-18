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
    getTileUrl: TaustakarttaMapType.getTaustaKarttaTile,
    tileSize: new google.maps.Size(256, 256),
    maxZoom: 15,
    minZoom: 0,
    name: 'Taustakartta'
  })

  map.mapTypes.set('taustakartta', customMapType)
  map.setMapTypeId('taustakartta')
  return map
}


module.exports = {
  init: initMap
}