const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const coinCountEl = document.getElementById('coinCount');
const goalStatusEl = document.getElementById('goalStatus');
const messagePanel = document.getElementById('messagePanel');
const startButton = document.getElementById('startButton');

const WORLD_WIDTH = 5000;
const VIEW_WIDTH = canvas.width;
const VIEW_HEIGHT = canvas.height;

const keys = {
  left: false,
  right: false,
  jump: false,
};

const world = {
  platforms: [],
  coins: [],
  spikes: [],
  goal: null,
};

const player = {
  x: 80,
  y: 360,
  w: 34,
  h: 52,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
  jumps: 0,
  jumpBuffer: 0,
  coyote: 0,
  invulnerable: 0,
  color: '#1e293b',
};

let cameraX = 0;
let score = 0;
let started = false;
let won = false;
let time = 0;

function buildLevel() {
  world.platforms = [
    { x: -20, y: 470, w: 320, h: 80 },
    { x: 350, y: 470, w: 360, h: 80 },
    { x: 820, y: 470, w: 380, h: 80 },
    { x: 1310, y: 470, w: 430, h: 80 },
    { x: 1790, y: 470, w: 420, h: 80 },
    { x: 2280, y: 470, w: 500, h: 80 },
    { x: 2870, y: 470, w: 430, h: 80 },
    { x: 3400, y: 470, w: 560, h: 80 },
    { x: 4050, y: 470, w: 950, h: 80 },

    { x: 420, y: 390, w: 140, h: 20 },
    { x: 630, y: 330, w: 120, h: 20 },
    { x: 980, y: 360, w: 120, h: 20 },
    { x: 1160, y: 300, w: 140, h: 20 },
    { x: 1500, y: 360, w: 130, h: 20 },
    { x: 1710, y: 300, w: 140, h: 20 },
    { x: 2050, y: 360, w: 140, h: 20 },
    { x: 2520, y: 340, w: 150, h: 20 },
    { x: 2740, y: 275, w: 130, h: 20 },
    { x: 3090, y: 340, w: 140, h: 20 },
    { x: 3305, y: 285, w: 120, h: 20 },
    { x: 3660, y: 340, w: 170, h: 20 },
    { x: 3920, y: 285, w: 120, h: 20 },
    { x: 4350, y: 370, w: 150, h: 20 },
    { x: 4570, y: 300, w: 150, h: 20 },
  ];

  world.spikes = [
    { x: 300, y: 446, w: 36, h: 24 },
    { x: 740, y: 446, w: 70, h: 24 },
    { x: 1220, y: 446, w: 52, h: 24 },
    { x: 1660, y: 446, w: 52, h: 24 },
    { x: 2200, y: 446, w: 56, h: 24 },
    { x: 2800, y: 446, w: 44, h: 24 },
    { x: 3450, y: 446, w: 46, h: 24 },
    { x: 4220, y: 446, w: 80, h: 24 },
  ];

  world.coins = [
    { x: 470, y: 350, r: 10, collected: false },
    { x: 680, y: 290, r: 10, collected: false },
    { x: 1020, y: 320, r: 10, collected: false },
    { x: 1215, y: 260, r: 10, collected: false },
    { x: 1560, y: 320, r: 10, collected: false },
    { x: 1770, y: 260, r: 10, collected: false },
    { x: 2110, y: 320, r: 10, collected: false },
    { x: 2575, y: 300, r: 10, collected: false },
    { x: 2790, y: 235, r: 10, collected: false },
    { x: 3160, y: 300, r: 10, collected: false },
    { x: 3350, y: 245, r: 10, collected: false },
    { x: 3725, y: 300, r: 10, collected: false },
    { x: 3965, y: 245, r: 10, collected: false },
    { x: 4405, y: 330, r: 10, collected: false },
    { x: 4640, y: 260, r: 10, collected: false },
  ];

  world.goal = { x: 4870, y: 350, w: 32, h: 120 };
}

