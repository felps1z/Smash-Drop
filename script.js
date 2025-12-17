// Função para iniciar o jogo
let game;
let game_container; // Tornar game_container global para o resize listener
let first_time = true;
const clienteImg = document.querySelector("#cliente_container img");
const clienteBalao = document.getElementById("balao_cliente");

let lastTouchEnd = 0;

document.addEventListener('touchend', function (event) {
  const now = new Date().getTime();
  if (now - lastTouchEnd <= 300) {
    event.preventDefault();
  }
  lastTouchEnd = now;
}, false);

document.querySelectorAll('#left-btn, #right-btn').forEach(botao => {
  botao.addEventListener('touchstart', e => {
    e.preventDefault();
  }, { passive: false });
});

document.getElementById('play-btn').addEventListener('click', () => {
  document.querySelector('#menu').style.display = 'none';
  document.querySelector('main').style.display = 'flex';
  if (first_time){
    document.querySelector('#modal-container').style.display = 'flex';
    document.getElementById('fechar-modal').addEventListener('click', () => {
      document.querySelector('#modal-container').style.display = 'none';
      startGame();
    });
    first_time = false;
  } else {
    startGame();
  }
});

document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', e => e.preventDefault(), { passive: false });

function startGame() {
  game_container = document.querySelector('#game-container'); 

  const config = {
    type: Phaser.AUTO,
    width: game_container.clientWidth,
    height: game_container.clientHeight,
    parent: 'game-container',
    backgroundColor: '#E7DFCC',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 300 },
        debug: false
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };

  game = new Phaser.Game(config);

  // Lógica dos balões de diálogo
  setTimeout(() => {
    const recepcionistaBalao = document.getElementById("balao_recepcionista");
    const recepcionistaText = document.getElementById("recepcionista-text");
    if (recepcionistaBalao && recepcionistaText) {
      recepcionistaText.textContent = "Olá! Pegue os pedidos para os clientes!";
      recepcionistaBalao.classList.remove("oculto"); 
    }

    setTimeout(() => {
      if (recepcionistaBalao) recepcionistaBalao.classList.add("oculto");
      
      if (clienteImg) clienteImg.classList.remove("oculto");
      if (clienteBalao) clienteBalao.classList.remove("oculto");

    }, 5000); 
  }, 2000); 
}

// Listas de chaves para as imagens
const goodFoodKeys = ['hamburguer', 'refrigerante', 'milkshake', 'batatas'];
const badFoodKeys = ['ancora_prata', 'bigorna', 'bota'];

// Mapeamento de chaves de imagem para emojis
const foodEmojis = {
  'hamburguer': '🍔',
  'refrigerante': '🥤',
  'milkshake': '🧋',
  'batatas': '🍟',
  'ancora_prata': '⚓',
  'bigorna': '💣',
  'bota': '🥾'
};

let fase = 1;
let jogador;
let comidas;
let cursors;
let score = 0;
let vida = 3;
let scoreText;
let vidaText;
let faseText;
let currentOrder = {};
let orderTextElement;
let moveLeft = false;
let moveRight = false;

function preload() {
  this.load.image('jogador', './assets/img/jimmy_game.png');
}

// ==================================================================
// FUNÇÃO CREATE
// ==================================================================
function create() {
  score = 0;
  vida = 3;
  fase = 1;
  jogador = this.physics.add.sprite(400, 550, 'jogador').setScale(0.6);
  jogador.setCollideWorldBounds(true);

  comidas = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();

  // Vidas
  vidaText = this.add.text(290, 10, '❤️ ' + vida, {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  });

  // Fase
  faseText = this.add.text(145, 10, 'Fase ' + fase, {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  });

  // Pontos
  scoreText = this.add.text(10, 10, '🪙 ', {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  });

  orderTextElement = document.querySelector('#order-text');

  generateNewOrder();
  updateOrderText();

  this.time.delayedCall(7000, () => {
    this.foodDropTimer = this.time.addEvent({
      delay: 1000,
      callback: dropFood,
      callbackScope: this,
      loop: true
    });
  }, [], this);

  this.physics.add.overlap(jogador, comidas, catchFood, null, this);

  const leftBtn = document.querySelector('#left-btn');
  const rightBtn = document.querySelector('#right-btn');

  leftBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    moveLeft = true;
    jogador.flipX = false;
  });
  rightBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    moveRight = true;
    jogador.flipX = true;
  });
  document.addEventListener('pointerup', e => {
    e.preventDefault();
    moveLeft = false;
    moveRight = false;
  });

  const preventZoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  leftBtn.addEventListener('touchstart', preventZoom, { passive: false });
  leftBtn.addEventListener('pointerdown', preventZoom, { passive: false });

  rightBtn.addEventListener('touchstart', preventZoom, { passive: false });
  rightBtn.addEventListener('pointerdown', preventZoom, { passive: false });
}

function update() {
  if (cursors.left.isDown || moveLeft) {
    jogador.setVelocityX(-300);
  } else if (cursors.right.isDown || moveRight) {
    jogador.setVelocityX(300);
  } else {
    jogador.setVelocityX(0);
  }
}

function generateNewOrder() {
  currentOrder = {};
  let totalItemsInOrder = 0;

  const numItemsInOrder = Phaser.Math.Between(1 + Math.floor(fase / 2), 2 + fase);

  for (let i = 0; i < numItemsInOrder; i++) {
    const itemKey = Phaser.Math.RND.pick(goodFoodKeys);
    const quantity = Phaser.Math.Between(1, 3);

    if (currentOrder[itemKey]) {
      currentOrder[itemKey] += quantity;
    } else {
      currentOrder[itemKey] = quantity;
    }
    totalItemsInOrder += quantity;
  }
}

