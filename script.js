

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

const chatWindow = document.getElementById('chat-window');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const chatbotIcon = document.querySelector('.chatbot-icon');

let chatOpen = false;

function toggleChat() {
    chatWindow.classList.toggle('open');
    
    if (!chatOpen) {
    chatbotIcon.classList.toggle('no-pulse');
    chatOpen = true;}
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
    }, 500); // Wait a moment for a more natural feel
}

function appendMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add(sender + '-message');
    messageDiv.innerText = message;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to the bottom
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

