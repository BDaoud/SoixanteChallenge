const http = require('http')
const fs = require('fs')

// const hostname = '127.0.0.1'
const port = 8080

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
  socket.emit('news', { hello: 'world' })
  socket.on('my other event', function (data) {
    console.log(data)
  })
})

server.listen(port)
