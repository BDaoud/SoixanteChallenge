/* global io, PIXI,requestAnimationFrame */

// = VARIABLES ==================
// Options you can set you custom the app
var pointsPerTweets = 200 // -1 for 1pt per character
var maxAmountOfBirds = 50 // -1 for no limit
// - Speed vars -----
var cloudSpeed = 1
var birdSpeed = 2
var birdSpeedRange = 0.8 // Percent
var birdFallingAcceleration = 1
var birdMinAplitude = 5
var birdMaxAplitude = 50
// - Animation vars -----
var birdSinTimer = 30.0
var GainFadeOutTime = 25.0
var GainFadeOutDist = 50
var TweetFadeOutTime = 10.0
var wingSpeed = 2
var winkDuration = 3
var winkLoop = 100
var winkTimes = [5, 10, 50]
// - Style vars -----
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
var SpriteSpacing = 0 // between the bird and the text
var spriteSize = 100
var stageHeight = 600
var stageWidth = 800

// = ASSETS LOADING =============
PIXI.loader
  .add('sky', 'img/sky.jpg')
  .add('cloud', 'img/cloud.png')
  .add('birdbody_base', 'img/birdbody_base.png')
  .add('birdbody_closed', 'img/birdbody_closed.png')
  .add('birdbody_crossed', 'img/birdbody_crossed.png')
  .add('birdwing_1', 'img/birdwing_1.png')
  .add('birdwing_2', 'img/birdwing_2.png')
  .load(onAssetsLoaded)

// - Texture vars -----
var skyTexture
var cloudTexture
var birdTextures

// - onAssetsLoaded -----
function onAssetsLoaded (loader, resources) {
  skyTexture = resources['sky'].texture
  cloudTexture = resources['cloud'].texture
  birdTextures = {
    body: {
      base: resources['birdbody_base'].texture,
      closed: resources['birdbody_closed'].texture,
      crossed: resources['birdbody_crossed'].texture
    },
    wing: [
      resources['birdwing_1'].texture,
      resources['birdwing_2'].texture
    ]
  }
  initializeStage()
}

// = INITIALIZATION =============
var renderer
var stage

// - Sprite vars -----
var tweets = []
var gains = []
var clouds
var score
var sky

// - initializeStage -----
function initializeStage () {
  renderer = PIXI.autoDetectRenderer(stageWidth, stageHeight, {backgroundColor: 0xffffff})
  document.getElementById('game').appendChild(renderer.view)
  stage = new PIXI.Container()
  sky = new PIXI.Sprite(skyTexture)
  stage.addChild(sky)
  clouds = new PIXI.extras.TilingSprite(cloudTexture, renderer.width, renderer.height)
  stage.addChild(clouds)
  score = new PIXI.Text('', styleScore)
  score.anchor.x = 0.5
  score.x = 400
  score.y = 10
  stage.addChild(score)
  socket.on('score', onScore)
  socket.on('tweet', onTweet)
  requestAnimationFrame(animate)
}

// = EVENTS =====================
var socket = io('http://127.0.0.1:8080')

// - on Score -----
function onScore (amount) {
  score.text = amount + ' points'
}

// - on Tweet -----
function onTweet (text) {
  if (tweets.length >= maxAmountOfBirds && maxAmountOfBirds !== -1) {
    return false
  }
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
  this.texture = birdTextures['body']['crossed']
}

// = ANIMATIONS =================
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

// - Sky animation -----
function animateSky () {
  clouds.tilePosition.x += cloudSpeed
}

// - Tweet animation -----
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
        tweet['bird'].texture = birdTextures['body']['closed']
      } else if (winkTimes.includes(step - winkDuration)) {
        tweet['bird'].texture = birdTextures['body']['base']
      }
      // Wing animation
      if (tweet['bird'].timer % (wingSpeed * 2) === 0) {
        tweet['wing'].texture = birdTextures['wing'][(tweet['bird'].timer % (wingSpeed * 4)) / (wingSpeed * 2)]
      }
      // Moving
      moveBird(tweet, x - tweet['bird'].speed, tweet['bird'].baseY + tweet['bird'].amplitude * Math.sin(t / birdSinTimer))
    }
  }
}

// - Gain animation -----
function animateGain (gain, index) {
  gain.alpha -= 1.0 / GainFadeOutTime
  gain.y -= GainFadeOutDist / GainFadeOutTime
  if (gain.alpha <= 0) {
    killSprite(gain)
    gains.splice(index, 1)
  }
}

// - Bird movement -----
function moveBird (tweet, x, y) {
  tweet['bird'].x = x
  tweet['bird'].y = y
  tweet['wing'].x = x
  tweet['wing'].y = y
  tweet['text'].x = x + spriteSize / 2 + SpriteSpacing
  tweet['text'].y = y
}

// = SPRITE CREATION ============
// - Bird creation -----
function createBird () {
  var bird = new PIXI.Sprite(birdTextures['body']['base'])
  bird.anchor.x = 0.5
  bird.anchor.y = 0.5
  bird.interactive = true
  bird
    .on('mousedown', onButtonDown)
    .on('touchstart', onButtonDown)
  bird.timer = 0
  bird.baseY = 100 + (stageHeight - 150) * Math.random()
  bird.amplitude = birdMinAplitude + (birdMaxAplitude - birdMinAplitude) * Math.random() // 5~50
  bird.speed = (1.0 - birdSpeedRange / 2 + birdSpeedRange * Math.random()) * birdSpeed // 60%~140% of birdSpeed
  stage.addChild(bird)
  var wing = new PIXI.Sprite(birdTextures['wing'][0])
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

// - Gain creation -----
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
// - Generic -----
function killSprite (sprite) {
  sprite.destroy
  stage.removeChild(sprite)
}

// - For tweets -----
function killBird (index) {
  killSprite(tweets[index]['bird'])
  killSprite(tweets[index]['wing'])
  killSprite(tweets[index]['text'])
  tweets.splice(index, 1)
}
