import * as THREE from './libs/three.module.js';
import {GLTFLoader} from './libs/plugins/GLTFLoader.js';
import {OrbitControls} from './libs/plugins/OrbitControls.js';
import {Butterfly, Ball_System, keyControl, keyUpControl, remoteControl} from './performance_obj.js';


//loader
const loader=new THREE.LoadingManager(myLoadingComplete);
const gltfLoader = new GLTFLoader(loader);
gltfLoader.load("assets/butterfly.gltf", (gltf) => {
	gltf.scene.traverse( function ( o ) { if ( o.isMesh ) o.castShadow = true;} );
	Butterfly.model = gltf;
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
let isPlaying=false;

//basic function

function myLoadingComplete()
{
	changeScreen(0,1);
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

function init()
{
	camera.position.set(0, 320, 400);
	camera.rotation.set(Math.atan2(320,400),0,0);
	orbitController.update();
	mainScene.background = new THREE.Color(0x111111);
	mainScene.fog = new THREE.Fog(0x111111, 20, 2000);
	player=new Butterfly();
	player.addScene(mainScene);

	ballSystem=new Ball_System();
	ballSystem.addScene(mainScene);
	initGround(mainScene);
	initLights(mainScene);

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
	if(!isPlaying) return;
	const deltaTime = Math.min( 0.1, clock.getDelta() );
	player.update(deltaTime);
	ballSystem.update(deltaTime, player);
	if(ballSystem.isEndingScene)
	{
		if(BGM.volume > 0)
		{
			let p=BGM.volume;
			p -= 1/32;
			if(p < 0) p =0;
			BGM.volume = p;
		}
	}
	if(ballSystem.isEnd())
	{
		isPlaying=false;
		end_room();
		BGM.pause();
		BGM.currentTime = 0;
	}
	renderer.render( mainScene, camera );
}


function addEventListeners()
{
/*	document.addEventListener( 'keydown', ( e ) => {
		keyStates[ e.code ] = true;
		keyControl(keyStates, player, ballSystem);
		if(e.code == "KeyZ") player.changeMode(1);
		if(e.code == "KeyX") player.changeMode(0);
	} );
	document.addEventListener( 'keyup', ( e ) => {
		keyStates[ e.code ] = false;
		keyUpControl(keyStates);
	} );*/
	window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}




socket.on('Start_Performance', function(){ //start performing 
	console.log("performance started");
	if(!isPlaying)
	{
		changeScreen(2,3);
		player.reset();
		ballSystem.reset();
		isPlaying=true;
		BGM.play();
		BGM.volume=1;
	}
});
socket.on('Receive_Game_Over', function(){ //start performing 
	console.log("performance ended");
	remoteControl({x:0, y:0}, player, ballSystem);
	ballSystem.callGameOver();
});
socket.on('Receive_Control', function(v){ //performers->clients controls
	remoteControl(v, player, ballSystem);
});