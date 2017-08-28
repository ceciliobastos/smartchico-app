//TODO verificar porque não está gravando localStorage

var geojsonbase = 'https://raw.githubusercontent.com/bigeyessolution/SmartChico/master/caus/data/geojson.json';
var lastPosition = [-9.41192,-40.50267];
var localGeoJSON = false;

var userMarker = false;
var markersClusters = false;
var map = false;
var watchId = false;

$(document).on("mobileinit", function () {
    $.mobile.loader.prototype.options.text = "loading";
    $.mobile.loader.prototype.options.textVisible = false;
    $.mobile.loader.prototype.options.theme = "a";
    $.mobile.loader.prototype.options.html = '<i class="fa fa-pulse fa-spin fa-5x fa-fw margin-bottom"></i>';

    initLocalBase();

    $('.be-btn-location').on('click', setMapToUserLocation);

    $('.be-btn-menu').on('click', menuToggle);

    $('#fTurismo, #fCultura, #fArte').on('change', setGeoJSONtoMap);
});

//Remover
initLocalBase();
$('.be-btn-location').on('click', setMapToUserLocation);
$('.be-btn-menu').on('click', menuToggle);

$('#fTurismo, #fCultura, #fArte').on('change', setGeoJSONtoMap);
//end remover

$(document).on("pagecontainerbeforechange", function (event, ui) {
    //var toPage = $(ui.toPage).attr('id');
    //var prevPage = $(ui.prevPage).attr('id');

    //if (prevPage === 'mapa') {Notgeofeaturese that 'img-src' was not explicitly set
    //}
});

$(document).on("pagecontainerchange", function (event, ui) {
  var toPage = $(ui.toPage).attr('id');
  var prevPage = $(ui.prevPage).attr('id');

  $('#menu').removeClass('opened-menu');

  if (toPage === 'mapa') {
    criarMapa();
    getGeoJSON();
  } else if (prevPage === 'mapa'){
    destruirMapa();
  }
});

/**
 * Cria o mapa em #mapa .mapView
 * @author Laudivan F Almeida <eu@laudivan.info>
 * @return {[type]} [description]
 */
function criarMapa() {
  $('#mapa .mapView').append('<div id="mapLocal">');

	var localLatLng = L.latLng(-23.5928401,-46.6488079);

	map = L.map('mapLocal', {
		zoom: 16,
		center: localLatLng,
		zoomControl: false
	}).setView([-9.41192,-40.50267],16)
  .on('popupopen', function(e) {
    var px = map.project(e.popup._latlng);
    px.y -= (e.popup._container.clientHeight + 200)/2;
    map.panTo( map.unproject(px),{animate: true} );
  });


  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    //attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
    id: 'rogeriobastos.08164jab',
    accessToken: 'pk.eyJ1Ijoicm9nZXJpb2Jhc3RvcyIsImEiOiJjaW9vZjBka2UwMDVsdHNrbTc5aDRwMW9hIn0.E8itic_IW42gcgLO12oLJw'
  }).addTo(map);

  markersClusters = L.markerClusterGroup();
  map.addLayer(markersClusters);

  setMapToUserLocation ();
}

/**
 * Limpa o mapa
 * @author Laudivan F Almeida <eu@laudivan.info>
 * @return {[type]} [description]
 */
function destruirMapa() {
    $('#mapa .mapView').empty();
    map = false;
}

$("#mpanel").trigger("updatelayout");

function showLoading() {
    $.mobile.loading("show", {
        text: "foo",
        textVisible: false,
        theme: "a",
        html: '<i class="fa fa-spinner fa-pulse fa-3x fa-fw margin-bottom"></i>'
    });
}

function hideLoading() {
    $.mobile.loading("hide");
}

