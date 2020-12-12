require('log-timestamp')
const express = require('express')
const app = express()
const port = 3005
const fs = require('fs')
const DB_FILE = './db.json'

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
  debounceTimer = setTimeout(() => persistDb(), 2000)
}

app.get('/register/:name', (req, res) => {
  const { name } = req.params
  console.log('isregistered', name)
  res.status(cache[name] ? HTTP_FOUND : HTTP_NOT_FOUND).send(cache[name])
})

app.post('/register/:name', (req, res) => {
  const { name } = req.params
  const { link } = req.query
  console.log('register', name, link)
  if (cache[name]) {
    res.status(HTTP_FOUND)
  }
  else {
    cache[name] = link
    persistDbDebounced()
  }
  res.send(cache[name])
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
    res.redirect(HTTP_MOVED, destination)
  }
  else {
    res.status(NOT_FOUND).send('Not found')
  }
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})