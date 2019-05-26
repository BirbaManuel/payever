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
const Promise = require('bluebird') // middleware to use Promise on request

//begin handle file path on server
const { promisify } = require('util')
const ensureDirectory = promisify(require('mkdirp'))
const sanitize = require('sanitize-filename')
const path = require('path')
const fs = require('fs')
//end handle file path on server

fetch.Promise = Promise
// Promise.promisifyAll(fs)
const readFileAsync = promisify(fs.readFile)
const config = { port: 8000 }
const uploadPath = path.join(__dirname, 'uploads')
const processedRequest = [] // contain all the request already handle
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
    { secret: 'payever', resave: true, saveUninitialized: true },
    {
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, //24h valide session
    }
  )
)
app.use(flash())

app.get('/api/user/:userId', handleUserApi)
app.get('/api/user/:userId/avatar', handleUserAvatarApi)
app.delete('/api/user/:userId/avatar', handleUserAvatarApiDelete)

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
  console.log(processedRequest)
  if (
    processedRequest.some((el, i, aray) => {
      return aray.includes(el)
    })
  ) {
    console.log('url already proceed')
  }
  const param = req.params.userId
  const url = baseURLAPI
  const fullUrl = `${url}${param}`
  await fetch(fullUrl)
    .then(res => res.json())
    .then(json => {
      res.status(200).json(json) //User Data Representation
    })
    .catch(error => {
      res.status(404).json(error) //User Data Representation not found
    })
}

async function handleUserAvatarApi(req, res) {
  const param = req.params.userId
  const url = baseURLAPI
  const fullUrl = `${url}${param}`
  const urlAvatarString = await fetch(fullUrl)
    .then(result => result.json())
    .then(urlAvatar => {
      const { avatar } = urlAvatar['data']
      return avatar
    })
    .catch(error => {
      res.status(404).json(error) //URL Avatar not found
    })
  const filename = urlAvatarString.split('/')[
    urlAvatarString.split('/').length - 1
  ]
  await fetch(urlAvatarString)
    .then(async resultat => {
      const result = fs.createWriteStream(filename)
      ;(await resultat.body.pipe(result)) /
        encodeImageBase64(filename).then(strData => {
          processedRequest.push({ fullUrl: strData })
          res
            .status(200)
            .json({ succes: 'got user ' + param + ' avatar !', data: strData })
        })
    })
    .catch(error => {
      res.status(404).json(error) //User Avatar not found
    })
}

async function handleUserAvatarApiDelete(req, res) {
  const param = req.params.userId
  const url = baseURLAPI
  const fullUrl = `${url}${param}`
  const urlAvatarString = await fetch(fullUrl)
    .then(result => result.json())
    .then(urlAvatar => {
      const { avatar } = urlAvatar['data']
      return avatar
    })
    .catch(error => {
      res.status(404).json(error) //URL Avatar not found
    })
  const filename = urlAvatarString.split('/')[
    urlAvatarString.split('/').length - 1
  ]
  //remove file
  fs.unlink(filename, function(err) {
    if (err) throw err
    console.log('File deleted!' + filename)
    res.status(200).json({
      succes: 'got user ' + param + ' remove his avatar! ' + filename + ' !',
    })
  })
}

const encodeImageBase64 = async path => {
  const res = await readFileAsync(path)
  const data = res.toString('base64')
  return data
}
http.Server(app).listen(config.port, function() {
  console.log(
    chalk`{green ✔ Server listening on port} {cyan ${config.port}} !!!`
  )
})
