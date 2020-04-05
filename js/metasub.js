// TODO: Need to add attributions & license

var taxa_api_url = "https://pangea.gimmebio.com/api/contrib/taxasearch/search?format=json&metadata=true"

// TODO: Link sample API to city onclick for sunburst plot
var sample_api_url = ""
var sampleData = DownloadJson("data/testsample.json");


var colorListInferno = [ "#000000", "#330A5F", "#781C6D", "#BB3754", "#ED6925", "#FCB519", "#FCFFA4", "#FFFFFF"] ;
var colorListViridis = [ "#440154", "#46337E", "#365C8D", "#277F8E", "#1FA187", "#4AC16D", "#9FDA3A", "#FDE725"];
var colorListTurbo = [ "#30123B", "#4777EF", "#1CCFD5", "#62FC6B", "#D1E935", "#FE9B2D", "#DA3907", "#7A0403"];
var colorList = colorListInferno;


// Load data files 
// TODO: load data from endpoint
// TODO: encapsulate instead of global vars
// TODO: Download files asynchronously and synchronize other initialization steps

// TODO: get taxa list from endpoint instead of static json
var taxaList = DownloadJson("data/taxalist.json");
var taxaListSpecies = taxaList.filter(function (x) { return x.rank == "species"});
var cityList = DownloadJson("data/cities.json");

var microbeDirectory = DownloadJson("data/microbe_directory_taxid.json");
microbeDirectory = microbeDirectory.reduce(function(map, obj) {map[obj.tax_id] = obj;  return map;}, {});

var cityToContinent = cityList.reduce(function(map, obj) {map[obj.city_name] = obj.continent;  return map;}, {});
var cityToColorGroup = cityList.reduce(function(map, obj) {map[obj.city_name] = obj.colorGroup;  return map;}, {});
var taxaNameToTaxonomy = taxaList.reduce(function(map, obj) {map[obj.name] = obj.taxon;  return map;}, {});
var taxaNameToTaxId = taxaList.reduce(function(map, obj) {map[obj.name] = obj.taxid;  return map;}, {});
var cityIdToMetadata = cityList.reduce(function(map, obj) {map[obj.city_name] = obj;  return map;}, {});

var togo_pdo = DownloadJson("data/togo_pdo.json");
togo_pdo = togo_pdo.reduce(function(map, obj) {map[obj.species_taxid] = obj;  return map;}, {});
var togo_meo = DownloadJson("data/togo_meo.json");
togo_meo = togo_meo.reduce(function(map, obj) {map[obj.species_taxid] = obj;  return map;}, {});
var togo_mpo = DownloadJson("data/togo_mpo.json");
togo_mpo = togo_mpo.reduce(function(map, obj) {map[obj.species_taxid] = obj;  return map;}, {});
var togo_def = DownloadJson("data/togo_definitions.json");
togo_def = togo_def.reduce(function(map, obj) {map[obj.ann] = obj.def;  return map;}, {});


var mapSampleMarkerPresent = false;
var mapCurrentSampleGeojson;
var mapSampleMarker;
var hoveredStateId;
var taxa_json;
var current_taxa_name;



var map = new mapboxgl.Map({
	container: 'mapDiv',
	center: { lat: 0, lon: 20 }, zoom: 1,
	style: 
	{
		version: 8,
		sources: 
		{
			toner: 
			{
			  type: 'raster',
			  tiles: 
			  [
				"http://a.tile.stamen.com/toner/{z}/{x}/{y}.png",
				"http://b.tile.stamen.com/toner/{z}/{x}/{y}.png",
				"http://c.tile.stamen.com/toner/{z}/{x}/{y}.png",
				"http://d.tile.stamen.com/toner/{z}/{x}/{y}.png"
			  ],
			  tileSize : 256,
			  attribution: 'Data by <a target="_top" rel="noopener" target="_blank" href="http://metasub.org">MetaSUB Consortium</a>. Map tiles by <a target="_top" rel="noopener"  target="_blank" href="http://stamen.com">Stamen Design</a>. Data by <a target="_top" rel="noopener" href="http://openstreetmap.org">OpenStreetMap</a>'
			}
		},
		layers: 
		[{
			id: 'toner',
			type: 'raster',
			source: 'toner',
			below: "traces"
		}]
	},
});


map.on('load', function() 
{
	map.resize();
	
	map.fitBounds([[-175, -50], [175, 60]]); // Fit all sampling cities
	var taxaName = "cutibacterium granulosum";
	PlotTaxa(taxaName);
	

	$("#colInferno").click(function() {
      colorList = colorListInferno;
	  if(taxa_json != null) PlotHeatmapTaxaMapbox(taxa_json);
    });
    $("#colViridis").click(function() {
      colorList = colorListViridis;
      if(taxa_json != null) PlotHeatmapTaxaMapbox(taxa_json);
    });

    $("#colTurbo").click(function() {
      colorList = colorListTurbo;
      if(taxa_json != null) PlotHeatmapTaxaMapbox(taxa_json);
    });
	
	map.resize();
});


