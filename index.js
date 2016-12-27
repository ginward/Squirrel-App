var fs = require('fs');
var express = require('express');
var app = express();
var https = require('https');
var http = require('http');
var privateKey  = fs.readFileSync('/etc/letsencrypt/live/www.duedue.xyz/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/www.duedue.xyz/cert.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var path = require('path');
app.all('*', ensureSecure); // at top of routing calls
app.use(express.static(path.join(__dirname, 'public')));
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(443);
http.createServer(app).listen(80);
function ensureSecure(req, res, next){
  if(req.secure){
    // OK, continue
    return next();
  };
  // handle port numbers if you need non defaults
  // res.redirect('https://' + req.host + req.url); // express 3.x
  res.redirect('https://' + req.hostname + req.url); // express 4.x
};
