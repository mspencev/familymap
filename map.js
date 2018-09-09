var w = window.innerWidth,
    h = window.innerHeight;
var minZoom;
var maxZoom;

let geocodes = {}; // Place to lat lon mapping.


var svg = d3.select("#map-holder")
    .append("svg")
    .attr("width", w)
    .attr("height", h);




var g = svg.append("g");

// For projecting a spherical geomerty on a 2D screen 
// var projection = d3.geoEquirectangular()
//     .scale(150)
//     .rotate([0, 0])
//     .center([0, 0])
//     .translate([w / 2, h / 2]);

// var projection = d3.geoMercator();
var projection = d3.geoEquirectangular()
    // .scale(150)
    .translate([w / 2, h / 2]);

var geoPath = d3.geoPath()
    .projection(projection);



    // svg.append("path")
    // .datum(topojson.feature(uk, uk.objects.subunits))
    // .attr("d", d3.geo.path().projection(d3.geo.mercator()));




let countriesGroup;

// function zoomed() {
//     t = d3.event.transform;
//     if (countriesGroup) {
//         // countriesGroup.attr("transform","translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
//     }

// }

// Define map zoom behaviour
// var zoom = d3
//     .zoom()
//     .on("zoom", zoomed);

let mapEl = document.getElementById("map-holder");
minZoom = Math.max(mapEl.offsetWidth / w, mapEl.offsetHeight / h);
maxZoom = 100 * minZoom;

// define X and Y offset for centre of map to be shown in centre of holder
midX = (mapEl.offsetWidth - minZoom * w) / 2;
midY = (mapEl.offsetHeight - minZoom * h) / 2;

// change zoom transform to min zoom and centre offsets
// svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));


locations = []; // key:  location name, value:  "latLng": {
//   "lat": 40.015831,
//   "lng": -105.27927
// },

function getTextBox(selection) {
    selection
        .each(function (d) {
            d.bbox = this
                .getBBox();
        })
        ;
}

var geoJson;
var people = [];
var idToIdx = {};

// get map data
d3.json(
    // //   "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json", function(json) {
    "https://mspencev.github.io/d3/map/family/custom50.json", function (json) {
        // "custom50.json", function(json) {
        geoJson = json;

        fetchFamilyTree();
    });

function fetchFamilyTree() {
    // d3.json("https://mspencev.github.io/d3/map/family/family.json", function(err, json) {
    // d3.json("family.test.json", function (err, json) {
    d3.json("family.12gen.json", function (err, json) {

        if (err) console.log("error fetching data");
        
        var personIdExp = RegExp('^.{4}-.{3}$');

        // Filter out any funny data, which we have.
        for(entry in json) {
            if(!personIdExp.test(entry)){
                continue;
            }
            idToIdx[entry] = people.length;
            people.push(json[entry]);
        }

        fetchLocations();
        // gotAllResponses().then(() => {
        //     console.log("GOT ALL RESPONDED!");
        //     renderMap();
        // })

        setTimeout( () => {
            renderMap();
        }, 2000);
    });
}

let geocodeCalls = 0;
let geocodeResponses = 0;

function fetchLocations() {
    let geocodeUrl = 'http://www.mapquestapi.com/geocoding/v1/batch?key=zX5pvmcAq3RBuI4WkGpRBHLLcRMnDweB';

    let url = geocodeUrl;
    const places = people.filter(function (person) {
        return person && person.birthPlace && person.birthPlace !== '';
    }).map(function(person) {
        return person.birthPlace;
    }).filter(function(place, index, theArray){
        return theArray.indexOf(place) === index; // Make unique
    });

    places.forEach(function (place, idx) {
        url += `&location=${place}`;
        if (idx % 90 === 0 && idx > 0) {
            // Limit of 100 locations for each batch reuqest
            fetchMapquestGeocodes(url);
            url = geocodeUrl; // reset
        }
    });

    fetchMapquestGeocodes(url);
}

function fetchMapquestGeocodes(url){
    ++geocodeCalls;
    console.log("Made Request!");

    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((response) => {
            handleMapquestGeocode(response);
        });
}

