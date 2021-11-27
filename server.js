require("dotenv").config()
const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const bodyParser = require("body-parser")
const dns = require("dns")
const URL = require("url").URL
const shortid = require("shortid")

const app = express()
// eslint-disable-next-line no-undef
mongoose.connect(process.env.MONGO_URI)

const { Schema } = mongoose
const urlPairSchema = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true }
})
const UrlPair = mongoose.model("UrlPair", urlPairSchema)

const parser = bodyParser.urlencoded({ extended: false })

// Basic Configuration
// eslint-disable-next-line no-undef
const port = process.env.PORT || 3000

app.use(cors())

// eslint-disable-next-line no-undef
app.use("/public", express.static(`${process.cwd()}/public`))

app.get("/", function (req, res) {
  // eslint-disable-next-line no-undef
  res.sendFile(process.cwd() + "/views/index.html")
})

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" })
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`)
})

app.post("/api/shorturl", parser, (req, res) => {
  const originalUrl = req.body.url

  try {
    const urlObject = new URL(originalUrl)

    if (urlObject.protocol == "http:" || urlObject.protocol == "https:") {

      // eslint-disable-next-line no-unused-vars
      dns.lookup(urlObject.hostname, (err, address, family) => {
        if (err) {
          res.json({ error: "Invalid Hostname" })
          return
        }

        urlProcessing(originalUrl, res)
      })

    } else {
      res.json({ error: "invalid url" })
    }
  } catch (e) {
    res.json({ error: "invalid url" })
  }
})

function urlProcessing(originalUrl, res) {
  UrlPair.findOne({ original_url: originalUrl }, (err, data) => {
    if (err) return console.error(err)

    if (data == null) {
      const shortUrl = shortid.generate()
      const urlPair = new UrlPair({
        original_url: originalUrl,
        short_url: shortUrl
      })

      urlPair.save((err) => {
        if (err) return console.error(err)
      })

      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      })
    } else {
      const { original_url: originalUrl, short_url: shortUrl } = data

      res.json({ original_url: originalUrl, short_url: shortUrl })
    }
  })
}

app.get("/api/shorturl/:endpoint", (req, res) => {
  UrlPair.findOne({ short_url: req.params.endpoint }, (err, data) => {
    if (err) return console.error(err)

    if (data == null) {
      res.json({ error: "No short URL found for the given input" })
    } else {
      res.redirect(data.original_url)
    }
  })
})