function resetGame() {
  buildLevel();
  player.x = 80;
  player.y = 360;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.facing = 1;
  player.jumps = 0;
  player.jumpBuffer = 0;
  player.coyote = 0;
  player.invulnerable = 0;
  cameraX = 0;
  score = 0;
  won = false;
  time = 0;
  updateHud();
}

function startGame() {
  resetGame();
  started = true;
  messagePanel.classList.add('hidden');
}

function updateHud() {
  coinCountEl.textContent = score;
  goalStatusEl.textContent = won ? 'Sí' : 'No';
}

function handleInput() {
  if (keys.left) player.vx -= 0.72;
  if (keys.right) player.vx += 0.72;

  if (!keys.left && !keys.right) {
    player.vx *= 0.82;
    if (Math.abs(player.vx) < 0.05) player.vx = 0;
  }

  if (keys.left && !keys.right) player.facing = -1;
  if (keys.right && !keys.left) player.facing = 1;

  if (keys.jump) {
    player.jumpBuffer = 0.12;
  }
}

function handleJump() {
  if (player.jumpBuffer > 0 && (player.onGround || player.coyote > 0)) {
    player.vy = -12.3;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
  }
}

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function handleCollisions() {
  const prevX = player.x;
  const prevY = player.y;

  player.x += player.vx;
  for (const platform of world.platforms) {
    if (!rectsIntersect(player, platform)) continue;
    if (prevX + player.w <= platform.x + 6 && player.vx > 0) {
      player.x = platform.x - player.w;
      player.vx = 0;
    } else if (prevX >= platform.x + platform.w - 6 && player.vx < 0) {
      player.x = platform.x + platform.w;
      player.vx = 0;
    }
  }

  player.y += player.vy;
  player.onGround = false;
  for (const platform of world.platforms) {
    if (!rectsIntersect(player, platform)) continue;
    if (prevY + player.h <= platform.y + 10 && player.vy >= 0) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.onGround = true;
    } else if (prevY >= platform.y + platform.h - 10 && player.vy < 0) {
      player.y = platform.y + platform.h;
      player.vy = 0;
    }
  }

  if (player.y > VIEW_HEIGHT + 200) {
    resetGame();
  }
}

function collectCoins() {
  for (const coin of world.coins) {
    if (coin.collected) continue;
    const dx = player.x + player.w / 2 - coin.x;
    const dy = player.y + player.h / 2 - coin.y;
    if (Math.hypot(dx, dy) < 24) {
      coin.collected = true;
      score += 1;
      updateHud();
    }
  }
}

function checkSpikes() {
  for (const spike of world.spikes) {
    if (rectsIntersect(player, spike)) {
      resetGame();
      return;
    }
  }
}

function checkGoal() {
  if (rectsIntersect(player, world.goal)) {
    won = true;
    updateHud();
    messagePanel.classList.remove('hidden');
    messagePanel.innerHTML = `
      <div>
        <h1>¡Objetivo cumplido!</h1>
        <p>Recogiste <strong>${score}</strong> monedas.</p>
        <p>Presiona empezar para volver a jugar.</p>
        <button id="restartButton">Jugar otra vez</button>
      </div>
    `;
    document.getElementById('restartButton').addEventListener('click', () => {
      startGame();
    });
    started = false;
  }
}

function updatePlayer(dt) {
  player.vy += 0.52 * dt;
  player.vx = Math.max(-6.2, Math.min(6.2, player.vx));

  if (!player.onGround) {
    player.coyote = Math.max(0, player.coyote - dt);
  } else {
    player.coyote = 0.12;
  }

  if (player.jumpBuffer > 0) {
    player.jumpBuffer -= dt;
  }

  handleInput();
  handleJump();
  handleCollisions();

  if (player.onGround) {
    player.jumps = 0;
  }

  collectCoins();
  checkSpikes();
  checkGoal();
}

