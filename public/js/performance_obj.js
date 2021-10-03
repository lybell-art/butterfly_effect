import * as THREE from './libs/three.module.js';
import {SkeletonUtils} from './libs/plugins/SkeletonUtils.js';

const keyVector=new THREE.Vector2();
let isKeyPressed=false;

//basic function
function clamp(input, a, b)
{
	if(input < a) return a;
	else if(input > b) return b;
	return input;
}

//key control(for debugging)
function getKeyVector(keyStates) //temporary
{
	keyVector.x=0; keyVector.y=0; isKeyPressed=false;
	if(keyStates['KeyW'] === true || keyStates['ArrowUp'] === true) keyVector.y--;
	if(keyStates['KeyS'] === true || keyStates['ArrowDown'] === true) keyVector.y++;
	if(keyStates['KeyA'] === true || keyStates['ArrowLeft'] === true) keyVector.x--;
	if(keyStates['KeyD'] === true || keyStates['ArrowRight'] === true) keyVector.x++;
	keyVector.normalize();
	if(keyVector.x != 0 || keyVector.y !=0) isKeyPressed=true;
}
function keyControl(keyStates, player, ballSystem)
{
	let oldVector={x:keyVector.x, y:keyVector.y};
	getKeyVector(keyStates);
	player.setLerp();
	if((oldVector.x != keyVector.x || oldVector.y != keyVector.y) && isKeyPressed)
	{
		
		ballSystem.setLerp();
	}
//	player.setLerp();
//	ballSystem.setLerp();
}
function keyUpControl(keyStates)
{
	getKeyVector(keyStates);
}

//remote control_by host
function remoteControl(v, player, ballSystem)
{
	let oldVector={x:keyVector.x, y:keyVector.y};
	keyVector.x=v.x; keyVector.y=v.y; isKeyPressed=false;
	keyVector.normalize();
	if(keyVector.x != 0 || keyVector.y !=0) isKeyPressed=true;
	if((oldVector.x != keyVector.x || oldVector.y != keyVector.y) && isKeyPressed)
	{
		player.setLerp();
		ballSystem.setLerp();
	}
}

function angleLerp(key, before, after)
{
	let r1=before, r2=after;
	if(before - after > Math.PI) r2+=2*Math.PI;
	else if(before - after < -Math.PI) r1+=2*Math.PI;

	let res=key * (r2 - r1) + r1;
	if(res > Math.PI) res -= 2*Math.PI;
	else if(res < -Math.PI) res += 2*Math.PI;
	return res;
}


