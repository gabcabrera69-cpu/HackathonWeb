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
    "hi": "Hello there! I'm Astra, your guide to Orbital Horizon. How can I assist you?",
    "hello": "Hello there! I'm Astra, your guide to Orbital Horizon. How can I assist you?",
    "hey": "Hey! It's great to see you. What can I help you with today?",
    "how are you": "I'm doing great, thanks for asking! I'm here to help you learn about Orbital Horizon and the fascinating world of exoplanets.",
    "you're welcome": "You're most welcome! Is there anything else I can assist you with?",
    "thank you": "You're most welcome! Is there anything else I can assist you with?",
    "are you single": "As an AI, I don't have personal relationships, but I'm always here to help you explore the cosmos! 😉",
    "what do you do": "I'm a chatbot designed to answer your questions about the Orbital Horizon project and exoplanet discovery. Think of me as your personal guide.",
    "who are you": "I am Astra, the AI assistant for Orbital Horizon. My purpose is to help you navigate our project and learn about the cosmos.",
    "what is your name": "My name is Astra, and I'm here to help you explore the vast universe of exoplanets.",
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