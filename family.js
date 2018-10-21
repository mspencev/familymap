let geocodes = {}; // Place to lat lon mapping.
const people = []; // unordered list of all the people
const idToIdx = {}; // person ID to index into people
const generations = []; // An array of arrays - index = generation, value = list of people.

const peopleWithoutLocations = {}; // {id: person}

let visibleGenerations = 1;
const defaultNumGens = 4;

const LOCATION_OF_DEATH='location_of_death';
const LOCATION_OF_CHILD='location_of_child';

const slider = document.getElementById('gen-range');
const sliderTooltip = document.getElementsByClassName('slider-tooltip')[0];
slider.value = defaultNumGens;
sliderTooltip.innerHTML = `${defaultNumGens} generations`; 


slider.addEventListener('input', () => {
    sliderTooltip.innerHTML = `${slider.value} generations`;

    updateSliderTootilp();

    drawFamily();

});


updateSliderTootilp = () => {
    
    var sliderPos = slider.value / slider.max;

    var pixelPostion = (slider.clientWidth * sliderPos) - 50;

    sliderTooltip.style.left = `${pixelPostion}px`;
}

function fetchFamilyTree() {

    console.log('fetching family tree');

    d3.text("https://mspencev.github.io/familymap/family.12gen.orig.json", function(err, text) {
    // d3.json("family.test.json", function (err, json) {
    // d3.text("family.12gen.orig.json", function (err, text) {
    // d3.text("family.test.orignal.txt", function (err, text) {

        json = formatFamilyData(text);
        if (err) {
            console.log("error fetching data: ", err);
            return;
        }
        
        var personIdExp = RegExp('^.{4}-.{3}$');

        // Filter out any funny data, which we have.
        for(id in json) {
            
            const person = json[id];
            idToIdx[id] = people.length;
            people.push(person);
        }
        console.log(" Num People: ", people.length);
        console.log(" Num People w/o locations: ", Object.keys(peopleWithoutLocations).length);

        updateSliderTootilp();

        growGeneration(0, 'KWHY-L6R');

        console.log('fetching geocodes');

        // fetchLocations();
        loadLocations();


        // gotAllResponses().then(() => {
        //     console.log("GOT ALL RESPONDED!");
        //     renderMap();
        // })

        // setTimeout( () => {
        //     if(Object.keys(geocodes).length === 0) {
        //         console.log("Failed to get the geocodes in time");
        //         return;
        //     }
        //     console.log('Rendering lines and markers');

        //     renderLines();
        //     renderMarkers();
        // }, 8000);
        
    });
}

const growGeneration =  (gen, id) => {
    
    if(!generations[gen]) {
        while(!generations[gen]){
            generations.push([]);
        }
    }
    generations[gen].push(id);

    const person = people[idToIdx[id]];

    if (!person.parentIds) {
        return;
    }
    person.parentIds.forEach((parentId) => {
        // IF the parent doesn't have a birth place - make it the same as the childs.
        const parent = people[idToIdx[parentId]];
        if (!parent.birthPlace) {
            if (parent.deathPlace) {
                parent.birthPlace = parent.deathPlace
                parent.locationType = LOCATION_OF_DEATH;
            } else {
                parent.birthPlace = person.birthPlace;
                parent.locationType = LOCATION_OF_CHILD;
            }
        }
        growGeneration(gen + 1, parentId);
    });
}


function loadLocations() {
    d3.text("https://mspencev.github.io/familymap/geocodes.json", function (err, text) {
    // d3.text("geocodes.json", function (err, text) {
        geocodes = JSON.parse(text);

        resolveOverlapLocations();

        drawFamily();
    });

}

const resolveOverlapLocations = () => {
    
    const locCount = {}; // count the number of instances of a particular location
    people.forEach((person) => {
        if(!person.birthPlace) {
            return;
        }

        if(locCount[person.birthPlace]) {
            locCount[person.birthPlace] =+ 1;
            const newLat = geocodes[person.birthPlace].lat + locCount[person.birthPlace] * 0.05;
            const newLon = geocodes[person.birthPlace].lon;

            person.birthPlace = `${person.birthPlace}-${locCount[person.birthPlace]}`;
            geocodes[person.birthPlace] = {'lat': newLat, 'lon': newLon};
        } else {
            locCount[person.birthPlace] = 1;
        }
    });
}

const clearFamily = () => {
    d3.selectAll('.child-parent-line').remove();
    d3.selectAll('.marker').remove();
}

const drawFamily = () => {
    clearFamily();
    renderLines();
    renderMarkers();
    updateCount();
}

let geocodeCalls = 0;
let geocodeResponses = 0;

