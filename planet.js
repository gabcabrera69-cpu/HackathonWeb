// --- Planet Generator Logic ---
const container = document.getElementById('planet-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100000); // Increased far clipping plane
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
    'https://i.imgur.com/SztsBYE.jpeg',
    'https://i.imgur.com/pbybcso.png',
    'https://i.imgur.com/Ry6Wqap.png',
    'https://i.imgur.com/jCBb5EU.png',
    'https://i.imgur.com/WeKNEnI.png',
    'https://i.imgur.com/J6oioXm.png',
    'https://i.imgur.com/TO1lR8E.png',
    'https://i.imgur.com/ls7CrET.png',
    'https://i.imgur.com/AUDyk0h.png'  

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

// --- Atmosphere Shaders ---
const atmosphereVertexShader = `
    varying vec3 vNormal;
    void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const atmosphereFragmentShader = `
    varying vec3 vNormal;
    uniform vec3 uGlowColor;
    void main() {
        // Calculate intensity based on the angle of the surface normal to the camera
        // This creates the "glow" effect at the planet's limb (Fresnel effect)
        float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(uGlowColor, 1.0) * intensity;
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

// --- Atmosphere Creation ---
function createAtmosphere(radius = 50, glowColor = new THREE.Color(0x93d5f0), scale = 1.05) {
    const atmosphereGeometry = new THREE.SphereGeometry(radius, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        uniforms: {
            uGlowColor: { value: glowColor }
        },
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    return atmosphere;
}

const planetAtmosphere = createAtmosphere();
// Scale the atmosphere to be slightly larger than the planet
planetAtmosphere.scale.set(1.05, 1.05, 1.05);
planet.add(planetAtmosphere);

// --- Starfield Creation ---
let starfield;

function createStarfield() {
    const starCount = 10000;
    const starGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 35000; // x
        positions[i3 + 1] = (Math.random() - 0.5) * 35000; // y
        positions[i3 + 2] = (Math.random() - 0.5) * 35000; // z
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        transparent: true,
        opacity: 0.8
    });

    starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);
}

// --- Camera Control ---
const originalCameraZ = 200;
let cameraTargetZ = originalCameraZ;

// --- Drag-to-Rotate Logic ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isDragging = false;
let draggedObject = null;
let previousMousePosition = { x: 0, y: 0 };