function updateOrderText() {
  let orderString = 'Pedido: ';
  let firstItem = true;

  for (const item in currentOrder) {
    if (currentOrder[item] > 0) {
      if (!firstItem) {
        orderString += ', ';
      }
      const displayItem = foodEmojis[item] || (item.charAt(0).toUpperCase() + item.slice(1));
      orderString += `${currentOrder[item]} ${displayItem}`;
      firstItem = false;
    }
  }

  if (firstItem) {
    orderString = 'Pedido: COMPLETO!';
  }
  if (orderTextElement) {
    orderTextElement.textContent = orderString;
  }
}

function dropFood() {
  const x = Phaser.Math.Between(55, 300);
  let isGoodChance = Phaser.Math.Between(0, 1) === 1;

  let orderNotComplete = Object.values(currentOrder).some(q => q > 0);
  if (orderNotComplete && Phaser.Math.Between(0, 3) !== 0) {
    isGoodChance = true;
  }

  let foodKey = isGoodChance ?
    Phaser.Math.RND.pick(goodFoodKeys) :
    Phaser.Math.RND.pick(badFoodKeys);

  const emoji = foodEmojis[foodKey] || '💣';

  const food = this.add.text(x, 10, emoji, {
    fontSize: '32px'
  });

  this.physics.add.existing(food);

  food.body.setVelocityY(Phaser.Math.Between(100, 200));
  food.isGood = isGoodChance;
  food.isBad = !isGoodChance;
  food.foodType = foodKey;

  comidas.add(food);
}

// ==================================================================
// FUNÇÃO CATCHFOOD (Lógica de pontos + Pop-up nova)
// ==================================================================
function catchFood(jogador, food) {
  if (food.isGood) {
    // Verifica se a comida faz parte do pedido atual
    if (currentOrder[food.foodType] && currentOrder[food.foodType] > 0) {
      score += 100; // Do cardápio: +100
      currentOrder[food.foodType]--;
      updateOrderText();
    } else {
      score += 50; // Comida boa, mas fora do cardápio: +50
    }
  } else if (food.isBad) {
    score -= 50; // Comida ruim: -50
    vida -= 1;
  }

  // Atualiza placar
  vidaText.setText('❤️ ' + vida);
  scoreText.setText('🪙 ' + score);

  food.destroy();

  // Game Over
  if (vida <= 0) {
    this.physics.pause();

    const modal = document.querySelector('#modal-gameover');
    const btnVoltar = document.querySelector('#voltar-menu');
    const menu = document.querySelector('#menu');
    const main = document.querySelector('main');

    modal.style.display = 'flex';
    document.querySelector('#pontuacao').innerHTML = 'Pontuação: ' + score;

    btnVoltar.addEventListener('click', () => {
      const gameOverImage = this.add.image(game.config.width / 2, game.config.height / 2, 'gonovo').setDisplaySize(300, 300);
      modal.style.display = 'none';

      // Destrói o jogo Phaser
      gameOverImage.destroy();
      game.destroy(true);
      game = null;
      if (clienteImg) clienteImg.classList.add("oculto");
      if (clienteBalao) clienteBalao.classList.add("oculto"); 

      // Volta para o menu
      main.style.display = 'none';
      menu.style.display = 'flex';
    }, { once: true }); // 🔑 evita múltiplos cliques
  }

  let orderComplete = true;
  for (const item in currentOrder) {
    if (currentOrder[item] > 0) {
      orderComplete = false;
      break;
    }
  }

  // Passou de fase
  if (orderComplete) {
    score += 300; // Bônus de fase
    scoreText.setText('🪙 ' + score);

    // CRIA O POP-UP VISUAL
    const popupText = this.add.text(game.config.width / 2, game.config.height / 2 - 50, 'Passou de Fase!\n+300 pontos!', {
      fontSize: '40px',
      fill: '#00ff00', // Verde vibrante
      fontFamily: 'Lilita One, cursive',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5);

    // Remove o pop-up após 2 segundos
    this.time.delayedCall(2000, () => {
      popupText.destroy();
    }, [], this);

    // 1. Pausar a física
    this.physics.pause();
    this.foodDropTimer.paused = true;

    // 2. Preparar próxima fase
    fase++;
    faseText.setText('Fase ' + fase);
    generateNewOrder(); 

    // 3. Sequência do timer
    this.time.delayedCall(1000, () => {
      updateOrderText();

      let countdown = 3;
      const countdownText = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        countdown, {
          fontSize: '96px',
          fill: '#ff6600',
          fontFamily: 'Lilita One, cursive',
          stroke: '#ffffff',
          strokeThickness: 8
        }
      ).setOrigin(0.5);

      this.time.addEvent({
        delay: 1000,
        callback: () => {
          countdown--;
          if (countdown > 0) {
            countdownText.setText(countdown);
          } else {
            countdownText.setText('VAI!').setFontSize('80px');
          }
        },
        repeat: 2 
      });

      this.time.delayedCall(3000, () => {
        countdownText.destroy();
        this.physics.resume();
        this.foodDropTimer.paused = false;
      }, [], this);

    }, [], this);
  }
}

window.addEventListener('resize', () => {
  if (game && game_container) {
    game.scale.resize(game_container.clientWidth, game_container.clientHeight);
  }
});