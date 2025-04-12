function setBackgroundTheme() {
  const hour = new Date().getHours();
  const body = document.body;

  if (hour >= 6 && hour < 18) {
    body.classList.add("jour");
    body.classList.remove("nuit");
  } else {
    body.classList.add("nuit");
    body.classList.remove("jour");
  }
}

window.onload = () => {
  setBackgroundTheme();
};

let energy = 100;
let mood = "Heureux";

function updateStatus() {
  document.getElementById("energy").textContent = energy;
  document.getElementById("mood").textContent = mood;

  const fill = document.getElementById("energyFill");
  fill.style.width = energy + "%";

  if (energy > 60) {
    fill.style.backgroundColor = "#28a745"; // vert
  } else if (energy > 30) {
    fill.style.backgroundColor = "#ffc107"; // orange
  } else {
    fill.style.backgroundColor = "#dc3545"; // rouge
  }
}

function feed() {
  if (energy < 100) {
    energy += 10;
    if (energy > 100) energy = 100;
    mood = "Content";
  } else {
    mood = "Trop plein !";
  }
  updateStatus();
}

function play() {
  if (energy > 10) {
    energy -= 10;
    mood = "Amusé";
  } else {
    mood = "Fatigué";
  }
  updateStatus();
}

function rest() {
  energy += 20;
  if (energy > 100) energy = 100;
  mood = "Reposé";
  updateStatus();
}

function setName() {
  const input = document.getElementById("nameInput");
  const newName = input.value.trim();
  if (newName !== "") {
    document.getElementById("name").textContent = newName;
    document.getElementById("nameInputSection").style.display = "none";
    document.getElementById("gameSection").style.display = "block";
  } else {
    alert("Donne-lui un vrai nom 😉");
  }
}

// Réduction d'énergie automatique
setInterval(() => {
  energy -= 5;
  if (energy <= 0) {
    energy = 0;
    mood = "Épuisé";
  }
  updateStatus();
}, 5000);