class Butterfly
{
	static model=null;
	constructor()
	{
		//model & animation properties
		const clonedModel = SkeletonUtils.clone(Butterfly.model.scene);
		this.body=new THREE.Object3D();
		this.body.add(clonedModel);
		this.body.scale.multiplyScalar(20);
		this.animMixer = new THREE.AnimationMixer(clonedModel);
		const flyingAnim = Butterfly.model.animations[0];
		const action = this.animMixer.clipAction(flyingAnim);
		this.animMixer.timeScale=0.5;
		action.play();

		//control properties
		this.position=this.body.position;
		this.rotation=this.body.rotation;
		this.direction=new THREE.Vector3(0,0,0); // Front
		this.speed=0;
		this.maxSpeed = 3;

		this.movingMode=STANDARD_MOVE;

		this.lerpFrame=0.0;
		this.isLearping=false;
		this.maxLerpDirSpeed=0.25;
		this.beforeAngle=0.0;
		this.afterAngle=0.0;
		this.changeModeLerping=false;

		this.elapsedTime=0.0;
		this.rotateRadius=100.0;

		this.altitude=0;
	}
	addScene(scene)
	{
		scene.add(this.body);
//		this.body.rotation.y=Math.PI/2;
	}
	reset()
	{
		this.position.set(0,0,0);
		this.rotation.set(0,0,0);
		this.direction.set(0,0,0);
		this.speed=0;
		this.movingMode=STANDARD_MOVE;

		this.lerpFrame=0.0;
		this.isLearping=false;
		this.maxLerpDirSpeed=0.25;
		this.beforeAngle=0.0;
		this.afterAngle=0.0;
		this.changeModeLerping=false;

		this.elapsedTime=0.0;
		this.rotateRadius=100.0;

		this.altitude=0;
		this.altitudeLerpDir=1;
	}
	setLerp()
	{
		if(this.movingMode == STANDARD_MOVE)
		{
			this.isLerping=true;
			this.lerpFrame=0.0;
			this.beforeAngle=this.rotation.y;
			this.afterAngle=Math.atan2(keyVector.x,keyVector.y);
		}
	}
	changeMode(mode)
	{
		this.movingMode=mode;
		this.elapsedTime=0.0;

		let getRadius=(x,z)=>Math.sqrt(x*x+z*z);
		this.rotateRadius=getRadius(this.position.x, this.position.z);
		this.changeModeLerping=true;
		if(this.movingMode == ROTATE_MOVE)
		{
			this.direction.set(-this.position.z, 0, this.position.x);
			this.direction.setLength(this.maxSpeed);
		}
		else if(this.movingMode == STANDARD_MOVE)
		{
			this.isLerping=true;
			this.altitudeLerpDir=Math.sign(this.altitude);
			this.lerpFrame=0.0;
			this.beforeAngle=this.rotation.y;
			this.afterAngle=this.rotation.y - ( this.rotation.y%(Math.PI/2) );
		}
	}
	basicControl(delta)
	{
		if(this.movingMode == STANDARD_MOVE)
		{
			if(isKeyPressed) this.speed += delta * 10;
			else this.speed -= delta * 10;
			if(this.speed > this.maxSpeed) this.speed = this.maxSpeed;
			else if(this.speed < 0) this.speed=0;

			this.direction.set(0,0,this.speed * (delta*60) );
			const r=new THREE.Euler(this.rotation.x, this.rotation.y, this.rotation.z);
			this.direction.applyEuler(r);
		}
		else if(this.movingMode == ROTATE_MOVE)
		{
			if(this.changeModeLerping)
			{
				this.speed += delta * 10;
				if(this.speed > this.maxSpeed) this.speed=this.maxSpeed;

				let diviv=(this.rotation.y - Math.atan2(-this.position.z,this.position.x)) % Math.PI;
				
				if(diviv < 0.01)
				{
					this.changeModeLerping=false;
					let getRadius=(x,z)=>Math.sqrt(x*x+z*z);
					this.rotateRadius=getRadius(this.position.x, this.position.z);
					this.direction.set(-this.position.z, 0, this.position.x);
					this.direction.setLength(this.maxSpeed);
				}
				else
				{
					this.direction.set(0,0,this.speed );
					const r=new THREE.Euler(this.rotation.x, this.rotation.y, this.rotation.z);
					this.direction.applyEuler(r);
				}
			}
			else
			{
				this.speed = this.maxSpeed;
				let getRadius=(x,z)=>Math.sqrt(x*x+z*z);
				this.rotateRadius=getRadius(this.position.x, this.position.z);
				let mag= (this.speed * this.speed) /this.rotateRadius;
				let acc=new THREE.Vector3(-this.position.x, 0, -this.position.z);
				acc.setLength(mag);
				this.direction.add(acc);
			}
		}
	}
	rotate(delta)
	{
		if(this.movingMode == STANDARD_MOVE)
		{
			if(this.isLerping)
			{
				this.rotation.y = angleLerp(this.lerpFrame/this.maxLerpDirSpeed, this.beforeAngle, this.afterAngle);
				this.lerpFrame += delta;
				if(this.lerpFrame > this.maxLerpDirSpeed)
				{
					this.rotation.y = this.afterAngle;
					this.lerpFrame=0.0;
					this.isLerping=false;
				}
			}
		}
		else if(this.movingMode == ROTATE_MOVE)
		{
			if(this.changeModeLerping)
			{
				this.rotation.y -= delta * 2;
			}
			else this.rotation.y=Math.atan2(-this.position.z,this.position.x);
		}
	}
	update(delta)
	{
		this.rotate(delta);
		this.basicControl(delta);

		if(this.movingMode == STANDARD_MOVE)
		{
			this.position.add(this.direction);
			if(this.changeModeLerping)
			{
				if(this.altitude != 0)
				{
					this.altitude -= this.altitudeLerpDir*2;
					if(this.altitude * this.altitudeLerpDir < 0)
					{
						this.altitude =0;
						this.changeModeLerping=false;
					}
				}
				else this.changeModeLerping=false;
			}
			this.position.clamp(new THREE.Vector3(-300,-200,-300),new THREE.Vector3(300,999,300));
			this.position.y=this.altitude + Math.sin(this.elapsedTime*4)*25;
		}
		else if(this.movingMode == ROTATE_MOVE)
		{
			let getRadius=(x,z)=>Math.sqrt(x*x+z*z);
			this.position.add(this.direction);

			let additionalVec=new THREE.Vector3(this.position.x, 0, this.position.z);
			additionalVec.normalize();
			additionalVec.multiplyScalar(keyVector.x);
			if(this.rotateRadius > 30 && keyVector.x < 0 ) this.position.add(additionalVec);
			else if(this.rotateRadius < 300 && keyVector.x > 0) this.position.add(additionalVec);

			if(keyVector.y > 0 && this.position.y > -150) this.altitude -= keyVector.y * 2;
			else if(keyVector.y < 0 && this.position.y < 400) this.altitude -= keyVector.y * 2;
			
			this.position.y = this.altitude + Math.sin(this.elapsedTime*4)*5;
		}
		this.animMixer.update(delta);
		this.elapsedTime+=delta;
	}
}

