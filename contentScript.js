/**
 * This function sends the formatted ingredients array to the
 * background script for further processing
 * @param {Array} ingredients An array of ingredient objects, see RapidAPI example for format
 */
function sendIngredientsToBackgroundScript(ingredients) {
    chrome.runtime.sendMessage({
        from: "contentScript",
        type: "arrayOfIngredients",
        data: ingredients
    });
}

/**
 * This function calls the API using the given URL and passes the
 * formatted ingrdients list onto the next function (cascading like
 * a waterfall)
 * @param {String} url The URL of the current page, gathered from `window.location.href`
 */
function getIngredientsListFromAPI(url) {
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




//We don't gotta wait for the whole page to load, we just need the ingredients list
/******************Use after subscribing to API*******************
//Make a call to API
//Get current page's url
let URL = window.location.href;
getIngredientsListFromAPI(URL); //Make API request
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




function showFullDetailsViewInExtension(success, ingredientsFailed) {
    var cornerPopup = document.querySelector("#ingredient-inspector-corner-popup");
    //TODO: Animate fade away animation onRemove
    cornerPopup.parentNode.removeChild(cornerPopup); //Remove element from DOM
    //Send data to background script where background script will open extension and render correct popuop with info
    chrome.runtime.sendMessage({
        from: "contentScript",
        type: "OpenFullDetailsInExtensionPopup",
        success: success,
        ingredientsFailed: ingredientsFailed
    });
}

function displayCornerPopup(success, ingredientsFailed) {
    /*
    Disclaimer: be very good about setting specific and constant styles throughout all websites,
    set everything to default to not allow different website themes to change box sizes and font-families etc etc
    */
    console.log("Displaing popup");
    var div = document.createElement("div");
    div.setAttribute("id", "ingredient-inspector-corner-popup"); //Use this ID to later remove the entire element from the DOM
    div.style.zIndex = 999999; //Set a really high z-index in case the website has popups too (stackoverflow uses numbers in the 8000s!!)
    div.style.position = "absolute";
    div.style.top = 0;
    div.style.right = 0;
    div.style.border = "2px solid black";
    div.innerHTML = `${success ? "Success" : ("Failed" + ingredientsFailed.join(", "))}<br /><br />`;

    var a = document.createElement("a");
    a.appendChild(document.createTextNode("Show More..."));
    //Rewrite the onclick in the longer way as to pass parameters :)
    a.addEventListener("click", () => {
        showFullDetailsViewInExtension(success, ingredientsFailed);
    });

    div.appendChild(a);
    //TODO: Animate fade in animation onShow
    document.body.appendChild(div);
}

chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
    //Verify type of message
    if (message.from == "backgroundScript") {
        switch (message.type) {
            case "dietaryInspectionResult":
                {
                    console.log("Background script able to classify ingredients");
                    var success = message.success;
                    var ingredientsFailed = message.ingredientsFailed;
                    //Use these two variables when displaying popup on screen
                    displayCornerPopup(success, ingredientsFailed);
                }
                break;
        }
    }
});