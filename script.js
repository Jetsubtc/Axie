const layoutBlocks = [6,5,4,3,4,5,6,5,4,3,4,5,6,5,4,3,4,5,6,5,4,3,4,5,6];
const multipliers = [
  1.10, 1.32, 1.59, 1.91, 2.29, 2.74, 3.28, 3.93, 4.71, 5.65,
  6.78, 8.14, 9.77, 11.72, 14.06, 16.87, 20.24, 24.29, 29.15,
  34.98, 41.97, 50.36, 60.43, 72.52, 380.00
];

const gameArea = document.getElementById("gameArea");
const currentMultiplierText = document.getElementById("currentMultiplier");
const hypeAmountText = document.getElementById("hypeAmount");
const balanceDisplay = document.getElementById("balanceDisplay");  // ADDED
const cashOutBtn = document.getElementById("cashOutBtn");
const restartBtn = document.getElementById("restartBtn");
const floatingInfoBox = document.getElementById("floatingInfoBox");
const losePopup = document.getElementById("losePopup");
const winPopup = document.getElementById("winPopup");

const clickSound = new Audio("sounds/click.mp3");
const loseSound = new Audio("sounds/lose1.mp3");
const winSound = new Audio("sounds/win.mp3");

let bombIndexes = [];
let clickedLayouts = new Set();
let gameOver = false;
let maxAllowedLevel = 0;
let currentMultiplier = 1.00;
const initialSOL = 1.0000;

let playerBalance = 6.0000;  // TRACK PLAYER BALANCE
let previousScrollHeight = 0;

// Stats tracking
let gameStats = {
  totalGames: 0,
  totalWins: 0,
  bestMultiplier: 0,
  totalEarned: 0,
  currentStreak: 0
};

// Create progress bar
function createProgressBar() {
  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';
  progressContainer.innerHTML = '<div class="progress-bar"></div>';
  document.body.appendChild(progressContainer);
  return progressContainer;
}

// Create stats panel
function createStatsPanel() {
  const statsPanel = document.createElement('div');
  statsPanel.className = 'stats-panel';
  statsPanel.innerHTML = `
    <div class="stats-item">
      <span>Games:</span>
      <span class="stats-value" id="totalGames">0</span>
    </div>
    <div class="stats-item">
      <span>Wins:</span>
      <span class="stats-value" id="totalWins">0</span>
    </div>
    <div class="stats-item">
      <span>Best:</span>
      <span class="stats-value" id="bestMultiplier">0.00x</span>
    </div>
    <div class="stats-item">
      <span>Earned:</span>
      <span class="stats-value" id="totalEarned">0.0000</span>
    </div>
  `;
  document.body.appendChild(statsPanel);
  return statsPanel;
}

// Particle effects
function createParticles(x, y, color = '#14F195') {
  for (let i = 0; i < 8; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.background = color;
    particle.style.width = Math.random() * 4 + 2 + 'px';
    particle.style.height = particle.style.width;
    particle.style.borderRadius = '50%';
    
    const angle = (Math.PI * 2 * i) / 8;
    const velocity = 50 + Math.random() * 50;
    particle.style.setProperty('--angle', angle + 'rad');
    particle.style.setProperty('--velocity', velocity + 'px');
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 1000);
  }
}

// Coin animation
function createCoins(x, y, amount) {
  for (let i = 0; i < Math.min(amount, 10); i++) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.style.left = (x + Math.random() * 40 - 20) + 'px';
    coin.style.top = y + 'px';
    coin.style.animationDelay = (i * 0.1) + 's';
    
    document.body.appendChild(coin);
    
    setTimeout(() => {
      coin.remove();
    }, 1500);
  }
}

// Update progress bar
function updateProgressBar() {
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    const progress = (maxAllowedLevel / (layoutBlocks.length - 1)) * 100;
    progressBar.style.width = progress + '%';
  }
}

