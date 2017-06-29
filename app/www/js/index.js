$(document).on("mobileinit", function () {
    $.mobile.loader.prototype.options.text = "loading";
    $.mobile.loader.prototype.options.textVisible = false;
    $.mobile.loader.prototype.options.theme = "a";
    $.mobile.loader.prototype.options.html = '<i class="fa fa-pulse fa-spin fa-5x fa-fw margin-bottom"></i>';
});

$(document).on("pagecontainerbeforechange", function (event, ui) {
    //var toPage = $(ui.toPage).attr('id');
    //var prevPage = $(ui.prevPage).attr('id');

    //if (prevPage === 'mapa') {
    //}
});

$(document).on("pagecontainerchange", function (event, ui) {
  var toPage = $(ui.toPage).attr('id');
  var prevPage = $(ui.prevPage).attr('id');

console.log(toPage)

  if (toPage === 'mapa')
      criarMapa();
  if (prevPage === 'mapa')
    destruirMapa();
});

function criarMapa() {
  $('#mapa .mapView').append('<div id="mapLocal">');

	var localLatLng = L.latLng(-23.5928401,-46.6488079);

	var map = L.map('mapLocal', {
		zoom: 16,
		center: localLatLng,
		zoomControl: false
	}).setView([-23.5928401,-46.6488079],16);

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
    id: 'rogeriobastos.08164jab',
    accessToken: 'pk.eyJ1Ijoicm9nZXJpb2Jhc3RvcyIsImEiOiJjaW9vZjBka2UwMDVsdHNrbTc5aDRwMW9hIn0.E8itic_IW42gcgLO12oLJw'
  }).addTo(map);
}

function destruirMapa() {
    $('#mapa .mapView').empty();
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
