const express = require('express');
const app = express();
const http = require('http').Server(app);

app.get("/",(req,res)=>{
  res.sendFile("index.html", { root: __dirname+"/public" });
});
app.get("/game",(req,res)=>{
  res.sendFile("game.html", { root: __dirname+"/public" });
});
app.use(express.static('public'));

let port = process.env.PORT || 3000;
http.listen(port, function(){ 
  console.log('server on! http://localhost:'+port);
});