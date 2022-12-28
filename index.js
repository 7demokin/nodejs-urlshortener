require('dotenv').config();
const express = require('express');
var cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser')

const MONGO_URI = process.env['MONGO_URI']

// Basic Configuration
const port = process.env.PORT || 3000;

const urlRegex = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/)

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: {
    type: String,
    required: true
  },
  short_url: {
    type: Number
  }
})

urlSchema.pre("save",function(next){
    if(this.isNew){
        this.constructor.find({}).then((result) => {
            console.log(result)
            this.short_url = result.length + 1;
            next();
          });
    }
})
const Url = mongoose.model("Url", urlSchema);

const validateUrl = (url) => {
  return urlRegex.test(url)
};

app.use(cors({ optionsSuccessStatus: 200 }));

app.use("/", bodyParser.urlencoded({extended: false}))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post('/api/shorturl', (req,res) => {
  //console.log(req.body)
  if (validateUrl(req.body.url)) {
    Url.create({original_url: req.body.url}, function(err, data) {
    if (err) return console.error(err);
    else {
      console.log(data);
      res.json({ original_url: data.original_url, short_url: data.short_url })
    }
  })
  }else{
    res.json({ error: 'invalid url' })
  }
})

app.get('/api/shorturl/:short_url', (req,res) => {
  Url.findOne({ short_url: req.params.short_url }, function(err, data) {
    if (err) return console.error(err);
    else {
      console.log(data);
      res.writeHead(301, { Location: data.original_url }).end();
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
