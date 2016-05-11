/* global io, PIXI,requestAnimationFrame */

var tweets = []
var gains = []

var renderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor: 0x1099bb})
document.body.appendChild(renderer.view)
var stage = new PIXI.Container()

var style = {
  font: 'bold 2.5em Arial',
  fill: 'white',
  stroke: 'black',
  strokeThickness: 5
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
  var tweet = new PIXI.Text(tweet.text, {font: '2em', wordWrap: true})
  tweet.anchor.x = 0.5
  tweet.anchor.y = 0.5
  tweet.x = 50 + 700 * Math.random()
  tweet.y = 50 + 500 * Math.random()
  tweet.interactive = true
  tweet
    .on('mousedown', onButtonDown)
    .on('touchstart', onButtonDown)
  stage.addChild(tweet)
  tweets.push(tweet)
})

function onButtonDown () {
  var tweet = this
  var amount = this.text.length
  showGains(amount, this.x, this.y)
  socket.emit('gain', amount)
  tweet.interactive = false
  tweet.scale.x += 0.3
  tweet.scale.y += 0.3
  tweet.alpha = 1
  setTimeout(function () {
    tweet.alpha = 0
    tweet.destroy()
  }, 250)
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
    if (tweet.interactive) {
      tweet.alpha -= 0.01
      if (tweet.alpha <= 0) {
        tweet.destroy
        tweet.interactive = false
        tweets.splice(index, 1)
        console.log(tweets.length)
      }
    }
  })
  gains.forEach(function (gain, index) {
    gain.alpha -= 0.02
    gain.y -= 1
    if (gain.alpha <= 0) {
      gain.alpha = 0
      gain.destroy()
      gains.splice(index, 1)
    }
  })
  renderer.render(stage)
}
