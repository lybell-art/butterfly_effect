const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

//initialize app
app.get("/",(req,res)=>{
  res.sendFile("index.html", { root: __dirname+"/public" });
});
app.get("/game",(req,res)=>{
  res.sendFile("game.html", { root: __dirname+"/public" });
});
app.use(express.static('public'));

//socket.io
io.on('connection', function(socket){
  console.log('user connected: ', socket.id);

  const room = getRandomInt(10000,99999);

  socket.room=room;
  socket.join(room);
  socket.emit("Room", room);
  console.log(socket.id, 'is joined to ', socket.room);

  socket.on('Switch_Room', function(roomNo){
    socket.leave(socket.room);
    socket.join(roomNo);
    socket.room = roomNo;
    console.log(socket.id, 'is joined to ', socket.room);
  })

  socket.on('Send_Control', function(v){
//    console.log(socket.room, v.x, v.y);
    socket.broadcast.to(socket.room).emit("Receive_Control", v);
  })

  socket.on('disconnect', function(){
    console.log('user disconnected: ', socket.id);
  });


});

let port = process.env.PORT || 3000;
http.listen(port, function(){ 
  console.log('server on! http://localhost:'+port);
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * Math.floor(max - min)) + min;
}