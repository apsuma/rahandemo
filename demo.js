function validation() {
  document.getElementById('validation').addEventListener("click", () => {
    document.getElementById('app').style.display = 'none';
    document.getElementById('show').style.display = 'block';

    navigator.geolocation.getCurrentPosition((position) => {

      let time = document.getElementById('minutesChoice').value;

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
        let TheatreGraslinMarker = new H.map.Marker({lat:47.213438333, lng:-1.56222079757});
        map.addObject(TheatreGraslinMarker);
        let miroirEauMarker = new H.map.Marker({lat:47.2150576441, lng:-1.54895952999});
        map.addObject(miroirEauMarker);
        let nefsMarker = new H.map.Marker({lat:47.2061466357, lng:-1.56450198054});
        map.addObject(nefsMarker);
        let zooGalerieMarker = new H.map.Marker({lat:47.2092851993, lng:-1.55006790517});
        map.addObject(zooGalerieMarker);
        let sallePaulFortMarker = new H.map.Marker({lat:47.220884172, lng:-1.55827835984});
        map.addObject(sallePaulFortMarker);
        let gdBlottereauMarker = new H.map.Marker({lat:47.2261904411, lng:-1.51067078598});
        map.addObject(gdBlottereauMarker);
        let tntMarker = new H.map.Marker({lat:47.2124437591, lng:-1.55213845859});
        map.addObject(tntMarker);
        let mondesMarinsMarker = new H.map.Marker({lat:47.2058997381, lng:-1.56778198758});
        map.addObject(mondesMarinsMarker);
        let streetWorkOutMarker = new H.map.Marker({lat:47.2094000017, lng:-1.52723523953});
        map.addObject(streetWorkOutMarker);
        let skateparkMarker = new H.map.Marker({lat:47.241643552, lng:-1.57270315853});
        map.addObject(skateparkMarker);
        let gigantMarker = new H.map.Marker({lat:47.2044442766, lng:-1.59274945868});
        map.addObject(gigantMarker);
        let aj1Marker = new H.map.Marker({lat:47.2451295884, lng:-1.52478036768});
        map.addObject(aj1Marker);
        let aj2Marker = new H.map.Marker({lat:47.2416534372, lng:-1.5231329754});
        map.addObject(aj2Marker);
        let aj3Marker = new H.map.Marker({lat:47.2350085703, lng:-1.53572348663});
        map.addObject(aj3Marker);
        let aj4Marker = new H.map.Marker({lat:47.2372703151, lng:-1.5217193883});
        map.addObject(aj4Marker);
        let aj5Marker = new H.map.Marker({lat:47.2396206454, lng:-1.51484699044});
        map.addObject(aj5Marker);
        let aj7Marker = new H.map.Marker({lat:47.2082156839, lng:-1.52535499795});
        map.addObject(aj7Marker);
        let aj8Marker = new H.map.Marker({lat:47.1915124804, lng:-1.53064004327});
        map.addObject(aj8Marker);
        let aj9Marker = new H.map.Marker({lat:47.2144037562, lng:-1.5623519341});
        map.addObject(aj9Marker);
        let aj6Marker = new H.map.Marker({lat:47.2270204035, lng:-1.50886714487});
        map.addObject(aj6Marker);
        let aj10Marker = new H.map.Marker({lat:47.1950277046, lng:-1.54283979512});
        map.addObject(aj10Marker);
        let aj11Marker = new H.map.Marker({lat:47.2013512434, lng:-1.58139067113});
        map.addObject(&aj11Marker);
        let aj12Marker = new H.map.Marker({lat:47.2241261806, lng:-1.59853934706});
        map.addObject(aj12Marker);
        let aj13Marker = new H.map.Marker({lat:47.222846783, lng:-1.59338389407});
        map.addObject(aj13Marker);
        let aj14Marker = new H.map.Marker({lat:47.230441113, lng:-1.5859146375});
        map.addObject();
        let aj15Marker = new H.map.Marker({lat:47.2413333514, lng:-1.50947592762});
        map.addObject(aj15Marker);
        let aj16Marker = new H.map.Marker({lat:47.2662603218, lng:-1.5199541891});
        map.addObject(aj16Marker);
        let aj17Marker = new H.map.Marker({lat:47.237752782, lng:-1.5186688211});
        map.addObject(aj17Marker);
        let aj18Marker = new H.map.Marker({lat:47.2265995797, lng:-1.52102740925});
        map.addObject(aj18Marker);
        let aj19Marker = new H.map.Marker({lat:47.2209085937, lng:-1.53293178762});
        map.addObject(aj19Marker);
        let aj20Marker = new H.map.Marker({lat:47.2165515348, lng:-1.52246933476});
        map.addObject(aj20Marker);
        let aj21Marker = new H.map.Marker({lat:47.2145277757, lng:-1.53171697694});
        map.addObject(aj21Marker);
        let aj22Marker = new H.map.Marker({lat:47.2149314762, lng:-1.52787662575});
        map.addObject(aj22Marker);
        let aj23Marker = new H.map.Marker({lat:47.2021632362, lng:-1.55169666661});
        map.addObject(aj23Marker);
        let aj24Marker = new H.map.Marker({lat:47.2078721474, lng:-1.60983464164});
        map.addObject(aj24Marker);
        let aj25Marker = new H.map.Marker({lat:47.2220910475, lng:-1.58171915022});
        map.addObject(aj25Marker);
        let aj26Marker = new H.map.Marker({lat:47.2244018009, lng:-1.5858450407});
        map.addObject(aj26);
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
  });
}
