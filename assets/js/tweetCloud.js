/* global io, PIXI,requestAnimationFrame */

var tweets = []
var renderer = PIXI.autoDetectRenderer(800, 600, {backgroundColor: 0x1099bb})
document.body.appendChild(renderer.view)
var stage = new PIXI.Container()

var socket = io('http://127.0.0.1:8080')
socket.on('tweet', function (tweet) {
  console.log(tweet.text)
  var tweet = new PIXI.Text(tweet.text, {font: '2em', wordWrap: true})
  tweet.anchor.x = 0.5
  tweet.anchor.y = 0.5
  tweet.x = 50 + 700 * Math.random()
  tweet.y = 50 + 500 * Math.random()
  stage.addChild(tweet)
  tweets.push(tweet)
})

animate()
function animate () {
  requestAnimationFrame(animate)
  tweets.forEach(function (tweet) {
    tweet.alpha -= 0.01
    if (tweet.alpha <= 0) {
      tweet.destroy
    }
  })
  renderer.render(stage)
}