if (renderer.domElement) {
    renderer.domElement.addEventListener('mousedown', (e) => {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        const objectsToIntersect = [planet];
        if (comparisonObject) {
            objectsToIntersect.push(comparisonObject);
        }
        const intersects = raycaster.intersectObjects(objectsToIntersect, true); 

        if (intersects.length > 0) {
            // The user clicked on a planet (or its atmosphere)
            draggedObject = intersects[0].object.parent === scene ? intersects[0].object : intersects[0].object.parent;
        }

        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    renderer.domElement.addEventListener('mouseup', () => {
        isDragging = false;
        draggedObject = null;
    });

    renderer.domElement.addEventListener('mouseleave', () => {
        isDragging = false;
    });

    renderer.domElement.addEventListener('mousemove', (e) => {
        if (!isDragging || !draggedObject) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        // Apply rotation only to the dragged object
        const rotationSpeed = 0.005;
        if (draggedObject) {
            draggedObject.rotation.y += deltaMove.x * rotationSpeed;
            draggedObject.rotation.x += deltaMove.y * rotationSpeed;
        }

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });
}

// --- Comparison Logic ---
let comparisonObject = null;
let storedPlanets = []; // Array to hold multiple stored planets
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
    // --- Cleanup existing comparison object ---
    if (comparisonObject) {
        scene.remove(comparisonObject);
        comparisonObject.geometry.dispose();
        // Also dispose of the comparison object's materials and its atmosphere's resources
        if (Array.isArray(comparisonObject.material)) {
            comparisonObject.material.forEach(m => m.dispose());
        } else {
            comparisonObject.material.dispose();
        }
        if (comparisonObject.children.length > 0) {
            comparisonObject.children[0].geometry.dispose();
            comparisonObject.children[0].material.dispose();
        }
        comparisonObject = null;
        planet.position.x = 0; // Reset user planet position
        // Recalculate zoom instead of just resetting
        showComparison('none');
    }

    // --- Create new comparison object ---
    if (bodyName && bodyName !== 'none') {
        let data;
        let compMaterial;
        let atmosphereColor = new THREE.Color(0xffffff); // Default atmosphere

        if (bodyName.startsWith('stored_')) {
            const index = parseInt(bodyName.split('_')[1], 10);
            if (index >= storedPlanets.length) return; // Invalid index

            data = storedPlanets[index];

            // Create a new texture from the saved image data to ensure it's independent
            const storedTexture = new THREE.Texture(data.textureImage);
            storedTexture.needsUpdate = true; // Tell three.js to upload the texture to the GPU

            // Create a material for the stored planet using its saved properties
            const storedUniforms = {
                uTexture: { value: storedTexture },
                uColor: { value: data.color.clone() },
                uLightDirection: { value: shaderUniforms.uLightDirection.value.clone() },
                uLightIntensity: { value: shaderUniforms.uLightIntensity.value }
            };
            compMaterial = new THREE.ShaderMaterial({
                uniforms: storedUniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
            });
            atmosphereColor = data.atmosphereColor.clone();
        } else {
            data = comparisonData[bodyName];
            const compTexture = textureLoader.load(data.texture);
            compMaterial = new THREE.MeshStandardMaterial({ map: compTexture });
        }
        
        const compGeometry = new THREE.SphereGeometry(data.radius, 64, 64);
        comparisonObject = new THREE.Mesh(compGeometry, compMaterial);

        // Add atmosphere to the comparison object
        const comparisonAtmosphere = createAtmosphere(data.radius, atmosphereColor);
        // Scale it slightly larger than the planet itself
        comparisonAtmosphere.scale.set(1.02, 1.02, 1.02);
        comparisonObject.add(comparisonAtmosphere);


        // Position the comparison object to the right of the user's planet
        const userPlanetRadius = planet.scale.x * 50; // Get current radius
        const halfGap = 30 / 2; // The gap is 30 units

        // --- Centering Logic ---
        planet.position.x = -userPlanetRadius - halfGap;
        comparisonObject.position.x = data.radius + halfGap;

        scene.add(comparisonObject);

        // --- Calculate required camera zoom ---
        const leftEdge = planet.position.x - userPlanetRadius;
        const rightEdge = comparisonObject.position.x + data.radius;
        const totalWidth = rightEdge - leftEdge;
        const totalHeight = Math.max(userPlanetRadius, data.radius) * 2;

        const fov = camera.fov * (Math.PI / 180);
        const distanceForHeight = totalHeight / (2 * Math.tan(fov / 2));
        const distanceForWidth = totalWidth / (2 * Math.tan(fov / 2) * camera.aspect);

        cameraTargetZ = Math.max(distanceForHeight, distanceForWidth) * 1.4;
    } else {
        // If 'Clear' is pressed, ensure camera resets
        const userPlanetRadius = planet.scale.x * 50;
        planet.position.x = 0;

        // --- Recalculate camera zoom for the single planet ---
        // would reset the zoom to the default, instead of fitting the planet.
        const radiusForCamera = Math.max(50, Math.ceil(userPlanetRadius / 100) * 100);
        const totalWidth = radiusForCamera * 2;
        const totalHeight = radiusForCamera * 2;

        const fov = camera.fov * (Math.PI / 180);
        const distanceForHeight = totalHeight / (2 * Math.tan(fov / 2));
        const distanceForWidth = totalWidth / (2 * Math.tan(fov / 2) * camera.aspect);
        cameraTargetZ = Math.max(originalCameraZ, distanceForHeight, distanceForWidth) * 1.4;
    }
}

// --- Store Planet Logic ---
function storeCustomPlanet() {
    // 1. Save the current planet's state
    const planetData = {
        radius: planet.scale.x * 50,
        // The texture's image source needs to be saved, not the texture object itself,
        // to prevent it from being overwritten when the main planet's texture changes.
        textureImage: planetMaterial.uniforms.uTexture.value.image,
        color: planetMaterial.uniforms.uColor.value.clone(),
        atmosphereColor: planetAtmosphere.material.uniforms.uGlowColor.value.clone()
    };

    // 2. Add to our array of stored planets
    storedPlanets.push(planetData);
    const storedIndex = storedPlanets.length - 1;

    // 3. Create a new button for the stored planet
    const newButton = document.createElement('button');
    newButton.classList.add('compare-btn');
    newButton.dataset.body = `stored_${storedIndex}`;
    newButton.textContent = `Custom ${storedIndex + 1}`;

    // 4. Add an event listener to the new button
    newButton.addEventListener('click', () => {
        showComparison(newButton.dataset.body);
    });

    // 5. Add the new button to the UI before the "Clear" button
    const clearButton = document.getElementById('clear-comparison-btn');
    if (clearButton) {
        clearButton.parentNode.insertBefore(newButton, clearButton);
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

// Create the starfield background
createStarfield();

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
            cameraTargetZ = Math.max(distanceForHeight, distanceForWidth) * 1.4;
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
    
    // Update atmosphere color as well
    const atmosphereColor = new THREE.Color(r, 0.8, b);
    planetAtmosphere.material.uniforms.uGlowColor.value = atmosphereColor;

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

//new texture function
const randomizeButton = document.getElementById('randomize-btn');
if (randomizeButton) {
    randomizeButton.addEventListener('click', randomizePlanet);
}

const storePlanetButton = document.getElementById('store-planet-btn');
if (storePlanetButton) {
    storePlanetButton.addEventListener('click', storeCustomPlanet);
}


//listeners for comparison buttons
const compareButtons = document.querySelectorAll('.compare-btn');
compareButtons.forEach(button => {
    button.addEventListener('click', () => {
        showComparison(button.dataset.body);
    });
});

function animate() {
    requestAnimationFrame(animate);
    // Only apply automatic rotation if the user is not dragging
    if (!isDragging) {
        if (planet) {
            planet.rotation.y += 0.005;
        }
        if (comparisonObject) {
            comparisonObject.rotation.y += 0.002;
        }
    }
    if (starfield) {
        starfield.rotation.y += 0.0001;
    }
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