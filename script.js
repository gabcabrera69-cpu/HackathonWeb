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

    // Update active link
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${current}`) {
            link.classList.add('active');
        }
    });

    // Debug logging
    console.log('Scroll Position:', scrollPosition, 'Active Section:', current);
}

window.addEventListener('scroll', updateActiveSection);

// Run initially to set active section on page load
updateActiveSection();

// --- Chatbot Logic ---
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

    // Display user's message
    appendMessage(userMessage, 'user');
    chatInput.value = '';

    // Get bot response
    const botResponse = getBotResponse(userMessage);
    setTimeout(() => {
        appendMessage(botResponse, 'bot');
    }, 500);
}

function appendMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(sender + '-message');
    messageDiv.innerText = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getBotResponse(input) {
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('what') && lowerInput.includes('genesis')) {
        return "PROJECT GENESIS is an interactive simulator designed to help users define and explore space habitat layouts. It's a tool for both entertainment and education!";
    }
    if (lowerInput.includes('who') && lowerInput.includes('team')) {
        return "Our team is a group of dedicated students from the Technological Institute of the Philippines (T.I.P.), led by our coach, Engr. Menchie Rosales.";
    }
    if (lowerInput.includes('how') && lowerInput.includes('work')) {
        return "The simulator allows users to customize a habitat’s shape, volume, and interior layout, providing a visual tool to learn about space habitat design principles.";
    }
    if (lowerInput.includes('what') && lowerInput.includes('purpose')) {
        return "The purpose of this project is to create an educational tool that empowers users to learn about space habitat design through interactive play and creativity.";
    }
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
        return "Hello! I'm glad to help. Ask me anything about Project Genesis.";
    }
    if (lowerInput.includes('thank')) {
        return "You're welcome! Feel free to ask more questions.";
    }
    return "I'm sorry, I don't have information on that. I can only answer questions about Project Genesis.";
}

// --- Planet Generator Logic ---
const container = document.getElementById('planet-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

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
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec4 textureColor = texture2D(uTexture, vUv);
    // Multiply the texture color by the uniform color
    gl_FragColor = textureColor * vec4(uColor, 1.0);
  }
`;

const shaderUniforms = {
    uTexture: { value: null },
    uColor: { value: new THREE.Color(0x808080) }
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

// --- Other Three.js Setup (existing code) ---
const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

camera.position.z = 200;

// (Existing code for sliders and animation goes here)
const radiusSlider = document.getElementById('radius-slider');
const tempSlider = document.getElementById('temp-slider');
const insolationSlider = document.getElementById('insolation-slider');
const radiusValueSpan = document.getElementById('radius-value');
const tempValueSpan = document.getElementById('temp-value');
const insolationValueSpan = document.getElementById('insolation-value');

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