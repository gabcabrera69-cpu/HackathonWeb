// --- Website Navigation Logic ---
const sections = document.querySelectorAll('main [id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveSection() {
    let current = '';
    const scrollPosition = window.pageYOffset + window.innerHeight / 3;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionBottom = sectionTop + sectionHeight;

        // Check if the scroll position is within the section's bounds
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            current = section.getAttribute('id');
        }
    });

    // If no section is in view, optionally set a default or keep the last active
    if (!current && sections.length > 0) {
        const lastSection = sections[sections.length - 1];
        if (scrollPosition >= lastSection.offsetTop) {
            current = lastSection.getAttribute('id'); // Handle case where scrolled past last section
        }
    }

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${current}`) {
            link.classList.add('active');
        }
    });

}

window.addEventListener('scroll', updateActiveSection);

// Run initially to set active section on page load
updateActiveSection();

// --- Chatbot Logic ---
const chatbotResponses = {
    
    // Core Project Concepts
    "exoplanet": "An exoplanet is simply a planet that orbits a star outside of our solar system. The discovery of these distant worlds is a huge field in astronomy.",
    "find exoplanets": "We use machine learning models trained on publicly available datasets from NASA. These models are designed to automatically analyze transit data and identify potential exoplanets, which is a lot faster than manual analysis.",
    "work": "We use machine learning models trained on publicly available datasets from NASA. These models are designed to automatically analyze transit data and identify potential exoplanets, which is a lot faster than manual analysis.",
    "transit method": "The transit method is how many exoplanets are discovered. It involves observing a star's light for a slight, periodic dip in brightness. This dip suggests that a planet is passing in front of the star, or 'transiting.'",

    // Datasets and Missions
    "kepler and tess": "Both are NASA satellites that use the transit method to find exoplanets. Kepler focused on a single region of the sky for a long period, while TESS is designed to survey nearly the entire sky by observing brighter, closer stars.",
    "kepler": "Kepler was a NASA satellite that focused on a single region of the sky to find exoplanets.",
    "tess": "TESS is a NASA satellite that surveys nearly the entire sky by observing brighter, closer stars to find exoplanets.",
    "data do you use": "We use open-source datasets from NASA missions like Kepler, K2, and TESS. This data includes confirmed exoplanets, planetary candidates, and false positives, along with variables like orbital period and planetary radius.",
    "data publicly available": "Yes, all the data we use is publicly available through NASA. We've just applied machine learning to analyze it in a new way.",

    // Machine Learning & Research
    "automated classification": "Manual analysis of exoplanet data is incredibly time-consuming. Automated classification allows us to process vast amounts of data quickly and efficiently, which could lead to the discovery of many new exoplanets that might otherwise be missed.",
    "accuracy": "Promising research studies have shown that machine learning models can achieve high-accuracy results in identifying exoplanets. Our goal is to build on that research and provide a reliable tool for classification.",
    "discover new exoplanets": "By automatically analyzing vast amounts of data that hasn't been fully studied yet, our project has the potential to uncover new exoplanets hiding within the datasets from satellites like Kepler and TESS.",

    // Specific Terminology
    "planetary candidate": "A planetary candidate is a potential exoplanet identified through data analysis that has yet to be officially confirmed by other methods.",
    "false positive": "A false positive is a signal in the data that initially looks like an exoplanet transit but is later determined to be caused by something else, like a background star or instrumental noise.",

    // Navigation and Help
    "demonstration": "Yes, absolutely! The interactive simulator on our homepage visualizes some of the planets we've identified, allowing you to see their characteristics in 3D.",
    "learn more": "You can check out the Resources tab on our website for links to the NASA datasets and research papers that inspired this project.",
    "resources": "You can check out the Resources tab on our website for links to the NASA datasets and research papers that inspired this project.",

    // General conversation starters
    "how are you": "I'm doing great, thanks for asking! I'm here to help you learn about Orbital Horizon and the fascinating world of exoplanets.",
    "orbital horizon": "Orbital Horizon is a project that uses machine learning to identify exoplanets from large NASA datasets. Our goal is to make this data more accessible and to help uncover new planets hidden within the data from missions like Kepler and TESS.",
    "project about": "Orbital Horizon is a project that uses machine learning to identify exoplanets from large NASA datasets. Our goal is to make this data more accessible and to help uncover new planets hidden within the data from missions like Kepler and TESS.",
    "what is": "That's a great question! What specifically would you like to know more about?",
};
const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatbotIcon = document.querySelector('.chatbot-icon');
const closeChatBtn = document.querySelector('.close-btn');

let chatOpen = false;

function toggleChat() {
    chatWindow.classList.toggle('open');
    
    if (!chatOpen) {
        chatbotIcon.classList.toggle('no-pulse');
        chatOpen = true;
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

function sendMessage() {
    const userMessage = chatInput.value.trim();
    if (userMessage === '') return;

    // user message
    appendMessage(userMessage, 'user-message');
    chatInput.value = '';

    // bot response
    const botResponse = getBotResponse(userMessage);
    setTimeout(() => {
        appendMessage(botResponse, 'bot-message');
    }, 500);
}

function appendMessage(message, className) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.classList.add(className);
    messageElement.innerText = message;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function getBotResponse(input) {
    const normalizedInput = input.toLowerCase();
    
    // Check for a direct match in the chatbotResponses object
    if (chatbotResponses[normalizedInput]) {
        return chatbotResponses[normalizedInput];
    } 
    
    // Check for a partial match if no direct one is found
    const responseKeys = Object.keys(chatbotResponses);
    for (const key of responseKeys) {
        if (normalizedInput.includes(key)) {
            return chatbotResponses[key];
        }
    }
    
    // Fallback response if no match is found
    return "I'm sorry, I don't have an answer for that right now. Maybe try rephrasing your question?";
}

// --- Planet Generator Logic ---
const container = document.getElementById('planet-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
//slider elements
const radiusSlider = document.getElementById('radius-slider');
const tempSlider = document.getElementById('temp-slider');
const insolationSlider = document.getElementById('insolation-slider');
const radiusValueSpan = document.getElementById('radius-value');
const tempValueSpan = document.getElementById('temp-value');
const insolationValueSpan = document.getElementById('insolation-value');


if (container) {
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
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});