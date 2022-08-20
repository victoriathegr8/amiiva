//Send ingredients to the background script for processsing
function sendIngredientsToBackgroundScript(ingredients) {
    chrome.runtime.sendMessage({
        message: ingredients
    });
}

function getRecipesListFromAPI(url) {
    //Call http request to API with current url
    var fetchURL = `https://recipe-ingredients-extractor.p.rapidapi.com/extract?url=${encodeURIComponent(url)}`;
    fetch(fetchURL, {
            method: 'GET',
            headers: {
                "X-Rapidapi-Key": "RAPIDAPI-KEY-GOES-HERE", //TODO: add api key here
                "X-RapidAPI-Host": "recipe-ingredients-extractor.p.rapidapi.com"
            }
        })
        .then((data) => data.json()) //Convert result to JSON
        .then((result) => {
            //Get array of ingredients
            var ingredients = result["data"]["recipeIngredient"];
            sendIngredientsToBackgroundScript(ingredients);
        });
}

//Run script when the page has loaded
document.addEventListener("DOMContentLoaded", () => {
    /******************Use after subscribing to API*******************
    //Make a call to API
    //Get current page's url
    let URL = window.location.href;
    getRecipesListFromAPI(URL); //Make API request
    ******************************************************************/

    //Use already formatted example data for testing purposes
    var ingredients = [
        { label: "plain flour", unit_measure: "g", quantity: 140 },
        { label: "eggs", quantity: 3 },
        { label: "milk", unit_measure: "ml", quantity: 300 },
        { label: "Dijon mustard", unit_measure: "teaspoon", quantity: 2 },
        { label: "vegetable oil", unit_measure: "tablespoon", quantity: 2 },
        { label: "Cumberland sausages", quantity: 8 },
        { label: "sage leaves", quantity: 8 },
        { label: "rosemary sprigs", quantity: 4 }
    ];
    sendIngredientsToBackgroundScript(ingredients);

});