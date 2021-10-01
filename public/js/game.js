const scoreUI=document.getElementById('score');
const lifeUI=document.getElementById('life');
const MAX_LIFE=3;
const BPM=115;
let BE_debug=null;
let BE_initialize=null;

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
function distanceSq(x1, y1, x2, y2)
{
	return (x2-x1)*(x2-x1) + (y2-y1)*(y2-y1)
}
function distance(x1, y1, x2, y2)
{
	return Math.sqrt(distanceSq(x1, y1, x2, y2));
}
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}
function keyframeLerp(key, minKey, minVal, maxKey, maxVal)
{
	let keyInterval=maxKey-minKey;
	let valueInterval=maxVal-minVal;
	return (key - minKey)/keyInterval * valueInterval + minVal;
}

//control game UI
function resetUI()
{
	scoreUI.innerText='SCORE : 0';
	for(let i=lifeUI.childElementCount;i<MAX_LIFE;i++)
	{
		let ico=document.createElement('img');
		ico.classList.add('life_icon');
		ico.src='assets/butterfly.png';
		lifeUI.appendChild(ico);
	}
}
function decreaseLifeIcon()
{
	if(lifeUI.childElementCount <=0) return;
	lifeUI.firstElementChild.remove();
}
function setScoreUI(score)
{
	if(!Number.isInteger(score)) return;
	scoreUI.innerText='SCORE : '+score;
}


class BE_player
{
	constructor()
	{
		this.x=0;
		this.y=0;
		this.life=3;
		this.score=0;
		this.scale=48;
		this.sprite=null;
		this.hitboxRadius=10;
		this.invinsibleTime=0;
	}
	initialize()
	{
		this.x=0;
		this.y=0;
		this.life=3;
		this.score=0;
		this.scale=48
		this.invinsibleTime=0;
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
		this.x=clamp(this.x+dx, -360+radius-5, 360-radius+5);
		this.y=clamp(this.y+dy, -240+radius-8, 240-radius+10);
		
	}
	scoreUp(score)
	{
		this.score+=score;
		setScoreUI(this.score);
	}
	damage()
	{
		if(this.invinsibleTime > 0) return;
		this.life--;
		this.invinsibleTime = 60;
		decreaseLifeIcon();
		this.scoreUp(-300);
		console.log(this.life);
	}
	render(d)
	{
//		console.log(this.invinsibleTime);
		if(this.invinsibleTime % 20 >= 10) d.tint(255, 128);
		d.image(this.sprite, this.x+d.width/2,this.y+d.height/2,this.scale,this.scale);
		if(this.invinsibleTime % 20 >= 10) d.tint(255, 255);
		if(this.invinsibleTime > 0) this.invinsibleTime--;
	}
}

class BE_bullet{
	static images=[];
	constructor(_x, _y, _r)
	{
		this.x=_x;
		this.y=_y;
		this.dx=Math.sin(_r)*2;
		this.dy=Math.cos(_r)*2;
		this.scale=28;
		this.hitboxRadius=8;
	}
	static setSprite(source)
	{
		for(let i=0;i<4;i++)
		{
			BE_bullet.images[i]=source[i];
		}
	}
	get speed()
	{
		return Math.sqrt(this.dx*this.dx + this.dy*this.dy);
	}
	set speed(s)
	{
		let ratio=s/this.speed;
		this.dx*=ratio;
		this.dy*=ratio;
	}
	hitCheck(player)
	{
		let hitDistance=this.hitboxRadius + player.hitboxRadius;
		if(distanceSq(this.x, this.y, player.x, player.y) < hitDistance*hitDistance)
		{
			return true;
		}
		return false;
	}
	boundCheck()
	{
		if(!between(this.x, -368,368) || !between(this.y, -248, 248)) return true;
		return false;
	}

	move(player)
	{
		this.x+=this.dx;
		this.y+=this.dy;
	}
	render(d)
	{
	}
}

class BE_normalBullet extends BE_bullet{
	static sprite=null;
	constructor(_x, _y, _r)
	{
		super(_x,_y,_r);
	}
	static setSprite(img)
	{
		BE_normalBullet.sprite=img;
	}
	render(d)
	{
		d.image(BE_normalBullet.sprite, this.x+d.width/2,this.y+d.height/2,this.scale,this.scale);
	}
}
class BE_bounceBullet extends BE_bullet{
	static sprite=null;
	constructor(_x, _y, _r)
	{
		super(_x,_y,_r);
		this.bounceCount=1;
	}
	static setSprite(img)
	{
		BE_bounceBullet.sprite=img;
	}
	boundCheck()
	{
		if(this.bounceCount >0) return false;
		return super.boundCheck();
	}
	bounce()
	{
		const Xwall=360 - 8;
		const Ywall=240 - 8;
		if(this.x < -Xwall) {this.dx=Math.abs(this.dx); return true;}
		else if(this.x > Xwall) {this.dx=-Math.abs(this.dx); return true;}
		if(this.y < -Ywall) {this.dy=Math.abs(this.dy); return true;}
		else if(this.y > Ywall) {this.dy=-Math.abs(this.dy); return true;}
		return false;
	}
	move(player)
	{	
		super.move(player);
		if(this.bounceCount > 0)
		{
			let bounded=this.bounce();
			if(bounded) this.bounceCount--;
		}
	}
	render(d)
	{
		d.image(BE_bounceBullet.sprite, this.x+d.width/2,this.y+d.height/2,this.scale,this.scale);
	}
}