function updateCamera() {
  cameraX = Math.max(0, Math.min(player.x - VIEW_WIDTH * 0.35, WORLD_WIDTH - VIEW_WIDTH));
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  sky.addColorStop(0, '#7dd3fc');
  sky.addColorStop(0.5, '#dbeafe');
  sky.addColorStop(1, '#f0f9ff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  for (let i = 0; i < 24; i++) {
    const x = ((i * 173) - cameraX * 0.25) % (VIEW_WIDTH + 120);
    const y = 40 + (i % 6) * 28;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(x, y, 4, 4);
  }

  ctx.fillStyle = '#bfdbfe';
  for (let i = 0; i < 8; i++) {
    const hillX = (i * 220) - (cameraX * 0.4) % 220;
    ctx.beginPath();
    ctx.moveTo(hillX, VIEW_HEIGHT);
    ctx.quadraticCurveTo(hillX + 85, VIEW_HEIGHT - 120, hillX + 170, VIEW_HEIGHT);
    ctx.fill();
  }
}

function drawPlatforms() {
  for (const platform of world.platforms) {
    const x = platform.x - cameraX;
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(x, platform.y, platform.w, platform.h);
    ctx.fillStyle = '#93c5fd';
    ctx.fillRect(x, platform.y, platform.w, 6);
  }
}

function drawCoins() {
  for (const coin of world.coins) {
    if (coin.collected) continue;
    const x = coin.x - cameraX;
    ctx.beginPath();
    ctx.fillStyle = '#fbbf24';
    ctx.arc(x, coin.y, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x - 3, coin.y - 2, 6, 4);
  }
}

function drawSpikes() {
  for (const spike of world.spikes) {
    const x = spike.x - cameraX;
    ctx.fillStyle = '#ef4444';
    const triW = spike.w / 3;
    for (let i = 0; i < 3; i++) {
      const sx = x + i * triW;
      ctx.beginPath();
      ctx.moveTo(sx, spike.y + spike.h);
      ctx.lineTo(sx + triW / 2, spike.y);
      ctx.lineTo(sx + triW, spike.y + spike.h);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawGoal() {
  const goal = world.goal;
  const x = goal.x - cameraX;
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(x, goal.y, goal.w, goal.h);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(x + 8, goal.y + 18, 16, 70);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(x + 24, goal.y + 18, 58, 34);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('FIN', x + 26, goal.y + 40);
}

function drawPlayer() {
  const x = player.x - cameraX;
  ctx.fillStyle = player.invulnerable > 0 && Math.floor(player.invulnerable * 15) % 2 === 0 ? '#fca5a5' : '#1f2937';
  ctx.fillRect(x, player.y, player.w, player.h);
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(x + (player.facing === 1 ? player.w - 8 : 0), player.y + 10, 8, 10);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x + 8, player.y + 14, 7, 7);
  ctx.fillRect(x + player.w - 15, player.y + 14, 7, 7);
}

function drawHudText() {
  ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
  ctx.fillRect(10, 10, 230, 56);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px Arial';
  ctx.fillText(`Monedas: ${score}`, 24, 34);
  ctx.fillText(`Meta: ${won ? 'Sí' : 'No'}`, 24, 56);
}

function render() {
  drawBackground();
  drawPlatforms();
  drawSpikes();
  drawCoins();
  drawGoal();
  drawPlayer();
  drawHudText();
}

function gameLoop(ts) {
  const dt = Math.min(1.5, (ts - (gameLoop.lastTs || ts)) / 16.67 || 1);
  gameLoop.lastTs = ts;

  if (started && !won) {
    time += dt;
    updatePlayer(dt);
    updateCamera();
  }

  render();
  requestAnimationFrame(gameLoop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'a' || key === 'arrowleft') keys.left = true;
  if (key === 'd' || key === 'arrowright') keys.right = true;
  if (key === ' ' || key === 'arrowup' || key === 'w') {
    event.preventDefault();
    keys.jump = true;
  }
});

window.addEventListener('keyup', (event) => {
  const key = event.key.toLowerCase();

  if (key === 'a' || key === 'arrowleft') keys.left = false;
  if (key === 'd' || key === 'arrowright') keys.right = false;
  if (key === ' ' || key === 'arrowup' || key === 'w') keys.jump = false;
});

startButton.addEventListener('click', () => {
  startGame();
});

resetGame();
updateHud();
requestAnimationFrame(gameLoop);