function fetchLocations() {
    // let geocodeUrl = 'http://www.mapquestapi.com/geocoding/v1/batch?key=zX5pvmcAq3RBuI4WkGpRBHLLcRMnDweB';
    let geocodeUrl = 'http://www.mapquestapi.com/geocoding/v1/batch?key=JIfLGNP9oFfewqidQT28WIzCFuYoUIwe';

    


    let url = geocodeUrl;
    const places = people.filter(function (person) {
        return person && person.birthPlace && person.birthPlace !== '';
    }).map(function(person) {
        return person.birthPlace;
    }).filter(function(place, index, theArray){
        return theArray.indexOf(place) === index; // Make unique
    });

    let cnt = 0;
    places.forEach(function (place, idx) {
        
        url += `&location=${place}`;
        if (idx % 90 === 0 && idx > 0) {
            // Limit of 100 locations for each batch reuqest
            fetchMapquestGeocodes(url);
            url = geocodeUrl; // reset
        }

        cnt = cnt + 1;
    });

    fetchMapquestGeocodes(url);
}

function fetchMapquestGeocodes(url){
    ++geocodeCalls;
    console.log("Made Request!, numcalls=", geocodeCalls, ", url=", url);

    fetch(url)
        .then((response) => {
            return response.json();
        })
        .then((response) => {
            handleMapquestGeocode(response);
        });
}


function handleMapquestGeocode(response) {
    console.log("Got Response!");

    response.results.forEach( (result) => {

        if(!result.locations[0]){
            console.log("Response had no locations");

            return;
        }

        geocodes[result.providedLocation.location] = {
            lat: result.locations[0].latLng.lat,
            lon: result.locations[0].latLng.lng
        };
    });

    geocodeResponses++;
    console.log('geocode responses: ', geocodeResponses);
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
    console.log("got all responses");
    const gotAllPromise = new Promise( (resolve, reject) => {
        let done = geocodeCalls === geocodeResponses;
        while(!done){
            done = geocodeCalls === geocodeResponses;
        }
        resolve();
    })

    return promiseTimeout(1000, gotAllPromise);
}

const updateCount = () => {
    document.getElementById('people-count').innerHTML = document.getElementsByClassName('marker').length;
}

function renderMarkers() {
    const data = [];
    const numGens = parseInt(slider.value) + 1; // + 1 since 1 generation would be two layers of people.

    for(let i = 0; i < numGens; ++i){
        generations[i].forEach((id) => {
            data.push(people[idToIdx[id]]);
        });
    }
    // add circles to group g
    g.selectAll("circle")
        .data(data).enter()
        .append("circle")
        .attr('class', (d) => {
            if(d.gender === 'Male') {
                return 'marker marker-dad'
            } else {
                return 'marker marker-mom'
            }
        })
        .attr("cx", (d) => { 
            const latlon = geocodes[d.birthPlace]; 

            if(!latlon) {
                return projection(0, 0)[0];
            }
            return projection( [latlon.lon, latlon.lat] )[0]; })
        .attr("cy", (d) => { 
            const latlon = geocodes[d.birthPlace];

            if(!latlon) {
                return projection(0, 0)[0];
            }
            return projection( [latlon.lon, latlon.lat])[1]; })
        .attr('r', () => MARKER_RADIUS / currentTransform.k)
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

    g.selectAll(".child-parent-line")
        .data(lines)
        .enter()
            .append("line")
            .attr("x1", function (d) { return d.x1; })
            .attr("y1", function (d) { return d.y1; })
            .attr("x2", function (d) { return d.x2; })
            .attr("y2", function (d) { return d.y2; })
            .attr('stroke-width', () => LINE_WIDTH / currentTransform.k)
            .attr("class", function (d) { return `child-parent-line ${d.isDad ? 'line-dad' : 'line-mom'}`; });
}



function getLines() {
    let lines = [];

    const numGens = parseInt(slider.value);
    for(let i = 0; i < numGens; ++i){
        generations[i].forEach((id) => {
            const person = people[idToIdx[id]];
           
            if(!person.parentIds || !person.parentIds[0]) {
                return;
            }
            
            const parents = [];
            person.parentIds.forEach((id) => {
                parents.push(people[idToIdx[id]] );
            });
    
            parents.forEach( (parent) => {
                if(!parent || !parent.birthPlace || parent.birthPlace === '') {
                    return;
                }
                lines.push(createLine(parent, person));
            });
        });
    }
 
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


window.addEventListener('resize', () =>{
    onResize(); // TODO ugly
    updateSliderTootilp();
    drawFamily();
});


fetchFamilyTree();
