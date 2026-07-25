// ==========================================
// FILE: script.js (Game Logic)
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let score = 0;
let gameOver = false;
let gameWon = false;

const keys = {
  left: false,
  right: false,
  up: false
};

const player = {
  x: 50,
  y: 200,
  width: 35,
  height: 45,
  velocityX: 0,
  velocityY: 0,
  speed: 5,
  jumpForce: 12,
  grounded: false,
  facing: 'right'
};

const gravity = 0.6;

const platforms = [
  { x: 0, y: 360, width: 900, height: 40, color: '#c84c0c' },
  { x: 200, y: 270, width: 120, height: 20, color: '#e09000' },
  { x: 400, y: 200, width: 100, height: 20, color: '#e09000' },
  { x: 580, y: 270, width: 120, height: 20, color: '#e09000' }
];

const coins = [
  { x: 230, y: 230, radius: 8, collected: false },
  { x: 270, y: 230, radius: 8, collected: false },
  { x: 440, y: 160, radius: 8, collected: false },
  { x: 610, y: 230, radius: 8, collected: false },
  { x: 650, y: 230, radius: 8, collected: false }
];

const enemies = [
  { x: 300, y: 330, width: 30, height: 30, speed: 2, direction: 1, minX: 200, maxX: 450 },
  { x: 600, y: 330, width: 30, height: 30, speed: 1.5, direction: -1, minX: 500, maxX: 750 }
];

const flag = { x: 730, y: 160, width: 10, height: 200 };

// --- EFEK PEMBUKA / INTRO OVERLAY ---
const startBtn = document.getElementById('startBtn');
const introOverlay = document.getElementById('introOverlay');

startBtn.addEventListener('click', () => {
  introOverlay.style.opacity = '0';
  introOverlay.style.visibility = 'hidden';
});

// --- KEYBOARD CONTROLS (LAPTOP) ---
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = true;
  
  if ((gameOver || gameWon) && (e.code === 'Enter' || e.code === 'Space')) {
    restartGame();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
  if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') keys.up = false;
});

// --- TOUCH CONTROLS (HP) ---
const bindTouch = (id, key) => {
  const btn = document.getElementById(id);
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
  btn.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
  btn.addEventListener('mousedown', () => { keys[key] = true; });
  btn.addEventListener('mouseup', () => { keys[key] = false; });
};

bindTouch('btnLeft', 'left');
bindTouch('btnRight', 'right');
bindTouch('btnJump', 'up');

// Tap Layar Canvas saat Game Over untuk Restart (Khusus HP)
canvas.addEventListener('touchstart', () => {
  if (gameOver || gameWon) restartGame();
});

// --- LOGIKA GAME ---
function updatePlayer() {
  if (gameOver || gameWon) return;

  if (keys.left) {
    player.velocityX = -player.speed;
    player.facing = 'left';
  } else if (keys.right) {
    player.velocityX = player.speed;
    player.facing = 'right';
  } else {
    player.velocityX = 0;
  }

  if (keys.up && player.grounded) {
    player.velocityY = -player.jumpForce;
    player.grounded = false;
  }

  player.velocityY += gravity;
  player.x += player.velocityX;
  player.y += player.velocityY;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;

  player.grounded = false;
  platforms.forEach(plat => {
    if (
      player.x < plat.x + plat.width &&
      player.x + player.width > plat.x &&
      player.y + player.height >= plat.y &&
      player.y + player.height <= plat.y + plat.height &&
      player.velocityY >= 0
    ) {
      player.grounded = true;
      player.velocityY = 0;
      player.y = plat.y - player.height;
    }
  });

  coins.forEach(coin => {
    if (!coin.collected) {
      const distX = (player.x + player.width / 2) - coin.x;
      const distY = (player.y + player.height / 2) - coin.y;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < player.width / 2 + coin.radius) {
        coin.collected = true;
        score += 10;
        // Efek partikel koin
        createExplosion(coin.x, coin.y, '#f8d800');
      }
    }
  });

  if (
    player.x < flag.x + flag.width &&
    player.x + player.width > flag.x &&
    player.y < flag.y + flag.height &&
    player.y + player.height > flag.y
  ) {
    gameWon = true;
  }

  if (player.y > canvas.height) {
    gameOver = true;
  }
}

