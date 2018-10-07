'use strict';

/**
 * 
 * @param 
 * Sample data:
 * "LJMQ-LWZ
    :
    "{"name":"Donald Lee Vickers","gender":"Male","lifespan":"Living","familiesAsParent":[],"id":"LJMQ-LWZ","flags":16,"parentIds":["KWC7-76D","KWC7-766"]}"
    KWHY-L6R
    :
    "{"name":"Mark Spencer Vickers","gender":"Male","lifespan":"1979-Living","birthDate":"2 May 1979","birthPlace":"Hayward, Alameda, California, United States","ascendancyNumber":"1","descendancyNumber":"1","familiesAsParent":[{"parent1":{"resource":"#KWHY-L6R","resourceId":"KWHY-L6R"},"parent2":{"resource":"#LJMQ-LS4","resourceId":"LJMQ-LS4"},"children":[{"resource":"#LJMQ-2TW","resourceId":"LJMQ-2TW"},{"resource":"#LJMQ-LMG","resourceId":"LJMQ-LMG"},{"resource":"#LJMQ-L77","resourceId":"LJMQ-L77"}]}],"familiesAsChild":[{"parent1":{"resource":"#LJMQ-LWZ","resourceId":"LJMQ-LWZ"},"parent2":{"resource":"#LJMQ-L3G","resourceId":"LJMQ-L3G"},"children":[{"resource":"#KWHY-L6R","resourceId":"KWHY-L6R"}]}],"id":"KWHY-L6R","flags":16,"parentIds":["LJMQ-LWZ","LJMQ-L3G"]}"
    KWC7-76D}"" 
 */
function formatFamilyData(data){
    console.log("formatting data");
    const obj = {};
    var personIdExp = RegExp('^.{4}-.{3}$');

    var tokens = data.split('\n');
    for(var i = 0; i < tokens.length; i+=3){
        let key = tokens[i];
        if(!personIdExp.test(key)){
            console.log("Unexpected token: ", key);
            continue;
        }

        let value = JSON.parse(tokens[i+2].replace('"{', '{').replace('}"', '}'))
        obj[key] = value;
    }

    return obj;
};



