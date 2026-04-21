const game        = document.getElementById('game');
const bird        = document.getElementById('bird');
const pipesContainer = document.getElementById('pipes');
const scoreEl     = document.getElementById('score');
const finalScoreEl = document.getElementById('finalScore');
const hintEl      = document.getElementById('hint');
const gameOverBox = document.getElementById('gameOverBox');
const restartBtn  = document.getElementById('restartBtn');
const wingSound  = new Audio("assets/sfx_wing.mp3");
const pointSound = new Audio("assets/sfx_point.mp3");
const dieSound   = new Audio("assets/sfx_die.mp3");

wingSound.preload  = "auto";
pointSound.preload = "auto";
dieSound.preload   = "auto";

function playSound(sound) {
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

const state = {
  started:       false,
  over:          false,
  score:         0,
  birdY:         260,
  velocity:      0,
  gravity:       0.42,
  flapStrength:  -7.2,
  pipeSpeed:     2.2,
  pipeGap:       170,
  spawnTimer:    0,
  spawnInterval: 1400,
  lastTime:      0,
  pipes:         []
};

const BIRD_X  = 90;
const BIRD_W  = 64;   
const BIRD_H  = 46;   
const GROUND_H = 72;
const PIPE_W  = 80;   

function getGameHeight() { return game.clientHeight; }
function getGameWidth()  { return game.clientWidth;  }

function resetGame() {
  state.started      = false;
  state.over         = false;
  state.score        = 0;
  state.birdY        = getGameHeight() * 0.42;
  state.velocity     = 0;
  state.spawnTimer   = 0;
  state.lastTime     = 0;
  state.pipes        = [];

  pipesContainer.innerHTML = '';
  scoreEl.textContent      = '0';
  finalScoreEl.textContent = '0';
  hintEl.textContent       = 'Clique, toque ou aperte espaço para começar';
  gameOverBox.classList.add('hidden');


  bird.classList.remove('dead');
  bird.style.transform = '';

  renderBird();
}

function startGame() {
  if (state.over) return;
  if (!state.started) {
    state.started = true;
    hintEl.textContent = '';
  }
  flap();
}

function flap() {
  state.velocity = state.flapStrength;
  playSound(wingSound);
}

function createPipePair() {
  const minTop  = 80;
  const maxTop  = getGameHeight() - GROUND_H - state.pipeGap - 120;
  const topHeight  = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
  const bottomY    = topHeight + state.pipeGap;
  const bottomHeight = getGameHeight() - GROUND_H - bottomY;

  const pairEl = document.createElement('div');
  pairEl.className    = 'pipe-pair';
  pairEl.style.left   = `${getGameWidth()}px`;
  pairEl.style.width  = `${PIPE_W}px`;

  const topEl = document.createElement('div');
  topEl.className    = 'pipe top';
  topEl.style.height = `${topHeight}px`;

  const bottomEl = document.createElement('div');
  bottomEl.className    = 'pipe bottom';
  bottomEl.style.height = `${bottomHeight}px`;

  pairEl.appendChild(topEl);
  pairEl.appendChild(bottomEl);
  pipesContainer.appendChild(pairEl);

  state.pipes.push({
    x:          getGameWidth(),
    topHeight,
    bottomY,
    width:      PIPE_W,
    passed:     false,
    el:         pairEl
  });
}

function renderBird() {
  bird.style.top = `${state.birdY}px`;
  
  if (!state.over) {
    const rotation = Math.max(-25, Math.min(90, state.velocity * 7));
    bird.style.transform = `rotate(${rotation}deg)`;
  }
}

function hitPipe(pipe) {
  const HITBOX_MARGIN_X = 18;
  const HITBOX_MARGIN_Y = 14;

  const birdLeft   = BIRD_X + HITBOX_MARGIN_X;
  const birdRight  = BIRD_X + BIRD_W - HITBOX_MARGIN_X;
  const birdTop    = state.birdY + HITBOX_MARGIN_Y;
  const birdBottom = state.birdY + BIRD_H - HITBOX_MARGIN_Y;

  const PIPE_MARGIN_X = 10; // diminui a área de colisão lateral do cano

  const pipeLeft   = pipe.x + PIPE_MARGIN_X;
  const pipeRight  = pipe.x + pipe.width - PIPE_MARGIN_X;

  const overlapX   = birdRight > pipeLeft && birdLeft < pipeRight;
  const hitTop     = birdTop < pipe.topHeight;
  const hitBottom  = birdBottom > pipe.bottomY;

  return overlapX && (hitTop || hitBottom);
}

function endGame() {
  if (state.over) return;

  state.over    = true;
  state.started = false;


  bird.classList.add('dead');
  bird.style.transform = 'rotate(0deg)';

  finalScoreEl.textContent = state.score;
  gameOverBox.classList.remove('hidden');
  hintEl.textContent = '';
  playSound(dieSound);
}

function update(delta) {
  if (!state.started || state.over) return;

  state.velocity += state.gravity * delta * 0.06;
  state.birdY    += state.velocity * delta * 0.06;

  const maxBirdY = getGameHeight() - GROUND_H - BIRD_H;

  if (state.birdY < 0) {
    state.birdY    = 0;
    state.velocity = 0;
  }

  if (state.birdY >= maxBirdY) {
    state.birdY = maxBirdY;
    renderBird();
    endGame();
    return;
  }

  state.spawnTimer += delta;
  if (state.spawnTimer >= state.spawnInterval) {
    state.spawnTimer = 0;
    createPipePair();
  }

  for (let i = state.pipes.length - 1; i >= 0; i--) {
    const pipe = state.pipes[i];
    pipe.x -= state.pipeSpeed * delta * 0.06;
    pipe.el.style.left = `${pipe.x}px`;

    if (!pipe.passed && pipe.x + pipe.width < BIRD_X) {
      pipe.passed = true;
      state.score += 1;
      scoreEl.textContent = state.score;
      playSound(pointSound);
    }

    if (hitPipe(pipe)) {
      renderBird();
      endGame();
      return;
    }

    if (pipe.x + pipe.width < -10) {
      pipe.el.remove();
      state.pipes.splice(i, 1);
    }
  }

  renderBird();
}

function loop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  const delta = Math.min(32, timestamp - state.lastTime);
  state.lastTime = timestamp;
  update(delta);
  requestAnimationFrame(loop);
}


window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (state.over) return;
    startGame();
  }
});

game.addEventListener('mousedown', (e) => {
 
  if (e.target === restartBtn) return;
  if (state.over) return;
  startGame();
});

game.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (state.over) return;
  startGame();
}, { passive: false });

restartBtn.addEventListener('click', resetGame);

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!state.started && !state.over) resetGame();
  }, 300);
});

resetGame();
requestAnimationFrame(loop);
