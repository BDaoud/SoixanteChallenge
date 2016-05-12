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

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})
app.use(express.static('assets'))

io.on('connection', function (socket) {
  socket.emit('score', score)
  client.stream('statuses/filter', {track: tracking}, function (stream) {
    stream.on('data', function (tweet) {
      socket.emit('tweet', tweet)
    })
    stream.on('error', function (error) {
      io.emit('disconnected');
      throw error
    })
  })
  socket.on('gain', function (gain) {
    score += gain
    socket.emit('score', score)
  })
  socket.on('disconnect', function () {
    io.emit('disconnected');
  });
})
