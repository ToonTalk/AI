const gameWorld = document.querySelector("#gameWorld");
const welcomeScreen = document.querySelector("#welcomeScreen");
const startButton = document.querySelector("#startButton");
const rideButton = document.querySelector("#rideButton");
const rideStep = document.querySelector("#rideStep");
const adventureControls = document.querySelector("#adventureControls");
const party = document.querySelector("#party");
const unicornCharacter = document.querySelector("#unicornCharacter");
const flightSwitch = document.querySelector("#flightSwitch");
const soundButton = document.querySelector("#soundButton");
const speechText = document.querySelector("#speechText");
const speechEmoji = document.querySelector("#speechEmoji");
const statusIcon = document.querySelector("#statusIcon");
const statusText = document.querySelector("#statusText");
const locationLabel = document.querySelector("#locationLabel");
const flowerCount = document.querySelector("#flowerCount");
const questCount = document.querySelector("#questCount");
const friendZone = document.querySelector("#friendZone");
const activityCard = document.querySelector("#activityCard");
const activityKicker = document.querySelector("#activityKicker");
const activityTitle = document.querySelector("#activityTitle");
const activityText = document.querySelector("#activityText");
const activityItems = document.querySelector("#activityItems");
const returnButton = document.querySelector("#returnButton");
const petalLayer = document.querySelector("#petalLayer");
const confettiLayer = document.querySelector("#confettiLayer");
const sparkleField = document.querySelector("#sparkleField");
const celebration = document.querySelector("#celebration");
const keepPlayingButton = document.querySelector("#keepPlayingButton");

const state = {
  started: false,
  riding: false,
  flying: false,
  soundOn: true,
  flowers: 0,
  scene: "meadow",
  traveling: false,
  completed: new Set(),
  celebrationShown: false,
  heldFlower: null,
  babiesFed: 0,
  speechTimer: null,
  utterance: null,
  lastSpoken: "",
  lastSpokenAt: 0,
};

const flowerEmojis = ["🌸", "🌼", "🌷", "🌺", "🌻"];
const flowerPositions = [
  [7, 73], [18, 83], [31, 68], [43, 83], [58, 71], [70, 84], [84, 70], [92, 84],
];

function playTone(notes = [523.25, 659.25, 783.99], duration = 0.12) {
  if (!state.soundOn) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + index * duration * 0.75;
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  });

  window.setTimeout(() => context.close(), 900);
}

