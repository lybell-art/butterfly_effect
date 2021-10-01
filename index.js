const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
let performerRooms={};

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

  //initial Room
  const room = getRandomInt(10000,99999);

  socket.room=room;
  socket.join(room);
  socket.emit("Room", room);
  console.log(socket.id, 'is joined to ', socket.room);

  //create Room-Performer side
  socket.on('Create_Room', function(){
    performerRooms[socket.id]=socket.room;
    console.log(socket.room, 'is created');
    console.log('current rooms are :', performerRooms);
  });

  //join Room-Audience side
  socket.on('Switch_Room', function(roomNo){
    if(!Object.values(performerRooms).includes(roomNo))
    {
      console.log('There is no ', roomNo+'!');
      console.log('current rooms are :', performerRooms);
      socket.emit('no_room', roomNo);
      return;
    }
    socket.leave(socket.room);
    socket.join(roomNo);
    socket.room = roomNo;
    console.log(socket.id, 'is joined to ', socket.room);
    socket.emit('Join_room', roomNo);
  });

  //leave Room-Audience side
  socket.on('Leave_Room', function(){
    socket.leave(socket.room);
    socket.join(-1);
    socket.room = -1;
    console.log(socket.id, 'left the room');
  });

  //start the performance
  socket.on('Send_Start_Performance', function(){
    socket.broadcast.to(socket.room).emit("Start_Performance");
  })

  //send performer's control to audiences' clients
  socket.on('Send_Control', function(v){
    socket.broadcast.to(socket.room).emit("Receive_Control", v);
  });

  //send gameover_control
  socket.on('Send_Game_Over', function(){
    socket.broadcast.to(socket.room).emit("Receive_Game_Over");
  });

  socket.on('disconnect', function(){
    socket.broadcast.to(socket.room).emit("Receive_Game_Over");
    console.log('user disconnected: ', socket.id);
    if(socket.id in performerRooms) delete performerRooms[socket.id];
  });
});

let port = process.env.PORT || 3000;
http.listen(port, function(){ 
  console.log('server on! http://localhost:'+port);
});

function getRandomInt(min, max) {
  return Math.floor(Math.random() * Math.floor(max - min)) + min;
}