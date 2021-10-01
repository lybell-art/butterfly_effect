const socket = io();
let isGamePlaying=false;
const BGM = new Audio("assets/music/Butterfly-and-Storm-2019.mp3");


function transitionScreen(toGame)
{
	const intro_screen=document.getElementById('intro_screen');
	const game_screen=document.getElementById('game_screen');
	if(toGame) //intro -> game
	{
		intro_screen.classList.remove("active_screen");
		game_screen.classList.add("active_screen");
	}
	else{
		intro_screen.classList.add("active_screen");
		game_screen.classList.remove("active_screen");
	}
}

function game_start()
{
	transitionScreen(true);
	isGamePlaying=true;
	socket.emit('Send_Start_Performance');
	if(BE_initialize !== undefined && BE_initialize !== null) BE_initialize();
	resetUI();
	document.getElementById("game_over_screen").style.display='none';
	document.getElementById("game").style.display='';
	BGM.play();
}

function game_end()
{
	transitionScreen(false);
}

let startButton=document.getElementById('start_button');
startButton.addEventListener('mousedown', game_start);

let returnButton=document.getElementById('return_button');
returnButton.addEventListener('mousedown', game_end);

socket.on('Room', function(no){
	const roomUIs = document.getElementsByClassName('roomNo');
	for (let i=0; i<roomUIs.length; i++) {
		roomUIs[i].innerText="Room No : "+no;
	}
	socket.emit('Create_Room');
});