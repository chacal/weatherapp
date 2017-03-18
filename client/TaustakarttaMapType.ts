import Proj4Module = require('proj4')
import $ = require('jquery')
import _ = require('lodash')

const proj4 = Proj4Module.default

// Register ETRS89 / ETRS-TM35FIN / EPSG:3067 projection to proj4
proj4.defs("EPSG:3067","+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");


export default class TaustakarttaMapType extends google.maps.ImageMapType {

  projection = getTaustakarttaProjection()

  getTile(tileCoord: google.maps.Point, zoom: number, ownerDocument: Document): Element {
    const tile = super.getTile(tileCoord, zoom, ownerDocument)

    // <img> tag we want to overlay is added dynamically -> listen for DOM changes and add our overlay only after the <img> has been added
    const observer = new MutationObserver(function(mutations) {
      if(_.findIndex(mutations, mutation => mutation.addedNodes && mutation.addedNodes.length > 0 && mutation.addedNodes[0].tagName.toUpperCase() === 'IMG') > -1) {
        $(tile).append('<div class="imageOverlay">')
        this.disconnect()
      }
    })
    observer.observe(tile, { childList: true })

    return tile
  }

  static getTaustaKarttaTile(coord: google.maps.Point, zoom: number): string {
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
}


/*
 Map boundaries from http://avoindata.maanmittauslaitos.fi/mapcache/wmts?service=wmts&request=getcapabilities&version=1.0.0

 corner    X (lon) EPSG     Google        Y (lat) EPSG       Google
 sw     -548576.000000       0         6291456.000000       256
 nw     -548576.000000       0         8388608.000000         0
 se     1548576.000000     256         6291456.000000       256
 ne     1548576.000000     256         8388608.000000         0

 <ows:LowerCorner>-548576.000000 6291456.000000</ows:LowerCorner>
 <ows:UpperCorner>1548576.000000 8388608.000000</ows:UpperCorner>
 */
function getTaustakarttaProjection(): google.maps.Projection {
  var mapSizeInEpsg3067 = 2097152
  var mapSizeInGoogle = 256
  var mapXOffsetFromEpsg3067Origin = -548576
  var mapYOffsetFromEpsg3067Origin = 6291456

  return {
    fromLatLngToPoint: function(latLng: google.maps.LatLng): google.maps.Point {
      var projected = proj4('EPSG:3067', [latLng.lng(), latLng.lat()])
      var epsgLng = projected[0]
      var epsgLat = projected[1]

      var scaledLng = (epsgLng - mapXOffsetFromEpsg3067Origin) / mapSizeInEpsg3067 * mapSizeInGoogle
      var scaledLat = mapSizeInGoogle - (epsgLat - mapYOffsetFromEpsg3067Origin) / mapSizeInEpsg3067 * mapSizeInGoogle
      //console.log("From latLng to point:", latLng.lng(), latLng.lat(), scaledLng, scaledLat)
      return new google.maps.Point(scaledLng, scaledLat)
    },
    fromPointToLatLng: function(point: google.maps.Point, noWrap: boolean): google.maps.LatLng {
      var scaledLng = point.x
      var scaledLat = point.y

      var epsgLng = scaledLng / mapSizeInGoogle * mapSizeInEpsg3067 + mapXOffsetFromEpsg3067Origin
      var epsgLat = (mapSizeInGoogle - scaledLat) / mapSizeInGoogle * mapSizeInEpsg3067 + mapYOffsetFromEpsg3067Origin

      var projected = proj4('EPSG:3067', 'EPSG:4326', [epsgLng, epsgLat])
      //console.log("From point to latLng:", point.x, point.y, projected[0], projected[1])
      return new google.maps.LatLng(projected[1], projected[0], noWrap)
    }
  }
}

