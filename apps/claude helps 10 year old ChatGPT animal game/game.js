let points = 0;
let animalsUnlocked = ["rabbit"];

function playRabbitGame() {
  // Code for the rabbit game will go here
  // If the player wins, give them points
  points += 10;
  
  // Check if they've earned enough points to unlock a new animal
  if (points >= 20 && !animalsUnlocked.includes("bird")) {
    animalsUnlocked.push("bird");
    alert("Congratulations! You've unlocked the bird adventure!");
  }
}
function updateAnimalButtons() {
  let buttonHTML = "";
  for (let animal of animalsUnlocked) {
    buttonHTML += `<button onclick="showFact('${animal}')">${animal}</button>`;
  }
  document.getElementById("animalButtons").innerHTML = buttonHTML;
}
function showFact(animal) {
  alert(animalFacts[animal]);
  location.href = `${animal}.html`;
}
updateAnimalButtons();

let animalFacts = {
  rabbit: "Rabbits are not rodents, they are lagomorphs!",
  bird: "Some birds, like parrots, can learn to mimic human speech!",
  lion: "Lions are the only cats that live in groups, called prides!"
};