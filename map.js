// // import {geocodes, people, idToIdx} from './family';



const map = d3.select("#map-holder");
const width = map.node().getBoundingClientRect().width;
const height = width ;

const projection = d3.geoEquirectangular(); //geoMercator(); 
const path = d3.geoPath().projection(projection);

const zoom = d3.zoom()
    .scaleExtent([1, 40])
    .translateExtent([[0,0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

const svg = map.append("svg")
    .attr("width", width)
    .attr("height", height)
    .call(zoom);

const g = svg.append("g");

      
d3.json("world-atlas-110m.json", function(error, world) {
  if (error) throw error;

    g.selectAll("path")
       .data(topojson.feature(world, world.objects.countries).features)
       .enter().append("path")
       .attr("d", path);

    g.append("path")
       .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
       .attr("class", "boundary")
       .attr("d", path);
  
});
    
function zoomed(){
    g.attr("transform","translate("+ 
        d3.event.transform.x + ", " + d3.event.transform.y + ")scale("+d3.event.transform.k+")");
    g.selectAll(".marker")
        .attr("r", function(){
            var self = d3.select(this);
            var r = 8 / d3.event.transform.k;  // set radius according to scale
            // self.style("stroke-width", r < 4 ? (r < 2 ? 0.5 : 1) : 2);  // scale stroke-width
            return r;
        });


    // g.attr("transform", d3.event.transform);
    console.log('transform: ', d3.event.transform);
//   const t = {k: 1, x: d3.event.transform.x, y: d3.event.transform.y};
//   d3.selectAll('.marker').attr('transform', t);
//   d3.selectAll('line').attr('transform', t);

// d3.event.transform.scale[0] = 1;
// d3.event.transform.k = 1;
    // TODO try doing a reverse scale
    // const inverseTransform = d3.event.transform.scale(-1);
    // console.log("inverse t = ", inverseTransform);
    // d3.selectAll('.marker').attr('transform', inverseTransform);
    // d3.selectAll('.marker').attr('transform', d3.event.transform);
    // d3.selectAll('.marker').attr('transform', "translate(" + d3.event.transform.translateX + "," + d3.event.transform.translateY + ") scale(1.0)");

    d3.selectAll('line').attr('transform', d3.event.transform);

    // var marker = document.getElementById('Layer_1');
    // var currentTransf = getTransformation(marker.getAttribute("transform"));
  
    // var currentx = currentTransf.translateX;
    // var currenty = currentTransf.translateY;
  
    // var center = d3.mouse(marker);
  
    // var dx = currentx - center[0] + 43;
    // var dy = currenty - center[1];
  
    // var newx = currentx + dx * dscale / (38.5/2);
    // var newy = currenty + dy * dscale / (39.8/2);
          
    // d3.selectAll(".marker").attr("transform", "translate(" + newx + "," + newy + ") scale(" + d3.event.transform.k + ")");



}   






///////////////////////// Fancy stuff

// var w = window.innerWidth,
//     h = window.innerHeight;
// var minZoom;
// var maxZoom;



// var svg = d3.select("#map-holder")
//     .append("svg")
//     .attr("width", w)
//     .attr("height", h);




// var g = svg.append("g");

// // For projecting a spherical geomerty on a 2D screen 
// // var projection = d3.geoEquirectangular()
// //     .scale(150)
// //     .rotate([0, 0])
// //     .center([0, 0])
// //     .translate([w / 2, h / 2]);

// // var projection = d3.geoMercator();
// var projection = d3.geoEquirectangular()
//     // .scale(150)
//     // .translate([w / 2, h / 2]);

// var geoPath = d3.geoPath()
//     .projection(projection);



//     // svg.append("path")
//     // .datum(topojson.feature(uk, uk.objects.subunits))
//     // .attr("d", d3.geo.path().projection(d3.geo.mercator()));




// let countriesGroup;

// // function zoomed() {
// //     t = d3.event.transform;
// //     if (countriesGroup) {
// //         // countriesGroup.attr("transform","translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
// //     }

// // }

// // Define map zoom behaviour
// // var zoom = d3
// //     .zoom()
// //     .on("zoom", zoomed);

// let mapEl = document.getElementById("map-holder");
// minZoom = Math.max(mapEl.offsetWidth / w, mapEl.offsetHeight / h);
// maxZoom = 100 * minZoom;

// // define X and Y offset for centre of map to be shown in centre of holder
// midX = (mapEl.offsetWidth - minZoom * w) / 2;
// midY = (mapEl.offsetHeight - minZoom * h) / 2;

// // change zoom transform to min zoom and centre offsets
// // svg.call(zoom.transform, d3.zoomIdentity.translate(midX, midY).scale(minZoom));


// locations = []; // key:  location name, value:  "latLng": {
// //   "lat": 40.015831,
// //   "lng": -105.27927
// // },

// function getTextBox(selection) {
//     selection
//         .each(function (d) {
//             d.bbox = this
//                 .getBBox();
//         })
//         ;
// }

// var geoJson;


// // get map data
// d3.json(
//     // //   "https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json", function(json) {
//     "https://mspencev.github.io/d3/map/family/custom50.json", function (json) {
//         // "custom50.json", function(json) {
//         geoJson = json;

//         renderMap();
//     });

    
// function renderMap() {

   

//     countriesGroup = g.attr("id", "map");
//     // add a background rectangle
//     const rect = countriesGroup
//         .append("rect")
//         .attr("x", 0)
//         .attr("y", 0)
//         .attr("width", w)
//         .attr("height", h);

//     //   countries = g.selectAll( "path" )
//     countries = countriesGroup.selectAll("path")
//     // countries = rect.selectAll("path")

//         .data(geoJson.features)
//         .enter()
//         .append("path")
//         .attr("fill", "#ccc")
//         .attr("d", geoPath)
//         .attr("id", function (d, i) {
//             return "country" + d.properties.iso_a3;
//         })
//         .attr("class", "country")
//         .on("mouseover", function (d, i) {
//             d3.select("#countryLabel" + d.properties.iso_a3).style("display", "block");
//         })
//         .on("mouseout", function (d, i) {
//             d3.select("#countryLabel" + d.properties.iso_a3).style("display", "none");
//         });

//     // feature/country. This will contain the country name and a background rectangle
//     // Use CSS to have class "countryLabel" initially hidden
//     countryLabels = countriesGroup
//         .selectAll("g")
//         .data(geoJson.features)
//         .enter()
//         .append("g")
//         .attr("class", "countryLabel")
//         .attr("id", function (d) {
//             return "countryLabel" + d.properties.iso_a3;
//         })
//         .attr("transform", function (d) {
//             return (
//                 "translate(" + geoPath.centroid(d)[0] + "," + geoPath.centroid(d)[1] + ")"
//             );
//         })
//         // add mouseover functionality to the label
//         .on("mouseover", function (d, i) {
//             d3.select(this).style("display", "block");
//         })
//         .on("mouseout", function (d, i) {
//             d3.select(this).style("display", "none");
//         })
//         // add an onlcick action to zoom into clicked country
//         .on("click", function (d, i) {
//             d3.selectAll(".country").classed("country-on", false);
//             d3.select("#country" + d.properties.iso_a3).classed("country-on", true);
//             // boxZoom(geoPath.bounds(d), geoPath.centroid(d), 20);
//         });
//     // add the text to the label group showing country name
//     countryLabels
//         .append("text")
//         .attr("class", "countryName")
//         .style("text-anchor", "middle")
//         .attr("dx", 0)
//         .attr("dy", 0)
//         .text(function (d) {
//             return d.properties.name;
//         })
//         .call(getTextBox);
//     // add a background rectangle the same size as the text
//     countryLabels
//         .insert("rect", "text")
//         .attr("class", "countryLabelBg")
//         .attr("transform", function (d) {
//             return "translate(" + (d.bbox.x - 2) + "," + d.bbox.y + ")";
//         })
//         .attr("width", function (d) {
//             return d.bbox.width + 4;
//         })
//         .attr("height", function (d) {
//             return d.bbox.height;
//         });

// };


// // zoom to show a bounding box, with optional additional padding as percentage of box size
// function boxZoom(box, centroid, paddingPerc) {

//     // let svgEl = document.getElementsByTagName("svg");

//     // minXY = box[0];
//     // maxXY = box[1];
//     // // find size of map area defined
//     // zoomWidth = Math.abs(minXY[0] - maxXY[0]);
//     // zoomHeight = Math.abs(minXY[1] - maxXY[1]);
//     // // find midpoint of map area defined
//     // zoomMidX = centroid[0];
//     // zoomMidY = centroid[1];
//     // // increase map area to include padding
//     // zoomWidth = zoomWidth * (1 + paddingPerc / 100);
//     // zoomHeight = zoomHeight * (1 + paddingPerc / 100);
//     // // find scale required for area to fill svg
//     // maxXscale = svgEl.offsetWidth / zoomWidth;
//     // maxYscale = svgEl.offsetHeight / zoomHeight;
//     // zoomScale = Math.min(maxXscale, maxYscale);
//     // // handle some edge cases
//     // // limit to max zoom (handles tiny countries)
//     // zoomScale = Math.min(zoomScale, maxZoom);
//     // // limit to min zoom (handles large countries and countries that span the date line)
//     // zoomScale = Math.max(zoomScale, minZoom);
//     // // Find screen pixel equivalent once scaled
//     // offsetX = zoomScale * zoomMidX;
//     // offsetY = zoomScale * zoomMidY;
//     // // Find offset to centre, making sure no gap at left or top of holder
//     // dleft = Math.min(0, svgEl.offsetWidth / 2 - offsetX);
//     // dtop = Math.min(0, svgEl.offsetHeight / 2 - offsetY);
//     // // Make sure no gap at bottom or right of holder
//     // dleft = Math.max(svgEl.offsetWidth - w * zoomScale, dleft);
//     // dtop = Math.max(svgEl.offsetHeight - h * zoomScale, dtop);
//     // // set zoom
//     // svg
//     //     .transition()
//     //     .duration(500)
//     //     .call(
//     //         zoom.transform,
//     //         d3.zoomIdentity.translate(dleft, dtop).scale(zoomScale)
//     //     );
// }