function speak(message, { force = false } = {}) {
  if (!state.soundOn || !state.started) return;
  const now = Date.now();
  if (!force && state.lastSpoken === message && now - state.lastSpokenAt < 12000) return;

  state.lastSpoken = message;
  state.lastSpokenAt = now;
  document.documentElement.dataset.lastSpoken = message;
  if (!("speechSynthesis" in window)) return;

  window.clearTimeout(state.speechTimer);
  window.speechSynthesis.cancel();
  state.utterance = null;
  state.speechTimer = window.setTimeout(() => {
    if (!state.soundOn) return;
    const utterance = new SpeechSynthesisUtterance(message);
    const voices = window.speechSynthesis.getVoices();
    const friendlyVoice = voices.find((voice) => voice.lang.startsWith("en") && voice.localService)
      || voices.find((voice) => voice.lang.startsWith("en"));
    if (friendlyVoice) utterance.voice = friendlyVoice;
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 0.95;
    utterance.onend = () => {
      if (state.utterance === utterance) state.utterance = null;
    };
    utterance.onerror = () => {
      if (state.utterance === utterance) state.utterance = null;
    };
    state.utterance = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, 100);
}

function setSpeech(message, emoji = "🦄") {
  speechText.textContent = message;
  speechEmoji.textContent = emoji;
  speak(message);
}

function setStatus(place, message, emoji) {
  locationLabel.textContent = place;
  statusText.textContent = message;
  statusIcon.textContent = emoji;
}

function necklaceMarkup(extraClass = "") {
  return `<span class="necklace-art ${extraClass}" aria-hidden="true">
    <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
  </span>`;
}

function addSparkles() {
  for (let index = 0; index < 18; index += 1) {
    const sparkle = document.createElement("i");
    sparkle.className = "sparkle";
    sparkle.style.left = `${6 + Math.random() * 88}%`;
    sparkle.style.top = `${8 + Math.random() * 62}%`;
    sparkle.style.animationDelay = `${Math.random() * 2.4}s`;
    sparkle.style.animationDuration = `${1.8 + Math.random() * 2.5}s`;
    sparkleField.appendChild(sparkle);
  }
}

function makeFlowers() {
  flowerPositions.forEach(([x, y], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "flower";
    button.setAttribute("aria-label", "Pick a magical flower");
    button.textContent = flowerEmojis[index % flowerEmojis.length];
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.style.animationDelay = `${index * 0.17}s`;
    button.addEventListener("click", () => pickFlower(button));
    gameWorld.appendChild(button);
  });
}

function pickFlower(button) {
  if (button.classList.contains("is-picked")) return;
  button.classList.add("is-picked");
  state.flowers += 1;
  flowerCount.textContent = state.flowers;
  burstPetals(button);
  playTone([659.25, 783.99], 0.1);
  speak("You picked a magical flower!");

  window.setTimeout(() => {
    button.style.left = `${5 + Math.random() * 88}%`;
    button.style.top = `${67 + Math.random() * 19}%`;
    button.classList.remove("is-picked");
  }, 4300);
}

function burstPetals(source) {
  const worldBox = gameWorld.getBoundingClientRect();
  const box = source.getBoundingClientRect();
  const colors = ["#ff78b6", "#ffd85e", "#8dddf0", "#9be49d", "#a77bef"];

  for (let index = 0; index < 12; index += 1) {
    const petal = document.createElement("i");
    const angle = (Math.PI * 2 * index) / 12;
    const distance = 42 + Math.random() * 42;
    petal.className = "petal";
    petal.style.left = `${box.left - worldBox.left + box.width / 2}px`;
    petal.style.top = `${box.top - worldBox.top + box.height / 2}px`;
    petal.style.background = colors[index % colors.length];
    petal.style.setProperty("--petal-x", `${Math.cos(angle) * distance}px`);
    petal.style.setProperty("--petal-y", `${Math.sin(angle) * distance}px`);
    petalLayer.appendChild(petal);
    window.setTimeout(() => petal.remove(), 1300);
  }
}

function confettiParty() {
  const colors = ["#ff6fae", "#ffd557", "#76dce8", "#8be39a", "#9a70e7", "#ff9c62"];

  for (let index = 0; index < 70; index += 1) {
    const bit = document.createElement("i");
    bit.className = "confetti";
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.background = colors[index % colors.length];
    bit.style.animationDelay = `${Math.random() * 0.65}s`;
    bit.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
    confettiLayer.appendChild(bit);
    window.setTimeout(() => bit.remove(), 3600);
  }
}

function startGame() {
  state.started = true;
  welcomeScreen.classList.add("is-closing");
  playTone([523.25, 659.25, 783.99, 1046.5], 0.13);
  speak("Welcome to Rainbow Meadow! Tap climb aboard to ride Starwhisker the unicorn.");
  window.setTimeout(() => {
    welcomeScreen.hidden = true;
    rideButton.focus();
  }, 560);
}

function climbAboard() {
  if (state.riding) return;
  state.riding = true;
  party.classList.add("is-riding");
  rideStep.hidden = true;
  adventureControls.hidden = false;
  setSpeech("Hold on to the moon-silver mane!", "✨");
  setStatus("RAINBOW MEADOW", "Lila is ready to ride!", "🦄");
  playTone([392, 523.25, 659.25, 783.99], 0.12);
  window.setTimeout(() => flightSwitch.focus(), 350);
}

function toggleFlight() {
  state.flying = flightSwitch.checked;
  gameWorld.classList.toggle("is-flying", state.flying);
  if (state.flying) {
    setSpeech("Up, up, and over the rainbow!", "🌈");
    setStatus("CLOUD-HIGH MEADOW", "Flying with rainbow magic!", "☁️");
    playTone([523.25, 659.25, 783.99, 1046.5], 0.1);
  } else {
    setSpeech("Clip-clop! A cozy ride through the flowers.", "🌸");
    setStatus("RAINBOW MEADOW", "A flower-path ride!", "🌼");
    playTone([659.25, 523.25], 0.11);
  }
}

function journeyTo(destination) {
  if (!state.riding || state.traveling || state.scene !== "meadow") return;
  state.traveling = true;
  const destinationName = destination === "lagoon" ? "Pearl Lagoon" : "Twinkle Nursery";
  setSpeech(`${state.flying ? "Soaring" : "Galloping"} to ${destinationName}!`, state.flying ? "☁️" : "✨");
  setStatus("MAGIC TRAIL", `Next stop: ${destinationName}`, "🌈");
  gameWorld.classList.add("is-traveling");
  document.querySelectorAll(".destination-button").forEach((button) => { button.disabled = true; });
  playTone(state.flying ? [392, 523.25, 659.25, 783.99] : [392, 440, 523.25], 0.11);

  window.setTimeout(() => showAdventure(destination), 1150);
}

function showAdventure(destination) {
  state.scene = destination;
  state.traveling = false;
  gameWorld.dataset.scene = destination;
  gameWorld.classList.remove("is-traveling");
  adventureControls.hidden = true;
  activityCard.hidden = false;
  document.querySelectorAll(".flower").forEach((flower) => { flower.hidden = true; });

  if (destination === "lagoon") {
    setStatus("PEARL LAGOON", "Marina has a rainbow surprise!", "🐚");
    friendZone.innerHTML = `
      <div class="friend-card">
        <span class="mermaid-wrap">
          <span class="friend-character" role="img" aria-label="Marina the mermaid">🧜‍♀️</span>
          ${necklaceMarkup("mermaid-necklace")}
        </span>
        <span class="friend-label">“Let’s make a rainbow necklace!”</span>
      </div>`;
    activityKicker.textContent = "A NEW FRIEND!";
    activityTitle.textContent = "Meet Marina";
    activityText.textContent = "Tap every shiny shell for her necklace.";
    buildMagicItems([
      ["🐚", "#ff9e9e"], ["🐚", "#ffc967"], ["🐚", "#fff185"],
      ["🐚", "#8ce09b"], ["🐚", "#7bd6f2"], ["🐚", "#b18bea"],
    ], destination);
    speak("Meet Marina the mermaid. Tap every shiny shell to make her a rainbow necklace.");
  } else {
    setStatus("TWINKLE NURSERY", "Three little unicorns want to play!", "✨");
    friendZone.innerHTML = `
      <div class="friend-card">
        <span class="baby-group" aria-label="Three baby unicorns">
          <button class="baby-unicorn" type="button" data-baby="1" aria-label="Baby unicorn 1" disabled>🦄</button>
          <button class="baby-unicorn" type="button" data-baby="2" aria-label="Baby unicorn 2" disabled>🦄</button>
          <button class="baby-unicorn" type="button" data-baby="3" aria-label="Baby unicorn 3" disabled>🦄</button>
        </span>
        <span class="friend-label">“Flowers are our favorite snack!”</span>
      </div>`;
    activityKicker.textContent = "STARWHISKER’S CHILDREN";
    activityTitle.textContent = "A flower picnic";
    activityText.textContent = "Pick a flower, then tap a little unicorn to feed it.";
    state.heldFlower = null;
    state.babiesFed = 0;
    buildMagicItems([
      ["🌸", "#ffacd3"], ["🌼", "#ffdb72"], ["🌷", "#ab8ef0"],
    ], destination);
    wireBabyUnicorns();
    speak("Meet Starwhisker's children. Pick a flower, then tap a little unicorn to give it a snack.");
  }

  window.setTimeout(() => activityItems.querySelector("button")?.focus(), 400);
}

function buildMagicItems(items, destination) {
  activityItems.replaceChildren();
  items.forEach(([emoji, color], index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "magic-item";
    button.style.setProperty("--item-color", color);
    button.textContent = emoji;
    button.setAttribute("aria-label", destination === "lagoon" ? `Rainbow shell ${index + 1}` : `Pick flower ${index + 1}`);
    button.addEventListener("click", () => {
      if (destination === "lagoon") findMagicItem(button, destination);
      else selectFlower(button);
    });
    activityItems.appendChild(button);
  });
}

function findMagicItem(button, destination) {
  if (button.classList.contains("is-found")) return;
  button.classList.add("is-found");
  burstPetals(button);
  playTone([659.25, 783.99, 1046.5], 0.09);
  const itemsLeft = activityItems.querySelectorAll(".magic-item:not(.is-found)").length;
  const total = activityItems.querySelectorAll(".magic-item").length;
  activityText.textContent = itemsLeft
    ? `${total - itemsLeft} found — ${itemsLeft} to go!`
    : destination === "lagoon"
      ? "The rainbow necklace is sparkling!"
      : "Three happy little unicorns!";

  if (itemsLeft === 0) prepareNecklaceGift();
}

function prepareNecklaceGift() {
  activityKicker.textContent = "NECKLACE READY!";
  activityTitle.textContent = "A rainbow necklace!";
  activityText.textContent = "Now give your necklace to Marina.";
  activityItems.replaceChildren();

  const giftButton = document.createElement("button");
  giftButton.type = "button";
  giftButton.className = "gift-button";
  giftButton.setAttribute("aria-label", "Give necklace to Marina");
  giftButton.innerHTML = `<small>YOU MADE THIS!</small>${necklaceMarkup("necklace-preview")}<strong>Give necklace to Marina</strong>`;
  giftButton.addEventListener("click", () => giveNecklace(giftButton));
  activityItems.appendChild(giftButton);
  speak("The rainbow necklace is ready. Tap it to give it to Marina.");
  giftButton.focus();
}

function giveNecklace(button) {
  if (button.classList.contains("is-given")) return;
  button.classList.add("is-given");
  button.disabled = true;
  friendZone.querySelector(".friend-character")?.classList.add("is-happy");
  friendZone.querySelector(".mermaid-necklace")?.classList.add("is-visible");
  const friendLabel = friendZone.querySelector(".friend-label");
  if (friendLabel) friendLabel.textContent = "“I love my rainbow necklace!”";
  gameWorld.classList.add("necklace-given");
  setStatus("PEARL LAGOON", "Marina is wearing your necklace!", "🌈");
  activityKicker.textContent = "LOOK AT MARINA!";
  activityTitle.textContent = "She’s wearing it!";
  activityText.textContent = "Your necklace moved onto Marina.";
  speak("Marina loves her sparkling rainbow necklace. Thank you!");
  window.setTimeout(() => button.remove(), 500);
  window.setTimeout(() => completeAdventure("lagoon"), 1300);
}

function wireBabyUnicorns() {
  friendZone.querySelectorAll(".baby-unicorn").forEach((baby) => {
    baby.addEventListener("click", () => feedBaby(baby));
  });
}

function selectFlower(button) {
  if (button.classList.contains("is-found")) return;
  if (state.heldFlower) {
    speak("You are already holding a flower. Tap a hungry baby unicorn to feed it.");
    return;
  }

  state.heldFlower = button;
  button.classList.add("is-selected");
  activityItems.querySelectorAll(".magic-item:not(.is-found)").forEach((flower) => {
    flower.disabled = true;
  });
  activityItems.querySelectorAll(".magic-item").forEach((flower) => {
    flower.hidden = flower !== button;
  });

  friendZone.querySelectorAll(".baby-unicorn:not(.is-fed)").forEach((baby) => {
    baby.disabled = false;
    baby.classList.add("is-ready");
    baby.setAttribute("aria-label", `Give ${button.textContent} to baby unicorn ${baby.dataset.baby}`);
  });

  activityText.textContent = "Great! Now tap a hungry little unicorn.";
  showFeedChoices(button);
  burstPetals(button);
  playTone([659.25, 783.99], 0.1);
  speak("You picked a flower. Now tap a hungry baby unicorn to give it the flower.");
}

function showFeedChoices(flower) {
  activityItems.querySelector(".feed-prompt")?.remove();
  const prompt = document.createElement("div");
  prompt.className = "feed-prompt";
  prompt.innerHTML = `<strong>Who gets the ${flower.textContent}?</strong><div class="feed-choice-row"></div>`;
  const row = prompt.querySelector(".feed-choice-row");

  friendZone.querySelectorAll(".baby-unicorn:not(.is-fed)").forEach((baby) => {
    const choice = document.createElement("button");
    choice.type = "button";
    choice.className = "feed-choice";
    choice.setAttribute("aria-label", `Give ${flower.textContent} to baby unicorn ${baby.dataset.baby}`);
    choice.innerHTML = `<span aria-hidden="true">${flower.textContent} → 🦄</span><small>Baby ${baby.dataset.baby}</small>`;
    choice.addEventListener("click", () => feedBaby(baby));
    row.appendChild(choice);
  });

  activityItems.appendChild(prompt);
  window.setTimeout(() => row.querySelector("button")?.focus(), 100);
}

function feedBaby(baby) {
  if (!state.heldFlower || baby.classList.contains("is-fed")) return;

  const flower = state.heldFlower;
  flower.classList.remove("is-selected");
  flower.classList.add("is-found");
  flower.disabled = true;
  state.heldFlower = null;
  state.babiesFed += 1;

  baby.classList.remove("is-ready");
  baby.classList.add("is-fed");
  baby.disabled = true;
  baby.setAttribute("aria-label", `Happy baby unicorn ${baby.dataset.baby} ate a flower`);
  activityItems.querySelector(".feed-prompt")?.remove();
  activityItems.querySelectorAll(".magic-item").forEach((item) => {
    item.hidden = false;
  });
  friendZone.querySelectorAll(".baby-unicorn:not(.is-fed)").forEach((otherBaby) => {
    otherBaby.disabled = true;
    otherBaby.classList.remove("is-ready");
    otherBaby.setAttribute("aria-label", `Baby unicorn ${otherBaby.dataset.baby}`);
  });

  playTone([523.25, 659.25, 783.99], 0.1);
  burstPetals(baby);

  if (state.babiesFed === 3) {
    activityText.textContent = "All three little unicorns had a flower snack!";
    speak("Yum! All three baby unicorns are happy and full.");
    window.setTimeout(() => completeAdventure("nursery"), 400);
  } else {
    activityText.textContent = `Yum! ${state.babiesFed} fed — pick another flower.`;
    activityItems.querySelectorAll(".magic-item:not(.is-found)").forEach((nextFlower) => {
      nextFlower.disabled = false;
    });
    speak("Crunch, crunch! That baby unicorn loved the flower. Pick another flower.");
  }
}

function completeAdventure(destination) {
  state.completed.add(destination);
  questCount.textContent = `${state.completed.size} / 2`;
  const button = document.querySelector(`[data-destination="${destination}"]`);
  button.classList.add("is-complete");
  confettiParty();
  playTone([523.25, 659.25, 783.99, 1046.5, 1318.51], 0.12);

  activityKicker.textContent = "MAGIC COMPLETE!";
  activityTitle.textContent = destination === "lagoon" ? "A rainbow for Marina!" : "Picnic time!";
  activityText.textContent = destination === "lagoon"
    ? "Marina is wearing her sparkling rainbow necklace!"
    : "Every little unicorn enjoyed a flower snack!";
  returnButton.innerHTML = `<span aria-hidden="true">🌈</span> Ride back to the meadow`;
  speak(destination === "lagoon"
    ? "Adventure complete! Marina is wearing her rainbow necklace."
    : "Adventure complete! The baby unicorns loved their flower snacks.");

  if (state.completed.size === 2 && !state.celebrationShown) {
    state.celebrationShown = true;
    window.setTimeout(showCelebration, 950);
  }
}

function returnToMeadow() {
  state.scene = "meadow";
  gameWorld.dataset.scene = "meadow";
  gameWorld.classList.remove("necklace-given");
  activityCard.hidden = true;
  friendZone.replaceChildren();
  adventureControls.hidden = false;
  document.querySelectorAll(".destination-button").forEach((button) => { button.disabled = false; });
  document.querySelectorAll(".flower").forEach((flower) => { flower.hidden = false; });
  returnButton.innerHTML = `<span aria-hidden="true">←</span> Back to the meadow`;
  setStatus(state.flying ? "CLOUD-HIGH MEADOW" : "RAINBOW MEADOW", state.flying ? "Where should we fly next?" : "Where should we ride next?", state.flying ? "☁️" : "🌼");
  setSpeech(state.completed.size === 2 ? "Every friend is smiling! Let’s explore some more." : "Choose another magical adventure!", "🦄");
  window.setTimeout(() => document.querySelector(".destination-button:not(.is-complete)")?.focus(), 300);
}

function showCelebration() {
  celebration.hidden = false;
  confettiParty();
  speak("Hooray! You are a Rainbow Rider. You helped every magical friend!");
  window.setTimeout(() => keepPlayingButton.focus(), 200);
}

function keepPlaying() {
  celebration.hidden = true;
  returnToMeadow();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  if (!state.soundOn) {
    window.clearTimeout(state.speechTimer);
    state.utterance = null;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  soundButton.classList.toggle("is-muted", !state.soundOn);
  soundButton.innerHTML = `<span aria-hidden="true">${state.soundOn ? "🔊" : "🔇"}</span>`;
  soundButton.setAttribute("aria-label", state.soundOn ? "Turn sound off" : "Turn sound on");
  if (state.soundOn) {
    playTone([523.25, 659.25], 0.1);
    speak("Sound and spoken instructions are on.", { force: true });
  }
}

startButton.addEventListener("click", startGame);
rideButton.addEventListener("click", climbAboard);
unicornCharacter.addEventListener("click", () => {
  if (!state.riding) climbAboard();
  else setSpeech("My mane tingles when adventure is near!", "✨");
});
flightSwitch.addEventListener("change", toggleFlight);
soundButton.addEventListener("click", toggleSound);
returnButton.addEventListener("click", returnToMeadow);
keepPlayingButton.addEventListener("click", keepPlaying);
document.querySelectorAll(".destination-button").forEach((button) => {
  button.addEventListener("click", () => journeyTo(button.dataset.destination));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.scene !== "meadow" && celebration.hidden) returnToMeadow();
});

addSparkles();
makeFlowers();
