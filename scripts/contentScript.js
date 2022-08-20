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

function displayCornerPopup(success, diets, ingredientsFailed) {
    /*
    Disclaimer: be very good about setting specific and constant styles throughout all websites,
    set everything to default to not allow different website themes to change box sizes and font-families etc etc
    */
    console.log("Displaying on-website popup");
    //Create outer popup layer with box shadow and overlay in top-right corner
    var div = document.createElement("div");
    div.style.all = "initial";
    div.setAttribute("id", "ingredient-inspector-corner-popup"); //Use this ID to later remove the entire element from the DOM
    div.style.zIndex = 999999; //Set a really high z-index in case the website has popups too (stackoverflow uses numbers in the 8000s!!)
    div.style.position = "fixed";
    div.style.top = 0;
    div.style.right = 0;
    div.style.marginTop = "1em";
    div.style.marginRight = "1em";

    div.style.boxShadow = "0 6px 6px rgba(0, 0, 0, 0.35)";
    //div.style.border = "2px solid black";
    div.style.backgroundColor = "white"; //Set a solid background color so that it actually overlays the website

    //Create a container for all the content inside the popup (make relative for the absolute X button)
    var container = document.createElement("div");
    container.style.position = "relative";
    //container.style.padding = "1.5em";
    container.style.display = "flex"; //Use flex styling for easier formatting of two columns

    //Create internal container for the icon that will rest on the left
    var leftIconContainer = document.createElement("div");
    leftIconContainer.style.margin = "1.5em";
    leftIconContainer.style.display = "flex";
    leftIconContainer.style.flexDirection = "column";
    leftIconContainer.style.justifyContent = "center";
    leftIconContainer.style.alignContent = "center";

    var mainResultIcon = document.createElement("img");
    //Set URL using one-liner ternary operator
    mainResultIcon.src = chrome.runtime.getURL(
        (success) ? "img/mainCheckmarkIcon.svg" : "img/mainFailedIcon.svg"
    );
    mainResultIcon.style.width = "10em";
    mainResultIcon.style.height = "10em";
    leftIconContainer.appendChild(mainResultIcon); //Add icon to left container

    container.appendChild(leftIconContainer); //Add left container to main flexbox container


    //Create interanl container for the information that will rest on the right
    var rightInfoContainer = document.createElement("div");
    rightInfoContainer.style.margin = "1.5em";

    //Create title message that depends on the result
    var resultTitle = document.createElement("h2");
    resultTitle.style.fontSize = "1.5em";
    resultTitle.innerHTML = (success) ? "This recipe meets your diets!" : "This recipe doesn't meet all of your diets :(";
    rightInfoContainer.appendChild(resultTitle);

    //Add horizontal line underneath title message
    var hr = document.createElement("hr");
    rightInfoContainer.appendChild(hr);

    var styles = document.createElement("style");
    styles.innerHTML = `
    ul#ingredient-inspector-corner-popup-dietList {
        list-style: none;
        margin: 0;
        padding-left: 1em;
        text-indent: -1em;
    }
    li.ingredient-inspector-corner-popup-dietListElement {
        padding-left: 1em;
        text-indent: -1em;
    }
    li.ingredient-inspector-corner-popup-successDiet::before {
        display: inline-block;
        background-image: url(${chrome.runtime.getURL("img/miniCheckmarkIcon.svg")});
        background-repeat: no-repeat;
        width: 24px;
        height: 24px;
        content: "";
    }
    li.ingredient-inspector-corner-popup-failedDiet::before {
        display: inline-block;
        background-image: url(${chrome.runtime.getURL("img/miniFailedIcon.svg")});
        background-repeat: no-repeat;
        width: 24px;
        height: 24px;
        content: "";
    }
    `;
    document.head.append(styles);
    //rightInfoContainer.appendChild(styles);

    var ul = document.createElement("ul");
    ul.setAttribute("id", "ingredient-inspector-corner-popup-dietList");
    if (diets.length < 1) {
        var pError = document.createElement("p");
        pError.style.color = "red";
        pError.innerHTML = "There are no selected diets, not sure how we got here, contact the developers, sorry :((";
        rightInfoContainer.appendChild(pError);
    }
    //console.log(diets);
    for (var diet of diets) {
        var li = document.createElement("li");
        li.innerHTML = diet.diet;
        li.classList.add((diet.success) ? "ingredient-inspector-corner-popup-successDiet" : "ingredient-inspector-corner-popup-failedDiet");
        ul.appendChild(li);
    }
    rightInfoContainer.appendChild(ul);

    if (!success) {
        var button = document.createElement("button");
        button.style.all = "initial";
        button.appendChild(document.createTextNode("View failed ingredients..."));
        //Rewrite the onclick in the longer way as to pass parameters :)
        button.addEventListener("click", () => {
            showFullDetailsViewInExtension(success, ingredientsFailed);
        });

        rightInfoContainer.appendChild(button);
    }

    container.appendChild(rightInfoContainer);

    var closeButton = document.createElement("span");
    closeButton.innerHTML = "&times;";

    closeButton.style.position = "absolute";
    closeButton.style.top = "5px";
    closeButton.style.left = "5px";

    closeButton.style.color = "gray";
    closeButton.style.cursor = "pointer";

    closeButton.style.fontSize = "2em";
    closeButton.style.width = "1em";
    closeButton.style.height = "1em";

    closeButton.style.textAlign = "center";

    closeButton.addEventListener("click", () => {
        //close popup, no further questions

    });

    container.appendChild(closeButton);



    div.appendChild(container);


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
                    var diets = message.diets;
                    var ingredientsFailed = message.ingredientsFailed;
                    //Use these two variables when displaying popup on screen
                    displayCornerPopup(success, diets, ingredientsFailed);
                }
                break;
        }
    }
});