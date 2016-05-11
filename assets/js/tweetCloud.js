/* global io, PIXI,requestAnimationFrame */

var birdSpeed = 10

var tweets = []
var gains = []

var renderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor: 0xc4dcf5})
document.getElementById('game').appendChild(renderer.view)
var stage = new PIXI.Container()
var texture = PIXI.Texture.fromImage('img/birdy.png')

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

socket.on('tweet', function (tweet) {
  // console.log(tweet.text)
  var baseY = 100 + 450 * Math.random()
  var bird = new PIXI.Sprite(texture)
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
  var text = new PIXI.Text(tweet.text, {font: '2em', wordWrap: true, wordWrapWidth: 250})
  text.anchor.y = 0.5
  text.x = 800 + 100 + 10
  text.y = baseY
  stage.addChild(text)
  tweets.push({bird: bird, text: text, baseY: baseY})
})

function onButtonDown () {
  var amount = this.points
  showGains(amount, this.x, this.y)
  socket.emit('gain', amount)
  this.interactive = false
  this.touched = true
  this.timer = 0
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
      tweet['text'].y += 10 + 3 * tweet['bird'].timer
      tweet['bird'].y += 10 + 3 * tweet['bird'].timer
      if (tweet['bird'].y > 700) {
        tweet['bird'].destroy
        tweet['text'].destroy
        tweets.splice(index, 1)
      }
    } else {
      tweet['bird'].timer += 1
      tweet['bird'].x -= birdSpeed
      tweet['bird'].y = tweet['baseY'] + 30 * Math.sin(tweet['bird'].timer / 30.0)
      tweet['text'].x -= birdSpeed
      tweet['text'].y = tweet['bird'].y
      if (tweet['bird'].x < -350) {
        tweet['bird'].destroy
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
