require('log-timestamp')
const express = require('express')
const app = express()
const port = 3005
const fs = require('fs')
const DB_FILE = process.env.DB_FILE || './db.json'
const DEBOUNCE_TIME = 2000

console.log('Using DB_FILE', DB_FILE)

const HTTP_MOVED = 301
const HTTP_FOUND = 302
const HTTP_NOT_FOUND = 404

let cache = {}

function loadDb() {
  fs.readFile(DB_FILE, 'utf8', function (err, data) {
    if (err) {
      return console.log(err)
    }
    cache = JSON.parse(data)
  })
}

loadDb()

function persistDb() {
  fs.writeFile(DB_FILE, JSON.stringify(cache), function (err, data) {
    if (err) {
      return console.log(err)
    }
    console.log('written')
  })
}

let debounceTimer
function persistDbDebounced() {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => persistDb(), DEBOUNCE_TIME)
}

app.get('/register/:name', (req, res) => {
  const { name } = req.params
  const link = cache[name] ? cache[name].link : ''
  res.status(link ? HTTP_FOUND : HTTP_NOT_FOUND).send(link)
})

app.post('/register/:name', (req, res) => {
  const { name } = req.params
  const { link } = req.query
  const userIp = req.headers['x-forwarded-for']
  const userAgent = req.get('User-Agent')

  console.log('register', name, link)
  if (cache[name]) {
    res.status(HTTP_FOUND)
  }
  else {
    cache[name] = { link, userIp, userAgent }
    persistDbDebounced()
  }
  res.send(cache[name].link)
})

app.get('/all', (req, res) => {
  res.send(JSON.stringify(cache))
})

app.use(express.static('public'));

app.get('/:other', (req, res) => {
  const { other } = req.params
  const destination = cache[other]
  console.log(`301 ${other} -> ${destination}`)
  if (destination) {
    res.redirect(HTTP_MOVED, destination.link)
  }
  else {
    res.status(HTTP_NOT_FOUND).send('Not found')
  }
})



if (!module.parent) {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })
}

module.exports = {
  server: app,
  DEBOUNCE_TIME,
  DB_FILE,
  cleanCache: () => {
    cache = {}
    fs.writeFileSync(DB_FILE, '{}')
  }
}; // for testing purspose
