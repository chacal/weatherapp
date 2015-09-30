// Register ETRS89 / ETRS-TM35FIN / EPSG:3067 projection to proj4
proj4.defs("EPSG:3067","+proj=utm +zone=35 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

function initMap() {
  var map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 60, lng: 24},
    zoom: 6,
    streetViewControl: false,
    mapTypeControl: false,
    scaleControl: true
  })

  var customMapType = new google.maps.ImageMapType({
    getTileUrl: getTaustaKarttaTile,
    tileSize: new google.maps.Size(256, 256),
    maxZoom: 15,
    minZoom: 0,
    name: 'Taustakartta'
  })
  customMapType.projection = getTaustakarttaProjection()

  map.mapTypes.set('taustakartta', customMapType)
  map.setMapTypeId('taustakartta')

  addMarkers(map)
}


function addMarkers(map) {
  new google.maps.Circle({
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.35,
    map: map,
    center: {lat: 60, lng: 24.9},
    radius: 3000
  })

  var marker = new google.maps.Marker({
    position: map.getCenter(),
    icon: {
      path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
      scale: 3
    },
    map: map
  })
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
function getTaustakarttaProjection() {
  var mapSizeInEpsg3067 = 2097152
  var mapSizeInGoogle = 256
  var mapXOffsetFromEpsg3067Origin = -548576
  var mapYOffsetFromEpsg3067Origin = 6291456

  return {
    fromLatLngToPoint: function(latLng) {
      var projected = proj4('EPSG:3067', [latLng.lng(), latLng.lat()])
      var epsgLng = projected[0]
      var epsgLat = projected[1]

      var scaledLng = (epsgLng - mapXOffsetFromEpsg3067Origin) / mapSizeInEpsg3067 * mapSizeInGoogle
      var scaledLat = mapSizeInGoogle - (epsgLat - mapYOffsetFromEpsg3067Origin) / mapSizeInEpsg3067 * mapSizeInGoogle
      //console.log("From latLng to point:", latLng.lng(), latLng.lat(), scaledLng, scaledLat)
      return new google.maps.Point(scaledLng, scaledLat)
    },
    fromPointToLatLng: function(point, noWrap) {
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


function getTaustaKarttaTile(coord, zoom) {
  var normalizedCoord = getNormalizedCoord(coord, zoom)
  if (!normalizedCoord) {
    return null
  }
  var tileX = normalizedCoord.x
  var tileY = normalizedCoord.y
  return '//avoindata.maanmittauslaitos.fi/mapcache/wmts?layer=taustakartta&style=default&tilematrixset=ETRS-TM35FIN&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=' + zoom + '&TileCol=' + tileX + '&TileRow=' + tileY

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
