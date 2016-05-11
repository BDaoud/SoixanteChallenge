const express = require('express')
const path = require('path')

// const hostname = '127.0.0.1'
const port = 8080

const Twitter = require('twitter')
var tracking = '#flash'
var client = new Twitter({
  // Not that safe, to improve
  consumer_key: 'gBW03vbufn6LeLVPBNAQgvFpo',
  consumer_secret: 'zjMb44NkpjSAU5ZuJkHNoLbd6fVrjDZd4EINbjBdrTYmNJ0Mru',
  access_token_key: '566644710-yVwCKSsJV5H23ktftUCYkzv4XHXSQx2Dd5l1fBK1',
  access_token_secret: 'MQxvhiUg07JnHnGC5deOl5YF3JweHjmau1L5h1sXCFhVC'
})

var app = express()
var server = require('http').Server(app)
var io = require('socket.io')(server)
server.listen(port)

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'))
})
app.use(express.static('assets'))

io.on('connection', function (socket) {
  client.stream('statuses/filter', {track: tracking}, function (stream) {
    console.log('User logged !')
    stream.on('data', function (tweet) {
      console.log(tweet.text)
      socket.emit('tweet', tweet)
    })
    stream.on('error', function (error) {
      throw error
    })
  })
})
