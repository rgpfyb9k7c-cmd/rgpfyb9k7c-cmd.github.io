const API = "https://api.datamuse.com/words";
const ROUND_SECONDS = 60;

const START_WORDS = [
  "cat", "night", "play", "time", "rain", "moon", "bell", "light",
  "ring", "stone", "cake", "snow", "ball", "sea", "bike", "boat",
  "duck", "fun", "star", "tree", "name", "day", "king", "run"
];

const COMPLIMENTS = [
  "Shakespeare would be nervous.",
  "Your vocabulary is extremely buoyant.",
  "That rhyme made the duck gasp.",
  "Poet laureate of the bathtub!",
  "Wow. Just wow. Quack.",
  "Your brain is a premium rubber duck.",
  "Genius detected in the wild.",
  "The dictionary is jealous of you.",
  "That was smoother than warm bath water.",
  "Absolute word wizard."
];

const $ = (id) => document.getElementById(id);
const scoreEl = $("score");
const timeEl = $("time");
const bestEl = $("best");
const complimentEl = $("compliment");
const messageEl = $("message");
const introEl = $("intro");
const playEl = $("play");
const resultsEl = $("results");
const wordEl = $("word");
const formEl = $("form");
const guessEl = $("guess");
const submitBtn = $("submitBtn");
const foundEl = $("found");
const startBtn = $("startBtn");
const againBtn = $("againBtn");
const resultsTitleEl = $("resultsTitle");
const resultsTextEl = $("resultsText");
const missedEl = $("missed");

let rhymes = new Map();   // word -> points
let used = new Set();
let currentWord = "";
let lastWord = "";
let score = 0;
let timeLeft = 0;
let timerId = null;
let playing = false;
let best = 0;

try { best = Number(localStorage.getItem("rhymeDuckBest")) || 0; } catch (e) {}
bestEl.textContent = best;

function setMessage(text) { messageEl.textContent = text; }

function show(panel) {
  [introEl, playEl, resultsEl].forEach((p) => p.classList.add("hidden"));
  panel.classList.remove("hidden");
}

function pickWord() {
  let word;
  do {
    word = START_WORDS[Math.floor(Math.random() * START_WORDS.length)];
  } while (word === lastWord);
  return word;
}

function checkJson(res) {
  if (!res.ok) throw new Error("Bad response");
  return res.json();
}

async function fetchRhymes(word) {
  const w = encodeURIComponent(word);
  const [perfect, near] = await Promise.all([
    fetch(API + "?rel_rhy=" + w + "&max=500").then(checkJson),
    fetch(API + "?rel_nry=" + w + "&max=500").then(checkJson)
  ]);
  const map = new Map();
  near.forEach((item) => map.set(item.word.toLowerCase(), 5));
  perfect.forEach((item) => map.set(item.word.toLowerCase(), 10));
  map.delete(word);
  return map;
}

async function startRound() {
  startBtn.disabled = true;
  againBtn.disabled = true;
  setMessage("Finding a word...");

  try {
    let word, map;
    let tries = 0;
    do {
      word = pickWord();
      map = await fetchRhymes(word);
      tries++;
    } while (map.size < 5 && tries < 3);
    if (map.size < 5) throw new Error("Not enough rhymes");

    currentWord = word;
    lastWord = word;
    rhymes = map;
  } catch (err) {
    setMessage("Couldn't reach the rhyme dictionary. Check your internet and try again.");
    startBtn.disabled = false;
    againBtn.disabled = false;
    startBtn.textContent = "Try again";
    return;
  }

  used = new Set();
  score = 0;
  timeLeft = ROUND_SECONDS;
  playing = true;
  scoreEl.textContent = 0;
  timeEl.textContent = timeLeft;
  wordEl.textContent = currentWord;
  foundEl.innerHTML = "";
  guessEl.value = "";
  guessEl.disabled = false;
  submitBtn.disabled = false;
  complimentEl.textContent = "Go go go! The duck is watching.";
  setMessage("");
  show(playEl);
  guessEl.focus();

  clearInterval(timerId);
  timerId = setInterval(tick, 1000);
}

function tick() {
  timeLeft--;
  timeEl.textContent = timeLeft;
  if (timeLeft <= 0) endRound();
}

function endRound() {
  playing = false;
  clearInterval(timerId);
  guessEl.disabled = true;
  submitBtn.disabled = true;

  if (score > best) {
    best = score;
    bestEl.textContent = best;
    try { localStorage.setItem("rhymeDuckBest", best); } catch (e) {}
    resultsTitleEl.textContent = "New best score!";
  } else {
    resultsTitleEl.textContent = "Time's up!";
  }
  resultsTextEl.textContent =
    "You scored " + score + " points with " + used.size + " rhymes for \"" + currentWord + "\".";

  const missed = [];
  rhymes.forEach((points, word) => {
    if (points === 10 && !used.has(word) && missed.length < 12) missed.push(word);
  });
  missedEl.textContent = missed.length ? missed.join(", ") : "You got them all!";

  complimentEl.textContent = "The duck is proud of you either way.";
  againBtn.disabled = false;
  show(resultsEl);
}

formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!playing) return;

  const guess = guessEl.value.trim().toLowerCase();
  guessEl.value = "";
  if (!guess) return;

  if (guess === currentWord) {
    setMessage("That's the same word!");
  } else if (used.has(guess)) {
    setMessage("You already used \"" + guess + "\".");
  } else if (rhymes.has(guess)) {
    const points = rhymes.get(guess);
    used.add(guess);
    score += points;
    scoreEl.textContent = score;

    const li = document.createElement("li");
    li.textContent = guess;
    if (points === 5) li.className = "near";
    foundEl.appendChild(li);

    setMessage("+" + points + (points === 10 ? " perfect rhyme!" : " near rhyme"));
    complimentEl.textContent = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
  } else {
    setMessage("\"" + guess + "\" isn't in the rhyme book.");
  }
  guessEl.focus();
});

startBtn.addEventListener("click", startRound);
againBtn.addEventListener("click", startRound);
