var form = document.forms["dietaryRestrictionsSelectionForm"];

function loadDietaryPreferences() {
    chrome.storage.sync.get({
        dietsArray: []
    }, (result) => {
        var dietsArr = result.dietsArray;
        //Populate page with elements of array
        var labels = document.querySelectorAll("label");
        for (var label of labels) {
            //Loop through each label element and match it to the dietsArr before checkmarking and popping from this array
            if (dietsArr.includes(label.innerText)) {
                var id = label.getAttribute("for");
                document.querySelector("#" + id).checked = true;
                var index = dietsArr.indexOf(label.innerText);
                dietsArr.splice(index, 1); //Remove the label from the dietsArr

            }

        }
        //If there are leftover dietary restrictions, they must be custom ones, put them in the textbox
        var textarea = document.querySelector("textarea");
        textarea.value = dietsArr.join(", "); //If array empty, then it is an empty string
    });
}

function saveChanges() {
    //Gather all names into an array
    //First get 
    var checkboxes = document.querySelectorAll("input[type=checkbox]");
    var diets = [];
    for (var checkbox of checkboxes) {
        if (checkbox.checked) {
            //We want the value of the label since that is the one that will be printed on the popup
            diets.push(document.querySelector(`label[for=${checkbox.getAttribute("id")}]`).innerText);
        }
    }
    //Then sort thru all the remaining custom ones
    var textarea = document.querySelector("textarea");
    if (textarea.value.split(",")[0] !== "") {
        diets = diets.concat(textarea.value.split(","));
    }

    chrome.storage.sync.set({
        dietsArray: diets
    }, () => {
        //Changes saved - TODO (!important): Show user
        console.log("Changes saved!");
        console.log(diets);
    });


}

var saveChangesButton = document.querySelector("button#saveChanges");
saveChangesButton.onclick = saveChanges;

loadDietaryPreferences();