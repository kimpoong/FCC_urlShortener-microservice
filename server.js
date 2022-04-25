require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const validUrl = require('valid-url');
const app = express();

// use database
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true
});
const { Schema } = mongoose;
const urlSchema = new Schema({
  original_url: String,
  short_url: Number
});
const urlModel = mongoose.model('url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint

app.post('/api/shorturl', async (req, res) => {
  const originalUrl = req.body.url;
  if (!validUrl.isHttpUri(originalUrl) && !validUrl.isHttpsUri(originalUrl)) {
    res.json({ error: 'invalid url' });
  } else {
    let result = await urlModel.findOne({
      original_url: originalUrl
    });
    if (result) {
      res.json({
        original_url: result.original_url,
        short_url: result.short_url
      });
    } else {
      result = await urlModel.findOne().sort({ short_url: 'desc' }).exec();
      let shortUrl = 0;
      if (result) shortUrl = result.short_url;
      let new_doc = new urlModel({
        original_url: originalUrl,
        short_url: (shortUrl + 1)
      });
      await new_doc.save();
      res.json({
        original_url: new_doc.original_url,
        short_url: new_doc.short_url
      });
    }
  }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const urlParams = await urlModel.findOne({
    short_url: req.params.short_url
  });
  if (urlParams) {
    res.redirect(urlParams.original_url);
  } else {
    res.json({ error: "No short URL found for the given input" });
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
