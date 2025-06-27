// Emergency Chat AI System

let chatHistory = [];
let isTyping = false;
let userLocation = null;

// Azure OpenAI Configuration
const AZURE_OPENAI_CONFIG = (() => {
    const envConfig = window.EnvironmentConfig ? window.EnvironmentConfig.getAzureOpenAIConfig() : null;
    
    return {
        endpoint: envConfig?.endpoint || "https://ai-raiyanbinsarwar0112ai312258162978.openai.azure.com/",
        apiVersion: envConfig?.apiVersion || "2024-12-01-preview",
        deploymentName: "gpt-4o",
        apiKey: envConfig?.apiKey || "2wuCk4AZtNAflvsGfbHjThuF7PKySOnOtW7DzxmgFDLtO07liLBJJQQJ99BCACHYHv6XJ3w3AAAAACOGaBwr"
    };
})();

// Emergency services database for Bangladesh
const emergencyDatabase = {
    dhaka: {
        police: [
            { name: 'Dhanmondi Police Station', lat: 23.7465, lng: 90.3742, phone: '02-9665301', address: 'Dhanmondi, Dhaka 1205' },
            { name: 'Ramna Police Station', lat: 23.7367, lng: 90.3956, phone: '02-9556133', address: 'Ramna, Dhaka 1000' },
            { name: 'Tejgaon Police Station', lat: 23.7543, lng: 90.3911, phone: '02-8833084', address: 'Tejgaon, Dhaka 1215' },
            { name: 'Gulshan Police Station', lat: 23.7925, lng: 90.4147, phone: '02-9881234', address: 'Gulshan, Dhaka 1212' }
        ],
        hospitals: [
            { name: 'Dhaka Medical College Hospital', lat: 23.7257, lng: 90.3995, phone: '02-9661064', address: 'Dhaka Medical College, Dhaka 1000' },
            { name: 'Sir Salimullah Medical College', lat: 23.7099, lng: 90.4152, phone: '02-7316222', address: 'Mitford, Dhaka 1100' },
            { name: 'Holy Family Red Crescent Hospital', lat: 23.7465, lng: 90.4008, phone: '02-8316071', address: 'Eskaton, Dhaka 1000' },
            { name: 'Square Hospital', lat: 23.7516, lng: 90.3860, phone: '02-8159457', address: 'West Panthapath, Dhaka 1205' },
            { name: 'United Hospital', lat: 23.7925, lng: 90.4147, phone: '02-8836000', address: 'Gulshan, Dhaka 1212' }
        ],
        fire: [
            { name: 'Fire Service Headquarters', lat: 23.7367, lng: 90.3956, phone: '9555555', address: 'Kakrail, Dhaka 1000' },
            { name: 'Dhanmondi Fire Station', lat: 23.7465, lng: 90.3742, phone: '02-9665544', address: 'Dhanmondi 27, Dhaka 1209' },
            { name: 'Tejgaon Fire Station', lat: 23.7543, lng: 90.3911, phone: '02-8833201', address: 'Tejgaon, Dhaka 1215' }
        ],
        ambulance: [
            { name: '999 Emergency Ambulance', phone: '999', address: 'Government Emergency Service', available24: true },
            { name: 'Dhaka Ambulance Service', phone: '01711-123456', address: '24/7 Private Service', available24: true },
            { name: 'Red Crescent Ambulance', phone: '02-9351522', address: 'Bangladesh Red Crescent Society', available24: true }
        ]
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeChat();
    getCurrentLocation();
});