// Update stats
function updateStats() {
  document.getElementById('totalGames').textContent = gameStats.totalGames;
  document.getElementById('totalWins').textContent = gameStats.totalWins;
  document.getElementById('bestMultiplier').textContent = gameStats.bestMultiplier.toFixed(2) + 'x';
  document.getElementById('totalEarned').textContent = gameStats.totalEarned.toFixed(4);
}

function initGame() {
  gameOver = false;
  clickedLayouts.clear();
  maxAllowedLevel = 0;
  currentMultiplier = 1.00;
  // Don't reset player balance on restart - keep accumulated balance

  floatingInfoBox.style.display = "none";
  restartBtn.style.display = "none";
  cashOutBtn.style.display = "inline-block";

  bombIndexes = layoutBlocks.map(n => Math.floor(Math.random() * n));
  updateUI();
  updateProgressBar();

  gameArea.innerHTML = '';

  for (let level = layoutBlocks.length - 1; level >= 0; level--) {
    const layout = document.createElement("div");
    layout.className = "layout";

    const rowWrapper = document.createElement("div");
    rowWrapper.style.display = "flex";
    rowWrapper.style.alignItems = "center";
    rowWrapper.style.justifyContent = "center";
    rowWrapper.style.gap = "12px";
    rowWrapper.style.width = "100%";
    rowWrapper.style.flexWrap = "wrap";

    const label = document.createElement("div");
    label.className = "multiplier-label";
    label.textContent = multipliers[level].toFixed(2) + "x";

    const blocksContainer = document.createElement("div");
    blocksContainer.className = "blocks";

    for (let i = 0; i < layoutBlocks[level]; i++) {
      const block = document.createElement("div");
      block.className = "block";

      const img = document.createElement("img");
      img.src = (i === bombIndexes[level]) ? "images/sea urchin.png" : "images/axie.png";
      img.alt = (i === bombIndexes[level]) ? "Bomb" : "Axie";
      img.className = (i === bombIndexes[level]) ? "bomb-img" : "axie-img";

      block.appendChild(img);

      block.addEventListener("click", () =>
        handleClick(level, i, block, blocksContainer)
      );

      blocksContainer.appendChild(block);
    }

    rowWrapper.appendChild(label);
    rowWrapper.appendChild(blocksContainer);
    layout.appendChild(rowWrapper);
    gameArea.appendChild(layout);
  }

  setTimeout(() => {
    gameArea.scrollTo({ top: gameArea.scrollHeight, behavior: 'smooth' });
    previousScrollHeight = gameArea.scrollHeight;
  }, 100);
}

