
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
var isWeb = true;

document.addEventListener("deviceready", function () {
	watchMsg();
	
	document.addEventListener("resume", onResume, false);

	document.addEventListener("pause", onPause, false);
	
	$('.be-btn-location').on('click', function(){
		setFollowUserPosition(true);
		map.setZoom(16);
	});

	initGeoLocationWatch();

	setFollowUserPosition(true);
	
	if (!localStorage.getItem('lastMsgId')) {
		setTimeout(getMsg, 15000);
	}

	isWeb = typeof device == 'undefined';
}, true);

$(function () {
	$.mobile.loader.prototype.options.text = "Carregando";
	$.mobile.loader.prototype.options.textVisible = false;
	$.mobile.loader.prototype.options.theme = "a";
	$.mobile.loader.prototype.options.html = '<i class="fa fa-pulse fa-spin fa-5x fa-fw margin-bottom"></i>';
	
	initLocalBase();
	
	$('.be-btn-menu').on('click', menuToggle);

	$('#fTurismo, #fCultura, #fArte').on('change', setGeoJSONtoMap);

	$( "#mapa .mapView" ).bind( "scrollstart", function(){ setFollowUserPosition(false); } );

});

$(document).on("pagecontainerbeforechange", function (event, ui) {
	var toPage = $(ui.toPage).attr('id');
	var prevPage = $(ui.prevPage).attr('id');

	if (prevPage === 'mapa') {
		if (!isWeb) {
			stopGeoLocationWatch();
		}
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
		if (!isWeb) {
			setFollowUserPosition(true);
			initGeoLocationWatch ();
		}
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

/**
 * Exibe o aviso de carregamento.
 * @author laudivan
 * @returns
 */
function showLoading() {
	$.mobile.loading("show", {
		text: "foo",
		textVisible: false,
		theme: "a",
		html: '<i class="fa fa-spinner fa-pulse fa-3x fa-fw margin-bottom"></i>'
	});
}

/**
 * Esconde o aviso de carregamento.
 * @author laudivan
 * @returns
 */
function hideLoading() {
	$.mobile.loading("hide");
}

/**
 * Popula o mapa com os pontos obtidos das geotags.
 * @author laudivan
 * @returns
 */
function setGeoJSONtoMap () {
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
			});

			var marker = L.marker(latlng, {icon: icon});

			marker.on('popupopen', function(){ 
				setFollowUserPosition(false); 
				//$( "#popUpTabs" ).tabs();
			} );

			marker.bindPopup(
				feature.properties.popupContent, {
					minHeight: feature.properties.width,
					minWidth: feature.properties.width,
					autoClose: true
				}
			);

			return marker;
		}
	});

	markersClusters.clearLayers();
	markersClusters.addLayer(markers);
}

/**
 * Exibe a aba selecionada no popup de algum ponto no mapa.
 * @author laudivan
 * @param tabName Nome (Id) da aba
 * @returns
 */
function showTab (tabName) {
	$('.tabContent.activedTab').fadeOut();
	$('.activedTab').removeClass ('activedTab');
	
	$('#btn-' + tabName + ', #'+tabName).addClass('activedTab');
	$('.tabContent.activedTab').fadeIn();
}

/**
 * Obtém as informações das geotags a apartir da url em geojsonbase.
 * @author laudivan
 * @returns
 */
function getGeoJSON () {
	var featuresbase = {
		release: 0,
		turismo: [],
		cultura: [],
		arte: []
	};

	function _geoWrapper(key,feature) {
		var flagActive = 'activedTab';
		var nTabs = 0;
		var tabs = '<div class="tabbar">';
		var caption = feature.properties.caption ? '<h3>' + feature.properties.caption + '</h3>' : '';
		var tabsContents = ''; 
		
		if (feature.properties.image) {
			nTabs ++;
			tabs += '<button id="btn-picture" onclick="showTab(' + "'picture'" + ')" class="' + flagActive + '">Foto</button>';
			tabsContents += '<div id="picture" class="tabContent ' + flagActive + '">' + caption + '<p>' + '<img src="' + feature.properties.image + '"></p></div>';
			flagActive = '';
		}
		
		if(feature.properties.sound) {
			nTabs++;
			tabs += '<button id="btn-audio" onclick="showTab(' + "'audio'" + ')" class="' + flagActive + '">Áudio</button>';
			tabsContents += '<div id="audio" class="tabContent ' + flagActive + '">' + caption + '<p>' + '<iframe src="' + feature.properties.sound + '"></iframe></p></div>';
			flagActive = '';
		}
		
		if (feature.properties.description) {
			nTabs++;
			tabs += '<button id="btn-description" onclick="showTab(' + "'description'" + ')" class="' + flagActive + '">Descrição</button>';
			tabsContents += '<div id="description" class="tabContent ' + flagActive + '">' + caption + '<p>' + feature.properties.description + '</p></div>';
		}
		
		tabs += '</div>'
		
		feature.properties.popupContent = '<div">' + (nTabs > 1 ? tabs : '') + tabsContents + '</div>'; 

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
		if(localGeoJSON && localGeoJSON.release > data.release) return true;

		featuresbase.release = data.release;

		$.each (data.features, _geoWrapper);

		localGeoJSON = featuresbase;
		localStorage.setItem('geojsonbase', JSON.stringify(localGeoJSON));
	}

	$.getJSON(geojsonbase, _cacheGeoJSON).done(setGeoJSONtoMap).fail(setGeoJSONtoMap);
}

/**
 * Obtém as mensagens ao usuários disponibilizadas em msgsbase.
 * @author laudivan
 * @returns
 */