function setGeoJSONtoMap () {
  //@todo SE TIVER ARMAZENADO CARREGAR NO MAPA EM DIFERENTES CAMADAS
  if(map === false || localGeoJSON === false) return;

  var mergedFeatures = [];

  if ($('#fCultura').is(':checked')) mergedFeatures = mergedFeatures.concat(localGeoJSON.cultura);
  if ($('#fArte').is(':checked')) mergedFeatures = mergedFeatures.concat(localGeoJSON.arte);
  if ($('#fTurismo').is(':checked')) mergedFeatures = mergedFeatures.concat(localGeoJSON.turismo);

  var markers = L.geoJson(mergedFeatures, {
    pointToLayer: function(feature, latlng) {
      var icon = L.icon ({
        iconUrl: 'img/icon.' + feature.properties.category + '.png',
        iconSize: [35, 55],
        iconAnchor: [17.5, 55],
        popupAnchor: [0, -55]
        /*shadowUrl: 'img/marker-shadow.png',
        shadowSize: [35, 13],
        shadowAnchor: [17.5, 6.5]*/
      });

      var marker = L.marker(latlng, {icon: icon});
      marker.bindPopup(
        feature.properties.popupContent, {
          minHeight: feature.properties.width,
          minWidth: feature.properties.width,
          //autoPan: true,
          autoClose: true
        }
      );

      return marker;
    }
  });

  markersClusters.clearLayers();
  //map.removeLayer(markersClusters);
  //markersClusters = L.markerClusterGroup();
  markersClusters.addLayer(markers);
  //map.addLayer(markersClusters);
}

function getGeoJSON () {
  var featuresbase = {
    release: 0,
    turismo: [],
    cultura: [],
    arte: []
  };

  function _geoWrapper(key,feature) {
    feature.properties.popupContent =
      (feature.properties.description ? feature.properties.description + '<br>':'') +
      (feature.properties.image ? '<img src="' + feature.properties.image + '">' : '') +
      (feature.properties.sound ? '<iframe src="' + feature.properties.sound + '"></iframe>' : '') +
      (feature.properties.caption ? '<br><h3>' + feature.properties.caption + '<h3>' : '')
    ;

    switch (feature.properties.category) {
      case 'turismo':
        featuresbase.turismo.push(feature);
        break;
      case 'cultura':
        featuresbase.cultura.push(feature);
        break;
      case 'arte':
        featuresbase.arte.push(feature);
        break;
      default:
    }
  }

  function _cacheGeoJSON (data) {
    //@todo LER O CAMPO release DA BASE LOCAL e COMPARAR COM O ONLINE
    if(localGeoJSON && localGeoJSON.release > data.release) return true;

    featuresbase.release = data.release;

    $.each (data.features, _geoWrapper);

    localGeoJSON = featuresbase;
    localStorage.setItem('geojsonbase', JSON.stringify(localGeoJSON));
  }

  $.getJSON(geojsonbase, _cacheGeoJSON).done(setGeoJSONtoMap).fail(setGeoJSONtoMap);
}

function initLocalBase () {
  localGeoJSON = localStorage.getItem('geojsonbase') ?
    JSON.parse(localStorage.getItem('geojsonbase')) :
    false;
}

function setUserPin (pos) {
  var latlng = L.latLng(pos.coords.latitude,pos.coords.longitude);

  console.log(JSON.stringify(pos));

  if (userMarker == false) {
    var icon = L.icon ({
      iconUrl: 'img/icon.user.png',
      //iconSize: [35, 55],
      iconSize: [106, 83],
      iconAnchor: [53, 83]
    });

    userMarker = L.marker(latlng, {icon: icon});

    userMarker.addTo(map);
  } else {
    userMarker.setLatLng(latlng);
  }
}

function __setMapToUserLocation (pos) {
  if (pos) {
    setUserPin(pos);
    map.panTo(
      L.latLng(pos.coords.latitude,pos.coords.longitude),
      { animate: true }
    );
  }
}

function __setMapToUserLocationError (error) {
  console.log('code: ' + error.code + '\nmessage: ' + error.message + '\n');
}

function setMapToUserLocation () {
  navigator.geolocation.getCurrentPosition(
    __setMapToUserLocation,
    __setMapToUserLocationError,
    { enableHighAccuracy: true }
  );
}

function menuToggle () {
  if ( $('#menu').hasClass('opened-menu') ) {
    $('#menu').removeClass('opened-menu');
  } else {
    $('#menu').addClass('opened-menu');
  }
}
