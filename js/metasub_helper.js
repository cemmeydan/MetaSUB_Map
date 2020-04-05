function DownloadJson(json_url) 
{
    var json = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': json_url,
        'dataType': "json",
        'success': function (data) {
            json = data;
        }
    });
    return json;
}

function Quartile(data, q) 
{
  data=Array_Sort_Numbers(data);
  var pos = ((data.length) - 1) * q;
  var base = Math.floor(pos);
  var rest = pos - base;
  if( (data[base+1]!==undefined) ) {
    return data[base] + rest * (data[base+1] - data[base]);
  } else {
    return data[base];
  }
}

function emptyIfNull(str)
{
	if(str == null) return(""); else return(str);
}

function Array_Sort_Numbers(inputarray)
{
  return inputarray.sort(function(a, b) {
    return a - b;
  });
}


function linspace(a,b,n) 
{
  return Plotly.d3.range(n).map(function(i){return a+i*(b-a)/(n-1);});
}

function getUnique(iterable) 
{
  return Array.from(new Set(iterable));
}

function countUnique(iterable) 
{
  return new Set(iterable).size;
}


function unpack(rows, key) 
{
	return rows.map(function(row) 
	{
		return row[key];
	});
}

function unpack_metadata(rows, key) 
{
	return rows.map(function(row) 
	{
		return row['sample_metadata'][key];
	});
}

var minAbShift = 6;
function ConvertRelAb(relAb)
{
	return Math.log10(relAb)+minAbShift;
}

function ConvertRelAbInverse(logAb)
{
	return 10**(logAb-minAbShift);
}


function convertHex(hex,opacity)
{
    hex = hex.replace('#','');
    r = parseInt(hex.substring(0,2), 16);
    g = parseInt(hex.substring(2,4), 16);
    b = parseInt(hex.substring(4,6), 16);

    result = 'rgba('+r+','+g+','+b+','+opacity+')';
    return result;
}


function TaxaJsonToGeojson(taxaData)
{
	curGeojson = {'type': "FeatureCollection", 
		'features': taxaData.map((x,index) => 
		{ return { 'type': "Feature", 
				  'properties': {'ab': ConvertRelAb(x.relative_abundance), 
								 'name': x.sample_metadata.metasub_name,
								 'sample_id': x.sample_name, 
								 'sample_uuid': x.sample_uuid, 
								 'city':x.sample_metadata.city,
								 'line': x.sample_metadata.line,
								 'location_type': x.sample_metadata.location_type,
								 'project': x.sample_metadata.project,
								 'surface': x.sample_metadata.surface,
								 'surface_material': x.sample_metadata.surface_material,
								 'num_reads': x.sample_metadata.num_reads
								 
								 }, 
				  'geometry': {'type': "Point", 'coordinates': [x.sample_metadata.longitude, x.sample_metadata.latitude] }
				}
			})
	};
	return curGeojson;
}

// append row to the HTML table
function appendRow() {
    var tbl = document.getElementById('my-table'), // table reference
        row = tbl.insertRow(tbl.rows.length),      // append table row
        i;
    // insert table cells to the new row
    for (i = 0; i < tbl.rows[0].cells.length; i++) {
        createCell(row.insertCell(i), i, 'row');
    }
}
 
// create DIV element and append to the table cell
function createCell(cell, cellStyle, divText, divStyle) 
{
	cell.setAttribute('class', cellStyle);
	cell.setAttribute('className', cellStyle);
    var div = document.createElement('div'), // create DIV element
        txt = document.createTextNode(divText); // create text node
    div.appendChild(txt);                    // append text node to the DIV
    div.setAttribute('class', divStyle);        // set DIV class attribute
    div.setAttribute('className', divStyle);    // set DIV class attribute for IE (?!)
    cell.appendChild(div);                   // append DIV to the table cell
}

function createCellWithSpan(cell, cellStyle, divText, divStyle, spanText, spanStyle) 
{
	cell.setAttribute('class', cellStyle);
	cell.setAttribute('className', cellStyle);
    var div = document.createElement('div'), // create DIV element
        txt = document.createTextNode(divText),
		span = document.createElement('span'),
		spanTxt = document.createTextNode(spanText);
    div.appendChild(txt);                    // append text node to the DIV
    div.setAttribute('class', divStyle);        // set DIV class attribute
    div.setAttribute('className', divStyle);    // set DIV class attribute for IE (?!)
	span.className = spanStyle;
	span.appendChild(spanTxt);
	div.appendChild(span);
    cell.appendChild(div);                   // append DIV to the table cell
}