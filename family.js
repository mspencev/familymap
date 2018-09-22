 const geocodes = {}; // Place to lat lon mapping.
 const people = [];
 const idToIdx = {};

function fetchFamilyTree() {
    console.log('fetching family tree');

    // d3.json("https://mspencev.github.io/d3/map/family/family.json", function(err, json) {
    d3.json("family.test.json", function (err, json) {
    // d3.json("family.12gen.json", function (err, json) {

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

        console.log('fetching geocodes');

        fetchLocations();
        // gotAllResponses().then(() => {
        //     console.log("GOT ALL RESPONDED!");
        //     renderMap();
        // })
        setTimeout( () => {
            if(Object.keys(geocodes).length === 0) {
                console.log("Failed to get the geocodes in time");
                return;
            }
            console.log('Rendering lines and markers');

            renderLines();
            renderMarkers();
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



function renderMarkers() {
    // add circles to svg
    svg.selectAll("circle")
        .data(people).enter()
        .append("circle")
        .attr('class', 'marker')
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
        .attr('class', 'line')
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

fetchFamilyTree();