window.onresize = function()
{
	var divElement = document.getElementById("sampleDiv");
	var sunburstSize = Math.max(200, divElement.offsetWidth*0.9);
	var svg = $('.sunburst-viz').find('svg');
	svg.width(sunburstSize);
	svg.height(sunburstSize);
	//map.resize();
}

  
$(document).ready(function() 
{
	MainPageSetup();
	SetupTaxaSearchAutocomplete();
});


// Bootstrap theme setup.
// TODO: remove obsolete 
function MainPageSetup()
{
	$().ready(function() {
	$sidebar = $('.sidebar');
	$navbar = $('.navbar');
	$main_panel = $('.main-panel');

	$full_page = $('.full-page');

	$sidebar_responsive = $('body > .navbar-collapse');
	sidebar_mini_active = true;
	white_color = false;

	window_width = $(window).width();

	fixed_plugin_open = $('.sidebar .sidebar-wrapper .nav li.active a p').html();



	$('.fixed-plugin a').click(function(event) {
	  if ($(this).hasClass('switch-trigger')) {
		if (event.stopPropagation) {
		  event.stopPropagation();
		} else if (window.event) {
		  window.event.cancelBubble = true;
		}
	  }
	});

	$('.fixed-plugin .background-color span').click(function() {
	  $(this).siblings().removeClass('active');
	  $(this).addClass('active');

	  var new_color = $(this).data('color');

	  if ($sidebar.length != 0) {
		$sidebar.attr('data', new_color);
	  }

	  if ($main_panel.length != 0) {
		$main_panel.attr('data', new_color);
	  }

	  if ($full_page.length != 0) {
		$full_page.attr('filter-color', new_color);
	  }

	  if ($sidebar_responsive.length != 0) {
		$sidebar_responsive.attr('data', new_color);
	  }
	});

	$('.switch-sidebar-mini input').on("switchChange.bootstrapSwitch", function() {
	  var $btn = $(this);

	  if (sidebar_mini_active == true) {
		$('body').removeClass('sidebar-mini');
		sidebar_mini_active = false;
		blackDashboard.showSidebarMessage('Sidebar mini deactivated...');
	  } else {
		$('body').addClass('sidebar-mini');
		sidebar_mini_active = true;
		blackDashboard.showSidebarMessage('Sidebar mini activated...');
	  }

	  // we simulate the window Resize so the charts will get updated in realtime.
	  var simulateWindowResize = setInterval(function() {
		window.dispatchEvent(new Event('resize'));
	  }, 180);

	  // we stop the simulation of Window Resize after the animations are completed
	  setTimeout(function() {
		clearInterval(simulateWindowResize);
	  }, 1000);
	});

	$('.switch-change-color input').on("switchChange.bootstrapSwitch", function() {
	  var $btn = $(this);

	  if (white_color == true) {

		$('body').addClass('change-background');
		setTimeout(function() {
		  $('body').removeClass('change-background');
		  $('body').removeClass('white-content');
		}, 900);
		white_color = false;
	  } else {

		$('body').addClass('change-background');
		setTimeout(function() {
		  $('body').removeClass('change-background');
		  $('body').addClass('white-content');
		}, 900);

		white_color = true;
	  }


	});

	$('.light-badge').click(function() {
	  $('body').addClass('white-content');
	});

	$('.dark-badge').click(function() {
	  $('body').removeClass('white-content');
	});
  });
}





function GetTaxaMap(taxa_name)
{
	var taxa_search_url = taxa_api_url + "&query=" + taxa_name;
	data = DownloadJson(taxa_search_url);
	cur_taxa_name = Object.keys(data.results)[0];
	cur_taxa_data = data.results[cur_taxa_name];
	return {taxa_data: cur_taxa_data, taxa_name: cur_taxa_name };
}



function removeMapboxLayer(layer_id)
{
	var layer_ids = map.getStyle().layers;
	var layer_id_list = layer_ids.map(function (layer) {return layer.id;});
	if( layer_id_list.includes(layer_id)) map.removeLayer(layer_id);
}

function removeMapboxSource(source_id)
{
	if( source_id in map.getStyle().sources) map.removeSource(source_id);
}

