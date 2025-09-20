// --- Planet Generator Logic ---
const container = document.getElementById('planet-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

//slider elements
const radiusSlider = document.getElementById('radius-slider');
const tempSlider = document.getElementById('temp-slider');
const insolationSlider = document.getElementById('insolation-slider');
const radiusValueSpan = document.getElementById('radius-value');
const tempValueSpan = document.getElementById('temp-value');
const insolationValueSpan = document.getElementById('insolation-value');

if (container) {
    // Set renderer size to the container's dimensions
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Update camera aspect ratio
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    // Add the canvas to the container
    container.appendChild(renderer.domElement);
}

const geometry = new THREE.SphereGeometry(50, 64, 64);
const textureLoader = new THREE.TextureLoader();

// List of planet texture paths
const textures = [
    'https://i.imgur.com/zlnvuaI.jpeg',
    'https://i.imgur.com/v9vKt4T.jpeg',
    'https://i.imgur.com/nVEgUBd.jpeg',
    'https://i.imgur.com/I4PhNbE.jpeg',
    'https://i.imgur.com/ivNyaJo.jpeg',
    'https://i.imgur.com/jxuq7Wj.jpeg',
    'https://i.imgur.com/bj8hvU4.jpeg',
    'https://i.imgur.com/RF0Gb8A.jpeg',
    'https://i.imgur.com/5BO62v7.jpeg',
    'https://i.imgur.com/vh2ApNc.jpeg',
    'https://imgur.com/pp6V4rC.jpeg',
    'https://i.imgur.com/bGwIGAH.jpeg',
    'https://i.imgur.com/xEl0Hp5.jpeg',
    'https://i.imgur.com/t5a5hUS.jpeg',
    'https://i.imgur.com/VVH74ia.jpeg',
    'https://i.imgur.com/SztsBYE.jpeg'

];


// Shader material to blend texture and color
const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal); // Transform normal to view space
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz; // Transform position to view space
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform sampler2D uTexture;
    uniform vec3 uColor;
    uniform vec3 uLightDirection; // Direction of the directional light
    uniform float uLightIntensity; // Intensity of the directional light
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
        vec4 textureColor = texture2D(uTexture, vUv);
        
        // Simple diffuse lighting
        vec3 lightDir = normalize(uLightDirection);
        vec3 normal = normalize(vNormal);
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * uLightIntensity * vec3(1.0, 1.0, 1.0); // White light
        
        // Combine texture, color, and lighting
        vec3 finalColor = textureColor.rgb * uColor * diffuse;
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

const shaderUniforms = {
    uTexture: { value: null },
    uColor: { value: new THREE.Color(0x808080) },
    uLightDirection: { value: new THREE.Vector3(50, 50, 50).normalize() }, 
    uLightIntensity: { value: 1.0 }
};

const planetMaterial = new THREE.ShaderMaterial({
    uniforms: shaderUniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
});
const planet = new THREE.Mesh(geometry, planetMaterial);
scene.add(planet);

// Function to randomly select and apply a new texture
function randomizePlanet() {
    const randomTexturePath = textures[Math.floor(Math.random() * textures.length)];
    const newTexture = textureLoader.load(randomTexturePath, (texture) => {
        planetMaterial.uniforms.uTexture.value = texture;
    });
}

// Initial texture on page load
randomizePlanet();

// --- Other Three.js Setup ---
const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

camera.position.z = 200;


function updatePlanetRadius(value) {
    if (planet) {
        const newRadius = parseFloat(value);
        const scaleFactor = newRadius / 50;
        planet.scale.set(scaleFactor, scaleFactor, scaleFactor);
        if (radiusValueSpan) {
            radiusValueSpan.textContent = newRadius;
        }
    }
}

function updatePlanetTemperature(value) {
    const temp = parseFloat(value);
    // Changes color based on temperature: blue (cold) to red (hot)
    const r = Math.min(1, Math.max(0, (temp + 100) / 200));
    const b = Math.min(1, Math.max(0, (-temp + 100) / 200));
    const newColor = new THREE.Color(r, 0.5, b);
    
    // Update the shader's color uniform
    planetMaterial.uniforms.uColor.value = newColor;

    if (tempValueSpan) {
        tempValueSpan.textContent = `${temp} °C`;
    }
}

function updateInsolation(value) {
    if (directionalLight) {
        const intensity = parseFloat(value) / 100;
        directionalLight.intensity = intensity;
        planetMaterial.uniforms.uLightIntensity.value = intensity;
        if (insolationValueSpan) {
            insolationValueSpan.textContent = value;
        }
    }
}



if (radiusSlider) {
    radiusSlider.addEventListener('input', (event) => updatePlanetRadius(event.target.value));
    updatePlanetRadius(radiusSlider.value);
}
if (tempSlider) {
    tempSlider.addEventListener('input', (event) => updatePlanetTemperature(event.target.value));
    updatePlanetTemperature(tempSlider.value);
}
if (insolationSlider) {
    insolationSlider.addEventListener('input', (event) => updateInsolation(event.target.value));
    updateInsolation(insolationSlider.value);
}

// Add a button to the UI to trigger the new texture function
const randomizeButton = document.getElementById('randomize-btn');
if (randomizeButton) {
    randomizeButton.addEventListener('click', randomizePlanet);
}

function animate() {
    requestAnimationFrame(animate);
    if (planet) {
        planet.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}

window.onload = function () {
    animate();
};

window.addEventListener('resize', () => {
    if (container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
});