function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const voiceBtn = document.getElementById('voiceBtn');
    const locationBtn = document.getElementById('locationBtn');
    const emergencyCallBtn = document.getElementById('emergencyCallBtn');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    
    // Set welcome message time
    const welcomeTime = document.getElementById('welcomeTime');
    if (welcomeTime) {
        welcomeTime.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
    
    // Enable send button when input has text
    chatInput.addEventListener('input', function() {
        sendBtn.disabled = this.value.trim().length === 0;
        if (this.value.trim().length > 0) {
            sendBtn.classList.add('active');
        } else {
            sendBtn.classList.remove('active');
        }
    });
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Suggestion chips
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const query = this.dataset.query;
            chatInput.value = query;
            sendMessage();
        });
    });
    
    // Voice input (if supported)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        voiceBtn.addEventListener('click', startVoiceRecognition);
    } else {
        voiceBtn.style.display = 'none';
    }
    
    // Location sharing
    locationBtn.addEventListener('click', shareUserLocation);
    
    // Emergency call
    emergencyCallBtn.addEventListener('click', function() {
        if (confirm('Do you want to call emergency services (999) immediately?')) {
            window.location.href = 'tel:999';
        }
    });
}

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat('user', message);
    
    // Clear input
    chatInput.value = '';
    document.getElementById('sendBtn').disabled = true;
    document.getElementById('sendBtn').classList.remove('active');
    
    // Hide suggestions after first message
    const suggestions = document.getElementById('quickSuggestions');
    if (suggestions) {
        suggestions.style.display = 'none';
    }
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Get AI response
        const response = await getAIResponse(message);
        
        // Hide typing indicator
        hideTypingIndicator();
        
        // Add AI response to chat
        addMessageToChat('ai', response.text, response.data);
        
    } catch (error) {
        console.error('Chat error:', error);
        hideTypingIndicator();
        
        // Add fallback response
        const fallbackResponse = getFallbackChatResponse(message);
        addMessageToChat('ai', fallbackResponse.text, fallbackResponse.data);
    }
}

