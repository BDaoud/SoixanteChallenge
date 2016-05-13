/* global io, PIXI,requestAnimationFrame */

// = VARIABLES ==================
// Options you can set you custom the app
var cloudSpeed = 1
var birdSpeed = 2
var birdSpeedRange = 0.8 // Percent
var birdFallingAcceleration = 1
var birdMinAplitude = 5
var birdMaxAplitude = 50
var birdSinTimer = 30.0
var pointsPerTweets = 200 // -1 for 1pt per character
var GainFadeOutTime = 25.0
var GainFadeOutDist = 50
var TweetFadeOutTime = 10.0
var wingSpeed = 2
var winkDuration = 3
var winkLoop = 100
var winkTimes = [5, 10, 50]
var styleTweet = {
  font: '1em Verdana, Geneva, sans-serif',
  fill: 'rgba(0,0,0,0.5)',
  wordWrap: true,
  wordWrapWidth: 250
}
var styleScore = {
  font: 'bold 2.5em Verdana, Geneva, sans-serif',
  fill: 'white',
  stroke: '#80bfff',
  strokeThickness: 3
}
var styleGains = {
  font: 'bold 2em Verdana, Geneva, sans-serif',
  fill: 'white',
  stroke: '#80bfff',
  strokeThickness: 2
}

// Images parameters (not to change accept if you change the images)
var SpriteSpacing = 0 // betweet the bird and the text
var spriteSize = 100
var stageHeight = 600
var stageWidth = 800

var tweets = []
var gains = []

var renderer = PIXI.autoDetectRenderer(stageWidth, stageHeight, {backgroundColor: 0xffffff})
document.getElementById('game').appendChild(renderer.view)
var stage = new PIXI.Container()

// - Sky ---
var sky = PIXI.Sprite.fromImage('img/sky.jpg')
stage.addChild(sky)
var cloudTexture = PIXI.Texture.fromImage('img/cloud.png')
var clouds = new PIXI.extras.TilingSprite(cloudTexture, renderer.width, renderer.height)
stage.addChild(clouds)

// - Score ---
var score = new PIXI.Text('', styleScore)
score.anchor.x = 0.5
score.x = 400
score.y = 10
stage.addChild(score)

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

// = EVENTS =====================
var socket = io('http://127.0.0.1:8080')

// - on Score -----
socket.on('score', function (amount) {
  score.text = amount + ' points'
})

// - on Tweet -----
socket.on('tweet', onTweet)
function onTweet (text) {
  var tweet = createBird()
  if (pointsPerTweets !== -1) {
    tweet['bird'].points = pointsPerTweets
  } else {
    tweet['bird'].points = text.length
  }
  tweet['text'].text = text
  tweets.push(tweet)
}

// - on Button Down -----
function onButtonDown () {
  var amount = this.points
  showGains(amount, this.x, this.y)
  socket.emit('gain', amount)
  this.interactive = false
  this.timer = 0
  this.texture = textures['body']['crossed']
}

// = ANIMATIONS =================
animate()
function animate () {
  requestAnimationFrame(animate)
  animateSky()
  tweets.forEach(function (tweet, index) {
    animateTweet(tweet, index)
  })
  gains.forEach(function (gain, index) {
    animateGain(gain, index)
  })
  renderer.render(stage)
}

function animateSky () {
  clouds.tilePosition.x += cloudSpeed
}

function animateTweet (tweet, index) {
  tweet['bird'].timer += 1
  var t = tweet['bird'].timer
  var x = tweet['bird'].x
  var y = tweet['bird'].y
  if (!tweet['bird'].interactive) {
    tweet['text'].alpha -= 1.0 / TweetFadeOutTime
    moveBird(tweet, x, y + birdFallingAcceleration * t)
    if (tweet['bird'].y > stageHeight + spriteSize / 2) {
      killBird(index)
    }
  } else {
    // Disappearance
    if (x < -1.5 * spriteSize) {
      killBird(index)
    } else if (x < -0.5 * spriteSize) {
      tweet['text'].alpha -= tweet['bird'].speed / spriteSize
      moveBird(tweet, x - tweet['bird'].speed, tweet['bird'].baseY + tweet['bird'].amplitude * Math.sin(t / birdSinTimer))
    } else {
      // Eyes animation
      var step = tweet['bird'].timer % winkLoop
      if (winkTimes.includes(step)) {
        tweet['bird'].texture = textures['body']['closed']
      } else if (winkTimes.includes(step - winkDuration)) {
        tweet['bird'].texture = textures['body']['base']
      }
      // Wing animation
      if (tweet['bird'].timer % (wingSpeed * 2) === 0) {
        tweet['wing'].texture = textures['wing'][(tweet['bird'].timer % (wingSpeed * 4)) / (wingSpeed * 2)]
      }
      // Moving
      moveBird(tweet, x - tweet['bird'].speed, tweet['bird'].baseY + tweet['bird'].amplitude * Math.sin(t / birdSinTimer))
    }
  }
}

function animateGain (gain, index) {
  gain.alpha -= 1.0 / GainFadeOutTime
  gain.y -= GainFadeOutDist / GainFadeOutTime
  if (gain.alpha <= 0) {
    killSprite(gain)
    gains.splice(index, 1)
  }
}

function moveBird (tweet, x, y) {
  tweet['bird'].x = x
  tweet['bird'].y = y
  tweet['wing'].x = x
  tweet['wing'].y = y
  tweet['text'].x = x + spriteSize / 2 + SpriteSpacing
  tweet['text'].y = y
}

// = SPRITE CREATION ============
function createBird () {
  var bird = new PIXI.Sprite(textures['body']['base'])
  bird.anchor.x = 0.5
  bird.anchor.y = 0.5
  bird.interactive = true
  bird
    .on('mousedown', onButtonDown)
    .on('touchstart', onButtonDown)
  bird.timer = 0
  bird.baseY = 100 + (stageHeight - 150) * Math.random()
  bird.amplitude = birdMinAplitude + (birdMaxAplitude - birdMinAplitude) * Math.random() // 5~50
  bird.speed = (1.0 - birdSpeedRange + (2 * birdSpeedRange) * Math.random()) * birdSpeed // 60%~140% of birdSpeed
  stage.addChild(bird)
  var wing = new PIXI.Sprite(textures['wing'][0])
  wing.anchor.x = 0.5
  wing.anchor.y = 0.5
  stage.addChild(wing)
  var text = new PIXI.Text('', styleTweet)
  text.anchor.y = 0.5
  stage.addChild(text)
  var tweet = { bird: bird, wing: wing, text: text }
  moveBird(tweet, stageWidth + spriteSize / 2, bird.baseY)
  return tweet
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

// = SPRITE DESTRUCTION =========
function killSprite (sprite) {
  sprite.destroy
  stage.removeChild(sprite)
}

function killBird (index) {
  killSprite(tweets[index]['bird'])
  killSprite(tweets[index]['wing'])
  killSprite(tweets[index]['text'])
  tweets.splice(index, 1)
}
