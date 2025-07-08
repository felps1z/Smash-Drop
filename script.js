// Função para iniciar o jogo
let game;

function startGame() {
  document.querySelector('#menu').style.display = 'none';
  document.querySelector('main').style.display = 'flex';
  const game_container = document.querySelector('#game-container');

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
}
let fase = 1;
let metaDePontos = 150;
let jogador;
let comidas;
let cursors;
let score = 0;
let vida = 3;
let scoreText;
let moveLeft = false;
let moveRight = false;

function preload() {
  this.load.image('jogador', './assets/img/jimmy_game.svg');
  this.load.image('goodFood', './assets/img/hamburguer-1.png');
  this.load.image('badFood', './assets/img/ancora_prata(png).png');
  this.load.image('gamerover', './assets/img/gamerover.jpg');
}

function create() {
  score = 0;
  vida = 1;
  jogador = this.physics.add.sprite(400, 550, 'jogador').setScale(0.6);
  jogador.setCollideWorldBounds(true);

  comidas = this.physics.add.group();

  cursors = this.input.keyboard.createCursorKeys();

  vidaText = this.add.text(10, 10, '❤️  1', {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  })
  scoreText = this.add.text(10, 32, 'Pontos: 0', {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  })
  faseText = this.add.text(125, 10, 'Fase ' + fase, {
    fontSize: '24px',
    fill: '#000000',
    fontFamily: 'Lilita One, cursive'
  });
  
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

function dropFood() {
  const x = Phaser.Math.Between(50, 750);
  const isGood = Phaser.Math.Between(0, 1) === 1;
  const isBad = Phaser.Math.Between(0, 1) === 1;
  const food = comidas.create(x, 10, isGood ? 'goodFood' : 'badFood').setScale(0.2);
  food.setVelocityY(Phaser.Math.Between(100, 200));
  food.isGood = isGood;
  food.isBad = isBad;
}
//ajeitar a questao de pontos, ancoras as vezes n contam
function catchFood(jogador, food) {

  if (food.isGood) {
    score += 10;
  } else if (food.isBad) {
    score -= 5;
    vida -= 1;
  }

  scoreText.setText('Pontos: ' + score + '/' + metaDePontos);
  vidaText.setText('❤️  ' + vida);
  food.destroy();

  // Game over
  if (vida <= 0) {
    this.add.image(150, 150, 'gamerover').setDisplaySize(300, 300); // ajusta o tamanho corretamente
    this.physics.pause();
    //timer(deixar o gamer over na tela um pouco antes de voltar para tela inicial)
    game.destroy(true);
    document.querySelector('#menu').style.display = 'flex';
    document.querySelector('main').style.display = 'none';
  }

  // Avançar de fase
  if (score >= metaDePontos) {
    fase++;
    metaDePontos += 150; // a cada fase meta sobe meta antiga +150 pontos
    faseText.setText('Fase ' + fase);
    scoreText.setText('Pontos: ' + score + '/' + metaDePontos);
    comidas.children.iterate(food => {
      food.setVelocityY(Phaser.Math.Between(200 + fase * 20, 300 + fase * 30));
    });
}
}

window.addEventListener('resize', () => {
  game_container.scale.resize(game_container.clientWidth, game_container.clientHeight);
});