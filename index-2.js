var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ColorThief = require('color-thief');


app.get('/', function(req, res){
  res.sendfile('index.html');
  
});

	
io.on('connection', function(socket){
  //reading the file


});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


