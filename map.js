// // import {geocodes, people, idToIdx} from './family';

const MARKER_RADIUS = 3;
const LINE_WIDTH = 1;
const BORDER_WIDTH = 2;

const map = d3.select("#map-holder");

let width;
let height;

let currentTransform = {x: 0, y: 0, k: 1};

const setDimensions = () => {
    width = map.node().getBoundingClientRect().width;
    height = map.node().getBoundingClientRect().height;

    console.log('width = ', width);
}



let topoCountries = undefined;

const projection = d3.geoEquirectangular(); //geoMercator(); 
const path = d3.geoPath().projection(projection);

const zoom = d3.zoom()
    // .scaleExtent([1, 40])
    // .translateExtent([[0,0], [width, height]])
    // .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

let svg;
let g;



const onResize = () => {
    map.select('svg').remove();
    drawMap();
}

const drawMap = () => {
    
    setDimensions();

    svg = map.append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(zoom);

    g = svg.append("g");


    g.selectAll("path")
    .data(topoCountries)
    .enter()
        .append("path")
        .attr("d", path)
        .attr('class', 'land');

    g.append('g')
        .attr('id', 'boundary-group')
        .attr('class', 'boundary')
        .selectAll('boundary')
            .data(topoCountries)
            .enter().append('path')
            .attr('d', path)
            .attr('stroke-width', 1);
}

d3.json("world-atlas-110m.json", function(error, world) {
  if (error) throw error;

    topoCountries = topojson.feature(world, world.objects.countries).features;

    drawMap();

});
    

function zoomed(){

    currentTransform = d3.event.transform;

    g.attr('transform', d3.event.transform);

    // g.attr("transform","translate("+ 
    //     d3.event.transform.x + ", " + d3.event.transform.y + ")scale("+d3.event.transform.k+")");
    g.selectAll(".marker")
        .attr("r", function(){
            return MARKER_RADIUS / d3.event.transform.k;  // radious is inversely proportional to scale
        });
    g.selectAll("line")
        .style("stroke-width", function(){
            return LINE_WIDTH / d3.event.transform.k;  // width is inversely proportional to scale
        });

    g.select('#boundary-group')
        .selectAll('path')
        .attr('stroke-width', BORDER_WIDTH / d3.event.transform.k);


}   
