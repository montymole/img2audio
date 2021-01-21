const http = require('http')
const fs = require('fs')

const files = {
  '/wfplayer.js': '/node_modules/wfplayer/dist/wfplayer.js',
  '/riff.js': '/js/riff.js',
  '/main.js': '/js/main.js'
}

const ctype = {
  'js': 'text/javascript',
  'html': 'text/html'
}

http.createServer((req, res) => {
  const p = files[req.url] || '/index.html';
  const t = p.split('.')[1];
  res.writeHead(200, { 'content-type': ctype[t] })
  fs.createReadStream(__dirname + p).pipe(res)
}).listen(process.env.PORT || 3000)


