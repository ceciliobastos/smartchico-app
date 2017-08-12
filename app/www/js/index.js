//TODO verificar porque não está gravando localStorage

var geojsonbase = 'https://raw.githubusercontent.com/bigeyessolution/SmartChico/master/caus/data/geojson.json';
var lastPosition = [-9.41192,-40.50267];
var localGeoJSON = false;

var markersClusters = false;
var showTur = true;
var showCult = true;
var showArt = true;
var map = false;

$(document).on("mobileinit", function () {
    $.mobile.loader.prototype.options.text = "loading";
    $.mobile.loader.prototype.options.textVisible = false;
    $.mobile.loader.prototype.options.theme = "a";
    $.mobile.loader.prototype.options.html = '<i class="fa fa-pulse fa-spin fa-5x fa-fw margin-bottom"></i>';

    initLocalBase();
});

$(document).on("pagecontainerbeforechange", function (event, ui) {
    //var toPage = $(ui.toPage).attr('id');
    //var prevPage = $(ui.prevPage).attr('id');

    //if (prevPage === 'mapa') {Notgeofeaturese that 'img-src' was not explicitly set
    //}
});

$(document).on("pagecontainerchange", function (event, ui) {
  var toPage = $(ui.toPage).attr('id');
  var prevPage = $(ui.prevPage).attr('id');

  if (toPage === 'mapa')
      criarMapa();
      getGeoJSON();
  if (prevPage === 'mapa')
    destruirMapa();
});

function centerToUser () {
  //TODO Centralizar mapa na posição do usuário
}

function swapShowTur () {
  showTur = !showTur;
  setGeoJSONtoMap();
  return showTur;
}

function swapShowArt () {
  showArt = !showArt;
  setGeoJSONtoMap();
  return showArt;
}

function swapShowCult () {
  showCult = !showCult;
  setGeoJSONtoMap();
  return showCult;
}

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
    px.y -= e.popup._container.clientHeight/2;
    map.panTo( map.unproject(px),{animate: true} );
  });


  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
    id: 'rogeriobastos.08164jab',
    accessToken: 'pk.eyJ1Ijoicm9nZXJpb2Jhc3RvcyIsImEiOiJjaW9vZjBka2UwMDVsdHNrbTc5aDRwMW9hIn0.E8itic_IW42gcgLO12oLJw'
  }).addTo(map);

  markersClusters = L.markerClusterGroup();
  map.addLayer(markersClusters);
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

function prepareMarkers () {
  var turMarkers = L.geoJson(localGeoJSON.turismo, {
    pointToLayer: function(feature, latlng) {
      var marker = L.marker(latlng);
      marker.bindPopup(feature.properties.popupContent
      //  , {minHeight: feature.properties.width, minWidth: feature.properties.width}
      );
      return marker;
    }
  });


}

function setGeoJSONtoMap () {
  //@todo SE TIVER ARMAZENADO CARREGAR NO MAPA EM DIFERENTES CAMADAS
  if(map === false || localGeoJSON === false) return;

  var mergedFeatures = [];

  if (showCult) mergedFeatures = mergedFeatures.concat(localGeoJSON.cultura);

  if (showArt) mergedFeatures = mergedFeatures.concat(localGeoJSON.arte);

  if (showTur) mergedFeatures = mergedFeatures.concat(localGeoJSON.turismo);

  var markers = L.geoJson(mergedFeatures, {
    pointToLayer: function(feature, latlng) {
      var icon = L.icon ({
        iconUrl: 'img/icon.' + feature.properties.category + '.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [0, -45],
        shadowUrl: 'img/marker-shadow.png',
        shadowSize: [41, 41],
        shadowAnchor: [13, 41]
      });

      var marker = L.marker(latlng, {icon: icon});
      marker.bindPopup(
        feature.properties.popupContent, {
          minHeight: feature.properties.width,
          minWidth: feature.properties.width,
          autoPan: true,
          autoClose: true
        }
      ).on ('click', function () {
        console.log("Abriu");
      });
      return marker;
    }
  });

  //map.removeLayer(markersClusters);
  markersClusters.clearLayers();

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
