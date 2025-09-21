// --- Planet Generator Logic ---
const container = document.getElementById('planet-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 10000); // Initialize with a placeholder aspect ratio
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

//slider elements
const radiusSlider = document.getElementById('radius-slider');
const tempSlider = document.getElementById('temp-slider');
const insolationSlider = document.getElementById('insolation-slider');
const radiusInput = document.getElementById('radius-input');
const tempInput = document.getElementById('temp-input');
const insolationInput = document.getElementById('insolation-input');

if (container) {
    // Update camera aspect ratio
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    // Set renderer size to the container's dimensions
    renderer.setSize(container.clientWidth, container.clientHeight);
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

// --- Camera Control ---
const originalCameraZ = 200;
let cameraTargetZ = originalCameraZ;

// --- Comparison Logic ---
let comparisonObject = null;
const comparisonData = {
    earth: {
        radius: 50, // Base radius (1 Earth radii)
        texture: 'https://i.imgur.com/jxuq7Wj.jpeg'
    },
    mars: {
        radius: 50 * 0.53, // Mars is ~0.53x Earth's radius
        texture: 'https://i.imgur.com/pp6V4rC.jpeg'
    },
    moon: {
        radius: 50 * 0.273, // Moon is ~0.273x Earth's radius
        texture: 'https://i.imgur.com/bGwIGAH.jpeg'
    },
    jupiter: {
        radius: 50 * 11.2, // Jupiter is ~11.2x Earth's radius
        texture: 'https://i.imgur.com/s9YuOa7.jpeg'
    },
    sun: {
        radius: 50 * 109, // Sun is ~109x Earth's radius
        texture: 'https://i.imgur.com/zlnvuaI.jpeg'
    }
};

function showComparison(bodyName) {
    // Remove previous comparison object if it exists
    if (comparisonObject) {
        scene.remove(comparisonObject);
        comparisonObject.geometry.dispose();
        comparisonObject.material.dispose();
        comparisonObject = null;
        planet.position.x = 0; // Reset user planet position
        cameraTargetZ = originalCameraZ; // Reset camera zoom
    }

    if (bodyName && bodyName !== 'none') {
        const data = comparisonData[bodyName];
        const compGeometry = new THREE.SphereGeometry(data.radius, 64, 64);
        const compTexture = textureLoader.load(data.texture);
        const compMaterial = new THREE.MeshStandardMaterial({ map: compTexture });
        
        comparisonObject = new THREE.Mesh(compGeometry, compMaterial);

        // Position the comparison object to the right of the user's planet
        const userPlanetRadius = planet.scale.x * 50; // Get current radius
        const halfGap = 30 / 2; // The gap is 30 units

        // --- Centering Logic ---
        planet.position.x = -userPlanetRadius - halfGap;
        comparisonObject.position.x = data.radius + halfGap;

        scene.add(comparisonObject);

        // --- Calculate required camera zoom ---
        // The total width is the rightmost edge of the comparison object minus the leftmost edge of the user's planet.
        const leftEdge = planet.position.x - userPlanetRadius;
        const rightEdge = comparisonObject.position.x + data.radius;
        const totalWidth = rightEdge - leftEdge;
        const totalHeight = Math.max(userPlanetRadius, data.radius) * 2;

        const fov = camera.fov * (Math.PI / 180);
        const distanceForHeight = totalHeight / (2 * Math.tan(fov / 2));
        const distanceForWidth = totalWidth / (2 * Math.tan(fov / 2) * camera.aspect);

        // Set the target Z position, adding a 20% buffer for padding
        cameraTargetZ = Math.max(distanceForHeight, distanceForWidth) * 1.2;
    } else {
        // If 'Clear' is pressed, ensure camera resets
        planet.position.x = 0;
        cameraTargetZ = originalCameraZ;
    }
}

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

camera.position.z = originalCameraZ;


function updatePlanetRadius(value) {
    if (planet) {
        const newRadius = parseFloat(value);
        const scaleFactor = newRadius / 50;
        planet.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Reposition comparison object if it exists
        if (comparisonObject) {
            const userPlanetRadius = newRadius;
            const comparisonRadius = comparisonObject.geometry.parameters.radius;
            
            // Recalculate positions to keep the pair centered
            const halfGap = 30 / 2; // The gap is 30 units
            planet.position.x = -userPlanetRadius - halfGap;
            // The comparison object's position doesn't need to change as its radius is constant.

            // --- Recalculate camera zoom to fit the new size ---
            const leftEdge = planet.position.x - userPlanetRadius;
            const rightEdge = comparisonObject.position.x + comparisonRadius;
            const totalWidth = rightEdge - leftEdge;
            const totalHeight = Math.max(userPlanetRadius, comparisonRadius) * 2;

            const fov = camera.fov * (Math.PI / 180);
            const distanceForHeight = totalHeight / (2 * Math.tan(fov / 2));
            const distanceForWidth = totalWidth / (2 * Math.tan(fov / 2) * camera.aspect);

            cameraTargetZ = Math.max(distanceForHeight, distanceForWidth) * 1.2;
        } else {
            // --- Recalculate camera zoom for the single planet ---
            // Use a stepped radius for camera calculation to show size change before zooming.
            const radiusForCamera = Math.max(50, Math.ceil(newRadius / 100) * 100);
            const totalWidth = radiusForCamera * 2;
            const totalHeight = radiusForCamera * 2;

            const fov = camera.fov * (Math.PI / 180);
            const distanceForHeight = totalHeight / (2 * Math.tan(fov / 2));
            const distanceForWidth = totalWidth / (2 * Math.tan(fov / 2) * camera.aspect);

            // Set the target Z position, adding a buffer for padding
            cameraTargetZ = Math.max(distanceForHeight, distanceForWidth) * 1.2;
        }
        // Sync slider and input
        radiusInput.value = newRadius;
        radiusSlider.value = newRadius;
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

    // Sync slider and input
    tempInput.value = temp;
    tempSlider.value = temp;
}

function updateInsolation(value) {
    if (directionalLight) {
        const intensity = parseFloat(value) / 100;
        directionalLight.intensity = intensity;
        planetMaterial.uniforms.uLightIntensity.value = intensity;
        // Sync slider and input
        insolationInput.value = value;
        insolationSlider.value = value;
    }
}



if (radiusSlider && radiusInput) {
    radiusSlider.addEventListener('input', (event) => updatePlanetRadius(event.target.value));
    radiusInput.addEventListener('input', (event) => updatePlanetRadius(event.target.value));
    updatePlanetRadius(radiusSlider.value);
}
if (tempSlider && tempInput) {
    tempSlider.addEventListener('input', (event) => updatePlanetTemperature(event.target.value));
    tempInput.addEventListener('input', (event) => updatePlanetTemperature(event.target.value));
    updatePlanetTemperature(tempSlider.value);
}
if (insolationSlider && insolationInput) {
    insolationSlider.addEventListener('input', (event) => updateInsolation(event.target.value));
    insolationInput.addEventListener('input', (event) => updateInsolation(event.target.value));
    updateInsolation(insolationSlider.value);
}

// Add a button to the UI to trigger the new texture function
const randomizeButton = document.getElementById('randomize-btn');
if (randomizeButton) {
    randomizeButton.addEventListener('click', randomizePlanet);
}

// Add event listeners for comparison buttons
const compareButtons = document.querySelectorAll('.compare-btn');
compareButtons.forEach(button => {
    button.addEventListener('click', () => {
        showComparison(button.dataset.body);
    });
});

function animate() {
    requestAnimationFrame(animate);
    if (planet) {
        planet.rotation.y += 0.005;
    }
    if (comparisonObject) {
        comparisonObject.rotation.y += 0.002; // Rotate the comparison body
    }
    // Smoothly animate camera to target zoom level
    camera.position.z += (cameraTargetZ - camera.position.z) * 0.05;

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