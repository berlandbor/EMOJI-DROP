document.addEventListener("DOMContentLoaded", () => {
  alert(`Добро пожаловать в Emoji Drop!

Соединяй одинаковые смайлики в ряд от 3 и более, чтобы они исчезали. 
С каждым уровнем игра усложняется — больше смайликов, меньше времени и больше совпадений!`);

  const mainCanvas = document.getElementById("maincanvas");
  const con = mainCanvas.getContext("2d");

  const scoreDisplay = document.getElementById("score");
  const levelDisplay = document.getElementById("level");

  const leftBtn = document.getElementById("left");
  const rightBtn = document.getElementById("right");
  const downBtn = document.getElementById("down");
  const playBtn = document.getElementById("playBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");

  con.scale(20, 20);
  con.font = '1.3px serif';
  con.textAlign = 'center';
  con.textBaseline = 'middle';

  const field = createMatrix(20, 12);

  const emojiMap = {
    1: '🍒', 2: '🍋', 3: '🍇', 4: '🍎', 5: '🍍',
    6: '🥝', 7: '🍊', 8: '🍌', 9: '🍉', 10: '🥥',
    11: '🍈', 12: '🍓', 13: '🍑', 14: '🥭', 15: '🍏'
  };

  const fullEmojiSet = Object.keys(emojiMap).map(Number);

  const player = {
    pos: { x: 5, y: 0 },
    value: 1,
    score: 0
  };

  let currentLevel = 0;
  let matchLength = 3;
  let threshold = 1000;
  let dropInterval = 0;
  let lastTime = 0;
  let animationFrameId = null;
  let isPaused = false;

  function createMatrix(rows, cols) {
    return Array.from({ length: rows }, () => Array(cols).fill(0));
  }

  function getAvailableEmojis() {
    const level = Math.min(Math.floor(player.score / 50) + 1, 10);
    const count = Math.min(3 + Math.floor(level / 2) * 2, 15);
    return fullEmojiSet.slice(0, count);
  }

  function drawMatrix(field) {
    con.clearRect(0, 0, 12, 20);
    for (let y = 0; y < field.length; y++) {
      for (let x = 0; x < field[y].length; x++) {
        const val = field[y][x];
        if (val !== 0) {
          con.strokeStyle = '#000';
          con.lineWidth = 0.05;
          con.strokeText(emojiMap[val], x + 0.5, y + 0.5);
          con.fillText(emojiMap[val], x + 0.5, y + 0.5);
        }
      }
    }
    con.strokeText(emojiMap[player.value], player.pos.x + 0.5, player.pos.y + 0.5);
    con.fillText(emojiMap[player.value], player.pos.x + 0.5, player.pos.y + 0.5);
  }

  function collide() {
    return (
      player.pos.y >= field.length ||
      field[player.pos.y]?.[player.pos.x] !== 0
    );
  }

  function merge() {
    field[player.pos.y][player.pos.x] = player.value;
  }

  function drop() {
    player.pos.y++;
    if (collide()) {
      player.pos.y--;
      merge();
      clearMatches();
      resetPlayer();
    }
    dropInterval = 0;
  }

  function move(dir) {
    const x = player.pos.x + dir;
    if (x >= 0 && x < field[0].length && field[player.pos.y]?.[x] === 0) {
      player.pos.x = x;
    }
  }

  function clearMatches() {
    const toClear = new Set();

    for (let y = 0; y < field.length; y++) {
      for (let x = 0; x <= field[0].length - matchLength; x++) {
        const val = field[y][x];
        if (val === 0) continue;
        let match = true;
        for (let i = 1; i < matchLength; i++) {
          if (field[y][x + i] !== val) {
            match = false;
            break;
          }
        }
        if (match) {
          for (let i = 0; i < matchLength; i++) {
            toClear.add(`${x + i},${y}`);
          }
        }
      }
    }

    for (let y = 0; y <= field.length - matchLength; y++) {
      for (let x = 0; x < field[0].length; x++) {
        const val = field[y][x];
        if (val === 0) continue;
        let match = true;
        for (let i = 1; i < matchLength; i++) {
          if (field[y + i][x] !== val) {
            match = false;
            break;
          }
        }
        if (match) {
          for (let i = 0; i < matchLength; i++) {
            toClear.add(`${x},${y + i}`);
          }
        }
      }
    }

    if (toClear.size > 0) {
      for (let coord of toClear) {
        const [x, y] = coord.split(',').map(Number);
        field[y][x] = 0;
      }
      player.score += toClear.size * 5;
      updateScore();
    }
  }

  function resetPlayer() {
    player.pos.y = 0;
    player.pos.x = 5;
    const available = getAvailableEmojis();
    player.value = available[Math.floor(Math.random() * available.length)];

    if (collide()) {
      alert(`Игра окончена! Счёт: ${player.score}`);
      restartGame();
    }
  }

  function updateScore() {
    scoreDisplay.textContent = player.score;

    const level = Math.min(Math.floor(player.score / 50) + 1, 10);
    if (level > currentLevel) {
      currentLevel = level;

      if (level === 10) {
        alert(`Поздравляем! Вы достигли максимального уровня 10 и победили!`);
        restartGame();
        return;
      }

      alert(`Поздравляем! Уровень ${level}!\nТеперь доступно больше смайликов и больше сложностей.`);
    }

    levelDisplay.textContent = level;
    threshold = Math.max(1000 - (level - 1) * 100, 200);
    matchLength = Math.min(3 + Math.floor(level / 2), 6);
  }

  function update(time = 0) {
    if (isPaused) return;
    const delta = time - lastTime;
    lastTime = time;
    dropInterval += delta;
    if (dropInterval > threshold) drop();
    drawMatrix(field);
    animationFrameId = requestAnimationFrame(update);
  }

  function restartGame() {
    for (let row of field) row.fill(0);
    player.score = 0;
    currentLevel = 0;
    updateScore();
    resetPlayer();
    isPaused = false;
    update();
  }

  document.addEventListener("keydown", e => {
    if (isPaused) return;
    switch (e.key) {
      case "ArrowLeft":
      case "a": move(-1); break;
      case "ArrowRight":
      case "d": move(1); break;
      case "ArrowDown":
      case "s": threshold = 50; break;
    }
  });

  document.addEventListener("keyup", e => {
    if (["ArrowDown", "s"].includes(e.key)) threshold = 1000;
  });

  leftBtn.addEventListener("click", () => move(-1));
  rightBtn.addEventListener("click", () => move(1));
  downBtn.addEventListener("touchstart", () => threshold = 50);
  downBtn.addEventListener("touchend", () => threshold = 1000);

  playBtn.addEventListener("click", () => {
    if (isPaused) {
      isPaused = false;
      update();
    }
  });

  pauseBtn.addEventListener("click", () => {
    isPaused = true;
    cancelAnimationFrame(animationFrameId);
  });

  resetBtn.addEventListener("click", () => restartGame());

  window.обновитьСтраницу = () => window.location.href = "index.html";

  resetPlayer();
  update();
});