function handleMapquestGeocode(response) {
    response.results.forEach( (result) => {
        if(!result.locations[0]){
            return;
        }
        geocodes[result.providedLocation.location] = {
            lat: result.locations[0].latLng.lat,
            lon: result.locations[0].latLng.lng
        };
    });

    console.log("Got Response!");
    ++geocodeResponses;
}

function promiseTimeout(ms, promise){

    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
      let id = setTimeout(function() {
        clearTimeout(id);
        reject('Timed out in '+ ms + 'ms.')
      }, 1000)
    })
  
    // Returns a race between our timeout and the passed in promise
    return Promise.race([
      promise,
      timeout.then( () => {
        throw new Error("Timeout after " + ms + " ms");
      })
    ])
  }
  

function gotAllResponses() {
    const gotAllPromise = new Promise( (resolve, reject) => {
        let done = geocodeCalls === geocodeResponses;
        while(!done){
            done = geocodeCalls === geocodeResponses;
        }
        resolve();
    })

    return promiseTimeout(1000, gotAllPromise);
}
    
function renderMap() {

    if(Object.keys(geocodes).length === 0) {
        console.log("Failed to get the geocodes in time");
        return;
    }

    countriesGroup = g.attr("id", "map");
    // add a background rectangle
    const rect = countriesGroup
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", w)
        .attr("height", h);

    //   countries = g.selectAll( "path" )
    countries = countriesGroup.selectAll("path")
    // countries = rect.selectAll("path")

        .data(geoJson.features)
        .enter()
        .append("path")
        .attr("fill", "#ccc")
        .attr("d", geoPath)
        .attr("id", function (d, i) {
            return "country" + d.properties.iso_a3;
        })
        .attr("class", "country")
        .on("mouseover", function (d, i) {
            d3.select("#countryLabel" + d.properties.iso_a3).style("display", "block");
        })
        .on("mouseout", function (d, i) {
            d3.select("#countryLabel" + d.properties.iso_a3).style("display", "none");
        });

    // feature/country. This will contain the country name and a background rectangle
    // Use CSS to have class "countryLabel" initially hidden
    countryLabels = countriesGroup
        .selectAll("g")
        .data(geoJson.features)
        .enter()
        .append("g")
        .attr("class", "countryLabel")
        .attr("id", function (d) {
            return "countryLabel" + d.properties.iso_a3;
        })
        .attr("transform", function (d) {
            return (
                "translate(" + geoPath.centroid(d)[0] + "," + geoPath.centroid(d)[1] + ")"
            );
        })
        // add mouseover functionality to the label
        .on("mouseover", function (d, i) {
            d3.select(this).style("display", "block");
        })
        .on("mouseout", function (d, i) {
            d3.select(this).style("display", "none");
        })
        // add an onlcick action to zoom into clicked country
        .on("click", function (d, i) {
            d3.selectAll(".country").classed("country-on", false);
            d3.select("#country" + d.properties.iso_a3).classed("country-on", true);
            // boxZoom(geoPath.bounds(d), geoPath.centroid(d), 20);
        });
    // add the text to the label group showing country name
    countryLabels
        .append("text")
        .attr("class", "countryName")
        .style("text-anchor", "middle")
        .attr("dx", 0)
        .attr("dy", 0)
        .text(function (d) {
            return d.properties.name;
        })
        .call(getTextBox);
    // add a background rectangle the same size as the text
    countryLabels
        .insert("rect", "text")
        .attr("class", "countryLabelBg")
        .attr("transform", function (d) {
            return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
        })
        .attr("width", function (d) {
            return d.bbox.width + 4;
        })
        .attr("height", function (d) {
            return d.bbox.height;
        });

    renderLines();
    renderMarkers();

};

function renderMarkers() {
    // add circles to svg
    svg.selectAll("circle")
        .data(people).enter()
        .append("circle")
        .attr("cx", (d) => { 
            const latlon = geocodes[d.birthPlace];
            return projection( [latlon.lon, latlon.lat] )[0]; })
        .attr("cy", (d) => { 
            const latlon = geocodes[d.birthPlace];
            return projection( [latlon.lon, latlon.lat])[1]; })
        .attr('class', 'marker')
        .attr('r', 3)
        .on("mouseover", (d) => {
            const tooltip = document.getElementById('tooltip');
            tooltip.classList.add('tooltip-active');
            tooltip.innerHTML = `Name: ${d.name}<br>Birth: ${d.birthDate}, ${d.birthPlace}`;
            tooltip.style.left = `${(d3.event.pageX + 10)}px`;
            tooltip.style.top = `${(d3.event.pageY - 20)}px`;
        })
        .on("mouseout", (d) => {
            document.getElementById('tooltip').classList.remove('tooltip-active');
        });
}

