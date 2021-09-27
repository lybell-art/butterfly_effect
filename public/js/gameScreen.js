const socket = io();
let isGamePlaying=false;


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
}

let startButton=document.getElementById('start_button');
startButton.addEventListener('mousedown', game_start);

socket.on('Room', function(no){
	const roomUIs = document.getElementsByClassName('roomNo');
	for (let i=0; i<roomUIs.length; i++) {
		roomUIs[i].innerText="Room No : "+no;
	}
});