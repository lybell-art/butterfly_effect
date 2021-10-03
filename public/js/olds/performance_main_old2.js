import * as THREE from './libs/three.module.js';
import {GLTFLoader} from './libs/plugins/GLTFLoader.js';
import {SkeletonUtils} from './libs/plugins/SkeletonUtils.js';
import { OrbitControls } from './libs/plugins/OrbitControls.js';

//loader
const loader=new THREE.LoadingManager(myLoadingComplete);
const gltfLoader = new GLTFLoader(loader);
gltfLoader.load("assets/butterfly.gltf", (gltf) => {
	gltf.scene.traverse( function ( o ) { if ( o.isMesh ) o.castShadow = true;} );
	Butterfly.model = gltf;
//	console.log(gltf.scene.traverse);
});

//scenes
const mainScene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2400);
const renderer = new THREE.WebGLRenderer();
const container = document.getElementById("show_canvas");

//objects
let player=null, ballSystem=null;
const clock = new THREE.Clock();

//controls
const orbitController = new OrbitControls( camera, renderer.domElement );
const keyStates={};
const keyVector=new THREE.Vector2();
let isKeyPressed=false;

//basic function
function getKeyVector() //temporary
{
	keyVector.x=0; keyVector.y=0; isKeyPressed=false;
	if(keyStates['KeyW'] === true || keyStates['ArrowUp'] === true) keyVector.y--;
	if(keyStates['KeyS'] === true || keyStates['ArrowDown'] === true) keyVector.y++;
	if(keyStates['KeyA'] === true || keyStates['ArrowLeft'] === true) keyVector.x--;
	if(keyStates['KeyD'] === true || keyStates['ArrowRight'] === true) keyVector.x++;
	keyVector.normalize();
	if(keyVector.x != 0 || keyVector.y !=0) isKeyPressed=true;
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
		if(this.movingMode == ROTATE_MOVE)
		{
			this.changeModeLerping=true;
			this.direction.set(-this.position.z, 0, this.position.x);
			this.direction.setLength(this.maxSpeed);
		}
		else if(this.movingMode == STANDARD_MOVE)
		{
			this.isLerping=true;
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
			this.position.y=Math.sin(this.elapsedTime*4)*25;
		}
		else if(this.movingMode == ROTATE_MOVE)
		{
			let getRadius=(x,z)=>Math.sqrt(x*x+z*z);
			this.position.add(this.direction);

			let additionalVec=new THREE.Vector3(this.position.x, 0, this.position.z);
			additionalVec.normalize();
			additionalVec.multiplyScalar(keyVector.x);
			if(this.rotateRadius > 30 && keyVector.x < 0 ) this.position.add(additionalVec);
			else if(this.rotateRadius < 320 && keyVector.x > 0) this.position.add(additionalVec);

			if(keyVector.y > 0 && this.position.y > -150) this.position.y -= keyVector.y * 2;
			else if(keyVector.y < 0 && this.position.y < 400) this.position.y -= keyVector.y * 2;
			console.log(this.rotateRadius);
		}
		this.animMixer.update(delta);
		this.elapsedTime+=delta;
//		console.log(delta);
	}
}

class BE_Ball
{
	static geometry=new THREE.SphereGeometry( 10 );
	static material = new THREE.MeshPhongMaterial( { color: 0xdeffff } );
	constructor(pos=null, dir=null)
	{
		this.body = new THREE.Mesh( BE_Ball.geometry, BE_Ball.material ); 
		this.position=this.body.position;
		this.direction=new THREE.Vector3();
	}
}

class Ball_System
{
	constructor()
	{
		this.balls=[];
		this.phase=0;
		this.
	}
}


function myLoadingComplete()
{
	changeScreen(0,3);
	console.log(Butterfly.model);
	init();
	animate();
}

function initGround(scene)
{
	const geometry=new THREE.PlaneGeometry( 5000, 5000 );
	const material=new THREE.MeshPhongMaterial( { color: 0x29354c } );
	const mesh=new THREE.Mesh(geometry, material);
	mesh.position.y = -200;
	mesh.rotation.x=-Math.PI/2;
	mesh.receiveShadow=true;
	scene.add(mesh);
}

function initLights(scene)
{
	scene.add( new THREE.HemisphereLight( 0xdddddd, 0x777777 ) );
	const light = new THREE.DirectionalLight( 0xffffff, 0.5 );
	light.position.set( 0, 400, 0 );
	light.castShadow = true;

	light.shadow.mapSize.width = 2048;
	light.shadow.mapSize.height = 2048;

	const d = 2000;

	light.shadow.camera.left = - d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = - d;

	light.shadow.camera.far = 4800;
	light.shadow.bias = - 0.0001;

	const spotLight = new THREE.SpotLight(0xffffff);
	spotLight.position.set( 0, 600, 0 );
	spotLight.penumbra=0.6;
	spotLight.angle=Math.PI*0.1;
	spotLight.target=player.body;

	scene.add(light);
	scene.add(spotLight);
}

function debugObj(scene)
{
	const geometry = new THREE.SphereGeometry( 15, 32, 16 );
	const material = new THREE.MeshPhongMaterial( { color: 0xffff00 } );
	const sphere = new THREE.Mesh( geometry, material );
	scene.add(sphere);
}

function init()
{
	camera.position.set(0, 0, 450);
	orbitController.update();
	mainScene.background = new THREE.Color(0x111111);
	mainScene.fog = new THREE.Fog(0x111111, 20, 2000);
	player=new Butterfly();
	player.addScene(mainScene);

	ballSystem=new Ball_System();
	ballSystem.addScene(mainScene);
	initGround(mainScene);
	initLights(mainScene);

//	debugObj(mainScene);

	//renderer setting
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;

	container.appendChild( renderer.domElement );

	addEventListeners();
}
function animate()
{
	requestAnimationFrame( animate );
	const deltaTime = Math.min( 0.1, clock.getDelta() );
	player.update(deltaTime);
	ballSystem.update(deltaTime);
	renderer.render( mainScene, camera );
}


function addEventListeners()
{
	document.addEventListener( 'keydown', ( e ) => {
		keyStates[ e.code ] = true;
		getKeyVector();
		player.setLerp();
		if(e.code == "KeyZ") player.changeMode(ROTATE_MOVE);
		if(e.code == "KeyX") player.changeMode(STANDARD_MOVE);
	} );
	document.addEventListener( 'keyup', ( e ) => {
		keyStates[ e.code ] = false;
		getKeyVector();
	} );
	window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}

const STANDARD_MOVE = 0;
const ROTATE_MOVE = 1;