class BE_Ball
{
	static geometry=new THREE.SphereGeometry( 20 );
	static material = new THREE.MeshPhongMaterial( { color: 0xdeffff } );
	constructor(parent, pos=null, dir=null)
	{
		this.body = new THREE.Mesh( BE_Ball.geometry, BE_Ball.material ); 
		this.body.castShadow=true;
		this.body.receiveShadow=true;
		this.position=this.body.position;
		this.direction=new THREE.Vector3();
		this.direction2=new THREE.Vector3();
		this.friction = 0.1+Math.random()*0.9;

		this.rotateSpeed= 2/(this.friction+0.3);
		this.rotateRadius= 100;

		this.sinWaveTime = 0.0;
		this.sinWaveBasis= 0.0;
		parent.add(this.body);
		if(pos != null)
		{
			if(pos instanceof THREE.Vector3) this.position.copy(pos);
			else if(pos instanceof Array) this.position.fromArray(pos);
		}
		if(dir != null)
		{
			if(dir instanceof THREE.Vector3) this.direction.copy(dir);
			else if(dir instanceof Array) this.direction.fromArray(dir);
		}
	}
	setRandomDir(speed)
	{
		this.direction.randomDirection();
		this.direction.multiplyScalar(speed/(this.friction+1));
	}

	//ROTATE_BALL movemode
	setRotateDir()
	{
		let getRadius=(x,z)=>Math.sqrt(x*x+z*z);
		this.rotateRadius=getRadius(this.position.x, this.position.z);
		this.direction.set(-this.position.z, 0, this.position.x);
		this.direction.setLength(this.rotateSpeed);
		this.direction2.set(0,0,0);
	}
	rotateControl()
	{
		this.direction.set(-this.position.z, 0, this.position.x);
		this.direction.setLength(this.rotateSpeed);
		let mag= (this.rotateSpeed * this.rotateSpeed) / this.rotateRadius;
		let acc=new THREE.Vector3(-this.position.x, 0, -this.position.z);
		acc.setLength(mag);
		this.direction.add(acc);
	}