class BE_contrailBullet extends BE_bullet{
	static sprite=null;
	constructor(_x, _y, _r)
	{
		super(_x,_y,_r);
		this.speed = 1;
		this.r=_r;
		this.allBullets=[];
		this.nextTrail=0.0;
		this.shootingDuration=75;
	}
	static setSprite(img)
	{
		BE_contrailBullet.sprite=img;
	}
	linkBulletArrays(arr)
	{
		this.allBullets=arr;
	}
	spawnBullet()
	{
		for(let i=-1;i<2;i+=2)
		{
			let newBullet=new BE_normalBullet(this.x, this.y, this.r + Math.PI/2 * i);
			this.allBullets.push(newBullet);
		}
	}
	move(player)
	{	
		const boost=1.03;
		super.move(player);
		this.dx *= boost;
		this.dy *= boost;
		this.nextTrail+=this.speed;
		if(this.nextTrail > this.shootingDuration)
		{
			this.nextTrail -= this.shootingDuration;
			this.spawnBullet();
		}
	}
	render(d)
	{
		d.push();
		d.translate(this.x+d.width/2,this.y+d.height/2);
		d.rotate(Math.PI-this.r);
		d.image(BE_contrailBullet.sprite, 0,0,this.scale,this.scale);
		d.pop();
	}
}

class BE_bloomBullet extends BE_bullet{
	static sprite=null;
	constructor(_x, _y, _r, args)
	{
		super(_x,_y, _r);
		this.speed = 4;
		this.r=_r;
		this.allBullets = [];
		this.splitCnt=4;
		this.friction=0.99;
		if(args.length >0) this.splitCnt=args[0];
		if(args.length >1) this.friction=args[1];
	}
	static setSprite(img)
	{
		BE_bloomBullet.sprite=img;
	}
	linkBulletArrays(arr)
	{
		this.allBullets=arr;
	}
	boundCheck()
	{
		const speedDelta=0.5;
		if(this.speed < speedDelta)
		{
			this.bloom();
			return true;
		}
		return super.boundCheck();
	}
	bloom()
	{
		for(let i=0;i<this.splitCnt;i++)
		{
			let theta = Math.PI * 2 / this.splitCnt* i;
			let newBullet=new BE_normalBullet(this.x, this.y, this.r + theta);
			this.allBullets.push(newBullet);
		}
	}
	move(player)
	{	
		super.move(player);
		this.dx *= this.friction;
		this.dy *= this.friction;
	}
	render(d)
	{
		d.push();
		d.translate(this.x+d.width/2,this.y+d.height/2);
		d.rotate(this.r);
		d.image(BE_bloomBullet.sprite, 0,0,this.scale,this.scale);
		d.pop();
	}
}


class bulletSystem{
	constructor()
	{
		this.time=0.0;
		this.maxActiveTime=60000.0/BPM * 24;
		this.maxTime=60000.0/BPM * 32;
		this.allBullets = [];
	}
	linkBulletArrays(arr)
	{
		this.allBullets=arr;
	}
	add_bullet(x, y, r, type, ...args)
	{
		let newBullet=null;
		switch(type)
		{
			case 1:
				newBullet=new BE_normalBullet(x, y, r);
				break;
			case 2:
				newBullet=new BE_bounceBullet(x, y, r);
				break;
			case 3:
				newBullet=new BE_contrailBullet(x, y, r);
				newBullet.linkBulletArrays(this.allBullets);
				break;
			case 4:
				newBullet=new BE_bloomBullet(x, y, r, args);
				newBullet.linkBulletArrays(this.allBullets);
				break;
		}
		this.allBullets.push(newBullet);
	}
	shootBullets(delta)
	{
	}
	run(delta)
	{
		if(this.time > this.maxTime) return false; //dead
		if(this.time < this.maxActiveTime) this.shootBullets(delta);
		this.time+=delta;
		return true; // active
	}
}

