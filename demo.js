navigator.geolocation.getCurrentPosition((position) => {

  const time = 40;

  const vitMoyenneMarche = 60;

  const distTime = time * vitMoyenneMarche;

  const distMoinsMarge = distTime * 0.8;

  const distMaxRadius = distMoinsMarge / 2;

  /**
 * Calculates and displays a walking route from the St Paul's Cathedral in London
 * to the Tate Modern on the south bank of the River Thames
 *
 * A full list of available request parameters can be found in the Routing API documentation.
 * see:  http://developer.here.com/rest-apis/documentation/routing/topics/resource-calculate-route.html
 *
 * @param   {H.service.Platform} platform    A stub class to access HERE services
 *
 */
  function createResizableCircle(map,radius) {
    var circle = new H.map.Circle(
        {lat: position.coords.latitude, lng: position.coords.longitude},
        distMaxRadius,
        {
          style: {fillColor: 'rgba(250, 250, 0, 0.3)', lineWidth: 0}
        }
        ),
        circleOutline = new H.map.Polyline(
            circle.getGeometry().getExterior(),
            {
              style: {lineWidth: 8, strokeColor: 'rgba(255, 0, 0, 0)'}
            }
        ),
        circleGroup = new H.map.Group({
          volatility: true, // mark the group as volatile for smooth dragging of all it's objects
          objects: [circle, circleOutline]
        }),
        circleTimeout;

    // ensure that the objects can receive drag events
    circle.draggable = true;
    circleOutline.draggable = true;

    // extract first point of the circle outline polyline's LineString and
    // push it to the end, so the outline has a closed geometry
    circleOutline.getGeometry().pushPoint(circleOutline.getGeometry().extractPoint(0));

    // add group with circle and it's outline (polyline)
    map.addObject(circleGroup);

    // event listener for circle group to show outline (polyline) if moved in with mouse (or touched on touch devices)


    // event listener for circle group to hide outline if moved out with mouse (or released finger on touch devices)
    // the outline is hidden on touch devices after specific timeout

    // event listener for circle group to change the cursor if mouse position is over the outline polyline (resizing is allowed)
    circleGroup.addEventListener('pointermove', function(evt) {
      if (evt.target instanceof H.map.Polyline) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default'
      }
    }, true);
  }

function calculateRouteFromAtoB (platform) {

  var router = platform.getRoutingService(),
    routeRequestParams = {
      mode: 'shortest;pedestrian',
      representation: 'display',
      waypoint0: position.coords.latitude + ',' + position.coords.longitude,
      waypoint1: '47.212528,-1.562238',
      routeattributes: 'waypoints,summary,shape,legs',
      maneuverattributes: 'direction,action',
  };

    router.calculateRoute(
      routeRequestParams,
      onSuccess,
      onError
    );
  }
  /**
   * This function will be called once the Routing REST API provides a response
   * @param  {Object} result          A JSONP object representing the calculated route
   *
   * see: http://developer.here.com/rest-apis/documentation/routing/topics/resource-type-calculate-route.html
   */
  function onSuccess(result) {
    var route = result.response.route[0];
   /*
    * The styling of the route response on the map is entirely under the developer's control.
    * A representitive styling can be found the full JS + HTML code of this example
    * in the functions below:
    */
    addRouteShapeToMap(route);
    addManueversToMap(route);
  
    addWaypointsToPanel(route.waypoint);
    addManueversToPanel(route);
    addSummaryToPanel(route.summary);
    // ... etc.
  }
  
  /**
   * This function will be called if a communication error occurs during the JSON-P request
   * @param  {Object} error  The error message received.
   */
  function onError(error) {
    alert('Can\'t reach the remote server');
  }
  
  /**
   * Boilerplate map initialization code starts below:
   */
  // set up containers for the map  + panel
  var mapContainer = document.getElementById('map'),
    routeInstructionsContainer = document.getElementById('panel');

  //Step 1: initialize communication with the platform
  // In your own code, replace variable window.apikey with your own apikey
  var platform = new H.service.Platform({
    apikey: window.apikey
  });
  var defaultLayers = platform.createDefaultLayers();

  //Step 2: initialize a map - this map is centered over your position
  var map = new H.Map(mapContainer,
    defaultLayers.vector.normal.map,{
    center: {lat: position.coords.latitude, lng:position.coords.longitude},
    zoom: 13,
    pixelRatio: window.devicePixelRatio || 1
  });
  // add a resize listener to make sure that the map occupies the whole container
  window.addEventListener('resize', () => map.getViewPort().resize());

  //Step 3: make the map interactive
  // MapEvents enables the event system
  // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
  var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

  // Create the default UI components
  var ui = H.ui.UI.createDefault(map, defaultLayers);

  // Hold a reference to any infobubble opened
  var bubble;

  /**
   * Opens/Closes a infobubble
   * @param  {H.geo.Point} position     The location on the map.
   * @param  {String} text              The contents of the infobubble.
   */
  function openBubble(position, text){
   if(!bubble){
      bubble =  new H.ui.InfoBubble(
        position,
        // The FO property holds the province name.
        {content: text});
      ui.addBubble(bubble);
    } else {
      bubble.setPosition(position);
      bubble.setContent(text);
      bubble.open();
    }
  }
  
  
  /**
   * Creates a H.map.Polyline from the shape of the route and adds it to the map.
   * @param {Object} route A route as received from the H.service.RoutingService
   */
  function addRouteShapeToMap(route){
    var lineString = new H.geo.LineString(),
      routeShape = route.shape,
      polyline;

    routeShape.forEach(function(point) {
      var parts = point.split(',');
      lineString.pushLatLngAlt(parts[0], parts[1]);
    });
  
    polyline = new H.map.Polyline(lineString, {
      style: {
        lineWidth: 4,
        strokeColor: 'rgba(0, 128, 255, 0.7)'
      }
    });
    // Add the polyline to the map
    map.addObject(polyline);
    // And zoom to its bounding rectangle
    map.getViewModel().setLookAtData({
      bounds: polyline.getBoundingBox()
    });
  }
  
  
  /**
   * Creates a series of H.map.Marker points from the route and adds them to the map.
   * @param {Object} route  A route as received from the H.service.RoutingService
   */
  function addManueversToMap(route){
    var svgMarkup = '<svg width="18" height="18" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="8" cy="8" r="8" ' +
        'fill="#1b468d" stroke="white" stroke-width="1"  />' +
      '</svg>',
      dotIcon = new H.map.Icon(svgMarkup, {anchor: {x:8, y:8}}),
      group = new  H.map.Group(),
      i,
      j;
  
    // Add a marker for each maneuver
    for (i = 0;  i < route.leg.length; i += 1) {
      for (j = 0;  j < route.leg[i].maneuver.length; j += 1) {
        // Get the next maneuver.
        maneuver = route.leg[i].maneuver[j];
        // Add a marker to the maneuvers group
        var marker =  new H.map.Marker({
          lat: maneuver.position.latitude,
          lng: maneuver.position.longitude} ,
          {icon: dotIcon});
        marker.instruction = maneuver.instruction;
        group.addObject(marker);
      }
    }
  
    group.addEventListener('tap', function (evt) {
      map.setCenter(evt.target.getGeometry());
      openBubble(
         evt.target.getGeometry(), evt.target.instruction);
    }, false);
  
    // Add the maneuvers group to the map
    map.addObject(group);
  }
  
  
  /**
   * Creates a series of H.map.Marker points from the route and adds them to the map.
   * @param {Object} route  A route as received from the H.service.RoutingService
   */
  function addWaypointsToPanel(waypoints){
  
  
  
    var nodeH3 = document.createElement('h3'),
      waypointLabels = [],
      i;
  
  
     for (i = 0;  i < waypoints.length; i += 1) {
      waypointLabels.push(waypoints[i].label)
     }
  
     nodeH3.textContent = waypointLabels.join(' - ');
  
    routeInstructionsContainer.innerHTML = '';
    routeInstructionsContainer.appendChild(nodeH3);
  }
  
  /**
   * Creates a series of H.map.Marker points from the route and adds them to the map.
   * @param {Object} route  A route as received from the H.service.RoutingService
   */
  function addSummaryToPanel(summary){
    var summaryDiv = document.createElement('div'),
     content = '';
     content += '<b>Total distance</b>: ' + summary.distance  + 'm. <br/>';
     content += '<b>Travel Time</b>: ' + summary.travelTime.toMMSS() + ' (in current traffic)';
  
  
    summaryDiv.style.fontSize = 'small';
    summaryDiv.style.marginLeft ='5%';
    summaryDiv.style.marginRight ='5%';
    summaryDiv.innerHTML = content;
    routeInstructionsContainer.appendChild(summaryDiv);
  }

  /**
   * Adds markers to the map highlighting the locations of the cultural places in Nantes.
   *
   * @param  {H.Map} map      A HERE Map instance within the application
   */
  function addMarkersToMap(map) {
    console.log(map)
    let luMarker = new H.map.Marker({lat:47.2152661555, lng:-1.54566621725});
    map.addObject(luMarker);
    let chateauMarker = new H.map.Marker({lat:47.2160563713, lng:-1.55001052667});
    map.addObject(chateauMarker);
    let bibMarker = new H.map.Marker({lat:47.2111500154, lng:-1.58560852342});
    map.addObject(bibMarker);
    let cosmopolisMarker = new H.map.Marker({lat:47.2144037562, lng:-1.5623519341});
    map.addObject(cosmopolisMarker);
  }

  /**
   * Creates a series of H.map.Marker points from the route and adds them to the map.
   * @param {Object} route  A route as received from the H.service.RoutingService
   */
  function addManueversToPanel(route){
  
  
  
    var nodeOL = document.createElement('ol'),
      i,
      j;
  
    nodeOL.style.fontSize = 'small';
    nodeOL.style.marginLeft ='5%';
    nodeOL.style.marginRight ='5%';
    nodeOL.className = 'directions';
  
       // Add a marker for each maneuver
    for (i = 0;  i < route.leg.length; i += 1) {
      for (j = 0;  j < route.leg[i].maneuver.length; j += 1) {
        // Get the next maneuver.
        maneuver = route.leg[i].maneuver[j];
  
        var li = document.createElement('li'),
          spanArrow = document.createElement('span'),
          spanInstruction = document.createElement('span');
  
        spanArrow.className = 'arrow '  + maneuver.action;
        spanInstruction.innerHTML = maneuver.instruction;
        li.appendChild(spanArrow);
        li.appendChild(spanInstruction);
  
        nodeOL.appendChild(li);
      }
    }
  
    routeInstructionsContainer.appendChild(nodeOL);
  }


  Number.prototype.toMMSS = function () {
    return  Math.floor(this / 60)  +' minutes '+ (this % 60)  + ' seconds.';
  }
  createResizableCircle(map);
  calculateRouteFromAtoB (platform);

    addMarkersToMap(map);

});

