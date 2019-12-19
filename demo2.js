const map = new H.map(mapContainer,
    defaultLayers.vector.normal.map,{
    center: {lat:47.207320, lng:-1.555843},
    zoom: 13,
    pixelRatio: window.devicePixelRatio || 1
  });

var mapEvents = new H.mapEvents.mapEvents(map);

map.addEventListener('tap', function(pointerdown));
