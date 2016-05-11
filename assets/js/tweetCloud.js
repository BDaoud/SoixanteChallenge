/* global io, PIXI,requestAnimationFrame */

var birdSpeed = 2

var tweets = []
var gains = []

var renderer = PIXI.autoDetectRenderer(800, 600)
document.getElementById('game').appendChild(renderer.view)
var stage = new PIXI.Container()

// - Sky ---
var sky = PIXI.Sprite.fromImage('img/sky.jpg')
stage.addChild(sky)

// - Score ---
var style = {
  font: 'bold 2.5em Arial',
  fill: 'white',
  stroke: 'black',
  strokeThickness: 3
}
var score = new PIXI.Text('0 point', style)
score.anchor.x = 0.5
score.x = 400
score.y = 10
stage.addChild(score)

var socket = io('http://127.0.0.1:8080')
socket.on('score', function (amount) {
  score.text = amount + ' points'
})

// - Tweets ---
var textures = {
  body: {
    base: PIXI.Texture.fromImage('img/birdbody_base.png'),
    closed: PIXI.Texture.fromImage('img/birdbody_closed.png'),
    crossed: PIXI.Texture.fromImage('img/birdbody_crossed.png')
  },
  wing: [
    PIXI.Texture.fromImage('img/birdwing_1.png'),
    PIXI.Texture.fromImage('img/birdwing_2.png')
  ]
}

socket.on('tweet', function (tweet) {
  var baseY = 100 + 450 * Math.random()
  var bird = new PIXI.Sprite(textures['body']['base'])
  bird.anchor.x = 0.5
  bird.anchor.y = 0.5
  bird.x = 800 + 50
  bird.y = baseY
  bird.touched = false
  bird.interactive = true
  bird
    .on('mousedown', onButtonDown)
    .on('touchstart', onButtonDown)
  bird.points = tweet.text.length
  bird.timer = 0
  stage.addChild(bird)
  var wing = new PIXI.Sprite(textures['wing'][0])
  wing.anchor.x = 0.5
  wing.anchor.y = 0.5
  wing.x = 800 + 50
  wing.y = baseY
  stage.addChild(wing)
  var style = {
    font: '1em Arial',
    fill: 'white',
    wordWrap: true,
    wordWrapWidth: 250,
    stroke: '#c0defb',
    strokeThickness: 1
  }
  var text = new PIXI.Text(tweet.text, style)
  text.anchor.y = 0.5
  text.x = 800 + 100 + 10
  text.y = baseY
  stage.addChild(text)
  tweets.push({bird: bird, wing: wing, text: text, baseY: baseY})
})

// - Interactivity & Animation ---
function onButtonDown () {
  var amount = this.points
  showGains(amount, this.x, this.y)
  socket.emit('gain', amount)
  this.interactive = false
  this.touched = true
  this.timer = 0
  this.texture = textures['body']['crossed']
}

function showGains (amount, x, y) {
  var style = {
    font: 'bold 2em Arial',
    fill: 'white',
    stroke: 'black',
    strokeThickness: 5
  }
  var gain = new PIXI.Text(amount, style)
  gain.anchor.x = 0.5
  gain.anchor.y = 1.0
  gain.x = x
  gain.y = y
  stage.addChild(gain)
  gains.push(gain)
}

animate()
function animate () {
  requestAnimationFrame(animate)
  tweets.forEach(function (tweet, index) {
    if (tweet['bird'].touched) {
      tweet['bird'].timer += 1
      tweet['text'].alpha -= 0.1
      tweet['bird'].y += tweet['bird'].timer
      tweet['text'].y = tweet['bird'].y
      tweet['wing'].y = tweet['bird'].y
      if (tweet['bird'].y > 700) {
        tweet['bird'].destroy
        tweet['wing'].destroy
        tweet['text'].destroy
        tweets.splice(index, 1)
      }
    } else {
      // Eyes animation
      var step = tweet['bird'].timer % 50
      if (step == 7 || step == 11) {
        tweet['bird'].texture = textures['body']['closed']
      } else if (step == 9 || step == 13) {
        tweet['bird'].texture = textures['body']['base']
      }
      // Wing animation
      if (tweet['bird'].timer % 4 == 0) {
        tweet['wing'].texture = textures['wing'][(tweet['bird'].timer % 8) / 4]
      }
      tweet['bird'].timer += 1
      tweet['bird'].x -= birdSpeed
      tweet['bird'].y = tweet['baseY'] + 30 * Math.sin(tweet['bird'].timer / 30.0)
      tweet['wing'].x -= birdSpeed
      tweet['wing'].y = tweet['bird'].y
      tweet['text'].x -= birdSpeed
      tweet['text'].y = tweet['bird'].y
      if (tweet['bird'].x < -350) {
        tweet['bird'].destroy
        tweet['wing'].destroy
        tweet['text'].destroy
        tweets.splice(index, 1)
      }
    }
  })
  gains.forEach(function (gain, index) {
    gain.alpha -= 0.05
    gain.y -= 2
    if (gain.alpha <= 0) {
      gain.alpha = 0
      gain.destroy()
      gains.splice(index, 1)
    }
  })
  renderer.render(stage)
}