function renderLines() {

    let lines = getLines();

    svg.selectAll("line")
        .data(lines).enter()
        .append("line")
        .attr("x1", function (d) { return d.x1; })
        .attr("y1", function (d) { return d.y1; })
        .attr("x2", function (d) { return d.x2; })
        .attr("y2", function (d) { return d.y2; })
        .attr("class", function (d) { return d.isDad ? "line-dad" : "line-mom"; });
}



function getLines() {
    let lines = [];

    people.forEach( (person) => {
        if(!person.birthPlace || person.birthPlace === '') {
            return;
        }

        if(!person.familiesAsChild || !person.familiesAsChild[0]){
            return;
        }

        // TODO what if the array has more than one?
        const asChild = person.familiesAsChild[0];

        const parents = [];
        if(asChild.parent1) { parents.push( people[idToIdx[asChild.parent1.resourceId]] ); }
        if(asChild.parent2) { parents.push( people[idToIdx[asChild.parent2.resourceId]] ); }

        parents.forEach( (parent) => {
            if(!parent || !parent.birthPlace || parent.birthPlace === '') {
                return;
            }
            lines.push(createLine(parent, person));
        });
    });
    return lines;
}

/**
 * 
 * @param {*} parent - the value part of the people object
 * @param {*} child 
 */
function createLine(parent, child) {
    const parentLatLon = geocodes[parent.birthPlace];
    const childLatLon = geocodes[child.birthPlace];
    const parentPt = projection([parentLatLon.lon, parentLatLon.lat]);
    const childPt = projection([childLatLon.lon, childLatLon.lat]);

    return {
        "x1": childPt[0],
        "y1": childPt[1],
        "x2": parentPt[0],
        "y2": parentPt[1],
        "isDad": parent.gender === 'Male',
        "parent": parent.name
    };
}

// zoom to show a bounding box, with optional additional padding as percentage of box size
function boxZoom(box, centroid, paddingPerc) {

    // let svgEl = document.getElementsByTagName("svg");

    // minXY = box[0];
    // maxXY = box[1];
    // // find size of map area defined
    // zoomWidth = Math.abs(minXY[0] - maxXY[0]);
    // zoomHeight = Math.abs(minXY[1] - maxXY[1]);
    // // find midpoint of map area defined
    // zoomMidX = centroid[0];
    // zoomMidY = centroid[1];
    // // increase map area to include padding
    // zoomWidth = zoomWidth * (1 + paddingPerc / 100);
    // zoomHeight = zoomHeight * (1 + paddingPerc / 100);
    // // find scale required for area to fill svg
    // maxXscale = svgEl.offsetWidth / zoomWidth;
    // maxYscale = svgEl.offsetHeight / zoomHeight;
    // zoomScale = Math.min(maxXscale, maxYscale);
    // // handle some edge cases
    // // limit to max zoom (handles tiny countries)
    // zoomScale = Math.min(zoomScale, maxZoom);
    // // limit to min zoom (handles large countries and countries that span the date line)
    // zoomScale = Math.max(zoomScale, minZoom);
    // // Find screen pixel equivalent once scaled
    // offsetX = zoomScale * zoomMidX;
    // offsetY = zoomScale * zoomMidY;
    // // Find offset to centre, making sure no gap at left or top of holder
    // dleft = Math.min(0, svgEl.offsetWidth / 2 - offsetX);
    // dtop = Math.min(0, svgEl.offsetHeight / 2 - offsetY);
    // // Make sure no gap at bottom or right of holder
    // dleft = Math.max(svgEl.offsetWidth - w * zoomScale, dleft);
    // dtop = Math.max(svgEl.offsetHeight - h * zoomScale, dtop);
    // // set zoom
    // svg
    //     .transition()
    //     .duration(500)
    //     .call(
    //         zoom.transform,
    //         d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale)
    //     );
}
