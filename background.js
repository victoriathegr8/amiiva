//Open the configuration page on install
chrome.runtime.onInstalled.addListener(async() => {
    let url = chrome.runtime.getURL("diet_restriction.html"); //Gets the full URL
    let tab = await chrome.tabs.create({ url }); //Opens the file in a new tab
});

chrome.runtime.onMessage.addListener(async(message, sender, sendResponse) => {
    var ingredientsArray = message; //Use array as seen in screenshot on API `About` page
});