const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const complimentEl = document.getElementById("compliment");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const startBtn = document.getElementById("start");

const COMPLIMENTS = [
  "Your quacking is simply majestic.",
  "That waddle? Chef's kiss.",
  "You have the aura of a premium bath toy.",
  "Scientists agree: you are extremely buoyant.",
  "Your beak is perfectly aligned. Inspiring.",
  "Honestly, the tacos are lucky to be caught by you.",
  "You float through life with elegance.",
  "Even the lava is impressed.",
  "Your yellow is the best yellow.",
  "Taco-catching genius, spotted in the wild.",
  "You make debugging look easy.",
  "Absolute legend of the bathtub."
];

const DUCK_Y = H - 50;     // vertical position of the duck's center
const DEATH_LAVA = 70;     // lava height that ends the game

let duck, tacos, score, lava, running, spawnTimer, lastTime, complimentTimer, keys;
let best = 0;
try { best = Number(localStorage.getItem("duckBest")) || 0; } catch (e) {}
bestEl.textContent = best;

function reset() {
  duck = { x: W / 2, size: 44 };
  tacos = [];
  score = 0;
  lava = 0;
  spawnTimer = 0;
  keys = {};
  scoreEl.textContent = 0;
}

function showCompliment() {
  complimentEl.textContent = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
}

function startGame() {
  reset();
  running = true;
  overlay.classList.add("hidden");
  showCompliment();
  clearInterval(complimentTimer);
  complimentTimer = setInterval(showCompliment, 4000);
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  clearInterval(complimentTimer);
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    try { localStorage.setItem("duckBest", best); } catch (e) {}
  }
  complimentEl.textContent = "The lava got you, but you were still wonderful.";
  overlayTitle.textContent = "Quack... It's lava 🌋";
  overlayText.innerHTML = "You caught <strong>" + score + "</strong> tacos.";
  startBtn.textContent = "Play again";
  overlay.classList.remove("hidden");
}

function spawnTaco() {
  tacos.push({
    x: 20 + Math.random() * (W - 40),
    y: -20,
    speed: Math.min(130 + score * 4, 320)
  });
}

function update(dt) {
  // Duck movement (keyboard)
  const move = 280 * dt;
  if (keys["ArrowLeft"] || keys["a"]) duck.x -= move;
  if (keys["ArrowRight"] || keys["d"]) duck.x += move;
  duck.x = Math.max(duck.size / 2, Math.min(W - duck.size / 2, duck.x));

  // Spawn tacos, a bit faster as score grows
  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnTaco();
    spawnTimer = Math.max(0.55, 1.2 - score * 0.02);
  }

  // Move tacos, check catches and misses
  for (let i = tacos.length - 1; i >= 0; i--) {
    const t = tacos[i];
    t.y += t.speed * dt;

    const caught =
      Math.abs(t.x - duck.x) < duck.size / 2 + 8 &&
      Math.abs(t.y - DUCK_Y) < duck.size / 2;

    if (caught) {
      tacos.splice(i, 1);
      score++;
      lava = Math.max(0, lava - 3);
      scoreEl.textContent = score;
    } else if (t.y > H - lava) {
      tacos.splice(i, 1);
      lava += 10;
    }
  }

  if (lava >= DEATH_LAVA) endGame();
}

function draw(time) {
  // Background and floor
  ctx.fillStyle = "#87ceeb";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#8d6e63";
  ctx.fillRect(0, H - 20, W, 20);

  // Lava with a wavy top
  if (lava > 0) {
    const top = H - Math.max(lava, 20);
    ctx.fillStyle = "#ff4500";
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 10) {
      ctx.lineTo(x, top + Math.sin(x / 18 + time / 250) * 4);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Tacos
  ctx.font = "30px serif";
  tacos.forEach(t => ctx.fillText("🌮", t.x, t.y));

  // Duck
  ctx.font = duck.size + "px serif";
  ctx.fillText("🦆", duck.x, DUCK_Y);
}

function loop(time) {
  if (!running) return;
  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  update(dt);
  if (running) draw(time);
  if (running) requestAnimationFrame(loop);
}

// Controls
window.addEventListener("keydown", e => {
  keys[e.key] = true;
  if (e.key.startsWith("Arrow")) e.preventDefault();
});
window.addEventListener("keyup", e => { keys[e.key] = false; });

function pointerMove(e) {
  if (!running) return;
  const rect = canvas.getBoundingClientRect();
  duck.x = ((e.clientX - rect.left) / rect.width) * W;
  duck.x = Math.max(duck.size / 2, Math.min(W - duck.size / 2, duck.x));
}
canvas.addEventListener("pointermove", pointerMove);
canvas.addEventListener("pointerdown", pointerMove);

startBtn.addEventListener("click", startGame);

// Draw an initial frame so the canvas isn't blank behind the overlay
reset();
draw(0);
