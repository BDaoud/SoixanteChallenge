/* global io, PIXI,requestAnimationFrame */

var birdSpeed = 2

var tweets = []
var gains = []

var renderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor: 0xffffff})
document.getElementById('game').appendChild(renderer.view)
var stage = new PIXI.Container()

// - Sky ---
var sky = PIXI.Sprite.fromImage('img/sky.jpg')
stage.addChild(sky)
var cloudTexture = PIXI.Texture.fromImage('img/cloud.png')
var clouds = new PIXI.extras.TilingSprite(cloudTexture, renderer.width, renderer.height)
stage.addChild(clouds)

// - Score ---
var style = {
  font: 'bold 2.5em Verdana, Geneva, sans-serif',
  fill: 'white',
  stroke: '#80bfff',
  strokeThickness: 3
}
var score = new PIXI.Text('', style)
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

var styleTweet = {
  font: '1em Arial',
  fill: '#666',
  wordWrap: true,
  wordWrapWidth: 250
  // stroke: 'rgba(0,127,255,0.2)',
  // strokeThickness: 2
}

socket.on('tweet', function (tweet) {
  var baseY = 100 + 450 * Math.random()
  var bird = new PIXI.Sprite(textures['body']['base'])
  bird.anchor.x = 0.5
  bird.anchor.y = 0.5
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
  stage.addChild(wing)
  var text = new PIXI.Text(tweet.text, styleTweet)
  text.anchor.y = 0.5
  stage.addChild(text)
  tweets.push({bird: bird, wing: wing, text: text, baseY: baseY})
  moveBird(tweets[tweets.length - 1], 900, baseY)
})

// - Interactivity & Animation ---
function onButtonDown () {
  var amount = this.points
  showGains(amount, this.x, this.y)
  socket.emit('gain', amount)
  this.interactive = false
  this.timer = 0
  this.texture = textures['body']['crossed']
}

var styleGains = {
  font: 'bold 2em Verdana, Geneva, sans-serif',
  fill: 'white',
  stroke: '#80bfff',
  strokeThickness: 2
}
function showGains (amount, x, y) {
  var gain = new PIXI.Text(amount, styleGains)
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
  clouds.tilePosition.x += 1
  tweets.forEach(function (tweet, index) {
    if (!tweet['bird'].interactive) {
      tweet['bird'].timer += 1
      tweet['text'].alpha -= 0.1
      moveBird(tweet, tweet['bird'].x, tweet['bird'].y + tweet['bird'].timer)
      if (tweet['bird'].y > 700) {
        killBird(index)
      }
    } else {
      // Eyes animation
      var step = tweet['bird'].timer % 50
      if (step === 7 || step === 11) {
        tweet['bird'].texture = textures['body']['closed']
      } else if (step === 9 || step === 13) {
        tweet['bird'].texture = textures['body']['base']
      }
      // Wing animation
      if (tweet['bird'].timer % 4 === 0) {
        tweet['wing'].texture = textures['wing'][(tweet['bird'].timer % 8) / 4]
      }
      tweet['bird'].timer += 1
      moveBird(tweet, tweet['bird'].x - birdSpeed, tweet['baseY'] + 30 * Math.sin(tweet['bird'].timer / 30.0))
      if (tweet['bird'].x < -350) {
        killBird(index)
      }
    }
  })
  gains.forEach(function (gain, index) {
    gain.alpha -= 0.04
    gain.y -= 2
    if (gain.alpha <= 0) {
      gain.destroy()
      stage.removeChild(gain)
      gains.splice(index, 1)
    }
  })
  renderer.render(stage)
}

function killBird (index) {
  tweets[index]['bird'].destroy
  tweets[index]['wing'].destroy
  tweets[index]['text'].destroy
  stage.removeChild(tweets[index]['bird'])
  stage.removeChild(tweets[index]['wing'])
  stage.removeChild(tweets[index]['text'])
  tweets.splice(index, 1)
}

function moveBird (tweet, x, y) {
  tweet['bird'].x = x
  tweet['bird'].y = y
  tweet['wing'].x = x
  tweet['wing'].y = y
  tweet['text'].x = x + 50
  tweet['text'].y = y
}