function addMessageToChat(type, message, data = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.className = `message ${type}-message`;
    
    if (type === 'user') {
        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${message}</div>
                <div class="message-time">${timestamp}</div>
            </div>
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
        `;
    } else {
        let messageContent = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${message}</div>
        `;
        
        // Add service cards if available
        if (data && data.services && data.services.length > 0) {
            messageContent += '<div class="service-cards">';
            data.services.forEach(service => {
                messageContent += `
                    <div class="service-card">
                        <div class="service-info">
                            <h4>${service.name}</h4>
                            <p><i class="fas fa-map-marker-alt"></i> ${service.distance || 'Available'}</p>
                            <p><i class="fas fa-location-dot"></i> ${service.address}</p>
                        </div>
                        <div class="service-actions">
                            <a href="tel:${service.phone}" class="call-btn">
                                <i class="fas fa-phone"></i> ${service.phone}
                            </a>
                            ${service.lat && service.lng ? 
                                `<button onclick="getDirections('${service.name}', ${service.lat}, ${service.lng})" class="direction-btn">
                                    <i class="fas fa-directions"></i> Directions
                                </button>` : ''
                            }
                        </div>
                    </div>
                `;
            });
            messageContent += '</div>';
        }
        
        // Add quick actions if available
        if (data && data.quickActions && data.quickActions.length > 0) {
            messageContent += '<div class="quick-actions-inline">';
            data.quickActions.forEach(action => {
                messageContent += `
                    <button class="quick-action-btn" onclick="${action.onclick}">
                        <i class="${action.icon}"></i> ${action.text}
                    </button>
                `;
            });
            messageContent += '</div>';
        }
        
        messageContent += `
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        messageDiv.innerHTML = messageContent;
    }
    
    chatMessages.appendChild(messageDiv);
    
    // Add to chat history
    chatHistory.push({
        type: type,
        message: message,
        data: data,
        timestamp: new Date().toISOString()
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function getAIResponse(userMessage) {
    try {
        // Build conversation context
        const conversationHistory = chatHistory.slice(-10).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.message
        }));
        
        const systemPrompt = `You are an intelligent, empathetic emergency assistance AI for Bangladesh. You're having a conversation with someone who may need emergency help or guidance.

Context:
- This is an ongoing conversation - respond naturally and conversationally
- The user is in Bangladesh (likely Dhaka area)
- You have access to emergency services database
- Be helpful, clear, and direct
- If it's an emergency, prioritize immediate action
- Provide specific, actionable advice

Previous conversation: ${conversationHistory.length > 0 ? JSON.stringify(conversationHistory.slice(-3)) : 'This is the start of the conversation'}

User's current message: "${userMessage}"

Respond in JSON format:
{
    "text": "Your conversational response (be natural, helpful, and empathetic)",
    "urgency": "critical|high|medium|low",
    "serviceType": "police|hospital|fire|ambulance|general|information",
    "needsServices": true/false,
    "recommendations": ["specific actionable advice"],
    "followUpQuestions": ["questions to better help the user"]
}

Important: Be conversational and natural. Don't be robotic. Show empathy and provide practical help.`;

        const response = await fetch(`${AZURE_OPENAI_CONFIG.endpoint}/openai/deployments/${AZURE_OPENAI_CONFIG.deploymentName}/chat/completions?api-version=${AZURE_OPENAI_CONFIG.apiVersion}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': AZURE_OPENAI_CONFIG.apiKey
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: systemPrompt },
                    ...conversationHistory.slice(-5),
                    { role: "user", content: userMessage }
                ],
                max_tokens: 800,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            throw new Error(`AI API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = JSON.parse(data.choices[0].message.content);
        
        // Add relevant services if needed
        if (aiResponse.needsServices && aiResponse.serviceType !== 'general') {
            const services = getRelevantServices(aiResponse.serviceType, userMessage);
            return {
                text: aiResponse.text,
                data: {
                    services: services.slice(0, 3),
                    urgency: aiResponse.urgency,
                    quickActions: generateQuickActions(aiResponse.serviceType, aiResponse.urgency)
                }
            };
        }
        
        return {
            text: aiResponse.text,
            data: {
                urgency: aiResponse.urgency,
                quickActions: aiResponse.urgency === 'critical' || aiResponse.urgency === 'high' ? 
                    [{ text: 'Call 999', icon: 'fas fa-phone', onclick: 'callEmergency()' }] : []
            }
        };
        
    } catch (error) {
        console.error('AI Response Error:', error);
        throw error;
    }
}

function getFallbackChatResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Emergency keywords
    if (lowerMessage.includes('emergency') || lowerMessage.includes('urgent') || lowerMessage.includes('help')) {
        return {
            text: "I understand this is urgent. Let me help you right away. Based on your message, I recommend calling emergency services immediately. Here are the quickest options:",
            data: {
                services: [
                    { name: 'Emergency Hotline', phone: '999', address: 'Immediate assistance for all emergencies', distance: 'Available now' },
                    { name: 'Medical Emergency', phone: '199', address: 'Medical emergencies and ambulance', distance: 'Available now' }
                ],
                urgency: 'high',
                quickActions: [
                    { text: 'Call 999 Now', icon: 'fas fa-phone', onclick: 'callEmergency()' }
                ]
            }
        };
    }
    
    // Service-specific responses
    if (lowerMessage.includes('police')) {
        return {
            text: "I can help you find police assistance. Here are the nearest police stations in Dhaka:",
            data: {
                services: emergencyDatabase.dhaka.police.slice(0, 3).map(s => ({
                    ...s,
                    distance: calculateDisplayDistance(23.7465, 90.3742, s.lat, s.lng)
                })),
                quickActions: [
                    { text: 'Call Police (999)', icon: 'fas fa-shield-alt', onclick: 'window.location.href="tel:999"' }
                ]
            }
        };
    }
    
    if (lowerMessage.includes('hospital') || lowerMessage.includes('medical')) {
        return {
            text: "For medical assistance, here are the nearest hospitals and medical facilities:",
            data: {
                services: emergencyDatabase.dhaka.hospitals.slice(0, 3).map(s => ({
                    ...s,
                    distance: calculateDisplayDistance(23.7465, 90.3742, s.lat, s.lng)
                })),
                quickActions: [
                    { text: 'Call Medical Emergency (199)', icon: 'fas fa-hospital', onclick: 'window.location.href="tel:199"' }
                ]
            }
        };
    }
    
    // Default helpful response
    return {
        text: "I'm here to help with any emergency or safety concerns you have. You can ask me about finding nearby emergency services, safety tips, emergency procedures, or any other assistance you need. What specific help are you looking for?",
        data: {
            quickActions: [
                { text: 'Emergency Call', icon: 'fas fa-phone', onclick: 'callEmergency()' },
                { text: 'Share Location', icon: 'fas fa-map-marker-alt', onclick: 'shareUserLocation()' }
            ]
        }
    };
}