class bulletSystem_basic extends bulletSystem{
	constructor(type, bit)
	{
		super();
		this.nextShootTime=0.0;
		this.shootingDuration=60000.0/BPM * (4/ bit);
		this.bulletType=type;
	}
	setBulletPos()
	{
		let _r=Math.random() * Math.PI*2;
		//set position
		let _x=Math.sin(_r)*432;
		let _y=Math.cos(_r)*432;
		if(_x > 350)
		{
			let bb=_x/350;
			_x = 350;
			_y = _y / bb;
		}
		else if(_x < -350)
		{
			let bb=_x/-350;
			_x = -350;
			_y = _y / bb;
		}
		if(_y > 230)
		{
			let bb=_y/230;
			_y = 230;
			_x = _x / bb;
		}
		else if(_y < -230)
		{
			let bb=_y/-230;
			_y = -230;
			_x = _x / bb;
		}
		//set direction
		let r2=_r + Math.random() * Math.PI*0.5 + Math.PI*0.75;
		if(r2 > Math.PI*2) r2 -=Math.PI*2;
		return {x:_x, y:_y, r:r2};
	}
	shootBullets(delta)
	{
		this.nextShootTime += delta;
		if(this.nextShootTime > this.shootingDuration)
		{
			this.nextShootTime -= this.shootingDuration;
			let posData=this.setBulletPos();
			this.add_bullet(posData.x, posData.y, posData.r, this.bulletType);
//			this.add_bullet(0, 200, Math.PI*0.75, this.bulletType);
		}
	}
}

class bulletSystem_slide extends bulletSystem
{
	constructor()
	{
		super();
		this.nextShootTime=0.0;
		this.shootingDuration=60000.0/BPM * 0.25;

		this.nextRotateTime=0.0;
		this.rotatingFullCycleDuration=60000.0/BPM * 8;

		this.shootPos={x:320, y:0};
		this.shootAngle=0;

		this.maxActiveTime=this.maxTime;
	}
	setRotation()
	{
		const basicBeat=60000.0/BPM;
		let sign=this.shootPos.x > 0 ? -1 : 1;

		const angleInterval=Math.PI*80/180;
		const minAngle=Math.PI/2 - angleInterval/2;
		const maxAngle=Math.PI/2 + angleInterval/2;

		let angle=0;
		if(this.nextRotateTime < 2*basicBeat)
		{
			angle=keyframeLerp(this.nextRotateTime, 0, minAngle, 2*basicBeat, maxAngle);
		}
		else if(this.nextRotateTime < 4*basicBeat)
		{
			angle=keyframeLerp(this.nextRotateTime, 2*basicBeat, maxAngle, 4*basicBeat, minAngle);
		}
		else
		{
			angle=keyframeLerp(this.nextRotateTime, 4*basicBeat, minAngle, 8*basicBeat, maxAngle);
		}
		this.shootAngle=angle*sign;
	}

	shootBullets(delta)
	{
		this.nextShootTime += delta;
		this.nextRotateTime += delta;
		if(this.nextShootTime > this.shootingDuration)
		{
			this.nextShootTime -= this.shootingDuration;
			this.setRotation();
			this.add_bullet(this.shootPos.x, this.shootPos.y, this.shootAngle, 1);
		}
		if(this.nextRotateTime > this.rotatingFullCycleDuration)
		{
			this.nextRotateTime -= this.rotatingFullCycleDuration;
			this.shootPos.x=-this.shootPos.x;
		}
	}
}

class bulletSystem_bloom extends bulletSystem
{
	constructor()
	{
		super();
		this.nextShootTime=0.0;
		this.shootingDuration=60000.0/BPM * 2;
		this.maxActiveTime=60000.0/BPM * 28;
	}
	shootBullets(delta)
	{
		this.nextShootTime += delta;
		if(this.nextShootTime > this.shootingDuration)
		{
			this.nextShootTime -= this.shootingDuration;
			let xPos=getRandomInt(0,4) * 160 - 240;
			this.add_bullet(xPos, 230, Math.PI, 4, 6, 0.98);
		}
	}
}

