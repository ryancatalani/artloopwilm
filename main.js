$(function(){

	var break1 = 1000;

	var dataURL = 'https://docs.google.com/spreadsheets/d/1TC-h9T0NDX3NYeruEdfROaN894dm-VtKh0SKZO-9ets/pubhtml';
	Tabletop.init({
		key: dataURL,
		callback: processData,
		simpleSheet: true
	});

	if ( $(window).width() < break1 ) {
		$('#listings').css('marginTop', $('header').outerHeight() + 300 + 10);
	} else {
		$('#listings').css('marginTop', $('header').outerHeight() + 10);
		$('#map').css('height', $(window).height());
	}

	var map;
	var all_bounds = [];
	var saved_listings = [];
	var listing_markers = {};

	$('#list_switcher').find('li').click(function(){
		if ($(this).hasClass('active')) return;

		if ($(this).attr('id') == 'list_switcher_all') {
			displayAllListings();
			$(this).addClass('active');
			$('#list_switcher_saved').removeClass('active');
		} else {
			displaySavedListings();
			$(this).addClass('active');
			$('#list_switcher_all').removeClass('active');
		}

	});

	if (window.location.hash.length > 0) {
		loadHashAttributes();
	}

	function processData(data, tabletop) {
		setupMap(data);
		$('.loading').hide();
		for (var i = 0; i < data.length; i++) {
			createListing(data[i]);
		};
		$('.list_btn').click(function(e){
			e.preventDefault();
			var listingID = $(this).parents('.listing').attr('id');
			if ( $(this).hasClass('list_btn_add') ) {
				addToList(listingID);
			} else {
				removeFromList(listingID);
			}
			return false;
		});
	}

	function createListing(data) {
		var id = 'l' + data.order;
		var classes = createListingClasses(data);

		if (saved_listings.indexOf(id) != -1) {
			classes += ' in_list';
		}

		var html = '<div class="listing ' + classes + '" id="' + id + '">';

			html += '<div class="header">';

				if (saved_listings.indexOf(id) == -1) {
					html += '<div class="list_btn list_btn_add"><i class="fa fa-plus-circle"></i></div>';
				} else {
					html += '<div class="list_btn list_btn_remove"><i class="fa fa-minus-circle"></i></div>';
				}

				html += '<div class="location">' + data.location + '</div>';
				html += '<div class="address">' + data.address + '</div>';

				html += '<ul class="features">'
				if (data.accessible && data.accessible.toLowerCase() === "yes") {
					html += '<li><i class="fa fa-wheelchair-alt"></i> <span class="text">Accessible</span></li>'
				}
				if (data.drinks && data.drinks.toLowerCase() === "yes") {
					html += '<li><i class="fa fa-glass"></i> <span class="text">Refreshments</span></li>'
				}
				if (data.music && data.music.toLowerCase() === "yes") {
					html += '<li><i class="fa fa-music"></i> <span class="text">Music</span></li>'
				}
				html += '<li class="location_area">' + data.where + '</li>';
				html += '</ul>'

			html += '</div>'
			html += '<div class="body">'

				html += '<img src="' + data.image + '"/>';

				html += '<div class="desc">' + data.description + '</div>';
						
				if (data.url && data.url.length > 0) {
					html += '<div class="contact"><i class="fa fa-external-link"></i> <a href="http://' + data.url + '" target="_blank">' + data.url + '</a></div>';
				}

				if (data.phone && data.phone.length > 0) {
					html += '<div class="contact"><i class="fa fa-phone"></i> <a href="tel:' + data.phone + '">' + data.phone + '</a></div>';
				}

			html += '</div>';

		html += '</div>';

		$('#listings_inner').append(html);
	}

	function text_to_var(text) {
		return text.toLowerCase().replace(/\W/,'_');
	}

	function createListingClasses(data) {
		var ret = [];

		var location = "loc_" + text_to_var(data.where);
		ret.push(location);

		if (data.accessible && data.accessible.toLowerCase() === "yes") {
			ret.push("feature_accessible");
		}
		if (data.drinks && data.drinks.toLowerCase() === "yes") {
			ret.push("feature_drinks");
		}
		if (data.music && data.music.toLowerCase() === "yes") {
			ret.push("feature_music");
		}

		return ret.join(' ');

	}

	function setupMap(data) {
		$('#map').css('top', $('header').outerHeight());

		map = L.map('map').setView([39.740317, -75.559411], 13);

		var colors = {
			downtown: '#C0243C',
			west_end: '#1C9E7A',
			north_wilmington: '#CE6F1A'
		}

		// L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		//     attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		// }).addTo(map);

		L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
			attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
			subdomains: 'abcd',
			maxZoom: 19
		}).addTo(map);

		// L.tileLayer.provider('CartoDB.Positron').addTo(map);

		for (var i = 0; i < data.length; i++) {
			var place = data[i];
			var point = [place.lat, place.long];
			var id = 'l' + place.order;
			all_bounds.push(point);

			var colorType = text_to_var(place.where);
			var color = colors[colorType];

			var markerOptions = {
				color: color,
				fillColor: color,
				fillOpacity: 0.1,
				opacity: 0.3
			};

			if (saved_listings.indexOf(id) != -1) {
				markerOptions = {
					color: color,
					fillColor: color,
					fillOpacity: 0.5,
					opacity: 1
				};
			}

			var marker = L.circleMarker(point, markerOptions);

			marker.listingID = id;

			marker.bindPopup(place.location, {
				maxWidth: 200
			});

			marker.on('click', onMarkerClick);
			marker.addTo(map);

			listing_markers[id] = marker;
		};

		map.fitBounds(all_bounds);

	}

	function onMarkerClick() {
		var topOffset = 0;
		if ( $(window).width() < break1 ) {
			topOffset = $('#map').outerHeight() + $('header').outerHeight() + 10;
		} else {
			topOffset = $('header').outerHeight() + 10;
		}

		var listingID = '#' + this.listingID;
		var offset = $(listingID).offset().top - topOffset;
		$('body').scrollTop(offset);
	}

	function addToList(listingID) {
		var htmlID = '#' + listingID;
		$(htmlID).find('.list_btn').removeClass('list_btn_add').addClass('list_btn_remove').html('<i class="fa fa-minus-circle"></i>');
		$(htmlID).addClass('in_list');

		var marker = listing_markers[listingID];
		marker.setStyle({
			fillOpacity: 0.5,
			opacity: 1
		});

		saved_listings.push(listingID);
		updateListingsState();
	}

	function removeFromList(listingID) {
		var htmlID = '#' + listingID;
		$(htmlID).find('.list_btn').removeClass('list_btn_remove').addClass('list_btn_add').html('<i class="fa fa-plus-circle"></i>');
		$(htmlID).removeClass('in_list');

		var marker = listing_markers[listingID];

		var indexToRemove = saved_listings.indexOf(listingID);
		saved_listings.splice(indexToRemove, 1);
		updateListingsState();

		if ($('#list_switcher_saved').hasClass('active')) {
			$(htmlID).hide();
			marker.setStyle({
				fillOpacity: 0,
				opacity: 0
			});
		} else {
			marker.setStyle({
				fillOpacity: 0.1,
				opacity: 0.3
			});
		}

		if (saved_listings.length == 0) {
			$('#no_saved_listings').show();
		}
	}

	function updateListingsState() {
		$('#saved_listings_count').text(saved_listings.length);

		var hash = '';
		if (saved_listings.length > 0) {
			var listings = saved_listings.sort().join('-');
			hash = "ex-" + listings;
		}
		window.location.hash = hash;
	}

	function displayAllListings() {
		$('.listing').show();
		$('body').scrollTop(0);
		map.fitBounds(all_bounds);

		for (var listingID in listing_markers) {
			var marker = listing_markers[listingID];

			if (saved_listings.indexOf(listingID) == -1) {
				marker.setStyle({
					fillOpacity: 0.1,
					opacity: 0.3
				});
			} else {
				marker.setStyle({
					fillOpacity: 0.5,
					opacity: 1
				});
			}
		}

		$('#no_saved_listings').hide();
		$('#intro').show();
	}

	function displaySavedListings() {
		$('.listing').hide();
		$('#intro').hide();

		if (saved_listings.length == 0) {
			$('#no_saved_listings').show();
		} else {
			$('#no_saved_listings').hide();

			var bounds = [];
			for (var i = 0; i < saved_listings.length; i++) {
				var id = saved_listings[i]
				var htmlID = '#' + id;
				bounds.push( listing_markers[id].getLatLng() );

				$(htmlID).show();
			};
			map.fitBounds(bounds);

			for (var listingID in listing_markers) {
				if (saved_listings.indexOf(listingID) == -1) {
					var marker = listing_markers[listingID];
					marker.setStyle({
						fillOpacity: 0,
						opacity: 0
					});
				}
			}

		}
	}

	function loadHashAttributes() {
		var listStr = window.location.hash.replace('#ex-','');
		saved_listings = listStr.split('-');
		$('#saved_listings_count').text(saved_listings.length);
	}

});