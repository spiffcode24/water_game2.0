// Log a message to the console to ensure the script is linked correctly
console.log('JavaScript file is linked correctly.');

// =============================
// GAME STATE
// =============================
let score = 0;
let timeLeft = 30;
let bottlesCompleted = 0;
let waste = 0;
let fillLevel = 0;
let isFilling = false;
let gameActive = false;
let targetMin = 80;
let targetMax = 95;
let waitingForTrashDrop = false;

const contaminationChance = 0.35;

let fillInterval = null;
let timerInterval = null;

// =============================
// DOM ELEMENTS
// =============================
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const bottlesDisplay = document.getElementById("bottles");
const wasteDisplay = document.getElementById("waste");
const feedback = document.getElementById("feedback");
const waterFill = document.getElementById("waterFill");
const targetZone = document.querySelector(".target-zone");
const wasteDump = document.getElementById("wasteDump");
const trashBottle = document.getElementById("trashBottle");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const fillBtn = document.getElementById("fillBtn");
const resetBtn = document.getElementById("resetBtn");
const homeBtn = document.getElementById("homeBtn");

const instructionsCard = document.getElementById("instructionsCard");
const playArea = document.getElementById("playArea");
const endScreen = document.getElementById("endScreen");
const finalMessage = document.getElementById("finalMessage");
const winPopup = document.getElementById("winPopup");
const closePopupBtn = document.getElementById("closePopupBtn");

