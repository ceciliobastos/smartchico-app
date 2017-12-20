//TODO verificar porque não está gravando localStorage

var geojsonbase = 'https://raw.githubusercontent.com/bigeyessolution/SmartChico/master/caus/data/geojson.json';
var msgsbase = 'https://raw.githubusercontent.com/bigeyessolution/SmartChico/master/caus/data/messages.json';
var lastPosition = [-9.41192,-40.50267];
var localGeoJSON = false;
var localMsgs = false;
var lastMsgId = false;

var userMarker = false;
var markersClusters = false;
var map = false;
var watchId = false;
var watchGeoTagsId = false;
var watchMsgId = false;
var followUser = false;
var page = false;

/*
$(document).on("mobileinit", function () {
    $.mobile.loader.prototype.options.text = "loading";
    $.mobile.loader.prototype.options.textVisible = false;
    $.mobile.loader.prototype.options.theme = "a";
    $.mobile.loader.prototype.options.html = '<i class="fa fa-pulse fa-spin fa-5x fa-fw margin-bottom"></i>';

    initLocalBase();

    // Localização ativada por padrão
    // $('.be-btn-location').on('click', setMapToUserLocation);

    $('.be-btn-menu').on('click', menuToggle);

    $('#fTurismo, #fCultura, #fArte').on('change', setGeoJSONtoMap);
});
*/

//Remover
$.mobile.loader.prototype.options.text = "loading";
$.mobile.loader.prototype.options.textVisible = false;
$.mobile.loader.prototype.options.theme = "a";
$.mobile.loader.prototype.options.html = '<i class="fa fa-pulse fa-spin fa-5x fa-fw margin-bottom"></i>';
initLocalBase();
$('.be-btn-location').on('click', function(){
    //setMapToUserLocation();
    setFollowUserPosition(true);
    map.setZoom(16);
});
$('.be-btn-menu').on('click', menuToggle);

$('#fTurismo, #fCultura, #fArte').on('change', setGeoJSONtoMap);

document.addEventListener("resume", onResume, false);
document.addEventListener("pause", onPause, false);

watchMsg();


$( "#mapa .mapView" ).bind( "scrollstart", function(){ setFollowUserPosition(false); } );

$(document).on("pagecontainerbeforechange", function (event, ui) {
    var toPage = $(ui.toPage).attr('id');
    var prevPage = $(ui.prevPage).attr('id');
               
    if (prevPage === 'mapa') {
        stopGeoLocationWatch();
        stopWatchGeoTag();
    }
});

$(document).on("pagecontainerchange", function (event, ui) {
  var toPage = $(ui.toPage).attr('id');
  var prevPage = $(ui.prevPage).attr('id');
  
  page = toPage;
               
  $('#menu').removeClass('opened-menu');

  if (toPage === 'mapa') {
    criarMapa();
    setFollowUserPosition(true);
    initGeoLocationWatch ();
    getGeoJSON();
    watchGeoTag();
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
  if (map) return;
    
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
}

/**
 * Limpa o mapa
 * @author Laudivan F Almeida <eu@laudivan.info>
 * @return {[type]} [description]
 */
function destruirMapa() {
    if (map !== false) {
        $('#mapa .mapView').empty();
        map = false;
        userMarker = false;
    }
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
    
                          
      marker.on('popupopen', function(){ setFollowUserPosition(false); } );
      //marker.on('popupclose', function(){ setFollowUserPosition(true); } );
    
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

function getMsg () {
    $.getJSON (msgsbase, function(msgs) {
        var lastMsgId = localStorage.getItem('lastIdMsg');
               
        lastMsgId = lastMsgId ? lastMsgId : -1;
               
        $.each(msgs, function (index, msg) {
            if (lastMsgId > msg.msgid) return true;
            
            showMsg ( msg );
                
            return false;
        });
    });
}

function gotToPos (lat, lng) {
    $.when (function () {
        if (page !== 'mapa') $.mobile.changePage ('#mapa');
    }).done (function () {
        var latLng = L.latLng(lat,lng);
             
        setFollowUserPosition (false);

        map.panTo(
            L.latLng(lat,lng),
            { animate: true }
        );
    });
    
}

function showMsg ( msg ) {
    navigator.notification.beep(3);
    
    if (msg.position) {
        navigator.notification.alert(message, function (btnIndex) {
            if (btnIndex == 2) {
                goToPos (msg.position[0],msg.position[1]);
            }
        }, 'Achamos um local interessante', ['Ok!', 'Mostre o lugar!']);
    } else {
        navigator.notification.alert(msg.message, function(){}, 'Mensagem do CAUS');
    }
    
    localStorage.setItem ('lastIdMsg', msg.msgid);
}

function initLocalBase () {
  localGeoJSON = localStorage.getItem('geojsonbase') ?
    JSON.parse(localStorage.getItem('geojsonbase')) :
    false;
}

function setUserPin (pos) {
  var latlng = L.latLng(pos.coords.latitude,pos.coords.longitude);

  if (userMarker == false) {
    var icon = L.icon ({
      iconUrl: 'img/icon.user.png',
      iconSize: [55, 55],
      iconAnchor: [27, 55]
    });

    userMarker = L.marker(latlng, {icon: icon});

    userMarker.addTo(map);
      
    userMarker.setLatLng(latlng);
  } else {
    userMarker.setLatLng(latlng);
  }
}

function __setMapToUserLocation (pos) {
  if (map === false) return;
  if (pos) {
    setUserPin(pos);
    if (followUser) {
        map.panTo(
          L.latLng(pos.coords.latitude,pos.coords.longitude),
          { animate: true }
        );
    }
  }
}

function __setMapToUserLocationError (error) {
  //console.log('code: ' + error.code + '\nmessage: ' + error.message + '\n');
}

function setMapToUserLocation () {
  navigator.geolocation.getCurrentPosition(
    __setMapToUserLocation,
    __setMapToUserLocationError,
    { enableHighAccuracy: true }
  );
}

function initGeoLocationWatch () {
    if (watchId === false) {
        watchId = navigator.geolocation.watchPosition(
            __setMapToUserLocation,
            __setMapToUserLocationError,
            { enableHighAccuracy: true, timeout: 1500 }
        );
    }
}

function stopGeoLocationWatch () {
    if (watchId !== false) {
        navigator.geolocation.clearWatch(watchId);
        watchId = false;
    }
}

function menuToggle () {
  if ( $('#menu').hasClass('opened-menu') ) {
    $('#menu').removeClass('opened-menu');
  } else {
    $('#menu').addClass('opened-menu');
  }
}

function setFollowUserPosition(status){
    followUser = status;
    if(status) {
        $('.be-btn-location').fadeOut();
    } else {
        $('.be-btn-location').fadeIn();
    }
}

function watchGeoTag () {
    if (watchGeoTagsId !== false) return;
    
    watchGeoTagsId = setInterval (getGeoJSON, 10000);
}

function stopWatchGeoTag () {
    if (watchGeoTagsId === false) return;
    
    clearInterval (watchGeoTagsId);
    
    watchGeoTagsId = false;
}

function watchMsg () {
    if (watchMsgId !== false ) return;
    
    watchMsgId = setInterval (getMsg, 30000);
}

function stopWatchMsg() {
    if (watchMsgId === false ) return;
    
    clearInterval (watchMsgId);
    
    watchMsgId = false;
}

function onResume () {
    if (page == 'mapa') initGeoLocationWatch ();
    
    watchMsg();
}

function onPause () {
    if (page == 'mapa') stopGeoLocationWatch ();
    
    stopWatchMsg ();
}
