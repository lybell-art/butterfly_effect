const socket = io();
const startButton=document.getElementById('join_button');
const leaveButton=document.getElementById('leave_button');
const noRoomWarningText=document.getElementById('no_room_warning');
const BGM = new Audio("assets/music/Butterfly-and-Storm-2019.mp3");

//screen transition
function changeScreen(from, to)
{
	const screens=[];
	screens.push(document.getElementById('loading_screen')); //1
	screens.push(document.getElementById('intro_screen')); //1
	screens.push(document.getElementById('waiting_screen')); //2
	screens.push(document.getElementById('show_canvas')); //3
	screens[from].classList.remove("active_screen");
	screens[to].classList.add("active_screen");
//	if(to == 2) start_performance();
}

//room join
function _switch_room(roomNo)
{
	socket.emit('Switch_Room', roomNo);
}

function into_the_performance()
{
	const roomNo_element=document.getElementById('type_roomNo');
	let roomNo=parseInt(roomNo_element.value);
	_switch_room(roomNo);
}

function leave_room()
{
	changeScreen(2,1);
	socket.emit('Leave_Room');
}

function end_room()
{
	changeScreen(3,1);
	socket.emit('Leave_Room');
}

//activate warning message
function show_noRoom_warning()
{
	noRoomWarningText.classList.add('showing');
}


//add event listeners
startButton.addEventListener('mousedown', into_the_performance);
leaveButton.addEventListener('mousedown', leave_room);
noRoomWarningText.addEventListener('animationend', function()
{
	noRoomWarningText.classList.remove('showing');
});


//sockets
socket.on('Join_room', function(){ //waiting performing
	changeScreen(1,2);
});
socket.on('no_room', function(roomNo){ //when there is no room you inputted
	console.log("failed!");
	noRoomWarningText.innerText="There is no room #"+roomNo;
	show_noRoom_warning();
});