	//RANDOM_BALL movemode
	setRandomRotDir(speed)
	{
		this.setRandomDir(speed);
		let getRadius=(x,z)=>Math.sqrt(x*x+z*z);
		this.rotateRadius=getRadius(this.position.x, this.position.z);
		this.direction2.set(0,0,0);
		this.sinWaveBasis=this.position.y;
	}
	randomRotPlayerControl()
	{
		const up=new THREE.Vector3(0,1,0);
		const z=this.direction.clone();
		z.normalize();
		const right=new THREE.Vector3().crossVectors(z, up);

		this.direction2.set(0,0,0);
		this.direction2.addScaledVector(up, keyVector.y);
		this.direction2.addScaledVector(right,keyVector.x);
		this.direction2.multiplyScalar(0.5);
	}
	randomRotControl()
	{
		let mag= (this.rotateSpeed * this.rotateSpeed) / this.rotateRadius;
		let acc=new THREE.Vector3(-this.position.x, 0, -this.position.z);
		acc.setLength(mag);
		this.direction.add(acc);
	}

	//DANCE_BALL movemode
	setDanceDirection()
	{
		const up=new THREE.Vector3(0,1,0);
		const z=this.position.clone();
		z.normalize();
		const right=new THREE.Vector3().crossVectors(z, up);

		this.direction2.set(0,0,0);
		this.direction2.addScaledVector(up, -keyVector.y);
		this.direction2.addScaledVector(right,keyVector.x);
		this.direction2.multiplyScalar(4);
	}

	//GAMEOVER_BALL movemode
	isEnded()
	{
		if(this.position.y + 180 < 0.1 && Math.abs(this.direction.y) < 0.1) return true;
		else return false;
	}

	//ball moving function
	update(delta, player, moveMode)
	{
		switch(moveMode)
		{
			case CREATE_BALL:
				let d=this.friction;
				let mul=1-d*d*d*0.03;
				this.direction.multiplyScalar(mul);
				this.direction2.set(0,0,0);
				break;
			case SWING_BALL:
				let mult=this.position.angleTo(player.position)/ Math.PI;
				mult=mult*mult *3 ;
				this.direction2.copy(player.direction);
				this.direction2.multiplyScalar(mult);
				break;
			case DANCE_BALL:
				this.direction2.multiplyScalar(0.985);
				break;
			case ROTATE_BALL:
				this.rotateSpeed=clamp(this.rotateSpeed+keyVector.y, -15/(this.friction+0.3), 15/(this.friction+0.3));
				this.rotateRadius=clamp(this.rotateRadius+keyVector.x*20, 50, 800);
				this.rotateControl();
				break;
			case RANDOM_BALL:
				this.randomRotControl();
				this.randomRotPlayerControl();
				this.sinWaveTime+=delta;
				break;
			case SLOWMOTION_BALL:
				break;
			case GAMEOVER_BALL:
				if(!this.isEnded()) this.direction.y-=delta*20;
				break;
		}
		if(moveMode == RANDOM_BALL) this.position.y=this.sinWaveBasis;
		this.position.add(this.direction);
		this.position.add(this.direction2);
		if(moveMode == GAMEOVER_BALL)
		{
			if(this.position.y < -180)
			{
				this.position.y = -180;
				this.direction.y *= -0.7;
			}
		}
		else
		{
			this.position.y = clamp(this.position.y, -180, 400);
			if(moveMode == RANDOM_BALL)
			{
				this.sinWaveBasis=this.position.y;
				this.position.y += Math.sin(this.sinWaveTime * (2 + this.friction*2)) * 100;
			}
		}

	}
}

