const socket = io();

function join_room(roomNo)
{
	socket.emit('Switch_Room', roomNo);
}

socket.on('Receive_Control', function(v){
	console.log(v.x, v.y);
});