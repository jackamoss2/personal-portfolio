// uses wave simulation equations derived in this article:
// https://medium.com/@matiasortizdiez/beginners-introduction-to-natural-simulation-in-python-ii-simulating-a-water-ripple-809356ffcb43

import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';



// scene setup ----------------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);


// camera setup ----------------
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.setZ(-70);
camera.position.setX(0);
camera.position.setY(50);


// renderer setup ----------------
const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('#bg'),
});
// renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;


// controls setup - remove when implementing? ----------------
const controls = new OrbitControls(camera, renderer.domElement);
// disable interaction
controls.rotateSpeed = 0;
controls.zoomSpeed = 0;
controls.target = new THREE.Vector3(0, 0, 0);
controls.update();

// light setup - rearrange before implimenting ----------------
// ambient light
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
// directional light
const dirLight = new THREE.DirectionalLight(0xbfb58f, 1.0)

//temp
// const geometry2 = new THREE.SphereGeometry(5,5)
// const material2 = new THREE.MeshBasicMaterial({
//     color:0xffffff,
// })
// const sphere = new THREE.Mesh(geometry2, material2);
// sphere.position.setZ(0);
// sphere.position.setX(-90);
// sphere.position.setY(30);
// scene.add(sphere);

dirLight.position.x += 50
dirLight.position.y += 20
dirLight.position.z += 20
dirLight.castShadow = true
dirLight.shadow.mapSize.width = 4096;
dirLight.shadow.mapSize.height = 4096;
const d = 25;
dirLight.shadow.camera.left = - d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = - d;
dirLight.position.z = -30;

let target = new THREE.Object3D();
target.position.z = -30;
dirLight.target = target;
dirLight.target.updateMatrixWorld();

dirLight.shadow.camera.lookAt(0, 0, -30);
scene.add(dirLight);
// scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );


// plane geometry ----------------
const nodesPerLength = 1;

const x_min = 0;
const x_max = 100; // length from x_min - KEEP EVEN OR BREAKS CODE
const Lx = x_max - x_min; // total length of plane
const nx = (nodesPerLength*Lx)+1; // number of nodes in x dimension
const dx = Lx / (nx - 1); // distance between nodes

const y_min = x_min;
const y_max = x_max; // plane shape square
const Ly = y_max - y_min; // total width of plane
const ny = nx;
const dy = Ly / (ny - 1);


// load textures
// const textureLoader = new THREE.TextureLoader();
// const waterBaseColor = textureLoader.load("./textures/Water_002_COLOR.jpg");
// const waterNormalMap = textureLoader.load("./textures/Water 0236normal.jpg");
// const waterHeightMap = textureLoader.load("./textures/Water_002_DISP.png");
// const waterRoughness = textureLoader.load("./textures/Water_002_ROUGH.jpg");
// const waterAmbientOcclusion = textureLoader.load("./textures/Water_002_OCC.jpg");


const geometry = new THREE.PlaneBufferGeometry(Lx, Ly, nx-1, ny-1); // length/width and number of segments (not vertices!) in each dimension
// const plane = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0xf2a23a }));
const material = new THREE.MeshStandardMaterial({
    color: 0x1a368a,
    // normalMap: waterNormalMap,
    // displacementMap: waterHeightMap, displacementScale: 0.01,
    // roughnessMap: waterRoughness, roughness: 0,
    // aoMap: waterAmbientOcclusion
});
const plane = new THREE.Mesh(geometry, material);
plane.receiveShadow = true;
plane.castShadow = true;
plane.rotation.x = - Math.PI / 2;
// plane.position.z = - 10;
scene.add(plane);

// wave function variables
const c = 1; // sqrt(proportionality constant / mass)
const CFL = 0.2; // Courant–Friedrichs–Lewy condition - needs to < 1; forces dt < dx (i think???)
const dt = c * CFL * dx;
const nu = 0.002



const count = geometry.attributes.position.count; // get total number of vertices from geometry object (nx * ny)



// matrix u will hold vertice properties t,x,y for t-1, t, and t+1 at all x,y in plane
var u = []; // create array representing time dimension, then,
for (var i=0; i<3; i++) { // for past(0), present(1), and future(2) timeframes, 
    u[i] = []; // create new array representing x dimension,
    for (var j=0; j<nx; j++) { // then, for each row of x vertices,
        u[i][j] = new Array(ny).fill(0); // create new array representing y dimension, of length ny, full of 0s
	}
}
u[1][Math.floor(nx / 2)][Math.floor(ny / 2)] = Math.sin(1 / 10); // disturbance at t = 1