function updateEnemies() {
  if (gameOver || gameWon) return;

  enemies.forEach(enemy => {
    enemy.x += enemy.speed * enemy.direction;

    if (enemy.x <= enemy.minX || enemy.x + enemy.width >= enemy.maxX) {
      enemy.direction *= -1;
    }

    if (
      player.x < enemy.x + enemy.width &&
      player.x + player.width > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + player.height > enemy.y
    ) {
      if (player.velocityY > 0 && player.y + player.height - player.velocityY <= enemy.y) {
        // EFEK SERANGAN: Buat partikel ledakan saat menginjak musuh
        createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#ff3300');
        
        enemies.splice(enemies.indexOf(enemy), 1);
        player.velocityY = -8;
        score += 20;
      } else {
        gameOver = true;
      }
    }
  });
}

// --- RENDER VISUAL ---
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Platform
  platforms.forEach(plat => {
    ctx.fillStyle = plat.color;
    ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
    ctx.fillStyle = '#00a800';
    ctx.fillRect(plat.x, plat.y, plat.width, 5);
  });

  // 2. Koin
  coins.forEach(coin => {
    if (!coin.collected) {
      ctx.beginPath();
      ctx.arc(coin.x, coin.y, coin.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f8d800';
      ctx.fill();
      ctx.strokeStyle = '#d8a000';
      ctx.stroke();
      ctx.closePath();
    }
  });

  // 3. Musuh (Menggunakan efek aura merah di sprites.js)
  enemies.forEach(enemy => {
    drawEnemyWithEffect(ctx, assets.enemy, enemy);
  });

  // 4. Render Partikel Ledakan
  updateAndDrawParticles(ctx);

  // 5. Bendera Finish
  ctx.fillStyle = '#fff';
  ctx.fillRect(flag.x, flag.y, flag.width, flag.height);
  ctx.fillStyle = '#00a800';
  ctx.beginPath();
  ctx.moveTo(flag.x + 10, flag.y);
  ctx.lineTo(flag.x + 50, flag.y + 20);
  ctx.lineTo(flag.x + 10, flag.y + 40);
  ctx.fill();

  // 6. Player
  const shouldFlipPlayer = player.facing === 'left';
  drawSprite(ctx, assets.player, player.x, player.y, player.width, player.height, shouldFlipPlayer, '#ff2a2a');

  // 7. Skor
  ctx.fillStyle = '#fff';
  ctx.font = '20px sans-serif';
  ctx.fillText(`SKOR: ${score}`, 20, 35);

  // 8. Screen Kalah / Menang
  if (gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 35px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Tekan Spasi / Tap Layar untuk Restart', canvas.width / 2, canvas.height / 2 + 30);
    ctx.textAlign = 'left';
  }

  if (gameWon) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4dff4d';
    ctx.font = 'bold 35px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KAMU MENANG!', canvas.width / 2, canvas.height / 2 - 10);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText(`Skor Akhir: ${score}`, canvas.width / 2, canvas.height / 2 + 25);
    ctx.fillText('Tekan Spasi / Tap Layar untuk Main Lagi', canvas.width / 2, canvas.height / 2 + 60);
    ctx.textAlign = 'left';
  }
}

function restartGame() {
  player.x = 50;
  player.y = 200;
  player.velocityX = 0;
  player.velocityY = 0;
  player.facing = 'right';
  score = 0;
  gameOver = false;
  gameWon = false;

  coins.forEach(c => c.collected = false);

  enemies.length = 0;
  enemies.push(
    { x: 300, y: 330, width: 30, height: 30, speed: 2, direction: 1, minX: 200, maxX: 450 },
    { x: 600, y: 330, width: 30, height: 30, speed: 1.5, direction: -1, minX: 500, maxX: 750 }
  );
}

function gameLoop() {
  updatePlayer();
  updateEnemies();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();