function getMsg () {
	if (isWeb) return;

	$.getJSON (msgsbase, function(msgs) {
		var lastMsgId = localStorage.getItem('lastMsgId');

	lastMsgId = lastMsgId ? lastMsgId : -1;

		$.each(msgs, function (index, msg) {
			if (lastMsgId >= msg.msgid) return true;
			
			showMsg ( msg );

			return false;
		});
	});
}

/**
 * Move o mapa para o ponto em pos e para de seguir a localização do usuário.
 * @author laudivan
 * @param pos array contendo o a longitude e latitude do ponto para o qual que mover.
 * @returns
 */
function goToPos (pos) {
	$.when (function () {
		if (page !== 'mapa') $.mobile.changePage ('#mapa');
	}).done (function () {
		setFollowUserPosition (false);
		map.flyTo(L.latLng(pos[1],pos[0]),18);
	});

}

/**
 * Exibe uma mensagem obtida por getMsg().
 * @author laudivan
 * @param msg
 * @returns
 */
function showMsg ( msg ) {
	navigator.notification.beep(1);

	buttons = msg.position ? ['OK!', 'Mostre o lugar!']: ['OK!'];

	title = (msg.position ? 'Dica' : 'Mensagem' ) + ' do CAUS';

	navigator.notification.confirm(
		msg.message, 
		function (btnIndex) {
			if (btnIndex == 2) {
				goToPos (msg.position);
			}
		}, 
		title,
		buttons
	);

	localStorage.setItem ('lastMsgId', msg.msgid);
}

/**
 * Inicializa a variável localGeoJSON
 * @author laudivan
 * @returns
 */
function initLocalBase () {
	localGeoJSON = localStorage.getItem('geojsonbase') ?
		JSON.parse(localStorage.getItem('geojsonbase')) :
		false;
}

/**
 * Cria o pin do usuário.
 * @author laudivan
 * @param pos posição do usuário.
 * @returns
 */
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

/**
 * Move o mapa para a localização do usuário e followUser estiver setado para True.
 * @author laudivan
 * @param pos posição do usuário.
 * @returns
 */
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

/**
 * Exibe erros de localização no console.
 * @author laudivan
 * @param error
 * @returns
 */
function __setMapToUserLocationError (error) {
	console.log('code: ' + error.code + '\nmessage: ' + error.message + '\n');
}

/**
 * Obtém a localização do usuário e passa a __setMapToUserLocation() para que mapa o siga.
 * @author laudivan
 * @returns
 */
function setMapToUserLocation () {
	navigator.geolocation.getCurrentPosition(
		__setMapToUserLocation,
		__setMapToUserLocationError,
		{ enableHighAccuracy: true }
	);
}

/**
 * Inicia o acompanhamento da localização do usuário.
 * @author laudivan
 * @returns
 */
function initGeoLocationWatch () {
	if (watchId === false) {
		watchId = navigator.geolocation.watchPosition(
			__setMapToUserLocation,
			__setMapToUserLocationError,
			{ enableHighAccuracy: true, timeout: 1500 }
		);
	}
}

/**
 * Interrompe o acompanhamento da localização do usuário.
 * @author laudivan
 * @returns
 */
function stopGeoLocationWatch () {
	if (watchId !== false) {
		navigator.geolocation.clearWatch(watchId);
		watchId = false;
	}
}

/**
 * Exibe ou esconde o menu da aplicação.
 * @author laudivan
 * @returns
 */
function menuToggle () {
	if ( $('#menu').hasClass('opened-menu') ) {
		$('#menu').removeClass('opened-menu');
	} else {
		$('#menu').addClass('opened-menu');
	}
}

/**
 * Habilita/desabilita o acompanhamento da localização do usuário
 * e esconde ou exibe o botão relativo a ação no mapa.
 * @author laudivan 
 * @param status
 * @returns
 */
function setFollowUserPosition(status){
	followUser = status;
	if(status) {
		$('.be-btn-location').fadeOut();
	} else {
		$('.be-btn-location').fadeIn();
	}
}

/**
 * Habilita a atualização periódica das geotags.
 * @author laudivan
 * @returns
 */
function watchGeoTag () {
	if (watchGeoTagsId !== false) return;

	watchGeoTagsId = setInterval (getGeoJSON, 3600000); //1 hour
}

/**
 * Desabilita a atualização periódica das geotags.
 * @author laudivan
 * @returns
 */
function stopWatchGeoTag () {
	if (watchGeoTagsId === false) return;

	clearInterval (watchGeoTagsId);

	watchGeoTagsId = false;
}

/**
 * Habilita o acompanhamento das mensagens ao usuário.
 * @author laudivan
 * @returns
 */
function watchMsg () {
	if (watchMsgId !== false ) return;

	watchMsgId = setInterval(getMsg, 600000); //10 minutes
}

/**
 * desabilita o acompanhamento das mensagens ao usuário.
 * @author laudivan
 * @returns
 */
function stopWatchMsg() {
	if (watchMsgId === false ) return;

	clearInterval (watchMsgId);

	watchMsgId = false;
}

/**
 * Função chamada quando a aplicação é trazida para primeiro plano nos dispositivos móveis.
 * @author laudivan
 * @returns
 */
function onResume () {
	if (page == 'mapa') initGeoLocationWatch ();

	watchMsg();
}

/**
 * Função chamada quando a aplicação passa a segundo plano nos dispositivos móveis.
 * @author laudivan
 * @returns
 */
function onPause () {
	if (page == 'mapa') stopGeoLocationWatch ();

	stopWatchMsg ();
}
