var ingredientsArray = [
    { label: "plain flour", unit_measure: "g", quantity: 140 },
    { label: "eggs", quantity: 3 },
    { label: "milk", unit_measure: "ml", quantity: 300 },
    { label: "Dijon mustard", unit_measure: "teaspoon", quantity: 2 },
    { label: "vegetable oil", unit_measure: "tablespoon", quantity: 2 },
    { label: "Cumberland sausages", quantity: 8 },
    { label: "sage leaves", quantity: 8 },
    { label: "rosemary sprigs", quantity: 4 }
];
const dietsArr = require('./diets.json'); //get list of diets
let selectedDiets = ["lactoseIntolerance", "halal", "vegan"]; // TESTING PURPOSES selected diets
let ingreLabelArr = []; // array of ingredient labels taken from API
for (let i = 0; i < ingredientsArray.length; i++) {
    ingreLabelArr.push(ingredientsArray[i].label);
}
let dietIngreArr = []; // array of arrays of diet ingredients
for (let i = 0; i < dietsArr.length; i++) {
    if (selectedDiets.includes(dietsArr[i].diet)) {
        dietIngreArr.push(dietsArr[i].ingredients);
    }
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
console.log(successBool)
let dietStatusArr = []; // param needed to send message for individual successes of diets
for (let i = 0; i < selectedDiets.length; i++) {
    dietStatusArr.push({
        diet: selectedDiets[i],
        success: dietSuccessArr[i]
    })
}
console.log(dietStatusArr)
console.log(failedIngreArr)