function getRelevantServices(serviceType, query) {
    const userLat = userLocation ? userLocation.lat : 23.7465;
    const userLng = userLocation ? userLocation.lng : 90.3742;
    
    let services = [];
    
    switch (serviceType) {
        case 'police':
            services = emergencyDatabase.dhaka.police;
            break;
        case 'hospital':
            services = emergencyDatabase.dhaka.hospitals;
            break;
        case 'fire':
            services = emergencyDatabase.dhaka.fire;
            break;
        case 'ambulance':
            services = emergencyDatabase.dhaka.ambulance;
            break;
        default:
            services = [
                ...emergencyDatabase.dhaka.police.slice(0, 1),
                ...emergencyDatabase.dhaka.hospitals.slice(0, 1),
                { name: 'Emergency Hotline', phone: '999', address: 'All emergency services' }
            ];
    }
    
    return services.map(service => ({
        ...service,
        distance: service.lat ? calculateDisplayDistance(userLat, userLng, service.lat, service.lng) : 'Available'
    }));
}

function generateQuickActions(serviceType, urgency) {
    const actions = [];
    
    if (urgency === 'critical' || urgency === 'high') {
        actions.push({ text: 'Call 999', icon: 'fas fa-phone', onclick: 'callEmergency()' });
    }
    
    switch (serviceType) {
        case 'medical':
        case 'hospital':
            actions.push({ text: 'Call Medical (199)', icon: 'fas fa-hospital', onclick: 'window.location.href="tel:199"' });
            break;
        case 'fire':
            actions.push({ text: 'Call Fire Service', icon: 'fas fa-fire-extinguisher', onclick: 'window.location.href="tel:9555555"' });
            break;
    }
    
    actions.push({ text: 'Share Location', icon: 'fas fa-map-marker-alt', onclick: 'shareUserLocation()' });
    
    return actions;
}

function showTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = 'flex';
        isTyping = true;
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = 'none';
        isTyping = false;
    }
}

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    const voiceBtn = document.getElementById('voiceBtn');
    voiceBtn.classList.add('recording');
    voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById('chatInput').value = transcript;
        document.getElementById('sendBtn').disabled = false;
        document.getElementById('sendBtn').classList.add('active');
    };
    
    recognition.onend = function() {
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        voiceBtn.classList.remove('recording');
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    };
    
    recognition.start();
}

function shareUserLocation() {
    if (navigator.geolocation) {
        addMessageToChat('user', 'I\'m sharing my location with you.');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                userLocation = { lat, lng };
                
                const locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                addMessageToChat('ai', `Thank you for sharing your location. I can see you're at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}. This will help me provide more accurate assistance and directions to nearby emergency services.`, {
                    quickActions: [
                        { text: 'Find Nearby Services', icon: 'fas fa-search', onclick: `sendMessage('What emergency services are near my location?')` },
                        { text: 'Get Directions', icon: 'fas fa-directions', onclick: `window.open('${locationUrl}', '_blank')` }
                    ]
                });
            },
            (error) => {
                addMessageToChat('ai', 'I couldn\'t access your location. You can still ask me about emergency services in your area by mentioning the area name (like "Dhanmondi" or "Gulshan").');
            }
        );
    } else {
        addMessageToChat('ai', 'Location sharing is not available on this device. You can tell me your area name and I\'ll help find nearby emergency services.');
    }
}

function callEmergency() {
    window.location.href = 'tel:999';
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            },
            (error) => {
                console.log('Location access denied or unavailable');
            }
        );
    }
}

// Helper function to calculate distance
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function calculateDisplayDistance(lat1, lng1, lat2, lng2) {
    if (!lat2 || !lng2) return 'Available';
    const dist = calculateDistance(lat1, lng1, lat2, lng2);
    return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
}

function getDirections(serviceName, lat, lng) {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(serviceName)}`;
    window.open(mapsUrl, '_blank');
}
