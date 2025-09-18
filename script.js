// --- Website Navigation Logic ---
const sections = document.querySelectorAll('main [id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

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

const container = document.getElementById('planet-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Check if the planet container exists before appending to it
if (container) {
    container.appendChild(renderer.domElement);
}

const geometry = new THREE.SphereGeometry(50, 64, 64);
const material = new THREE.MeshLambertMaterial({ color: 0x808080 });
const planet = new THREE.Mesh(geometry, material);
scene.add(planet);

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 50, 50);
scene.add(directionalLight);

camera.position.z = 200;

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
    if (planet) {
        const temp = parseFloat(value);
        const r = Math.min(1, Math.max(0, (temp - 0) / 200));
        const b = Math.min(1, Math.max(0, (-temp - 0) / 200));
        const g = 0.5;
        const newColor = new THREE.Color(r, g, b);
        material.color.set(newColor);
        if (tempValueSpan) {
            tempValueSpan.textContent = `${temp} °C`;
        }
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

// Check if sliders exist before adding event listeners
if (radiusSlider) {
    radiusSlider.addEventListener('input', (event) => updatePlanetRadius(event.target.value));
    // Initial setup
    updatePlanetRadius(radiusSlider.value);
}
if (tempSlider) {
    tempSlider.addEventListener('input', (event) => updatePlanetTemperature(event.target.value));
    // Initial setup
    updatePlanetTemperature(tempSlider.value);
}
if (insolationSlider) {
    insolationSlider.addEventListener('input', (event) => updateInsolation(event.target.value));
    // Initial setup
    updateInsolation(insolationSlider.value);
}

function animate() {
    requestAnimationFrame(animate);
    if (planet) {
        planet.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}

// Start animation after the window has loaded
window.onload = function () {
    animate();
};

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});