class bulletSystem_point extends bulletSystem
{
	constructor(type, bit)
	{
		super();
		this.nextShootTime=0.0;
		this.shootingDuration=60000.0/BPM * (4/ bit);
		this.bulletType=type;

		this.nextRotateTime=0.0;
		this.rotatingFullCycleDuration=60000.0/BPM * 4;

		this.xPos=0;
		this.shootAngle=0;
		this.beforeX=-2;

		this.maxActiveTime=this.maxTime;
	}
	setRotation()
	{
		let minAngle=keyframeLerp(this.xPos, -310, 0, 310, -Math.PI/2);
		this.shootAngle=Math.random() * Math.PI/2 + minAngle;
	}
	shootBullets(delta)
	{
		this.nextShootTime += delta;
		this.nextRotateTime += delta;
		if(this.nextShootTime > this.shootingDuration)
		{
			this.nextShootTime -= this.shootingDuration;
			this.setRotation();
			this.add_bullet(this.xPos, -230, this.shootAngle, this.bulletType);
		}
		if(this.nextRotateTime > this.rotatingFullCycleDuration)
		{
			this.nextRotateTime -= this.rotatingFullCycleDuration;
			let xx=getRandomInt(-2,3);
			if(this.beforeX == xx)
			{
				if(xx == 2) xx = -2;
				else xx = this.beforeX + 1;
			}
			this.beforeX = xx;
			this.xPos = xx * 165;
		}
	}
}

function chooseBulletSystem(index)
{
	switch(index)
	{
//		case 0: return new bulletSystem_basic(1, 8);
		case 1: return new bulletSystem_basic(2, 4);
		case 2: return new bulletSystem_slide();
		case 3: return new bulletSystem_bloom();
		case 0: return new bulletSystem_basic(3, 2);
		case 5: return new bulletSystem_point(1, 16);
		case 6: return new bulletSystem_basic(1, 16);
		case 7: return new bulletSystem_bloom();
		case 9: return new bulletSystem_basic(1, 8);
		default: return new bulletSystem_basic(1, 8);
	}
}

let Butterfly_Bullethell=function(d)
{
	let playerImg=null, bulletImg=[];
	let player=new BE_player();
	let bullets=[];
	let bulletSystems=[];
	let currentPattern=0;
	const matPatternCount = 8;

	//player controls
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
		socket.volatile.emit('Send_Control', {x:dx,y:dy});
	}

	//setting function
	let setSprites=function()
	{
		player.setSprite(playerImg);
		BE_normalBullet.setSprite(bulletImg[0]);
		BE_bounceBullet.setSprite(bulletImg[1]);
		BE_contrailBullet.setSprite(bulletImg[2]);
		BE_bloomBullet.setSprite(bulletImg[3]);
	}
	let setBulletSystems=function()
	{
		bulletSystems=[];
		for(let i=0;i<matPatternCount;i++)
		{
//			let patternNo=getRandomInt(0,1);
			bulletSystems[i] = chooseBulletSystem(i);
			bulletSystems[i].linkBulletArrays(bullets);
		}
	}

	//activate bullet system
	let activateBulletSystem=function(delta)
	{
		if(currentPattern >= matPatternCount) return;
		let c = bulletSystems[currentPattern].run(delta);
		if(c == false)
		{
			player.scoreUp(1000);
			currentPattern++;
		}
	}
	let moveBullets=function()
	{
		for(let i=0;i<bullets.length;i++)
		{
			bullets[i].move(player);
		}
	}
	let detectBullets=function()
	{
		let playerHit=false;
		for(let i=bullets.length-1;i>=0;i--)
		{
			let isHit=bullets[i].hitCheck(player);
			let outbound=bullets[i].boundCheck();

			if(isHit) playerHit=true;
			if(isHit || outbound) bullets.splice(i,1);
		}
		if(playerHit) player.damage();
	}
	let renderBullets=function(d)
	{
		for(let i=0;i<bullets.length;i++)
		{
			bullets[i].render(d);
		}
	}

	//public function
	let __initialize=function(){
		bullets.splice(0);
		currentPattern=0;
		setBulletSystems();
		dx=0; dy=0;
		player.initialize();
		console.log("initialize the game");
	}

	let __debug=function()
	{
		console.log(bullets);
	}
	
	//game_over
	let game_over=function()
	{
		isGamePlaying=false;
		document.getElementById("game_over_screen").style.display='';
		document.getElementById("game").style.display='none';
		socket.emit('Send_Game_Over');
	}


	d.preload=function() {
		playerImg = d.loadImage('assets/butterfly.png', true);
		for(let i=0;i<4;i++)
		{
			bulletImg[i] = d.loadImage('assets/bullet'+(i+1)+'.png', true);
		}
	}
	d.setup=function()
	{
		d.createCanvas(720,480);
		d.imageMode(d.CENTER);
		setSprites();
		setBulletSystems();
		player.initialize();

		BE_initialize=__initialize;
		BE_debug=__debug;
	};
	d.draw=function()
	{
		if(isGamePlaying)
		{
			let isMouseOn=_isMouseOn();
			d.background(0);
			inputKeys();
			activateBulletSystem(d.deltaTime);
			moveBullets();
			detectBullets();
			renderBullets(d);
			player.render(d);
			if(player.life < 0) game_over();
		}
	};
};
new p5(Butterfly_Bullethell, 'game');

