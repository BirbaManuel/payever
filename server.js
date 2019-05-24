const express = require('express')
const http = require('http')
const app = express()
const logger = require('morgan') // add server log for dev runtime
const chalk = require('chalk') // add some cool color to your log
const bodyParser = require('body-parser') //to do : add multer for more fct in parsing data from request
const assert = require('assert') //library to do unit test
const session = require('express-session') // need this module to use flash
const flash = require('connect-flash') //middleware connect-flash : temporary messages
const fetch = require('node-fetch') //middleware to fetch other url
const Bluebird = require('bluebird') // middleware to use Promise on request

//begin handle file path on server
const { promisify } = require('util')
const ensureDirectory = promisify(require('mkdirp'))
const sanitize = require('sanitize-filename')
const path = require('path')
const fs = require('fs')
//end handle file path on server

fetch.Promise = Bluebird
const config = { port: 8000 }

const urlencodedParser = bodyParser.urlencoded({ extended: true })
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  )
  next()
})
app.use(
  session(
    { secret: 'payever' },
    {
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, //24h valide session
    }
  )
)
app.use(flash())

app.get('/api/user/:userId', handleUserApi)
app.get('/api/user/:userId/avatar', handleUserAvatarApi)

app.use(function(req, res, next) {
  res.status(404).json({
    error: `sorry your request method
      ${req.method}
       forward
      ${req.originalUrl}
       not match…`,
  })
})

const baseURLAPI = `https://reqres.in/api/users/`
async function handleUserApi(req, res) {
  const param = req.params.userId
  const url = baseURLAPI
  const fullUrl = `${url}${param}`
  await fetch(fullUrl)
    .then(res => res.json())
    .then(json => {
      res.status(200).json(json) //User Data Representation
    })
}

async function handleUserAvatarApi(req, res) {
  const param = req.params.userId
  const url = baseURLAPI
  const fullUrl = `${url}${param}`
  const urlAvatarString = await fetch(fullUrl)
    .then(res => res.json())
    .then(urlAvatar => {
      const { avatar } = urlAvatar['data']
      return avatar
    })
  await fetch(urlAvatarString)
    //.then(res => res.json())
    .then(imgAvatar => {
      console.log(imgAvatar)
      //return imgAvatar
    })
  res.status(200).json({ succes: 'got user ' + param + ' avatar !' })
}

http.Server(app).listen(config.port, function() {
  console.log(
    chalk`{green ✔ Server listening on port} {cyan ${config.port}} !!!`
  )
})