function handleClick(level, index, clickedBlock, blocksContainer) {
  if (gameOver || clickedLayouts.has(level) || level !== maxAllowedLevel || clickedBlock.classList.contains('revealed')) return;

  clickedLayouts.add(level);
  const children = blocksContainer.querySelectorAll(".block");
  const bombIndex = bombIndexes[level];

  const img = clickedBlock.querySelector("img");

  if (index === bombIndex) {
    clickedBlock.classList.add("bomb", "revealed");
    gameOver = true;
    cashOutBtn.style.display = 'none';
    restartBtn.style.display = 'block';

    // Create explosion particles
    const rect = clickedBlock.getBoundingClientRect();
    createParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#ff5252');
    
    loseSound.play();
    showLosePopup();
    showFloatingMessage("Out of luck this time — keep pushing!", "#f44336");
    
    // Update stats
    gameStats.totalGames++;
    updateStats();
  } else {
    clickedBlock.classList.add("safe", "revealed");

    const bombBlock = children[bombIndex];
    if (bombBlock) {
      bombBlock.classList.add("revealed", "bomb");
    }

    // Create success particles
    const rect = clickedBlock.getBoundingClientRect();
    createParticles(rect.left + rect.width/2, rect.top + rect.height/2, '#14F195');

    currentMultiplier = multipliers[level];
    maxAllowedLevel++;
    updateUI();
    updateProgressBar();

    if (!gameOver) {
      clickSound.play();
    }

    const nextLayout = document.querySelectorAll(".layout")[layoutBlocks.length - 1 - maxAllowedLevel];
    if (nextLayout) {
      setTimeout(() => {
        nextLayout.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }

    setTimeout(() => {
      const newHeight = gameArea.scrollHeight;
      if (newHeight > previousScrollHeight) {
        gameArea.scrollTo({ top: newHeight, behavior: 'smooth' });
        previousScrollHeight = newHeight;
      }
    }, 150);
  }
}

function updateUI() {
  currentMultiplierText.textContent = currentMultiplier.toFixed(2) + "x";

  // Calculate potential earnings based on multiplier
  const earned = initialSOL * currentMultiplier;

  // Update hypeAmount to show potential winnings, rounded
  hypeAmountText.textContent = earned.toFixed(4);

  // Update main balance display with player's current balance
  balanceDisplay.textContent = `Balance: ${playerBalance.toFixed(4)} HYPE`;
}

function cashOut() {
  if (gameOver) return;
  gameOver = true;

  // Calculate winnings
  const earned = initialSOL * currentMultiplier;

  // Add winnings to player's balance
  playerBalance += earned;

  // Create coin animation
  const rect = cashOutBtn.getBoundingClientRect();
  createCoins(rect.left + rect.width/2, rect.top, Math.floor(earned * 2));

  cashOutBtn.style.display = 'none';
  restartBtn.style.display = 'inline-block';

  winSound.play();

  showFloatingMessage(`You cashed out at ${currentMultiplier.toFixed(2)}x — +${earned.toFixed(4)} HYPE`, "#00e676");
  showWinPopup();

  // Update stats
  gameStats.totalGames++;
  gameStats.totalWins++;
  gameStats.totalEarned += earned;
  if (currentMultiplier > gameStats.bestMultiplier) {
    gameStats.bestMultiplier = currentMultiplier;
  }
  updateStats();

  // Update balance display after cash out
  updateUI();
}

function showFloatingMessage(text, color = "#00e676") {
  floatingInfoBox.textContent = text;
  floatingInfoBox.style.color = color;
  floatingInfoBox.style.display = "block";

  setTimeout(() => {
    floatingInfoBox.style.display = "none";
  }, 2000);
}

function showLosePopup() {
  if (!losePopup) return;
  losePopup.style.display = "block";
  setTimeout(() => {
    losePopup.style.display = "none";
  }, 2000);
}

function showWinPopup() {
  if (!winPopup) return;
  winPopup.style.display = "block";
  setTimeout(() => {
    winPopup.style.display = "none";
  }, 2000);
}

restartBtn.addEventListener("click", initGame);
cashOutBtn.addEventListener("click", cashOut);

document.addEventListener("DOMContentLoaded", () => {
  initGame();

  const menuButton = document.getElementById("menuButton");
  if (menuButton) {
    menuButton.addEventListener("click", () => {
      alert("Menu clicked - implement sidebar if needed.");
    });
  }

  const connectWallet = document.getElementById("connectWallet"); // ✅ fixed typo
  let provider;
  let signer;
  let connected = false;

  async function connectToWallet() {
    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not installed. Please install it to use this feature.");
      return;
    }

    if (!connected) {
      try {
        // 🔑 Prompt MetaMask to connect
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        const address = await signer.getAddress();

        const displayAddress = address.slice(0, 6) + "..." + address.slice(-4);
        connectWallet.innerText = displayAddress;
        connected = true;
      } catch (err) {
        console.error("Wallet connection failed:", err);
        alert("Connection failed.");
      }
    } else {
      // Simulate disconnect
      connectWallet.innerText = "Connect Wallet";
      provider = null;
      signer = null;
      connected = false;
    }
  }

  if (connectWallet) {
    connectWallet.addEventListener("click", connectToWallet);
  }
});

