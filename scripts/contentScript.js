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
    // var cornerPopup = document.querySelector("#ingredient-inspector-corner-popup");
    //TODO: Animate fade away animation onRemove
    // cornerPopup.parentNode.removeChild(cornerPopup); //Remove element from DOM
    //Send data to background script where background script will open extension and render correct popuop with info
    // chrome.runtime.sendMessage({
    //     from: "contentScript",
    //     type: "OpenFullDetailsInExtensionPopup",
    //     success: success,
    //     ingredientsFailed: ingredientsFailed
    // });
    let failedDietsElem = document.getElementById("ingredient-inspector-corner-popup-dietList");
    if (failedDietsElem.style.display != "none") {
        failedDietsElem.style.display = "none";
        if (document.getElementById("ingredient-inspector-corner-popup-ingredientList")) {
            document.getElementById("ingredient-inspector-corner-popup-ingredientList").remove();
            document.getElementById("found-ingredients-label").remove();
        }
        let pElem = document.createElement("p");
        pElem.setAttribute("id", "found-ingredients-label");
        pElem.innerHTML = "Found ingredients:";
        pElem.style.marginBottom = "10px"
        document.getElementById("ingredient-inspector-container").appendChild(pElem);
        let ul = document.createElement("ul");
        ul.setAttribute("id", "ingredient-inspector-corner-popup-ingredientList");
        for (var ingredient of ingredientsFailed) {
            var li = document.createElement("li");
            li.innerHTML = ingredient;
            ul.appendChild(li);
        }
        document.getElementById("ingredient-inspector-container").appendChild(ul);
        document.getElementById("ingredient-inspector-container").appendChild(document.getElementById("view-failed-ingredients-button"));
        document.getElementById("view-failed-ingredients-button").innerHTML = "View diets checked";
    }
    else {
        failedDietsElem.style.display = "block";
        document.getElementById("ingredient-inspector-corner-popup-ingredientList").style.display = "none";
        document.getElementById("found-ingredients-label").style.display = "none";
        document.getElementById("view-failed-ingredients-button").innerHTML = "View found ingredients";
    }
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
    container.setAttribute("id", "ingredient-inspector-container");
    container.style.position = "relative";
    container.style.margin = "1em 1.75em 1em 1.75em";

    var mainResultIcon = document.createElement("img");
    //Set URL using one-liner ternary operator
    mainResultIcon.src = chrome.runtime.getURL(
        (success) ? "img/mainCheckmarkIcon.svg" : "img/mainFailedIcon.svg"
    );
    mainResultIcon.style.width = "2em";
    mainResultIcon.style.height = "2em";
    mainResultIcon.style.display = "inline-table";
    mainResultIcon.style.float = "left";
    container.appendChild(mainResultIcon); //Add icon to popup

    //Create title message that depends on the result
    var resultTitle = document.createElement("h2");
    resultTitle.style.fontSize = "1.5em";
    resultTitle.style.display = "table-cell";
    resultTitle.innerHTML = (success) ? "Inspection Passed" : "Inspection Failed!";
    container.appendChild(resultTitle);

    //Add horizontal line underneath title message
    var hr = document.createElement("hr");
    hr.style.border = 0;
    hr.style.height = "1px";
    hr.style.backgroundImage = "linear-gradient(to right, rgba(45, 45, 45, 0.25) 0%, rgba(45, 45, 45, 0.75) 20%, rgba(45, 45, 45, 0.75) 80%, rgba(45, 45, 45, 0.25))";
    hr.style.borderRadius = "50%";
    container.appendChild(hr);

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
        container.appendChild(pError);
    }
    //console.log(diets);
    for (var diet of diets) {
        var li = document.createElement("li");
        li.innerHTML = diet.diet;
        li.classList.add((diet.success) ? "ingredient-inspector-corner-popup-successDiet" : "ingredient-inspector-corner-popup-failedDiet");
        ul.appendChild(li);
    }
    container.appendChild(ul);

    if (!success) {
        var button = document.createElement("button");
        button.setAttribute("id", "view-failed-ingredients-button");
        button.style.all = "initial";
        button.style.textDecoration = "underline";
        button.style.cursor = "pointer";
        button.style.color = "blue";
        button.style.display = "block";
        button.style.margin = "0 auto";
        button.style.marginTop = "0.5em";
        button.appendChild(document.createTextNode("View found ingredients"));
        //Rewrite the onclick in the longer way as to pass parameters :)
        button.addEventListener("click", () => {
            showFullDetailsViewInExtension(success, ingredientsFailed);
        });

        container.appendChild(button);
    }


    var closeButton = document.createElement("span");
    closeButton.innerHTML = "&times;";

    closeButton.style.position = "absolute";
    closeButton.style.top = "-11px";
    closeButton.style.left = "-22px";

    closeButton.style.color = "gray";
    closeButton.style.cursor = "pointer";

    closeButton.style.fontSize = "1.2em";
    //closeButton.style.width = "1em";
    //closeButton.style.height = "1em";

    //closeButton.style.textAlign = "center";

    closeButton.addEventListener("click", () => {
        //close popup, no further questions
        div.style.display = "none";
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