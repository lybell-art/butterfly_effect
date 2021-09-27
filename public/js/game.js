const scoreUI=document.getElementById('score');
const lifeUI=document.getElementById('life');

function between(input, a, b)
{
	return a<=input && input<=b;
}
function clamp(input, a, b)
{
	if(input < a) return a;
	else if(input > b) return b;
	return input;
}


class BE_player
{
	constructor()
	{
		this.x=0;
		this.y=0;
		this.life=0;
		this.score=0;
		this.scale=48;
		this.sprite=null;
	}
	setSprite(img)
	{
		this.sprite=img;
	}
	setPosition(x, y)
	{
		this.x=x;
		this.y=y;
	}
	move(dx, dy)
	{
		let radius=this.scale/2;
		this.x=clamp(this.x+dx, -360+radius, 360-radius);
		this.y=clamp(this.y+dy, -240+radius, 240-radius);
	}
	render(d)
	{
		d.image(this.sprite, this.x+d.width/2,this.y+d.height/2,this.scale,this.scale);
	}
}

let Butterfly_Bullethell=function(d)
{
	let playerImg=null;
	let player=new BE_player();
	let dx=0, dy=0;
	let _isMouseOn=function()
	{
		return (between(d.mouseX,1,d.width) && between(d.mouseY,1,d.height));
	}
	let inputKeys=function()
	{
		dx=0, dy=0;
		if(d.keyIsDown(65)) //A
		{
			player.move(-5,0);
			dx+=-1;
		}
		if(d.keyIsDown(68)) //D
		{
			player.move(5,0);
			dx+=1;
		} 
		if(d.keyIsDown(87)) //W
		{
			player.move(0,-5);
			dy+=1;
		}
		if(d.keyIsDown(83)) //S
		{
			player.move(0,5);
			dy+=-1;
		}
		socket.emit('Send_Control', {x:dx,y:dy});
	}
	
	d.preload=function() {
		playerImg = d.loadImage('assets/butterfly.png', true);
	}
	d.setup=function()
	{
		d.createCanvas(720,480);
		d.imageMode(d.CENTER);
		player.setSprite(playerImg);
	};
	d.draw=function()
	{
		if(isGamePlaying)
		{
			let isMouseOn=_isMouseOn();
			d.background(0);
			inputKeys();
			player.render(d);
		}
	};
};
new p5(Butterfly_Bullethell, 'game');