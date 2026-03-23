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
let contaminationChance = 0.35;
let fillStep = 1.5;
let roundTime = 30;
let targetZoneHeight = 15;
let currentDifficulty = "easy";

const difficultySettings = {
  easy: {
    contaminationChance: 0.2,
    fillStep: 1.2,
    roundTime: 40,
    targetZoneHeight: 20,
  },
  medium: {
    contaminationChance: 0.35,
    fillStep: 1.5,
    roundTime: 30,
    targetZoneHeight: 15,
  },
  hard: {
    contaminationChance: 0.5,
    fillStep: 1.6,
    roundTime: 24,
    targetZoneHeight: 13,
  },
};

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
const easyBtn = document.getElementById("easyBtn");
const mediumBtn = document.getElementById("mediumBtn");
const hardBtn = document.getElementById("hardBtn");

const instructionsCard = document.getElementById("instructionsCard");
const instructionsText = document.getElementById("instructionsText");
const playArea = document.getElementById("playArea");
const endScreen = document.getElementById("endScreen");
const finalMessage = document.getElementById("finalMessage");
const winPopup = document.getElementById("winPopup");
const closePopupBtn = document.getElementById("closePopupBtn");

const backgroundMusic = document.getElementById("backgroundMusic");
const volumeSlider = document.getElementById("volumeSlider");
const muteBtn = document.getElementById("muteBtn");
const fillingSound = document.getElementById("fillingSound");
const throwAwaySound = document.getElementById("throwAwaySound");

const defaultInstructions =
  "Press and hold the fill button to raise the water level. Release in the blue target zone to score points. Overfill the bottle and you create waste.";

let isMuted = false;

// =============================
// DIFFICULTY SETUP
// =============================
function applyDifficultySettings(mode) {
  const settings = difficultySettings[mode] || difficultySettings.medium;

  contaminationChance = settings.contaminationChance;
  fillStep = settings.fillStep;
  roundTime = settings.roundTime;
  targetZoneHeight = settings.targetZoneHeight;
}

function updateDifficultyButtons() {
  easyBtn.classList.toggle("active", currentDifficulty === "easy");
  mediumBtn.classList.toggle("active", currentDifficulty === "medium");
  hardBtn.classList.toggle("active", currentDifficulty === "hard");

  easyBtn.setAttribute("aria-pressed", String(currentDifficulty === "easy"));
  mediumBtn.setAttribute("aria-pressed", String(currentDifficulty === "medium"));
  hardBtn.setAttribute("aria-pressed", String(currentDifficulty === "hard"));
}

function setDifficulty(mode) {
  if (!difficultySettings[mode]) return;

  currentDifficulty = mode;
  applyDifficultySettings(currentDifficulty);
  updateDifficultyButtons();

  // Hard mode has a different core action, so the fill button is disabled.
  if (currentDifficulty === "hard") {
    fillBtn.disabled = true;
    fillBtn.textContent = "Hard Mode: Use Waste Dump";
    instructionsText.textContent = "Fill the waste dump with water bottles to win!";
  } else {
    fillBtn.disabled = false;
    fillBtn.textContent = "Hold to Fill";
    instructionsText.textContent = defaultInstructions;
  }

  if (!gameActive) {
    timeLeft = roundTime;
    timerDisplay.textContent = timeLeft;
  }
}