function PlotHeatmapTaxa(taxa_name)
{
	var taxa_json = GetTaxaMap(taxa_name)
	var cur_taxa_data = taxa_json['taxa_data'];
	var cur_taxa_name = taxa_json['taxa_name'];

	var data = [
		{
			type: "densitymapbox",
			text: unpack(cur_taxa_data, "sample_name"),
			lon: unpack_metadata(cur_taxa_data, "longitude"),
			lat: unpack_metadata(cur_taxa_data, "latitude"),
			z: unpack(cur_taxa_data, "relative_abundance"),
			marker: { color: "fuchsia", size: 5 },
			coloraxis: 'coloraxis',
			hoverinfo: 'skip',
			radius: 30
		},
		{
			type: "scattermapbox",
			text: unpack(cur_taxa_data, "sample_name"),
			lon: unpack_metadata(cur_taxa_data, "longitude"),
			lat: unpack_metadata(cur_taxa_data, "latitude"),
			marker: { color: "#620573", size: 10 },
		}
	];

	var layout = {
		dragmode: "zoom",
		mapbox: { 
			style: "stamen-toner", 
			center: { lat: 0, lon: 20 }, zoom: 1
		},
		margin: { r: 0, t: 0, b: 0, l: 0 },
		coloraxis: {colorscale: "Viridis"},
	};

	var config = {"responsive": true, "displayModeBar": false, "displaylogo": false, "modeBarButtonsToRemove": ['sendDataToCloud', 'editInChartStudio', 'zoom2d', 'pan2d', 'select2d', 'lasso2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'toggleSpikelines']};

	pl = Plotly.newPlot("mapDiv", data, layout, config);
		
	$("#taxa_name_placeholder").text(cur_taxa_name);
}




function PlotHeatmapTaxaMapbox(taxaData)
{
	$("#taxa_name_placeholder").text(taxaData.taxa_name);
	
	
	// need to remove layers before we can remove the source	
	removeMapboxLayer('taxaBySample-heat');
	removeMapboxLayer('taxaBySample-pointHeat');
	removeMapboxLayer('taxaBySample-point');
	
	// remove the source
	removeMapboxSource('taxaBySample');
	
	// Add a geojson source.
	map.addSource('taxaBySample', {
		'type': 'geojson',
		'generateId': true,
		'data': TaxaJsonToGeojson(taxaData.taxa_data)
	});
	
	// log-scaling
	abVals = taxaData.taxa_data.map(x=> { return ConvertRelAb(x.relative_abundance); })

	// Percentile scaling for colors since data range is pretty wide even with log-scaling
	var quantVals = [0, Quartile(abVals, 0.15), Quartile(abVals, 0.30), Quartile(abVals, 0.45), Quartile(abVals, 0.60), Quartile(abVals, 0.75), Quartile(abVals, 0.90), Quartile(abVals, 1)];

	// Add colors into legend
	mapLegend.innerHTML = "";
	for (i = 0; i < quantVals.length; i++) 
	{
		var curVal = (ConvertRelAbInverse(quantVals[i]) * 100).toPrecision(3) + "%";
		var curColor = colorList[i];
		var item = document.createElement('div');
		var key = document.createElement('span');
		key.className = 'legend-key';
		key.style.backgroundColor = curColor;
		key.style.borderColor = "black";

		var value = document.createElement('span');
		value.innerHTML = curVal;
		item.appendChild(key);
		item.appendChild(value);
		mapLegend.appendChild(item);
	}

	// Color & circle size weights
	// TODO: finetune for visuals
	var heatmapWeight = ['interpolate', ['linear'], ['get', 'ab'], 0, 0, quantVals[6], 1];
	var heatmapColor = ['interpolate',
				['linear'],
				['heatmap-density'],
				0.0, convertHex(colorList[0], 0.0),
				0.1, convertHex(colorList[1], 0.5), 
				0.2, convertHex(colorList[2], 1.0),
				0.4, convertHex(colorList[3], 1.0),
				0.6, convertHex(colorList[4], 1.0),
				0.8, convertHex(colorList[5], 1.0),
				1.0, convertHex(colorList[6], 1.0)
			];
				
	var circleColor = [
			'interpolate',
			['linear'],
			['get', 'ab'],
			quantVals[0], convertHex(colorList[0], 0.0),
			quantVals[1], convertHex(colorList[1], 0.8), 
			quantVals[2], convertHex(colorList[2], 0.8),
			quantVals[3], convertHex(colorList[3], 0.8),
			quantVals[4], convertHex(colorList[4], 0.8),
			quantVals[5], convertHex(colorList[5], 0.8),
			quantVals[6], convertHex(colorList[6], 0.8),
			quantVals[7], convertHex(colorList[6], 0.8),
		  ];
	
	// Heatmap layer
	// Note that heatmap is affected both by magnitude of the point relAbundance, but also frequency of points. 
	// So for now we'll use a 2-layer approach
	map.addLayer(
	{
		'id': 'taxaBySample-heat',
		'type': 'heatmap',
		'source': 'taxaBySample',
		'maxzoom': 20,
		'paint': {
			// Increase the heatmap weight based on frequency and property magnitude
			'heatmap-weight': heatmapWeight,
			// Increase the heatmap color weight weight by zoom level
			// heatmap-intensity is a multiplier on top of heatmap-weight
			'heatmap-intensity': [
				'interpolate',
				['linear'],
				['zoom'],
				0,
				1,
				14,
				4
			],
			// Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
			// Begin color ramp at 0-stop with a 0-transparancy color
			// to create a blur-like effect.
			'heatmap-color': heatmapColor,
			// Adjust the heatmap radius by zoom level
			'heatmap-radius': [
				'interpolate',
				['linear'],
				['zoom'],
				0,
				6,
				15,
				40
			],
			// Transition from heatmap to circle layer by zoom level
			'heatmap-opacity': [
				'interpolate',
				['linear'],
				['zoom'],
				7,
				1,
				18,
				0.7
			]
		}
	});

	// Show blurred circles as a pseudo-heatmap
	map.addLayer(
	{
		'id': 'taxaBySample-pointHeat',
		'type': 'circle',
		'source': 'taxaBySample',
		'paint': 
		{
		  'circle-radius': [
			'interpolate',
			['linear'],
			['zoom'],
			0,
			8,//['case',['boolean', ['feature-state', 'hover'], false],	8,	8],
			15,
			50 //['case',['boolean', ['feature-state', 'hover'], false],	50, 50]
		  ],
		  'circle-color': circleColor,
		  'circle-blur': [
			'interpolate',
			['linear'],
			['zoom'],
			0,
			['case',['boolean', ['feature-state', 'hover'], false],	0,	3],
			15,
			['case',['boolean', ['feature-state', 'hover'], false],	0,	1]
		  ],
		  'circle-opacity': 1,
		  'circle-stroke-color': '#fad400',
		  'circle-stroke-width': ['case',['boolean', ['feature-state', 'hover'], false], 3,	0],
		}
	});
	
	// Show actual sample points on the map when zoomed in enough
	map.addLayer(
		{
			'id': 'taxaBySample-point',
			'type': 'circle',
			'source': 'taxaBySample',
			'minzoom': 8,
			'paint': {
				'circle-radius': [
					'interpolate',
					['linear'],
					['zoom'],
					10,
					['interpolate', ['linear'], ['get', 'ab'], 1, 5, 10, 30],
					16,
					['interpolate', ['linear'], ['get', 'ab'], 1, 10, 10, 100]
				],
				'circle-color': circleColor,
				'circle-stroke-color': '#000000',
				'circle-stroke-width': 2,
				'circle-opacity': [
					'interpolate',
					['linear'],
					['zoom'],
					7,
					0,
					8,
					1
				]
			}
		}
	);

	
	map.on('click', 'taxaBySample-pointHeat', function(e) 
	{
		map.flyTo({ center: e.features[0].geometry.coordinates, zoom: Math.max(map.getZoom(), 9) });
		ShowCityMetadata(e.features[0]);
		
		var el = document.createElement('div');
		el.className = 'marker';
		
		if(mapSampleMarker != null) mapSampleMarker.remove();
		
		mapSampleMarker = new mapboxgl.Marker(el, 
			{offset: [0, -25]})
			.setLngLat(e.features[0].geometry.coordinates)
			.addTo(map);
		mapSampleMarkerPresent = true;
		mapCurrentSampleGeojson = e.features[0];
	});
	 
	map.on('mouseenter', 'taxaBySample-pointHeat', function(e) 
	{
		map.getCanvas().style.cursor = 'pointer';	
	});
	
	map.on('mousemove', 'taxaBySample-pointHeat', function(e) 
	{
		if (e.features.length > 0) 
		{
			// Show metadata
			ShowCityMetadata(e.features[0]);
			
			if (hoveredStateId) 
			{
				map.setFeatureState(
					{ source: 'taxaBySample', id: hoveredStateId },
					{ hover: false }
				);
			}
			hoveredStateId = e.features[0].id;
			map.setFeatureState(
				{ source: 'taxaBySample', id: hoveredStateId },
				{ hover: true }
			);
		}
	});
	
	map.on('mouseleave', 'taxaBySample-pointHeat', function() 
	{
		map.getCanvas().style.cursor = '';
		
		if( mapCurrentSampleGeojson == null) // No sample are "clicked", revert the hover table for city metadata.
		{
			// TODO: is it better to keep showing metadata for the last sample?
			
			//$('#city_name_header').text("");
			//$('#city_name_header_msg').css("display", "block");
			//$('#city_metadata_div').css("display", "none");
			//$('#taxon_relative_abundance').text("");			
		}else  // A sample is being shown. Revert to its metadata instead.
		{
			ShowCityMetadata(mapCurrentSampleGeojson);
		}
		
		if (hoveredStateId) 
		{
			map.setFeatureState(
				{ source: 'taxaBySample', id: hoveredStateId },
				{ hover: false }
			);
		}
		hoveredStateId = null;
		
	});
	map.resize();
}



function ShowCityMetadata(geojson)
{
	$('#taxon_relative_abundance').text( (ConvertRelAbInverse(geojson.properties.ab) * 100).toPrecision(3) + "%");
	$('#city_name_header').text(cityIdToMetadata[geojson.properties.city].text);
	$('#city_metadata_sample_name').text(geojson.properties.name);
	$('#city_metadata_project').text(geojson.properties.project);
	$('#city_metadata_line').text( emptyIfNull(geojson.properties.line).replace(";", ", "));
	$('#city_metadata_location_type').text(geojson.properties.location_type);
	$('#city_metadata_surface').text(  emptyIfNull(geojson.properties.surface).replace(";", ", "));
	$('#city_metadata_material').text(geojson.properties.surface_material);
	$('#city_metadata_numreads').text( (geojson.properties.num_reads/1e6).toFixed(3) + "M");
	$('#city_metadata_citypopulation').text( (cityIdToMetadata[geojson.properties.city].city_total_population/1e6).toFixed(3) + "M");
	$('#city_metadata_cityelevation').text(cityIdToMetadata[geojson.properties.city].city_elevation_meters + "m");
}	




function PlotBoxplot(taxaData)
{
	// Get data and sort by continent & city
	boxData = taxaData.taxa_data.map(x => {return {ab:x.relative_abundance, city: x.sample_metadata.city, continent:cityToContinent[x.sample_metadata.city], colorGroup:cityToColorGroup[x.sample_metadata.city]} });
	boxData = boxData.sort((a, b) => (a.colorGroup > b.colorGroup) ? 1 : (a.colorGroup === b.colorGroup) ? ( (a.city === b.city) ? 1 : -1 )  : -1);

	// Setup city colors
	var curCities = getUnique(boxData.map(x => x.city));
	var curColors = getUnique(cityList.map(x => x.colorGroup));
	var boxColor = {};
	var allColors = linspace(0, 360, curColors.length);

	for( i=0; i < curColors.length; i++)
	{
	  var result = 'hsl('+ allColors[i] +',70%'+',70%)';
	  boxColor[curColors[i]] = result;
	}
	
	var cityX = {};
	var prevContinent = "";
	var prevX = 0;
	for(i=0; i < curCities.length; i++)
	{
		var curCity = curCities[i];
		var curX; prevX + 1;
		if(prevContinent === cityToContinent[curCity] )
		{
			curX = prevX + 1; 
		}else
		{
			curX = prevX + 2;
		}
		prevContinent = cityToContinent[curCity];
		cityX[curCity] = curX;
		prevX = curX;
	}

	// Setup plot.ly data
	var data = curCities.map( city => { 
		curCityData = boxData.filter(function (x) { return x.city == city})
		
		return {
			y: curCityData.map(x => {return x.ab }),
			x0: cityX[city],
			name: city,
			marker: {color: boxColor[ cityToColorGroup[city] ] },
			type: 'box'
		}
	});



	var layout = 
	{
	  boxgap:0.1,
	  boxgroupgap:0.1,
	  height:250,
	  autosize: true,
	  yaxis: {
		title: 'Relative abundance',
		zeroline: true,
		color: "#FFFFFF"
	  },
	  xaxis: {
		  tickvals: curCities.map( city => {return cityX[city]}),
		  ticktext: curCities,
		  color: "#FFFFFF"
	 	},
	  boxmode: 'overlay',
	  showlegend:false,
	  margin: {t: 0, r: 10, autoexpand: true },
	  plot_bgcolor: 'rgba(0,0,0,0)',
	  paper_bgcolor: 'rgba(0,0,0,0)',
	};
	var config = {responsive: true};
	
	Plotly.newPlot('statDiv', data, layout, config);
	$('#stat_taxa_name').text("Relative abundance by City for " + taxaData.taxa_name);
	
}

function SetupTaxaSearchAutocomplete()
{
	// Typeahead search functionality
	var taxaBH = new Bloodhound({
	  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('name'),
	  queryTokenizer: Bloodhound.tokenizers.whitespace,
	  identify: function(obj) { return obj.name; },
	  local: taxaListSpecies
	  // TODO: currently we're showing only species rank taxa during autocomplete. When metasub API returns results for ranks other than species (genus, phylum...) use full list instead.
	});

	var cityBH = new Bloodhound({
	  datumTokenizer: Bloodhound.tokenizers.obj.whitespace('text'),
	  queryTokenizer: Bloodhound.tokenizers.whitespace,
	  identify: function(obj) { return obj.text; },
	  local: cityList
	});

	// default taxa to show when search is blank
	function taxaSearchWithDefaults(q, sync) 
	{
	  if (q === '') {
		sync(taxaBH.get('Cutibacterium granulosum', 'Cutibacterium acnes', 'Escherichia coli'));
	  }

	  else {
		taxaBH.search(q, sync);
	  }
	}
	
	// default cities to show when search is blank
	function citySearchWithDefaults(q, sync) 
	{
	  if (q === '') {
		sync(cityBH.get('New York, NY, USA', 'London, London, United Kingdom', 'Tokyo, Japan'));
	  }

	  else {
		cityBH.search(q, sync);
	  }
	}

	$('#taxaSearchBox').typeahead({
	  hint: true,
	  highlight: true,
	  minLength: 0
	},
	{
	  name: 'Taxa',
	  source: taxaSearchWithDefaults,
	  display: 'name',
	  limit: 10,
	  templates: {
	    header: "<h4 class='typeahead-header'>Taxa</h4>",
		empty: [
			'<div class="empty-message">',
			'no taxa found',
			'</div>'
		].join('\n'),
		suggestion: function(data) {   return '<div><div style="display:inline-block; width:50%;"><strong>'  + data.name + '</strong></div><div style="display:inline-block; width:50%;">' + data.taxon.split("|")[0].split("__")[1] + " (" + data.rank + ')</div></div>';}
	  }
	},
	{
	  name: 'Cities',
	  source: citySearchWithDefaults,
	  display: 'name',
	  limit: 10,
	  templates: {
	    header: "<h4 class='typeahead-header'>Cities</h4>",
		empty: [
			'<div class="empty-message">',
			'no city found',
			'</div>'
		].join('\n'),
		suggestion: function(data) {   return '<div><div style="display:inline-block; width:50%;"><strong>'  + data.text + '</strong></div><div style="display:inline-block; width:50%;">' +  data.continent_name +'</div></div>';}
	  }
	}
	
	).on("typeahead:selected", function (obj, datum) 
	{
		if("continent_name" in datum) // City/Location
		{
			map.flyTo({ center: [datum.longitude, datum.latitude], zoom: 9 });
		}else if("taxon" in datum) // Taxon
		{
			current_taxa_name = datum.name;
			PlotTaxa(datum.name);
		}
	});
}

function PlotTaxa(taxa_name)
{
	taxa_json = GetTaxaMap(taxa_name)
	var cur_taxa_data = taxa_json['taxa_data'];
	var cur_taxa_name = taxa_json['taxa_name'];
	
	$("#taxon_name_header").text(cur_taxa_name);
	
	PlotHeatmapTaxaMapbox(taxa_json);
	PlotBoxplot(taxa_json);
	
	// TODO: instead of sampleData use real city data based on last clicked city/sample
	PlotSunburst(sampleData);
	
	// TODO: highlight selected taxa in the sunburst plot.
	// TODO: show metadata for selected taxa in the sidebar
}


function buildHierarchy(sampleData) 
{
  var sortedKeys = Object.keys(sampleData).sort(function(a, b) { return sampleData[b] - sampleData[a]; })
  var root = {"name": "root", "children": [], "idx": 1};
  for(var i in sortedKeys)
  {
	curTaxon = sortedKeys[i];
	// !!! IMPORTANT !!!
	// !!! Note that we're skipping any taxa that are not defined in our taxa list (i.e. missing hierarchy data). 
	// May result in wrong results shown unless the taxa list is customized to the dataset
	// TODO: find missing taxa through NCBI api? or show as unknown?
	if(! (curTaxon in taxaNameToTaxonomy))	continue; 
	
	var taxId = taxaNameToTaxId[curTaxon];
    var sequence = taxaNameToTaxonomy[curTaxon];
    var size = sampleData[curTaxon];
	
	// rename levels into an easily sortable format
	sequence = sequence.replace("d__", "1__");
	sequence = sequence.replace("k__", "2__");
	sequence = sequence.replace("p__", "3__");
	sequence = sequence.replace("c__", "4__");
	sequence = sequence.replace("o__", "5__");
	sequence = sequence.replace("f__", "6__");
	sequence = sequence.replace("g__", "7__");
	sequence = sequence.replace("s__", "8__");
	sequence = sequence.replace("t__", "9__");
	
	
    var parts = sequence.split("|");
	var levels = parts.map(x=> {return x.split("__")[0]});
	
	// Which levels to keep & plot in sunburst. Currently domain, phyla, family, genus, species
	var levelsToKeep = ["1", "3", "6", "7", "8"];
	var partsFilled = [];
	
	// Fill out if there are any missing levels in the sequence
	for(var j=0; j < levelsToKeep.length; j++)
	{
		curLevel = levelsToKeep[j];
		if(levels.includes(curLevel))
		{
			partsFilled.push( parts[ levels.indexOf(curLevel) ] ); 
		}else
		{
			partsFilled.push( curLevel + "__Unknown");
		}
	}
	parts = partsFilled.sort();
	
	// Build the tree
    var currentNode = root;
    for (var j = 0; j < parts.length; j++) 
	{
      var children = currentNode["children"];
	  var partsSplit = parts[j].split("__");
      var nodeName = partsSplit[1].replace("_", " ");
	  var nodeNameOrg = nodeName;
	  var nodeNameSplit = nodeName.split(" ")
	  if(nodeNameOrg in taxaNameToTaxId) taxId = taxaNameToTaxId[nodeNameOrg]; else taxId = -1;
	  
	  if( partsSplit[0] == "8"  && nodeNameSplit.length > 1) // In species shorten the genera name to fit in sunburst
	  {
		nodeName = nodeNameSplit[0].substring(0,1) + ". " + nodeNameSplit.slice(1, nodeNameSplit.length);
	  }
      var childNode;
      if (j + 1 < parts.length) 
	  {
		// Not yet at the end of the sequence; move down the tree.
		var foundChild = false;
		for (var k = 0; k < children.length; k++) 
		{
			if (children[k]["name"] == nodeName) 
			{
				childNode = children[k];
				foundChild = true;
				break;
			}
		}
		
		// If we don't already have a child node for this branch, create it.
		if (!foundChild) 
		{
			childNode = {"name": nodeName, "children": [], "idx": children.length+1, "taxid": taxId, "name_original": nodeNameOrg};
			children.push(childNode);
		}
		currentNode = childNode;
      } else 
	  {
		// Reached the end of the sequence; create a leaf node.
		childNode = {"name": nodeName, "children": [], "value": size, "idx": children.length+1, "taxid": taxId, "name_original": nodeNameOrg};
		children.push(childNode);
      }
    }
  }
  return root;
}


function PlotSunburst(sampleData)
{
	$("#sampleDiv").html("");
	var divElement = document.getElementById("sampleDiv");
	var sunburstSize = Math.max(200, divElement.offsetWidth*0.9);
	var sunburstData = buildHierarchy(sampleData);
	const color = d3.scaleOrdinal(d3.schemePaired);
	
	const sampleSunburst = Sunburst();

	sampleSunburst
		.height(sunburstSize)
		.width(sunburstSize)
		.excludeRoot(true)
		.data(sunburstData)
		.color((d, parent) => {
			curColor = color(parent ? parent.data.name : null); // color each taxa by its parent so there's some structure
			if(d.idx % 2 == 1) { return curColor; } else { return d3.hsl(curColor).brighter(); } // but alternate colors with brighter hues so consecutive taxa are easier to differentiate
		})
		.tooltipTitle((node, d) => node.name_original)
		.tooltipContent((d, node) => `Relative abundance: <i>${(node.value*100).toPrecision(3)}%</i>`)
		.size('value')
		.onHover((d) => SunburstHover(d) )
		(divElement);
}

function SunburstHover(node)
{
	if(node != null) ShowTaxonMetadata(node); //else HideTaxonMetadata(node);
}

function HighlightTaxonMetadata(spanId)
{
	$('#' + spanId).css("opacity", "1");
	$('#' + spanId).css("border-color", "#f5b400");
	//$('#' + spanId).css("outline-width", "2px");
	
}

// TODO: fix metadata section, too ad hoc and messy right now.
// maybe structure in the metadata fields and a mapping description file?
function ShowTaxonMetadata(node)
{
	HideTaxonMetadata();
	$('#sunburst_taxon_name_header').text(node.name_original);
	$('#sunburst_taxon_relative_abundance').text( (node.__dataNode.value * 100).toPrecision(3) + "%");
	
	if(node.taxid != null)
	{
		if(node.taxid in microbeDirectory)
		{
			curAnn = microbeDirectory[node.taxid];
			
			
			if('optimal_temperature' in curAnn)
			{
				$('#sunburst_taxon_temp').text(curAnn['optimal_temperature']);
			}
			if('optimal_ph' in curAnn)
			{
				$('#sunburst_taxon_ph').text(curAnn['optimal_ph']);
			}
			
			if('gram_stain' in curAnn)
			{
				//$('#sunburst_taxon_gram_row').css("display", "table-row");
				if(curAnn['gram_stain'] == 1) { HighlightTaxonMetadata('sunburst_taxon_gram_positive'); } else { HighlightTaxonMetadata('sunburst_taxon_gram_negative'); }
			}
			if('biofilm_forming' in curAnn)
			{
				if(curAnn['biofilm_forming'] == 1) { HighlightTaxonMetadata('sunburst_taxon_biofilm_y'); } else { HighlightTaxonMetadata('sunburst_taxon_biofilm_n'); }
			}
			if('spore_forming' in curAnn)
			{
				if(curAnn['spore_forming'] == 1) { HighlightTaxonMetadata('sunburst_taxon_spore_y'); } else { HighlightTaxonMetadata('sunburst_taxon_spore_n'); }
			}
			if('extreme_environment' in curAnn)
			{
				if(curAnn['extreme_environment'] == 1) { HighlightTaxonMetadata('sunburst_taxon_extremophile_y'); } else { HighlightTaxonMetadata('sunburst_taxon_extremophile_n'); }
			}
			if('antimicrobial_susceptibility' in curAnn)
			{
				if(curAnn['antimicrobial_susceptibility'] == 1) { HighlightTaxonMetadata('sunburst_taxon_antimicrobial_y'); } else { HighlightTaxonMetadata('sunburst_taxon_antimicrobial_n'); }
			}
			if('animal_pathogen' in curAnn)
			{
				if(curAnn['animal_pathogen'] == 1) { HighlightTaxonMetadata('sunburst_taxon_animal_pathogen_y'); } else { HighlightTaxonMetadata('sunburst_taxon_animal_pathogen_n'); }
			}
			if('plant_pathogen' in curAnn)
			{
				if(curAnn['plant_pathogen'] == 1) { HighlightTaxonMetadata('sunburst_taxon_plant_pathogen_y'); } else { HighlightTaxonMetadata('sunburst_taxon_plant_pathogen_n'); }
			}
			if('pathogenicity' in curAnn)
			{
				if(curAnn['pathogenicity'] == 1) { HighlightTaxonMetadata('sunburst_taxon_pathogenicity_1'); } 
				else if(curAnn['pathogenicity'] == 2) { HighlightTaxonMetadata('sunburst_taxon_pathogenicity_2'); }
				else if(curAnn['pathogenicity'] == 3) { HighlightTaxonMetadata('sunburst_taxon_pathogenicity_3'); }
			}
		}
		
		var taxaMetadataTable = document.getElementById('sunburst_taxa_metadata_table');
        
		var curAnnCt = 0;
		var taxaMetadataRow;
		
		
		if(node.taxid in togo_mpo)
		{
			mpoAnn = togo_mpo[node.taxid];
			for(curAnn in mpoAnn) 
			{ 
				if(curAnn == "species_taxid" || curAnn == "species_name" ) continue; // Skip features
				
				if(curAnn == "staining") // Gram staining highlight
				{
					if(curAnn['staining'] == "Gram positive") { HighlightTaxonMetadata('sunburst_taxon_gram_positive'); } else if(curAnn['staining'] == "Gram negative") { HighlightTaxonMetadata('sunburst_taxon_gram_negative'); }
					continue;
				}
				
				
				if(taxaMetadataRow == null || curAnnCt % 2 == 0)
				{
					taxaMetadataRow = taxaMetadataTable.insertRow(taxaMetadataTable.rows.length);
					taxaMetadataRow.className = "sunburst_taxon_temp_row";
				}
				curElements = mpoAnn[curAnn].split(";");
				
				createCell(taxaMetadataRow.insertCell(-1), 'td_meta_key', curAnn, '');
				curCell = taxaMetadataRow.insertCell(-1);
				for(i in curElements)
				{
					el = curElements[i];
					sep = ", ";
					if(i == (curElements.length-1) ) sep = "";
					if(el in togo_def) 
					{ 
						createCellWithSpan(curCell, 'td_meta_val', (el + sep), "togo_tooltip", togo_def[el], "togo_tooltiptext"); 
					}else 
					{
						createCell(curCell, 'td_meta_val', (el + sep), ""); 
					}
				}
				curAnnCt++;
			}
			
			
		}
		curAnnCt = 0
		if(node.taxid in togo_meo)
		{
			mpoAnn = togo_meo[node.taxid];
			for(curAnn in mpoAnn) 
			{ 
				if(curAnn == "species_taxid" || curAnn == "species_name" ) continue;
				
				if(taxaMetadataRow == null || curAnnCt % 2 == 0)
				{
					taxaMetadataRow = taxaMetadataTable.insertRow(taxaMetadataTable.rows.length);
					taxaMetadataRow.className = "sunburst_taxon_temp_row";
				}
				curElements = mpoAnn[curAnn].split(";");
				
				createCell(taxaMetadataRow.insertCell(-1), 'td_meta_key', curAnn, '');
				curCell = taxaMetadataRow.insertCell(-1);
				for(i in curElements)
				{
					el = curElements[i];
					sep = ", ";
					if(i == (curElements.length-1) ) sep = "";
					if(el in togo_def) 
					{ 
						createCellWithSpan(curCell, 'td_meta_val', (el + sep), "togo_tooltip", togo_def[el], "togo_tooltiptext"); 
					}else 
					{
						createCell(curCell, 'td_meta_val', (el + sep), ""); 
					}
				}
				curAnnCt++;
			}
		}
		if(node.taxid in togo_pdo)
		{
			pdoAnn = togo_pdo[node.taxid];
			taxaMetadataRow = taxaMetadataTable.insertRow(taxaMetadataTable.rows.length);
			taxaMetadataRow.className = "sunburst_taxon_temp_row";
			createCell(taxaMetadataRow.insertCell(-1), 'td_meta_key', "Infectious strains", ""); 
			createCellWithSpan(taxaMetadataRow.insertCell(-1), 'td_meta_val', (pdoAnn['disease'].split(";").join(", ")), "togo_tooltip", (pdoAnn['name'].split(";").join(", ")), "togo_tooltiptext");
		}
		
	
	}
}

function HideTaxonMetadata(node)
{
	$('#sunburst_taxon_name_header').text(String.fromCharCode(160));
	$('#sunburst_taxon_relative_abundance').text("");
	$('.taxa-legend-key').css("opacity", "0.3");
	$(".sunburst_taxon_temp_row").remove();
}
