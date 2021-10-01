import * as THREE from './libs/three.module.js';
import { OrbitControls } from './libs/plugins/OrbitControls.js';

const previewScene=new THREE.Scene();
const mainScene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 2400);
const renderer = new THREE.WebGLRenderer();
const container = document.getElementById("show_canvas");
const GROUND_Y=-300;

//objects
const Spheres=[];
const clock = new THREE.Clock();

//controls
const keyStates={};
let orbitController = new OrbitControls( camera, renderer.domElement );

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

class BE_sphere
{
	static geometry=new THREE.SphereGeometry(20, 16, 12);
	static material=new THREE.MeshStandardMaterial( {
		color: 0xeeffff,
		roughness: 0.5,
		metalness: 0 } );
	constructor(position, scene)
	{
		this.mesh=new THREE.Mesh(BE_sphere.geometry, BE_sphere.material);
		this.mesh.castShadow=true;
		this.mesh.receiveShadow=true;
		this.position=this.mesh.position;
		this.position.copy(position);
		this.velocity=new THREE.Vector3(0,0,0);
		scene.add(this.mesh);
	}
	setDirection(dir)
	{
		let vel=this.velocity.length();
		this.velocity.copy(dir);
		this.velocity.multiplyScalar(vel);
	}
	addForce(v)
	{
		this.velocity.add(v);
		this.velocity.clampLength(0,10);
	}
	update()
	{
		this.position.add(this.velocity);
	}
}


function sphereController()
{
	let vec=new THREE.Vector3(0,0,0);
	if(keyStates['KeyW'] === true) vec.z+=0.2;
	if(keyStates['KeyS'] === true) vec.z-=0.2;
	if(keyStates['KeyA'] === true) vec.x-=0.2;
	if(keyStates['KeyD'] === true) vec.x+=0.2;
	for(let i=0;i<Spheres.length;i++)
	{
		Spheres[i].addForce(vec);
	}
}

function initGround(scene)
{
	const geometry=new THREE.PlaneGeometry( 5000, 5000 );
	const material=new THREE.MeshLambertMaterial( { color: 0x3c4952 } );
	const mesh=new THREE.Mesh(geometry, material);
	mesh.position.y = GROUND_Y;
	mesh.rotation.x=-Math.PI/2;
	mesh.receiveShadow=true;
	scene.add(mesh);
}

function initLights(scene)
{
	scene.add( new THREE.HemisphereLight( 0xbbbbbb, 0x787878 ) );
	const light = new THREE.DirectionalLight( 0xffffff, 0.5 );
	light.position.set( 100, 100, 0 );
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

	scene.add(light);
}

function initObj()
{
	for(let i=0;i<10;i++)
	{
		let pos=new THREE.Vector3(getRandomInt(-250,250), getRandomInt(-250,250), getRandomInt(-250,250));
		let obj=new BE_sphere(pos, mainScene);
		obj.velocity=new THREE.Vector3().random();
		Spheres.push(obj);

	}
	initGround(mainScene);
	initLights(mainScene);

	const helper = new THREE.GridHelper( 10000, 2, 0xffffff, 0xffffff );
	mainScene.add( helper );
}

function init()
{
	camera.position.set(0, 0, 450);
	orbitController.update();
	mainScene.background = new THREE.Color(0x111111);
	mainScene.fog = new THREE.Fog(0x111111, 20, 2000);

	initObj();

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
	sphereController();
	for(let i=0;i<Spheres.length;i++)
	{
		Spheres[i].update();
	}
	render();
}
function render()
{
	renderer.render( mainScene, camera );
}
init();
animate();


function addEventListeners()
{
	document.addEventListener( 'keydown', ( e ) => {
		keyStates[ e.code ] = true;
	} );
	document.addEventListener( 'keyup', ( e ) => {
		keyStates[ e.code ] = false;
	} );

	window.addEventListener( 'resize', onWindowResize );
}


function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
}