// =============================
// START GAME
// =============================
function startGame() {
  // Keep music playing during game
  if (backgroundMusic && !isMuted) {
    backgroundMusic.currentTime = 0;
    backgroundMusic.play().catch(err => {
      console.log("Could not play music: " + err);
    });
  }
  clearInterval(timerInterval);
  clearInterval(fillInterval);
  hideWinPopup();
  resetContaminationStep();

  score = 0;
  timeLeft = roundTime;
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

  if (currentDifficulty === "hard") {
    waitingForTrashDrop = true;
    trashBottle.classList.remove("hidden");
    wasteDump.classList.add("ready");
    fillBtn.disabled = true;
    fillBtn.textContent = "Hard Mode: Use Waste Dump";
    feedback.textContent = "Hard mode: drag bottles into the waste dump as fast as you can.";
  } else {
    feedback.textContent = "Press and hold the button to fill the bottle.";
  }

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
  let isWinner = bottlesCompleted > waste;

  // Always stop the fill loop sound when a round ends.
  if (fillingSound) {
    fillingSound.pause();
    fillingSound.currentTime = 0;
  }

  if (throwAwaySound) {
    throwAwaySound.pause();
    throwAwaySound.currentTime = 0;
  }

  // Hard mode has a different objective: create more waste than filled bottles.
  if (currentDifficulty === "hard") {
    isWinner = waste > bottlesCompleted;
  }

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

    // Stop filling sound
    if (fillingSound) {
      fillingSound.pause();
    }
    if (throwAwaySound) {
      throwAwaySound.pause();
      throwAwaySound.currentTime = 0;
    }
  clearInterval(timerInterval);
  clearInterval(fillInterval);
  hideWinPopup();
  resetContaminationStep();

  score = 0;
  timeLeft = roundTime;
  bottlesCompleted = 0;
  waste = 0;
  fillLevel = 0;
  isFilling = false;
  gameActive = false;

  updateHUD();
  resetBottle();
  setRandomTargetZone();

  feedback.textContent = "Press and hold the button to fill the bottle.";
  fillBtn.textContent = currentDifficulty === "hard"
    ? "Hard Mode: Use Waste Dump"
    : "Hold to Fill";

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
  const zoneHeight = targetZoneHeight;
  const minBottom = 20;
  const maxBottom = 100 - zoneHeight;

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
  // Easy uses one simple chance value.
  if (currentDifficulty === "easy") {
    return Math.random() < contaminationChance;
  }

  // Medium and Hard use a random chance range each bottle,
  // so contamination stays unpredictable.
  let randomChance = contaminationChance;

  if (currentDifficulty === "medium") {
    randomChance = 0.25 + Math.random() * 0.2;
  }

  if (currentDifficulty === "hard") {
    randomChance = 0.28 + Math.random() * 0.18;
  }

  return Math.random() < randomChance;
}

function handleTrashDrop() {
  if (!waitingForTrashDrop) return;

  // Hard mode is a different challenge: throw as many bottles as possible.
  if (currentDifficulty === "hard") {
    if (throwAwaySound && !isMuted) {
      throwAwaySound.currentTime = 0;
      throwAwaySound.play().catch(() => {});
    }

    waste += 1;
    score += 5;
    updateHUD();

    feedback.textContent = `Nice! Bottles dumped: ${waste}`;

    trashBottle.classList.add("hidden");
    setTimeout(() => {
      if (gameActive && currentDifficulty === "hard") {
        trashBottle.classList.remove("hidden");
      }
    }, 180);
    return;
  }

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
  if (!gameActive || isFilling || waitingForTrashDrop || currentDifficulty === "hard") return;

  isFilling = true;

  // Play filling sound
  if (fillingSound && !isMuted) {
    fillingSound.currentTime = 0;
    fillingSound.play().catch(err => {});
  }

  fillInterval = setInterval(() => {
    fillLevel += fillStep;

    if (fillLevel >= 100) {
      fillLevel = 100;
      waterFill.style.height = `${fillLevel}%`;

      clearInterval(fillInterval);
      isFilling = false;
      if (fillingSound) {
        fillingSound.pause();
      }
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

  // Stop filling sound
  if (fillingSound) {
    fillingSound.pause();
  }

  handleFillResult();
}

// =============================
// CHECK RESULT
// Check if fill level lands in the current random target zone.
// =============================
function handleFillResult() {
  if (currentDifficulty === "hard") {
    return;
  }

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
// SOUND CONTROLS
// =============================
function updateVolume() {
  if (backgroundMusic) {
    backgroundMusic.volume = volumeSlider.value / 100;
  }
}

function toggleMute() {
  isMuted = !isMuted;

  if (isMuted) {
    if (backgroundMusic) {
      backgroundMusic.muted = true;
    }
    muteBtn.textContent = "🔇";
    muteBtn.classList.add("muted");
  } else {
    if (backgroundMusic) {
      backgroundMusic.muted = false;
      // Try to play in case it was paused
      backgroundMusic.play().catch(err => {});
    }
    muteBtn.textContent = "🔊";
    muteBtn.classList.remove("muted");
  }
}

// =============================
// EVENT LISTENERS
// =============================
setDifficulty("easy");

// Initialize background music
if (backgroundMusic) {
  backgroundMusic.volume = 0.7;
  backgroundMusic.muted = false;
  
  // Try to play music when menu first appears
  backgroundMusic.play().catch(err => {
    console.log("Autoplay blocked by browser - user must interact first");
  });
} else {
  console.warn("Audio element not found - check that backgroundMusic ID exists");
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", startGame);
homeBtn.addEventListener("click", goHome);
closePopupBtn.addEventListener("click", hideWinPopup);
easyBtn.addEventListener("click", () => setDifficulty("easy"));
mediumBtn.addEventListener("click", () => setDifficulty("medium"));
hardBtn.addEventListener("click", () => setDifficulty("hard"));

// Sound control event listeners
volumeSlider.addEventListener("input", updateVolume);
muteBtn.addEventListener("click", toggleMute);

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
