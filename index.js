var express = require('express');
var app = express();
var path = require('path');
app.use(express.static(path.join(__dirname, 'public')));
app.listen(81, function () {
  console.log('Example app listening on port 81!')
})