// mousemove event
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const vector3 = new THREE.Vector3();
const maxClickDistance = 10;
window.addEventListener('mousemove', event => {
    addImpact(event, 11)
})
window.addEventListener('click', event => {
    addImpact(event, 100)
})
function addImpact(event, duration) {
    // three raycaster
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersect = raycaster.intersectObjects(scene.children);
    // console.log(intersect)

    if (intersect.length > 0 && (intersect[0].object).geometry) {
        const mesh = intersect[0].object
            const geometry = mesh.geometry
            const point = intersect[0].point

            for (let i = 0; i  < geometry.attributes.position.count; i++) {
                vector3.setX(geometry.attributes.position.getX(i))
                vector3.setY(geometry.attributes.position.getY(i))
                vector3.setZ(geometry.attributes.position.getZ(i))
                const toWorld = mesh.localToWorld(vector3)

                const distance = point.distanceTo(toWorld)
                var x = (geometry.attributes.position.getX(i)*nodesPerLength) + Math.floor(nx/2); // adjusts geometry axis to matrix
                var y = (geometry.attributes.position.getY(i)*nodesPerLength) + Math.floor(ny/2);

                if (distance < .5 && x!=0 && x!=x_max*nodesPerLength && y!=0 && y!=y_max*nodesPerLength) { // prevents modifying edge vertices 
                    // add i to impacted points list
                    impacts.push([x,y,duration]);
                }
            }
    }
}


var impacts = [
    // [x,y,duration],
    [Math.floor(nx /2 ),Math.floor(ny / 2), 31],
]


var computing = false;
var time = 0;
function animate() {
    computing = true;
    time = time + 1;
    
    const uCopy = []
    uCopy[0] = JSON.parse(JSON.stringify(u[0]))
    uCopy[1] = JSON.parse(JSON.stringify(u[1]))
    
    // const t = 1; // t is present, t-1 is past
    for (var x=1; x<nx-1; x++) {
        for (var y=1; y<ny-1; y++) {
            u[2][x][y] = 0.5* c * (Math.pow(dt,2)/Math.pow(dx,2)) * ((uCopy[1][x+1][y] - 2*uCopy[1][x][y] + uCopy[1][x-1][y]) + (uCopy[1][x][y+1] - 2*uCopy[1][x][y] +uCopy[1][x][y-1]) - nu * (uCopy[1][x][y] - uCopy[0][x][y])/dt) + 2*uCopy[1][x][y] - uCopy[0][x][y];

            if (x == nx-2 && y == ny-2) {
                computing = false;
            }
        }
    }
    

    //for each impact/frame, adjust respective index
    for (var i in impacts) {
        i = parseInt(i)
        impacts[i][2] = impacts[i][2] - 1
        u[2][impacts[i][0]][impacts[i][1]] = -Math.sin((time+1) / 10)
    }
    
    // remove impacts when completed
    for (var i in impacts) {
        i = parseInt(i)
        if (impacts[i][2] <= 0) {
            impacts.splice(i,1)
        }
    }

    // generate initial disturbance
    // if (time < 31) {
    //         u[2][Math.floor(nx /2 )][Math.floor(ny / 2)] = -Math.sin((time+1) / 10)
    // }

    
    for (let i = 0; i < count; i++) { // iterate through each geometry vertex to assign z value
        // transform geometry coordinates to matrix indices
        // assumes geometry is centered at 0,0
        // assumes simulation matrix has same number of nodes as geometry
        // assumes nx,ny are odd
        const xGeometry = geometry.attributes.position.getX(i);
        const yGeometry = geometry.attributes.position.getY(i);
        const xMatrix = (xGeometry / dx) + (Math.floor(nx / 2))
        const yMatrix = (yGeometry / dy) + (Math.floor(ny / 2))
        
        // get elevation from simulation matrix, assign to geometry vertex
        const amplification = 2;
        const z = u[1][xMatrix][yMatrix] * amplification;
        geometry.attributes.position.setZ(i, z);
        // if (xMatrix == 0 || xMatrix == nx-1 || yMatrix == 0 || yMatrix == ny-1) {
        //     geometry.attributes.position.setZ(i, 0);
        // }
    }
    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;
    
    renderer.render(scene, camera);
    
    // shift present elevations to past, and future to present, for use in next iteration
    if (computing == false) {
        u[0] = uCopy[1] // set u[past] = u[present]
        u[1] = u[2] // set u[present] = u[future], as calculated this iteration 
    }
    else {
        throw new Error('computation exceeded loop')
    }
    

    requestAnimationFrame(animate);
}
animate();

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
};
window.addEventListener('resize', onWindowResize);