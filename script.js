// Função para iniciar o jogo
let game;
let game_container; // Tornar game_container global para o resize listener

function startGame() {
  document.querySelector('#menu').style.display = 'none';
  document.querySelector('main').style.display = 'flex';
  game_container = document.querySelector('#game-container'); // Atribuir à variável global

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
    const recepcionistaText = document.getElementById("recepcionista-text"); // Novo ID para o texto da recepcionista
    if (recepcionistaBalao && recepcionistaText) {
        recepcionistaText.textContent = "Olá! Pegue os pedidos para os clientes!"; // Texto inicial
        recepcionistaBalao.classList.remove("oculto"); // Mostra o balão
    }

    setTimeout(() => {
      if (recepcionistaBalao) recepcionistaBalao.classList.add("oculto"); // Oculta o balão da recepcionista
      
      const clienteImg = document.querySelector("#cliente_container img");
      if (clienteImg) clienteImg.classList.remove("oculto"); // Mostra o cliente

      const clienteBalao = document.getElementById("balao_cliente");
      // O texto do pedido será atualizado por updateOrderText()
      if (clienteBalao) clienteBalao.classList.remove("oculto"); // Mostra o balão do cliente
      
      // Opcional: Se quiser um texto inicial "Olá!" no balão do cliente antes do pedido
      // const orderTextElement = document.getElementById("order-text");
      // if (orderTextElement) orderTextElement.textContent = "Olá! Quero meu pedido!";

    }, 5000); // Mostra por 5 segundos
  }, 2000); // Começa após 2 segundos
}

// Listas de chaves para as imagens de comidas boas e ruins (DEVE USAR OS MESMOS NOMES DAS IMAGENS!)
const goodFoodKeys = ['hamburguer', 'refrigerante', 'milkshake', 'batatas']; 
const badFoodKeys = ['ancora_prata', 'bigorna', 'guitarra']; 

// Mapeamento de chaves de imagem para emojis (para exibir no pedido)
const foodEmojis = {
  'hamburguer': '🍔',
  'refrigerante': '🥤',
  'milkshake': '🍦',
  'batatas': '🍟'
};

// Objeto para definir a escala de cada tipo de comida
const foodScales = {
  'hamburguer': 0.2,
  'refrigerante': 0.12,
  'milkshake': 0.10,
  'batatas': 0.15,
  'ancora_prata': 0.4,
  'bigorna': 0.13,
  'guitarra': 0.17,
};

let fase = 1;
//let metaDePontos = 150; 
let jogador;
let comidas;
let cursors;
let score = 0;
let vida = 3;
let scoreText;
let vidaText;
let faseText;
let currentOrder = {};
// AGORA: orderTextElement é a variável que faz referência ao elemento HTML <p id="order-text">
let orderTextElement; 
let moveLeft = false;
let moveRight = false;


function preload() {
  this.load.image('jogador', './assets/img/jimmy_game.svg');

  // Carregar todas as boas comidas
  this.load.image('hamburguer', './assets/img/hamburguer-1.png');
  this.load.image('refrigerante', './assets/img/coca-removebg-preview.png');
  this.load.image('milkshake', './assets/img/milkshake-removebg-preview.png');
  this.load.image('batatas', './assets/img/batatafrita-removebg-preview.png');

  // Carregar todas as más comidas (caminhos consistentes com './assets/img/')
  this.load.image('ancora_prata', './assets/img/ancora_prata(png).png');
  this.load.image('bigorna', './assets/img/bigorna-removebg-preview.png');
  this.load.image('guitarra', './assets/img/guitarra-removebg-preview.png'); // <-- CONFIRME SE É .png OU .jpg
  this.load.image('gamerover', './assets/img/gamerover.jpg');
}

