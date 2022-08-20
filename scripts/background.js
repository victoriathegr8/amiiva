var currentTabID = 0;

//Open the configuration page on install
chrome.runtime.onInstalled.addListener(async() => {
    let url = chrome.runtime.getURL("diet_restriction.html"); //Gets the full URL
    let tab = await chrome.tabs.create({ url }); //Opens the file in a new tab
});



/**
 * This function will send data to the content-script to notify it of the result and
 * what the popup needs to show (whether a green success checkmark or red failure cross)
 * @param {Boolean} success values will be either true|false
 * @param {Array} diets array of objects that specify which diets passed
 *      Example array:
 *      [
 *          {
 *              diet: "vegan",
 *              success: false
 *          },
 *          {
 *              diet: "vegeterian",
 *              success: true
 *          }
 *      ]
 * @param {Array} ingredientsFailed will be an empty array if "success", else list failed ingredients
 */
function sendResultToPopup(success, diets, ingredientsFailed = []) {
    //Get result of scanning ingredients and send it to popup
    chrome.tabs.sendMessage(currentTabID, {
        from: "backgroundScript",
        type: "dietaryInspectionResult",
        success: success,
        diets: diets,
        ingredientsFailed: ingredientsFailed
    });
}



/*
-------------------------------------WARNING:--------------------------------------------
Be very careful of XSS attacks, incoming messages from  content script may be malicious,
avoid uses of `eval`, and be sure to verify that the objects you are dealing with have
the requested properties before accessing them (null-checks)!!!!
*/
chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
    //Store tab globally if it exists
    currentTabID = sender.tab ? sender.tab.id : false;

    if (message.from == "contentScript") {
        switch (message.type) {
            case "arrayOfIngredients":
                {
                    console.log("Ingredients received from API");
                    var ingredientsArray = message.data; //Use array as seen in screenshot on API `About` page
                    //Reminder: Make sure to verify a property exists before accessing it
                    //TODO: Code goes here

                    /*
                    //Test succeeded inspection
                    sendResultToPopup(true, [{
                        diet: "diet #1",
                        success: true
                    },
                    {
                        diet: "diet #2",
                        success: true
                    },
                    {
                        diet: "diet #3",
                        success: true
                    }
                ]); //Testing message sending
                */

                    //Test failed inspection
                    sendResultToPopup(false, [{
                            diet: "diet #1",
                            success: true
                        },
                        {
                            diet: "diet #2",
                            success: false
                        },
                        {
                            diet: "diet #3",
                            success: true
                        }
                    ], ["pizza", "ice cream"]); //Testing message sending
                }
                break;
            case "OpenFullDetailsInExtensionPopup":
                {
                    var success = message.success;
                    var ingredientsFailed = message.ingredientsFailed;
                    //TODO: Show extension popup
                    chrome.action.setPopup({ popup: "popups/detailedPopups.html" });
                    chrome.action.openPopup();
                    //Once popup is open, try to send it data
                    chrome.runtime.sendMessage({
                        from: "backgroundScript",
                        type: "RenderDynamicInfoInExtensionPopup",
                        success: success,
                        ingredientsFailed: ingredientsFailed
                    });
                }
                break;
            default:
                //Do nothing, maybe this will prevent XSS attacks
                break;
        }
    }
});