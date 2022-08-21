var currentTabID = 0;
let dietsJson;
fetch(chrome.runtime.getURL('diets.json')) // get all diets.json data
    .then((resp) => resp.json())
    .then(function (jsonData) {
        dietsJson = jsonData;
    });

//Open the configuration page on install
chrome.runtime.onInstalled.addListener(async() => {
    chrome.storage.sync.get({});
    if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
    } else {
        let url = chrome.runtime.getURL("configMenu.html"); //Gets the full URL
        let tab = await chrome.tabs.create({ url }); //Opens the file in a new tab
    }
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
                    console.log(ingredientsArray);
                    //Reminder: Make sure to verify a property exists before accessing it
                    //TODO: Code goes here

                    function succeed() {
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
                    }

                    function fail() {
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
                    //fail();

                    const dietsArr = dietsJson; //get list of diets
                    let dietNamesArr = []; // list of all diet names
                    for (let i = 0; i < dietsArr.length; i++) {
                        dietNamesArr.push(dietsArr[i].diet)
                    }
                    chrome.storage.sync.get({
                        dietsArray: []
                    }, (result) => {
                        let selectedDiets = result.dietsArray;
                        //Populate page with elements of array
                        //selectedDiets = ["Halal", "Vegetarian", "Dijon mustard"]; // TESTING PURPOSES selected diets
                        let ingreLabelArr = []; // array of ingredient labels taken from API
                        for (let i = 0; i < ingredientsArray.length; i++) {
                            ingreLabelArr.push(ingredientsArray[i].label);
                        }
                        let dietIngreArr = []; // array of arrays of diet ingredients
                        for (let i = 0; i < selectedDiets.length; i++) {
                            if (dietNamesArr.includes(selectedDiets[i])) {
                                let tempObj = dietsArr.filter(x => x.diet == selectedDiets[i])
                                tempObj = tempObj[0];
                                dietIngreArr.push(tempObj.ingredients);
                            } 
                            else dietIngreArr.push([selectedDiets[i]])
                        }
                        let failedIngreArr = []; // array of failed ingredients
                        let dietSuccessArr = []; // array of success bools for each selected diet
                        for (let i = 0; i < dietIngreArr.length; i++) {
                            let tempFailedArr = [];
                            for (let j = 0; j < dietIngreArr[i].length; j++) {
                                if (ingreLabelArr.includes(dietIngreArr[i][j])) tempFailedArr.push(dietIngreArr[i][j])
                            }
                            if (tempFailedArr.length > 0) {
                                dietSuccessArr.push(false);
                                for (let k = 0; k < tempFailedArr.length; k++) {
                                    failedIngreArr.push(tempFailedArr[k])
                                }
                            } else dietSuccessArr.push(true);
                        }
                        let successBool = !(dietSuccessArr.includes(false)); // overall success bool
                        let dietStatusArr = []; // param needed to send message for individual successes of diets
                        for (let i = 0; i < selectedDiets.length; i++) {
                            dietStatusArr.push(
                                {
                                    diet: selectedDiets[i],
                                    success: dietSuccessArr[i]
                                }
                            )
                        }
                        sendResultToPopup(successBool, dietStatusArr, failedIngreArr);
                    });
    
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