class Ball_System
{
	constructor()
	{
		this.hull=new THREE.Group();
		this.hull.castShadow=true;
		this.hull.receiveShadow=true;
		this.balls=[];
		this.phase=0;
		this.ballMoveMode=CREATE_BALL;
		this.time=0.0;
		this.phaseTime=0.0;
		this.maxTime=60.0/BPM * 32;

		this.spawnTime=0.0;
		this.spawnMaxTime=60.0/BPM * 0.5;
		this.isActive=true;
	}
	get isEndingScene()
	{
		return this.ballMoveMode == GAMEOVER_BALL;
	}
	addScene(scene)
	{
		scene.add(this.hull);
//		this.body.rotation.y=Math.PI/2;
	}
	reset()
	{
		this.hull.clear();
		this.balls.splice(0);
		this.phase=0;
		this.ballMoveMode=CREATE_BALL;
		this.time=0.0;
		this.phaseTime=0.0;
		this.spawnTime=0.0;
		this.isActive=true;
	}
	createBall(player)
	{
		let base=player.position.clone();
		base.normalize();
		let newPos=base.clone();
		newPos.multiplyScalar(340);
		let newDir=base.clone();
		newDir.y*=3;
		if(newDir.y < 0) newDir.y = 0;
		newDir.multiplyScalar(2+Math.random()*1);
		this.balls.push(new BE_Ball(this.hull, newPos, newDir));
	}
	createBalls(delta, player)
	{
		this.spawnTime+=delta;
		if(this.spawnTime > this.spawnMaxTime)
		{
			this.spawnTime-=this.spawnMaxTime;
			if(player.speed > 0.5) this.createBall(player);
		}
	}
	controlBalls(delta, player)
	{
		this.phaseTime+=delta;
		if(this.phaseTime > this.maxTime)
		{
			this.phase++;
			this.phaseTime -= this.maxTime;
			switch(this.phase)
			{
				case 2: //swing
				case 4:
					this.iterateBalls((t)=>{t.setRandomDir(0.5);});
					this.ballMoveMode=SWING_BALL;
					break;
				case 3: //dance
					this.iterateBalls((t)=>{t.direction.set(0,0,0); t.direction2.set(0,0,0);});
					this.ballMoveMode=DANCE_BALL;
					break;
				case 5:
				case 9:
					this.iterateBalls((t)=>{t.direction.multiplyScalar(0.2); t.direction2.multiplyScalar(0.2);});
					this.ballMoveMode=SLOWMOTION_BALL;
					break;
				case 6:
					this.iterateBalls((t)=>{t.setRandomRotDir(2);});
					this.ballMoveMode=RANDOM_BALL;
					break;
				case 7:
					this.iterateBalls((t)=>{t.setRotateDir();});
					this.ballMoveMode=ROTATE_BALL;
					break;
			}
			if(this.phase == 1 || this.phase == 6) player.changeMode(1);
			else if(this.phase == 2 || this.phase == 9) player.changeMode(0);
		}
		switch(this.phase)
		{
			case 0:
			case 1:
				this.createBalls(delta, player); break;
		}
	}
	iterateBalls(func)
	{
		for(let i=0;i<this.balls.length;i++)
		{
			func(this.balls[i]);
		}
	}
	moveBalls(delta, player)
	{
		for(let i=0;i<this.balls.length;i++)
		{
			this.balls[i].update(delta, player, this.ballMoveMode);
		}
	}
	update(delta, player)
	{
		this.time+=delta;
		if(this.time < DELAY_TIME) return;
		if(this.isActive && this.ballModeMode != GAMEOVER_BALL) this.controlBalls(delta, player);
		this.moveBalls(delta, player);
	}
	setLerp()
	{
		if(this.ballMoveMode == DANCE_BALL)
		{
			this.iterateBalls((t)=>{t.setDanceDirection();});
		}
	}
	callGameOver()
	{
		this.iterateBalls((t)=>{t.direction.set(0,0,0); t.direction2.set(0,0,0);})
		this.ballMoveMode=GAMEOVER_BALL;
	}
	isEnd()
	{
		if(this.ballMoveMode != GAMEOVER_BALL) return false;
		let ended=true;
		for(let i=0;i<this.balls.length;i++)
		{
			if(!this.balls[i].isEnded())
			{
				ended=false;
			}
		}
		return ended;
	}
}


const BPM = 115;
const DELAY_TIME=2.233333;

const STANDARD_MOVE = 0;
const ROTATE_MOVE = 1;

const CREATE_BALL = 0;
const SWING_BALL = 1;
const DANCE_BALL = 2;
const SLOWMOTION_BALL = 3;
const RANDOM_BALL = 4;
const ROTATE_BALL = 5;
const GAMEOVER_BALL = -1;

export {Butterfly, BE_Ball, Ball_System, keyControl, keyUpControl, remoteControl};