function create() {
  score = 0;
  vida = 3;
  fase = 1;
  jogador = this.physics.add.sprite(400, 550, 'jogador').setScale(0.6);
  jogador.setCollideWorldBounds(true);

  comidas = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();

  vidaText = this.add.text(10, 10, '❤️ ' + vida, {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  });
  scoreText = this.add.text(10, 32, ' ', {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  });
  faseText = this.add.text(145, 10, 'Fase ' + fase, {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  });

  // AGORA: orderTextElement referencia o <p id="order-text"> dentro do HTML
  orderTextElement = document.querySelector('#order-text');

  generateNewOrder();
  updateOrderText(); // Atualiza o texto do pedido na tela (agora no elemento HTML)

  this.time.addEvent({
    delay: 1000,
    callback: dropFood,
    callbackScope: this,
    loop: true
  });

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

/**
 * Atualiza o texto do pedido na tela (agora no elemento HTML).
 */
function updateOrderText() {
  let orderString = 'Pedido: '; // Mantive o "Pedido: " aqui
  let firstItem = true;

  for (const item in currentOrder) {
    if (currentOrder[item] > 0) {
      if (!firstItem) {
        orderString += ', ';
      }
      // Usa o mapeamento de emojis para exibir no pedido, se disponível, senão usa o nome da chave
      const displayItem = foodEmojis[item] || (item.charAt(0).toUpperCase() + item.slice(1));
      orderString += `${currentOrder[item]} ${displayItem}`;
      firstItem = false;
    }
  }

  if (firstItem) {
    orderString = 'Pedido: COMPLETO!';
  }
  // Atualiza o texto do elemento HTML
  if (orderTextElement) { // Garante que o elemento existe antes de tentar modificar
      orderTextElement.textContent = orderString; 
  }
}

function dropFood() {
  const x = Phaser.Math.Between(50, 350); 
  let isGoodChance = Phaser.Math.Between(0, 1) === 1; 

  let orderNotComplete = false;
  for (const item in currentOrder) {
      if (currentOrder[item] > 0) {
          orderNotComplete = true;
          break;
      }
  }

  if (orderNotComplete && Phaser.Math.Between(0, 3) !== 0) {
      isGoodChance = true;
  }

  let foodKey;
  if (isGoodChance) {
    foodKey = Phaser.Math.RND.pick(goodFoodKeys);
  } else {
    foodKey = Phaser.Math.RND.pick(badFoodKeys);
  }

  const food = comidas.create(x, 10, foodKey).setScale(foodScales[foodKey] || 0.2); 
  food.setVelocityY(Phaser.Math.Between(100, 200));

  food.isGood = isGoodChance;
  food.isBad = !isGoodChance;
  food.foodType = foodKey;
}

function catchFood(jogador, food) {
  if (food.isGood) {
    score += 10;
    if (currentOrder[food.foodType] && currentOrder[food.foodType] > 0) {
      currentOrder[food.foodType]--;
      updateOrderText();
    }
  } else if (food.isBad) {
    score -= 5;
    vida -= 1;
  }

  //scoreText.setText('Pontos: ' + score + '/' + metaDePontos);
  vidaText.setText('❤️  ' + vida);
  food.destroy();

  if (vida <= 0) {
    const gameOverImage = this.add.image(game.config.width / 2, game.config.height / 2, 'gamerover').setDisplaySize(300, 300);
    this.physics.pause();
    
    this.time.delayedCall(5000, () => {
      gameOverImage.destroy();
      game.destroy(true);
      document.querySelector('#menu').style.display = 'flex';
      document.querySelector('main').style.display = 'none';
    }, [], this);
  }

  let orderComplete = true;
  for (const item in currentOrder) {
    if (currentOrder[item] > 0) {
      orderComplete = false;
      break;
    }
  }

  if (orderComplete) {
    fase++;
    //metaDePontos += 150; 
    faseText.setText('Fase ' + fase);
    
    // Pequeno atraso antes de gerar o próximo pedido para o "Pedido: COMPLETO!" ser visível
    this.time.delayedCall(1000, () => { // 1 segundo de atraso
        generateNewOrder();
        updateOrderText();
    }, [], this);


    comidas.children.iterate(food => {
      food.setVelocityY(Phaser.Math.Between(200 + fase * 20, 300 + fase * 30));
    });
  }
}

window.addEventListener('resize', () => {
  if (game && game_container) {
    game.scale.resize(game_container.clientWidth, game_container.clientHeight);
  }
});