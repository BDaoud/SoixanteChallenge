const http = require('http')
const fs = require('fs')
const Twitter = require('twitter')

// const hostname = '127.0.0.1'
const port = 8080

var tracking = '#flash'
var client = new Twitter({
  // Not that safe, to improve
  consumer_key: 'gBW03vbufn6LeLVPBNAQgvFpo',
  consumer_secret: 'zjMb44NkpjSAU5ZuJkHNoLbd6fVrjDZd4EINbjBdrTYmNJ0Mru',
  access_token_key: '566644710-yVwCKSsJV5H23ktftUCYkzv4XHXSQx2Dd5l1fBK1',
  access_token_secret: 'MQxvhiUg07JnHnGC5deOl5YF3JweHjmau1L5h1sXCFhVC'
})

const server = http.createServer((req, res) => {
  fs.readFile('index.html', 'utf-8', function (err, content) {
    if (err) { throw err }
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/html')
    res.end(content)
  })
})

var io = require('socket.io')(server)

io.on('connection', function (socket) {
  client.stream('statuses/filter', {track: tracking}, function (stream) {
    console.log('User logged !')
    stream.on('data', function (tweet) {
      console.log(tweet.text)
    })
    stream.on('error', function (error) {
      throw error
    })
  })
})

server.listen(port)