// =============================
// START GAME
// =============================
function startGame() {
  clearInterval(timerInterval);
  clearInterval(fillInterval);
  hideWinPopup();
  resetContaminationStep();

  score = 0;
  timeLeft = 30;
  bottlesCompleted = 0;
  waste = 0;
  fillLevel = 0;
  isFilling = false;
  gameActive = true;

  updateHUD();
  resetBottle();
  setRandomTargetZone();

  instructionsCard.classList.add("hidden");
  endScreen.classList.add("hidden");
  playArea.classList.remove("hidden");

  feedback.textContent = "Press and hold the button to fill the bottle.";

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

// =============================
// END GAME
// =============================
function endGame() {
  gameActive = false;
  isFilling = false;
  const isWinner = bottlesCompleted > waste;

  clearInterval(timerInterval);
  clearInterval(fillInterval);
  resetContaminationStep();

  playArea.classList.add("hidden");
  endScreen.classList.remove("hidden");

  finalMessage.textContent =
    `Final Score: ${score} | Bottles Filled: ${bottlesCompleted} | Waste: ${waste}`;

  if (isWinner) {
    // Small delay makes sure the round complete screen appears before the popup.
    setTimeout(() => {
      showWinPopup();
    }, 120);
  }
}

// =============================
// GO HOME
// Return to the instructions screen from any game state.
// =============================
function goHome() {
  clearInterval(timerInterval);
  clearInterval(fillInterval);
  hideWinPopup();
  resetContaminationStep();

  score = 0;
  timeLeft = 30;
  bottlesCompleted = 0;
  waste = 0;
  fillLevel = 0;
  isFilling = false;
  gameActive = false;

  updateHUD();
  resetBottle();
  setRandomTargetZone();

  feedback.textContent = "Press and hold the button to fill the bottle.";

  playArea.classList.add("hidden");
  endScreen.classList.add("hidden");
  instructionsCard.classList.remove("hidden");
}

// =============================
// UPDATE HUD
// =============================
function updateHUD() {
  scoreDisplay.textContent = score;
  timerDisplay.textContent = timeLeft;
  bottlesDisplay.textContent = bottlesCompleted;
  wasteDisplay.textContent = waste;
}

// =============================
// RESET BOTTLE
// =============================
function resetBottle() {
  fillLevel = 0;
  waterFill.style.height = "0%";
}

// Move the target zone to a random vertical position each round.
// This keeps the game fresh and makes the player adjust their timing.
function setRandomTargetZone() {
  const zoneHeight = 15;
  const minBottom = 20;
  const maxBottom = 85;

  targetMin = Math.floor(Math.random() * (maxBottom - minBottom + 1)) + minBottom;
  targetMax = targetMin + zoneHeight;

  targetZone.style.bottom = `${targetMin}%`;
}

function showWinPopup() {
  winPopup.classList.remove("hidden");
}

function hideWinPopup() {
  winPopup.classList.add("hidden");
}

function showContaminatedBottleTask() {
  waitingForTrashDrop = true;
  trashBottle.classList.remove("hidden");
  wasteDump.classList.add("ready");
  fillBtn.disabled = true;
}

function resetContaminationStep() {
  waitingForTrashDrop = false;
  trashBottle.classList.add("hidden");
  wasteDump.classList.remove("ready");
  fillBtn.disabled = false;
}

function isBottleContaminated() {
  return Math.random() < contaminationChance;
}

function handleTrashDrop() {
  if (!waitingForTrashDrop) return;

  resetContaminationStep();
  waste += 1;
  updateHUD();

  feedback.textContent = "Good save! You trashed the contaminated bottle.";

  setTimeout(() => {
    if (gameActive) {
      resetBottle();
      setRandomTargetZone();
      feedback.textContent = "Press and hold the button to fill the next bottle.";
    }
  }, 650);
}

// =============================
// BEGIN FILLING
// =============================
function startFilling() {
  if (!gameActive || isFilling || waitingForTrashDrop) return;

  isFilling = true;

  fillInterval = setInterval(() => {
    fillLevel += 1.5;

    if (fillLevel >= 100) {
      fillLevel = 100;
      waterFill.style.height = `${fillLevel}%`;

      clearInterval(fillInterval);
      isFilling = false;
      handleFillResult();
      return;
    }

    waterFill.style.height = `${fillLevel}%`;
  }, 50);
}

// =============================
// STOP FILLING
// =============================
function stopFilling() {
  if (!gameActive || !isFilling) return;

  isFilling = false;
  clearInterval(fillInterval);
  handleFillResult();
}

// =============================
// CHECK RESULT
// Check if fill level lands in the current random target zone.
// =============================
function handleFillResult() {
  if (fillLevel >= targetMin && fillLevel <= targetMax) {
    if (isBottleContaminated()) {
      feedback.textContent =
        "Oh no! This bottle is contaminated. Drag it into the waste dump.";
      showContaminatedBottleTask();
    } else {
      score += 10;
      bottlesCompleted += 1;
      feedback.textContent = "Great job! You filled the bottle successfully.";
    }
  } else if (fillLevel > targetMax) {
    waste += 1;
    feedback.textContent = "Too full. You wasted water!";
  } else {
    feedback.textContent = "Not enough water. Try again.";
  }

  updateHUD();

  if (waitingForTrashDrop) {
    return;
  }

  setTimeout(() => {
    if (gameActive) {
      resetBottle();
      setRandomTargetZone();
      feedback.textContent = "Press and hold the button to fill the next bottle.";
    }
  }, 900);
}

// =============================
// EVENT LISTENERS
// =============================
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", startGame);
homeBtn.addEventListener("click", goHome);
closePopupBtn.addEventListener("click", hideWinPopup);

// Drag and drop events for contaminated bottle challenge
trashBottle.addEventListener("dragstart", (event) => {
  if (!waitingForTrashDrop) {
    event.preventDefault();
    return;
  }

  event.dataTransfer.setData("text/plain", "contaminatedBottle");
});

wasteDump.addEventListener("dragover", (event) => {
  if (!waitingForTrashDrop) return;
  event.preventDefault();
});

wasteDump.addEventListener("drop", (event) => {
  if (!waitingForTrashDrop) return;
  event.preventDefault();

  const droppedItem = event.dataTransfer.getData("text/plain");
  if (droppedItem === "contaminatedBottle") {
    handleTrashDrop();
  }
});

// Mouse events
fillBtn.addEventListener("mousedown", startFilling);
fillBtn.addEventListener("mouseup", stopFilling);
fillBtn.addEventListener("mouseleave", stopFilling);

// Touch events for mobile
fillBtn.addEventListener("touchstart", (event) => {
  event.preventDefault();
  startFilling();
});

fillBtn.addEventListener("touchend", (event) => {
  event.preventDefault();
  stopFilling();
});
