const dietsArr = require('./diets.json');
let ingreArr = [];
let ingreLabelArr = [];
let selectedDiets = ["vegan", "halal"];
if (selectedDiets.length > 1) {

}
for (let i = 0; i < ingreArr.length; i++) {
    ingreLabelArr.push(ingreArr[i].label);
}
ingreLabelArr = ["flour", "eggs"]
// let dietIngreArr = dietsArr.filter(function(x) {
//     return x.diet === selectedDiet;
// })
let dietIngreArr = [];
for (let i = 0; i < dietsArr.length; i++) {
    if (selectedDiets.includes(dietsArr[i].diet)) {
        dietIngreArr.push(dietsArr[i].ingredients);
    }
}
console.log(dietIngreArr)
if (dietIngreArr.length == 1) dietIngreArr = dietIngreArr[0];
else dietIngreArr = [].concat.apply([], dietIngreArr);
console.log(dietIngreArr);
let failedIngreArr = [];
let failBool = false;
for (let i = 0; i < ingreLabelArr.length; i++) {
    if (dietIngreArr.includes(ingreLabelArr[i])) {
        failedIngreArr.push(ingreLabelArr[i])
    }
    if (failedIngreArr.length > 0) {
        failBool = true;
    }
}
console.log(failBool);
