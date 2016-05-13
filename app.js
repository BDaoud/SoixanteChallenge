const express = require('express')
const path = require('path')
const config = require('./config.json')

const Twitter = require('twitter')
var client = new Twitter({
  // Not that safe, to improve
  consumer_key: config['twitter']['consumer_key'],
  consumer_secret: config['twitter']['consumer_secret'],
  access_token_key: config['twitter']['access_token_key'],
  access_token_secret: config['twitter']['access_token_secret']
})
var tracking = config['tracking']

var score = 0

var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
server.listen(config['port'])
.on('listening', () => {
  console.log('Server listening at localhost:' + config['port'])
})
.on('error', (err) => {
  throw err
})

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})
.use(express.static('assets'))

client.stream('statuses/filter', {track: tracking}, function (stream) {
  console.log('Twitter streaming, tracking the word "' + tracking + '"')
  stream.on('data', function (tweet) {
    if (tweet.text) {
      io.emit('tweet', tweet.text)
    }
  })
  stream.on('error', function (error) {
    throw error
  })
})

io.on('connection', function (socket) {
  socket.emit('score', score)
  socket.on('gain', function (gain) {
    score += gain
    socket.emit('score', score)
  })
})
