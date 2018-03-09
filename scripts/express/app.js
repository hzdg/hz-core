var express = require('express');
var app = express();

app.get('/', function (req, res) {
  res.send('This is the end!');
})

app.listen(5000);
