// Emergency Page JavaScript with AI Integration

let map;
let userLocation;
let markers = [];
let services = [];

// Azure OpenAI Configuration (Note: In production, this should be handled by a backend)
const AZURE_OPENAI_CONFIG = (() => {
    const envConfig = window.EnvironmentConfig ? window.EnvironmentConfig.getAzureOpenAIConfig() : null;
    
    return {
        endpoint: envConfig?.endpoint || "https://ai-raiyanbinsarwar0112ai312258162978.openai.azure.com/",
        apiVersion: envConfig?.apiVersion || "2024-12-01-preview",
        deploymentName: "gpt-4o", // Common deployment name, adjust as needed
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
    console.log('Emergency page loaded');
    console.log('Document ready state:', document.readyState);
    
    // Test if elements exist
    setTimeout(() => {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('emergencySearch');
        console.log('After timeout - Search Button:', searchBtn);
        console.log('After timeout - Search Input:', searchInput);
    }, 1000);
    
    initializeMap();
    initializeLocationButton();
    initializeFilterButtons();
    initializeAISearch();
    loadSampleServices();
});

// Initialize the map
function initializeMap() {
    // Initialize map centered on Dhaka
    map = L.map('map').setView([23.8103, 90.4125], 12);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add map click event
    map.on('click', function(e) {
        console.log('Map clicked at:', e.latlng);
    });
}

// Initialize location button
function initializeLocationButton() {
    const locationBtn = document.getElementById('getLocationBtn');
    
    locationBtn.addEventListener('click', function() {
        getCurrentLocation();
    });
}

// Get user's current location
function getCurrentLocation() {
    const locationBtn = document.getElementById('getLocationBtn');
    const locationStatus = document.getElementById('locationStatus');
    
    if (!navigator.geolocation) {
        updateLocationStatus('Geolocation is not supported by this browser.', 'error');
        return;
    }

    // Show loading state
    locationBtn.disabled = true;
    locationBtn.innerHTML = '<i class="fas fa-spinner loading"></i> Getting Location...';
    updateLocationStatus('Getting your location...', 'loading');

    navigator.geolocation.getCurrentPosition(
        function(position) {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Update map view
            map.setView([userLocation.lat, userLocation.lng], 15);
            
            // Add user location marker
            if (window.userMarker) {
                map.removeLayer(window.userMarker);
            }
            
            window.userMarker = L.marker([userLocation.lat, userLocation.lng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '<i class="fas fa-map-marker-alt" style="color: #dc2626; font-size: 24px;"></i>',
                    iconSize: [24, 24],
                    iconAnchor: [12, 24]
                })
            }).addTo(map).bindPopup('Your Location');

            // Load nearby services
            loadNearbyServices(userLocation);
            
            // Reset button
            locationBtn.disabled = false;
            locationBtn.innerHTML = '<i class="fas fa-check"></i> Location Found';
            updateLocationStatus('Location found! Showing nearby emergency services.', 'success');
            
            setTimeout(() => {
                locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Update Location';
            }, 3000);
        },
        function(error) {
            let errorMessage = 'Unable to get your location.';
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location services.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
            }
            
            updateLocationStatus(errorMessage, 'error');
            
            // Reset button
            locationBtn.disabled = false;
            locationBtn.innerHTML = '<i class="fas fa-map-marker-alt"></i> Try Again';
            
            // Use default Dhaka location
            loadNearbyServices({ lat: 23.8103, lng: 90.4125 });
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
        }
    );
}

// Update location status message
function updateLocationStatus(message, type) {
    const statusEl = document.getElementById('locationStatus');
    statusEl.innerHTML = `<i class="fas ${getStatusIcon(type)}"></i> ${message}`;
    statusEl.className = `location-status ${type}`;
}

function getStatusIcon(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'loading': return 'fa-spinner loading';
        default: return 'fa-info-circle';
    }
}

// Initialize filter buttons
function initializeFilterButtons() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Filter services
            const filter = this.dataset.filter;
            filterServices(filter);
        });
    });
}

// Filter services on map
function filterServices(filter) {
    markers.forEach(marker => {
        if (filter === 'all' || marker.serviceType === filter) {
            marker.marker.addTo(map);
        } else {
            map.removeLayer(marker.marker);
        }
    });
    
    // Also filter the services list
    updateServicesList(filter);
}

// Load sample nearby services (in real app, this would call an API)
function loadSampleServices() {
    const dhakaLocation = { lat: 23.8103, lng: 90.4125 };
    loadNearbyServices(dhakaLocation);
}

function loadNearbyServices(location) {
    // Clear existing markers
    markers.forEach(marker => {
        map.removeLayer(marker.marker);
    });
    markers = [];
    
    // Sample emergency services data (in real app, this would come from an API)
    const sampleServices = [
        {
            id: 1,
            name: 'Dhaka Medical College Hospital',
            type: 'hospital',
            lat: location.lat + 0.01,
            lng: location.lng + 0.01,
            address: 'Bakshibazar, Dhaka 1000',
            phone: '+88029661064',
            distance: '1.2 km'
        },
        {
            id: 2,
            name: 'Ramna Police Station',
            type: 'police',
            lat: location.lat - 0.005,
            lng: location.lng + 0.005,
            address: 'Ramna, Dhaka 1000',
            phone: '+88029334091',
            distance: '0.8 km'
        },
        {
            id: 3,
            name: 'Popular Pharmacy',
            type: 'pharmacy',
            lat: location.lat + 0.005,
            lng: location.lng - 0.01,
            address: 'Dhanmondi, Dhaka 1205',
            phone: '+8801711123456',
            distance: '0.5 km'
        },
        {
            id: 4,
            name: 'Square Hospital',
            type: 'hospital',
            lat: location.lat - 0.01,
            lng: location.lng - 0.005,
            address: 'West Panthapath, Dhaka 1205',
            phone: '+88028144400',
            distance: '1.5 km'
        },
        {
            id: 5,
            name: 'Wari Police Station',
            type: 'police',
            lat: location.lat + 0.015,
            lng: location.lng + 0.015,
            address: 'Wari, Dhaka 1203',
            phone: '+88027316245',
            distance: '2.1 km'
        }
    ];
    
    services = sampleServices;
    
    // Add markers to map
    services.forEach(service => {
        const marker = createServiceMarker(service);
        markers.push({
            marker: marker,
            serviceType: service.type,
            service: service
        });
    });
    
    // Update services list
    updateServicesList('all');
}

// Create marker for service
function createServiceMarker(service) {
    const iconConfig = getServiceIconConfig(service.type);
    
    const marker = L.marker([service.lat, service.lng], {
        icon: L.divIcon({
            className: 'service-marker',
            html: `<div class="service-marker-icon ${service.type}">
                     <i class="${iconConfig.icon}"></i>
                   </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        })
    }).addTo(map);
    
    const popupContent = `
        <div class="service-popup">
            <h3>${service.name}</h3>
            <p><i class="fas fa-map-marker-alt"></i> ${service.address}</p>
            <p><i class="fas fa-phone"></i> ${service.phone}</p>
            <p><i class="fas fa-route"></i> ${service.distance}</p>
            <div class="popup-actions">
                <a href="tel:${service.phone}" class="popup-btn call">
                    <i class="fas fa-phone"></i> Call
                </a>
                <button onclick="getDirections(${service.lat}, ${service.lng})" class="popup-btn directions">
                    <i class="fas fa-directions"></i> Directions
                </button>
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent);
    
    return marker;
}

// Get service icon configuration
function getServiceIconConfig(type) {
    const configs = {
        'police': { icon: 'fas fa-shield-alt', color: '#1e40af' },
        'hospital': { icon: 'fas fa-plus-circle', color: '#dc2626' },
        'pharmacy': { icon: 'fas fa-pills', color: '#059669' }
    };
    
    return configs[type] || { icon: 'fas fa-map-marker-alt', color: '#666' };
}

// Update services list
function updateServicesList(filter) {
    const servicesList = document.getElementById('servicesList');
    const filteredServices = filter === 'all' ? services : services.filter(s => s.type === filter);
    
    if (filteredServices.length === 0) {
        servicesList.innerHTML = `
            <div style="text-align: center; color: #666; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No services found in this category.</p>
            </div>
        `;
        return;
    }
    
    servicesList.innerHTML = filteredServices.map(service => createServiceHTML(service)).join('');
}

// Create HTML for service card
function createServiceHTML(service) {
    const iconConfig = getServiceIconConfig(service.type);
    
    return `
        <div class="service-card">
            <div class="service-header">
                <div class="service-icon ${service.type}">
                    <i class="${iconConfig.icon}"></i>
                </div>
                <div class="service-info">
                    <h3>${service.name}</h3>
                    <p>${service.type.charAt(0).toUpperCase() + service.type.slice(1)}</p>
                </div>
            </div>
            <div class="service-details">
                <p><i class="fas fa-map-marker-alt"></i> ${service.address}</p>
                <p><i class="fas fa-phone"></i> ${service.phone}</p>
                <p><i class="fas fa-route"></i> Distance: ${service.distance}</p>
            </div>
            <div class="service-actions">
                <a href="tel:${service.phone}" class="action-btn call">
                    <i class="fas fa-phone"></i> Call Now
                </a>
                <button onclick="getDirections(${service.lat}, ${service.lng})" class="action-btn directions">
                    <i class="fas fa-directions"></i> Directions
                </button>
            </div>
        </div>
    `;
}

// Initialize AI Search functionality
function initializeAISearch() {
    const searchInput = document.getElementById('emergencySearch');
    const searchBtn = document.getElementById('searchBtn');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');
    const aiResponse = document.getElementById('aiResponse');

    console.log('Initializing AI Search...');
    console.log('Search Input:', searchInput);
    console.log('Search Button:', searchBtn);
    console.log('AI Response Element:', aiResponse);

    if (!searchBtn) {
        console.error('Search button not found!');
        return;
    }

    if (!searchInput) {
        console.error('Search input not found!');
        return;
    }

    // Handle search button click
    searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Search button clicked!');
        const query = searchInput.value.trim();
        console.log('Query:', query);
        if (query) {
            performAISearch(query);
        } else {
            alert('Please enter a search query');
        }
    });

    // Handle Enter key in search input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            console.log('Enter key pressed!');
            const query = searchInput.value.trim();
            if (query) {
                performAISearch(query);
            }
        }
    });

    // Handle suggestion chip clicks
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Suggestion chip clicked:', chip.dataset.query);
            const query = chip.dataset.query;
            searchInput.value = query;
            // Use the new AI search function for suggestion chips too
            performAISearch(query);
        });
    });

    console.log('AI Search initialized successfully!');
}

// Perform AI search with Azure OpenAI
async function performAISearch(query) {
    console.log('=== performAISearch called ===');
    console.log('Query:', query);
    console.log('Query type:', typeof query);
    console.log('Query length:', query.length);
    
    const aiResponse = document.getElementById('aiResponse');
    const responseContent = document.getElementById('responseContent');
    
    console.log('AI Response element found:', !!aiResponse);
    console.log('Response Content element found:', !!responseContent);
    
    if (!aiResponse || !responseContent) {
        console.error('AI response elements not found!');
        console.error('aiResponse:', aiResponse);
        console.error('responseContent:', responseContent);
        alert('Error: AI response area not found. Please refresh the page.');
        return;
    }

    // Show loading state
    aiResponse.style.display = 'block';
    responseContent.innerHTML = `
        <div class="ai-loading">
            <div class="loading-spinner"></div>
            <p>AI is analyzing your emergency request...</p>
        </div>
    `;

    console.log('Loading state displayed');

    try {
        // For demo purposes, let's use a more reliable approach
        // First try Azure OpenAI, then fallback to intelligent local processing
        let response;
        
        try {
            console.log('Attempting Azure OpenAI call...');
            // Call Azure OpenAI API with proper error handling
            const aiAnalysis = await callAzureOpenAI(query);
            response = await processAIResponse(query, aiAnalysis);
            console.log('Azure OpenAI response:', response);
        } catch (apiError) {
            console.log('Azure OpenAI not available, using intelligent fallback:', apiError);
            // Use enhanced local processing instead
            response = getIntelligentResponse(query);
            console.log('Fallback response:', response);
        }
        
        displayAIResponse(response);
        
    } catch (error) {
        console.error('AI Search Error:', error);
        
        // Final fallback to basic emergency services
        const fallbackResponse = getFallbackResponse(query);
        displayAIResponse(fallbackResponse);
        
        // Show error message
        setTimeout(() => {
            showNotification('AI service temporarily unavailable. Showing local emergency services.', 'warning');
        }, 100);
    }
}

// Call Azure OpenAI API
async function callAzureOpenAI(query) {
    const prompt = `You are an intelligent emergency assistance AI for Bangladesh. A user has submitted this query: "${query}"

Please analyze this request comprehensively and provide a helpful response. Consider:

1. What type of emergency or assistance is being requested?
2. What level of urgency is indicated?
3. Are there any specific locations mentioned?
4. What would be the most helpful response for this user?

Based on your analysis, respond in JSON format with the following structure:
{
    "serviceType": "police|hospital|ambulance|fire|pharmacy|general|traffic|legal|mental_health|other",
    "urgency": "critical|high|medium|low", 
    "location": "any specific location mentioned or null",
    "keywords": ["relevant", "search", "terms"],
    "analysis": "A detailed, helpful analysis of the user's request and what type of assistance they need",
    "recommendations": [
        "Specific actionable recommendations",
        "Emergency numbers to call",
        "Safety precautions to take",
        "Steps to follow"
    ],
    "additionalInfo": "Any additional context or information that would be helpful"
}

Important: Provide real, practical help. If this seems like a genuine emergency, prioritize immediate action steps. Be comprehensive but concise.`;

    const requestBody = {
        messages: [
            {
                role: "system", 
                content: "You are an expert emergency response AI assistant for Bangladesh with deep knowledge of local emergency services, cultural context, and safety protocols. Always prioritize user safety and provide accurate, actionable guidance. Be empathetic and helpful while maintaining professionalism."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        max_tokens: 800,
        temperature: 0.2,
        top_p: 0.9,
        frequency_penalty: 0.1
    };

    const response = await fetch(`${AZURE_OPENAI_CONFIG.endpoint}/openai/deployments/${AZURE_OPENAI_CONFIG.deploymentName}/chat/completions?api-version=${AZURE_OPENAI_CONFIG.apiVersion}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_CONFIG.apiKey
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
        try {
            return JSON.parse(data.choices[0].message.content);
        } catch (e) {
            // If JSON parsing fails, return the raw content
            return {
                serviceType: "general",
                urgency: "medium",
                location: null,
                keywords: [query],
                analysis: data.choices[0].message.content,
                recommendations: ["Contact emergency services if needed"]
            };
        }
    }
    
    throw new Error('No valid response from AI');
}

// Process AI response and match with local services
async function processAIResponse(originalQuery, aiAnalysis) {
    const { serviceType, urgency, location, analysis, recommendations, additionalInfo } = aiAnalysis;
    
    // Get relevant services based on AI analysis
    let services = [];
    let icon = 'fas fa-info-circle';
    let title = 'Emergency Assistance';
    
    // Determine user location (use Dhaka as default, or detected location)
    const userLat = userLocation ? userLocation.lat : 23.7465; // Default to Dhanmondi
    const userLng = userLocation ? userLocation.lng : 90.3742;
    
    switch (serviceType) {
        case 'police':
            services = emergencyDatabase.dhaka.police.map(s => ({
                ...s, 
                distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng)
            }));
            icon = 'fas fa-shield-alt';
            title = 'Police Stations Near You';
            break;
            
        case 'hospital':
            services = emergencyDatabase.dhaka.hospitals.map(s => ({
                ...s, 
                distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng)
            }));
            icon = 'fas fa-hospital';
            title = 'Emergency Hospitals';
            break;
            
        case 'ambulance':
            services = emergencyDatabase.dhaka.ambulance.map(s => ({...s, distance: 'Available 24/7'}));
            icon = 'fas fa-ambulance';
            title = 'Ambulance Services';
            break;
            
        case 'fire':
            services = emergencyDatabase.dhaka.fire.map(s => ({
                ...s, 
                distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng)
            }));
            icon = 'fas fa-fire-extinguisher';
            title = 'Fire Stations';
            break;
            
        case 'pharmacy':
            services = [
                { name: 'Lazz Pharma (24/7)', phone: '01900-000001', address: 'Dhanmondi 27, Dhaka', distance: calculateDisplayDistance(userLat, userLng, 23.7465, 90.3742) },
                { name: 'Square Pharmacy', phone: '01900-000002', address: 'Gulshan 2, Dhaka', distance: calculateDisplayDistance(userLat, userLng, 23.7925, 90.4147) },
                { name: 'Ibn Sina Pharmacy', phone: '01900-000003', address: 'Elephant Road, Dhaka', distance: calculateDisplayDistance(userLat, userLng, 23.7384, 90.3969) }
            ];
            icon = 'fas fa-pills';
            title = 'Emergency Pharmacy';
            break;
            
        case 'mental_health':
            services = [
                { name: 'National Mental Health Institute', phone: '02-9122213', address: 'Sher-e-Bangla Nagar, Dhaka', distance: calculateDisplayDistance(userLat, userLng, 23.7697, 90.3563) },
                { name: 'KAAN Pete ROI Crisis Helpline', phone: '01779554391', address: '24/7 Mental Health Support', distance: 'Available 24/7' },
                { name: 'Moner Bondhu Helpline', phone: '01841448040', address: 'Mental Health Crisis Support', distance: 'Available 24/7' }
            ];
            icon = 'fas fa-brain';
            title = 'Mental Health Support';
            break;
            
        case 'legal':
            services = [
                { name: 'Legal Aid Services', phone: '02-9562813', address: 'Supreme Court Bar Association', distance: 'Available' },
                { name: 'Women\'s Legal Aid', phone: '02-9666409', address: 'Legal support for women', distance: 'Available' },
                { name: 'Human Rights Commission', phone: '02-9661882', address: 'Human rights violations', distance: 'Available' }
            ];
            icon = 'fas fa-gavel';
            title = 'Legal Assistance';
            break;
            
        default:
            // For general queries, provide comprehensive emergency services
            services = [
                { name: 'Emergency Hotline', phone: '999', address: 'National Emergency Service', distance: 'Immediate' },
                ...emergencyDatabase.dhaka.police.slice(0, 1).map(s => ({...s, distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng)})),
                ...emergencyDatabase.dhaka.hospitals.slice(0, 2).map(s => ({...s, distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng)})),
                ...emergencyDatabase.dhaka.ambulance.slice(0, 1)
            ];
            title = 'Emergency Services Available';
    }
    
    // Sort services by distance (closest first)
    services.sort((a, b) => {
        if (a.distance === 'Immediate' || a.distance === 'Available 24/7') return -1;
        if (b.distance === 'Immediate' || b.distance === 'Available 24/7') return 1;
        if (a.lat && b.lat) {
            const distA = calculateDistance(userLat, userLng, a.lat, a.lng);
            const distB = calculateDistance(userLat, userLng, b.lat, b.lng);
            return distA - distB;
        }
        return 0;
    });
    
    return {
        icon,
        title,
        urgency,
        analysis: analysis || `AI analysis for "${originalQuery}" - ${serviceType} assistance recommended.`,
        recommendations: recommendations || ['Contact emergency services if needed', 'Stay safe and follow local guidelines'],
        services: services.slice(0, 5), // Limit to top 5
        originalQuery,
        additionalInfo
    };
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Fallback response when AI is unavailable
function getFallbackResponse(query) {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('police')) {
        return {
            icon: 'fas fa-shield-alt',
            title: 'Police Stations Near You',
            analysis: 'Found local police stations based on your request.',
            services: emergencyDatabase.dhaka.police.slice(0, 3).map(s => ({...s, distance: 'Nearby'})),
            recommendations: ['Call 999 for immediate police assistance', 'Provide your exact location when calling']
        };
    } else if (lowerQuery.includes('hospital') || lowerQuery.includes('medical')) {
        return {
            icon: 'fas fa-hospital',
            title: 'Emergency Hospitals',
            analysis: 'Found nearby hospitals for medical emergencies.',
            services: emergencyDatabase.dhaka.hospitals.slice(0, 3).map(s => ({...s, distance: 'Nearby'})),
            recommendations: ['Call 199 for medical emergencies', 'Go to the nearest hospital immediately for serious conditions']
        };
    } else if (lowerQuery.includes('ambulance')) {
        return {
            icon: 'fas fa-ambulance',
            title: 'Ambulance Services',
            analysis: 'Available ambulance services for emergency transport.',
            services: emergencyDatabase.dhaka.ambulance.map(s => ({...s, distance: 'On-demand'})),
            recommendations: ['Call 999 for emergency ambulance', 'Provide clear location and nature of emergency']
        };
    } else if (lowerQuery.includes('fire')) {
        return {
            icon: 'fas fa-fire-extinguisher',
            title: 'Fire Emergency Services',
            analysis: 'Fire stations and emergency services available.',
            services: emergencyDatabase.dhaka.fire.slice(0, 3).map(s => ({...s, distance: 'Nearby'})),
            recommendations: ['Call 9555555 for fire emergencies', 'Evacuate the area if safe to do so']
        };
    } else {
        return {
            icon: 'fas fa-info-circle',
            title: 'Emergency Services',
            analysis: `Found general emergency services for "${query}".`,
            services: [
                { name: 'Emergency Hotline', distance: 'Immediate', phone: '999', address: 'National Emergency Service' },
                { name: 'Police Service', distance: 'As needed', phone: '999', address: 'Bangladesh Police' },
                { name: 'Medical Emergency', distance: '5-15 min', phone: '199', address: 'Government Health Service' }
            ],
            recommendations: ['Call 999 for general emergencies', 'Stay calm and provide clear information']
        };
    }
}

// Display AI response with enhanced formatting
function displayAIResponse(response) {
    const responseContent = document.getElementById('responseContent');
    
    let html = `
        <div class="ai-response-header">
            <i class="${response.icon}"></i>
            <h3>${response.title}</h3>
            ${response.urgency ? `<span class="urgency-badge urgency-${response.urgency}">${response.urgency.toUpperCase()}</span>` : ''}
        </div>
    `;

    // AI Analysis section
    if (response.analysis) {
        html += `
            <div class="ai-analysis">
                <h4><i class="fas fa-brain"></i> AI Analysis:</h4>
                <p>${response.analysis}</p>
            </div>
        `;
    }

    // Additional Information section (if available from AI)
    if (response.additionalInfo) {
        html += `
            <div class="ai-additional-info">
                <h4><i class="fas fa-info-circle"></i> Additional Information:</h4>
                <p>${response.additionalInfo}</p>
            </div>
        `;
    }

    // Emergency Services List
    html += '<div class="emergency-services-list">';
    
    response.services.forEach((service, index) => {
        const isHighPriority = index < 2 && (response.urgency === 'critical' || response.urgency === 'high');
        html += `
            <div class="emergency-service-item ${isHighPriority ? 'high-priority' : ''}">
                <div class="service-info">
                    <h4>${service.name} ${isHighPriority ? '<span class="priority-indicator">🚨 PRIORITY</span>' : ''}</h4>
                    <p><i class="fas fa-map-marker-alt"></i> ${service.distance} • ${service.address}</p>
                    ${service.available24 ? '<span class="availability-badge">24/7 Available</span>' : ''}
                </div>
                <div class="service-actions">
                    <a href="tel:${service.phone}" class="call-btn ${isHighPriority ? 'emergency-call' : ''}">
                        <i class="fas fa-phone"></i>
                        ${service.phone}
                    </a>
                    ${service.lat && service.lng ? 
                        `<button class="direction-btn" onclick="getDirections('${service.name}', ${service.lat}, ${service.lng})">
                            <i class="fas fa-directions"></i>
                            Directions
                        </button>` :
                        `<button class="direction-btn" onclick="searchLocation('${service.name}')">
                            <i class="fas fa-search"></i>
                            Find Location
                        </button>`
                    }
                </div>
            </div>
        `;
    });

    html += '</div>';
    
    // AI Recommendations
    if (response.recommendations && response.recommendations.length > 0) {
        html += `
            <div class="ai-recommendations">
                <h4><i class="fas fa-lightbulb"></i> AI Recommendations:</h4>
                <ul>
                    ${response.recommendations.map(rec => `<li><i class="fas fa-chevron-right"></i> ${rec}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Emergency Tips based on urgency
    const emergencyTips = getEmergencyTips(response.urgency);
    html += `
        <div class="ai-tips">
            <h4><i class="fas fa-exclamation-triangle"></i> Emergency Tips:</h4>
            <ul>
                ${emergencyTips.map(tip => `<li><i class="fas fa-check-circle"></i> ${tip}</li>`).join('')}
            </ul>
        </div>
    `;

    // Quick Actions
    html += `
        <div class="quick-actions">
            <h4><i class="fas fa-bolt"></i> Quick Actions:</h4>
            <div class="action-buttons">
                <button onclick="shareLocation()" class="action-btn">
                    <i class="fas fa-map-marker-alt"></i>
                    Share My Location
                </button>
                <button onclick="callEmergency()" class="action-btn emergency">
                    <i class="fas fa-phone"></i>
                    Call 999
                </button>
                <button onclick="newSearch()" class="action-btn">
                    <i class="fas fa-search"></i>
                    New Search
                </button>
            </div>
        </div>
    `;

    responseContent.innerHTML = html;      // Add map markers for services with coordinates
    addServiceMarkers(response.services);
    
    // Show satisfaction survey after response is displayed
    setTimeout(() => {
        showSatisfactionSurvey(response.originalQuery);
    }, 3000);
}

// Get emergency tips based on urgency level
function getEmergencyTips(urgency) {
    const baseTips = [
        'Save important numbers in your phone for quick access',
        'Keep your phone charged for emergency situations',
        'Stay calm and provide clear information when calling for help'
    ];
    
    switch (urgency) {
        case 'critical':
            return [
                '🚨 Call emergency services immediately (999)',
                'Share your exact location with emergency responders',
                'Follow dispatcher instructions carefully',
                'Stay on the line until help arrives',
                ...baseTips
            ];
        case 'high':
            return [
                'Contact emergency services promptly',
                'Provide detailed information about the situation',
                'Share your location with emergency services',
                ...baseTips
            ];
        case 'medium':
            return [
                'Assess if immediate emergency services are needed',
                'Consider contacting relevant services for assistance',
                ...baseTips,
                'Document important details if safe to do so'
            ];
        default:
            return [
                ...baseTips,
                'Research and plan ahead for potential emergencies',
                'Know your local emergency services and their contact numbers'
            ];
    }
}

// Enhanced directions function
function getDirections(serviceName, lat, lng) {
    if (lat && lng) {
        // Use Google Maps or other mapping service
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(serviceName)}`;
        window.open(mapsUrl, '_blank');
        
        // Also add marker to local map
        if (map) {
            addMarkerToMap(lat, lng, serviceName);
        }
    } else {
        searchLocation(serviceName);
    }
}

// Search for location when coordinates not available
function searchLocation(serviceName) {
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(serviceName + ' Bangladesh')}`;
    window.open(searchUrl, '_blank');
}

// Add service markers to map
function addServiceMarkers(services) {
    if (!map) return;
    
    // Clear existing service markers
    markers.forEach(marker => {
        if (marker.options.type === 'service') {
            map.removeLayer(marker);
        }
    });
    markers = markers.filter(marker => marker.options.type !== 'service');
    
    // Add new service markers
    services.forEach((service, index) => {
        if (service.lat && service.lng) {
            const icon = L.divIcon({
                className: 'custom-marker service-marker',
                html: `<div class="marker-icon"><i class="fas fa-map-marker-alt"></i><span>${index + 1}</span></div>`,
                iconSize: [30, 40],
                iconAnchor: [15, 40]
            });
            
            const marker = L.marker([service.lat, service.lng], { 
                icon: icon,
                type: 'service'
            }).addTo(map);
            
            marker.bindPopup(`
                <div class="marker-popup">
                    <h4>${service.name}</h4>
                    <p>${service.address}</p>
                    <p><strong>Phone:</strong> ${service.phone}</p>
                    <a href="tel:${service.phone}" class="popup-call-btn">Call Now</a>
                </div>
            `);
            
            markers.push(marker);
        }
    });
}

// Add marker to map
function addMarkerToMap(lat, lng, title) {
    if (!map) return;
    
    const marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(title);
    map.setView([lat, lng], 15);
}

// Show satisfaction survey after AI response
function showSatisfactionSurvey(originalQuery) {
    const existingSurvey = document.querySelector('.satisfaction-survey');
    if (existingSurvey) return; // Don't show multiple surveys

    const survey = document.createElement('div');
    survey.className = 'satisfaction-survey';
    survey.innerHTML = `
        <div class="survey-content">
            <h4><i class="fas fa-star"></i> How helpful was this response?</h4>
            <div class="rating-buttons">
                <button onclick="submitSatisfaction('very-helpful', '${originalQuery}')" class="rating-btn">
                    <i class="fas fa-smile"></i> Very Helpful
                </button>
                <button onclick="submitSatisfaction('helpful', '${originalQuery}')" class="rating-btn">
                    <i class="fas fa-meh"></i> Helpful
                </button>
                <button onclick="submitSatisfaction('not-helpful', '${originalQuery}')" class="rating-btn">
                    <i class="fas fa-frown"></i> Not Helpful
                </button>
            </div>
            <button onclick="closeSatisfactionSurvey()" class="close-survey">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    const aiResponse = document.getElementById('aiResponse');
    if (aiResponse) {
        aiResponse.appendChild(survey);
    }
}

// Submit satisfaction rating
function submitSatisfaction(rating, query) {
    // Log the feedback (in production, send to analytics)
    console.log('User satisfaction feedback:', { rating, query, timestamp: new Date().toISOString() });
    
    // Show thank you message
    const survey = document.querySelector('.satisfaction-survey');
    if (survey) {
        survey.innerHTML = `
            <div class="survey-thank-you">
                <i class="fas fa-check-circle"></i>
                <p>Thank you for your feedback!</p>
            </div>
        `;
        
        // Remove survey after 2 seconds
        setTimeout(() => {
            closeSatisfactionSurvey();
        }, 2000);
    }
}

// Close satisfaction survey
function closeSatisfactionSurvey() {
    const survey = document.querySelector('.satisfaction-survey');
    if (survey) {
        survey.remove();
    }
}

// Quick action functions
function shareLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const locationUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                
                if (navigator.share) {
                    navigator.share({
                        title: 'My Current Location - Emergency',
                        text: 'I need help at this location',
                        url: locationUrl
                    });
                } else {
                    // Fallback - copy to clipboard
                    navigator.clipboard.writeText(`Emergency location: ${locationUrl}`).then(() => {
                        showNotification('Location copied to clipboard!', 'success');
                    });
                }
            },
            (error) => {
                showNotification('Unable to get location. Please enable location services.', 'error');
            }
        );
    } else {
        showNotification('Geolocation is not supported by this browser.', 'error');
    }
}

function callEmergency() {
    if (confirm('Do you want to call emergency services (999)?')) {
        window.location.href = 'tel:999';
    }
}

function newSearch() {
    const searchInput = document.getElementById('emergencySearch');
    const aiResponse = document.getElementById('aiResponse');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    
    if (aiResponse) {
        aiResponse.style.display = 'none';
    }
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Get directions to a service (placeholder function)
function getDirections(serviceName) {
    alert(`Getting directions to ${serviceName}. In a real app, this would open your maps application.`);
}

// Add CSS styles for markers
const markerStyles = `
    <style>
        .service-marker-icon {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .service-marker-icon.police {
            background: #1e40af;
        }
        
        .service-marker-icon.hospital {
            background: #dc2626;
        }
        
        .service-marker-icon.pharmacy {
            background: #059669;
        }
        
        .service-popup {
            max-width: 250px;
        }
        
        .service-popup h3 {
            margin: 0 0 10px 0;
            color: #333;
            font-size: 16px;
        }
        
        .service-popup p {
            margin: 5px 0;
            color: #666;
            font-size: 14px;
        }
        
        .service-popup i {
            color: #2c5aa0;
            margin-right: 8px;
            width: 16px;
        }
        
        .popup-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .popup-btn {
            flex: 1;
            padding: 8px 12px;
            border-radius: 15px;
            text-decoration: none;
            text-align: center;
            font-size: 12px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .popup-btn.call {
            background: #059669;
            color: white;
        }
        
        .popup-btn.directions {
            background: #2c5aa0;
            color: white;
        }
        
        .popup-btn:hover {
            transform: translateY(-1px);
        }
        
        .user-location-marker {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        /* AI Response Styles */
        .ai-response-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .ai-response-header i {
            font-size: 24px;
            color: #2c5aa0;
            margin-right: 10px;
        }
        
        .ai-response-header h3 {
            margin: 0;
            font-size: 18px;
            color: #333;
        }
        
        .ai-message {
            margin: 10px 0;
            font-size: 14px;
            color: #666;
        }
        
        .emergency-services-list {
            margin-top: 10px;
        }
        
        .emergency-service-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 10px;
            background: #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .service-info {
            flex: 1;
            margin-right: 10px;
        }
        
        .service-info h4 {
            margin: 0 0 5px 0;
            font-size: 16px;
            color: #333;
        }
        
        .service-info p {
            margin: 2px 0;
            font-size: 14px;
            color: #666;
        }
        
        .service-actions {
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .call-btn, .direction-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 8px 12px;
            border-radius: 15px;
            text-decoration: none;
            text-align: center;
            font-size: 14px;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-bottom: 5px;
        }
        
        .call-btn {
            background: #059669;
            color: white;
        }
        
        .direction-btn {
            background: #2c5aa0;
            color: white;
        }
        
        .call-btn:hover, .direction-btn:hover {
            transform: translateY(-1px);
        }
        
        .ai-tips {
            margin-top: 15px;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        
        .ai-tips h4 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
        }
        
        .ai-tips ul {
            padding-left: 20px;
            margin: 0;
            list-style-type: disc;
        }
        
        .ai-tips li {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
        }

        /* Satisfaction Survey Styles */
        .satisfaction-survey {
            position: fixed;
            bottom: 20px;
            right: 20px;
            max-width: 300px;
            width: 100%;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            overflow: hidden;
        }
        
        .survey-content {
            padding: 15px;
            text-align: center;
        }
        
        .survey-content h4 {
            margin: 0 0 10px 0;
            font-size: 16px;
            color: #333;
        }
        
        .rating-buttons {
            display: flex;
            justify-content: space-around;
            margin-bottom: 10px;
        }
        
        .rating-btn {
            flex: 1;
            padding: 10px;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            transition: background 0.3s ease;
            font-size: 14px;
            margin: 0 5px;
        }
        
        .rating-btn i {
            margin-right: 5px;
        }
        
        .rating-btn:hover {
            background: #f0f0f0;
        }
        
        .close-survey {
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 16px;
            color: #999;
        }
        
        .close-survey:hover {
            color: #333;
        }
        
        .survey-thank-you {
            font-size: 14px;
            color: #333;
            margin-top: 10px;
        }
    </style>
`;

// Add styles to head
document.head.insertAdjacentHTML('beforeend', markerStyles);

// Enhanced intelligent response that works without API
function getIntelligentResponse(query) {
    const lowerQuery = query.toLowerCase();
    
    // Enhanced keywords analysis with more comprehensive categories
    const emergencyKeywords = {
        police: ['police', 'theft', 'robbery', 'crime', 'assault', 'harassment', 'fight', 'violence', 'stolen', 'mugging', 'attack', 'threat', 'security', 'law enforcement'],
        hospital: ['hospital', 'medical', 'doctor', 'sick', 'emergency', 'injury', 'accident', 'health', 'pain', 'heart attack', 'stroke', 'bleeding', 'unconscious', 'fever'],
        fire: ['fire', 'smoke', 'burning', 'flames', 'gas leak', 'explosion', 'electrical fire', 'building fire'],
        ambulance: ['ambulance', 'emergency transport', 'urgent medical', 'accident', 'injury', 'need transport', 'can\'t move'],
        traffic: ['traffic', 'accident', 'car crash', 'road', 'vehicle', 'collision', 'highway'],
        pharmacy: ['pharmacy', 'medicine', 'drug store', 'prescription', 'medication'],
        general: ['help', 'emergency', 'need assistance', 'urgent', 'crisis']
    };

    // Location keywords for Bangladesh
    const locationKeywords = {
        dhaka: ['dhaka', 'dhanmondi', 'gulshan', 'ramna', 'tejgaon', 'wari', 'old dhaka', 'new market', 'elephant road'],
        chittagong: ['chittagong', 'chattogram'],
        sylhet: ['sylhet'],
        rajshahi: ['rajshahi'],
        khulna: ['khulna']
    };
    
    // Determine urgency based on keywords
    const urgentKeywords = ['emergency', 'urgent', 'help', 'now', 'immediately', 'critical', 'serious', 'asap', 'quick'];
    const urgency = urgentKeywords.some(word => lowerQuery.includes(word)) ? 'high' : 'medium';
    
    // Detect location mentioned in query
    let detectedLocation = 'dhaka'; // default
    for (const [location, keywords] of Object.entries(locationKeywords)) {
        if (keywords.some(keyword => lowerQuery.includes(keyword))) {
            detectedLocation = location;
            break;
        }
    }
    
    // Determine service type with scoring
    let serviceType = 'general';
    let maxScore = 0;
    
    for (const [type, keywords] of Object.entries(emergencyKeywords)) {
        const score = keywords.reduce((acc, keyword) => {
            const count = (lowerQuery.match(new RegExp(keyword, 'g')) || []).length;
            return acc + count;
        }, 0);
        
        if (score > maxScore) {
            maxScore = score;
            serviceType = type;
        }
    }
    
    // Generate intelligent analysis based on query content
    const analysis = generateIntelligentAnalysis(query, serviceType, urgency, detectedLocation);
    
    // Get services based on type and location
    let services = [];
    let icon = 'fas fa-info-circle';
    let title = 'Emergency Services';
    
    const userLat = userLocation ? userLocation.lat : 23.7465;
    const userLng = userLocation ? userLocation.lng : 90.3742;
    
    switch (serviceType) {
        case 'police':
            services = emergencyDatabase.dhaka.police.map(s => ({
                ...s, 
                distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng),
                relevance: calculateRelevance(query, s.name + ' ' + s.address)
            }));
            icon = 'fas fa-shield-alt';
            title = 'Police Assistance';
            break;
            
        case 'hospital':
            services = emergencyDatabase.dhaka.hospitals.map(s => ({
                ...s, 
                distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng),
                relevance: calculateRelevance(query, s.name + ' ' + s.address)
            }));
            icon = 'fas fa-hospital';
            title = 'Medical Emergency';
            break;
            
        case 'fire':
            services = emergencyDatabase.dhaka.fire.map(s => ({
                ...s, 
                distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng),
                relevance: calculateRelevance(query, s.name + ' ' + s.address)
            }));
            icon = 'fas fa-fire-extinguisher';
            title = 'Fire Emergency';
            break;
            
        case 'ambulance':
            services = emergencyDatabase.dhaka.ambulance.map(s => ({
                ...s, 
                distance: 'Available 24/7',
                relevance: calculateRelevance(query, s.name + ' ' + s.address)
            }));
            icon = 'fas fa-ambulance';
            title = 'Emergency Transport';
            break;
            
        case 'pharmacy':
            // Generate pharmacy services (you can expand this database)
            services = [
                { name: 'Lazz Pharma (24/7)', phone: '01900-000001', address: 'Dhanmondi 27, Dhaka', distance: '2.1km', relevance: 0.8 },
                { name: 'Square Pharmacy', phone: '01900-000002', address: 'Gulshan 2, Dhaka', distance: '3.5km', relevance: 0.7 },
                { name: 'Ibn Sina Pharmacy', phone: '01900-000003', address: 'Elephant Road, Dhaka', distance: '1.8km', relevance: 0.9 }
            ];
            icon = 'fas fa-pills';
            title = 'Emergency Pharmacy';
            break;
            
        default:
            // Intelligent mixed services based on query analysis
            const mixedServices = [
                { name: 'Emergency Hotline', phone: '999', address: 'National Emergency Service', distance: 'Immediate', relevance: 1.0 },
                ...emergencyDatabase.dhaka.police.slice(0, 1).map(s => ({...s, distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng), relevance: 0.7})),
                ...emergencyDatabase.dhaka.hospitals.slice(0, 1).map(s => ({...s, distance: calculateDisplayDistance(userLat, userLng, s.lat, s.lng), relevance: 0.8}))
            ];
            services = mixedServices;
            title = 'Emergency Services Available';
    }
    
    // Sort services by relevance and distance
    services.sort((a, b) => {
        if (a.relevance !== b.relevance) return b.relevance - a.relevance;
        if (a.distance === 'Immediate' || a.distance === 'Available 24/7') return -1;
        if (b.distance === 'Immediate' || b.distance === 'Available 24/7') return 1;
        return 0;
    });
    
    // Generate contextual recommendations
    const recommendations = generateIntelligentRecommendations(serviceType, urgency, query);
    
    return {
        icon,
        title,
        urgency,
        analysis,
        recommendations,
        services: services.slice(0, 5),
        originalQuery: query
    };
}

// Generate intelligent analysis based on query content
function generateIntelligentAnalysis(query, serviceType, urgency, location) {
    const urgencyText = urgency === 'high' ? 'urgent' : 'standard';
    const serviceText = serviceType === 'general' ? 'emergency' : serviceType;
    
    let analysis = `Based on your query "${query}", I've identified this as a ${urgencyText} ${serviceText} situation`;
    
    if (location !== 'dhaka') {
        analysis += ` in ${location.charAt(0).toUpperCase() + location.slice(1)}`;
    }
    
    analysis += '. ';
    
    // Add specific insights based on service type
    switch (serviceType) {
        case 'police':
            analysis += 'I\'ve found nearby police stations and emergency contacts. If this is an active crime, call 999 immediately.';
            break;
        case 'hospital':
            analysis += 'I\'ve located the nearest hospitals and medical facilities. For life-threatening emergencies, call 199 for ambulance service.';
            break;
        case 'fire':
            analysis += 'I\'ve identified fire emergency services in your area. Evacuate immediately if you\'re in danger and call 9555555.';
            break;
        case 'ambulance':
            analysis += 'I\'ve found available ambulance services. Call 999 or the specific numbers below for emergency transport.';
            break;
        case 'pharmacy':
            analysis += 'I\'ve located nearby pharmacies, including 24-hour options for urgent medication needs.';
            break;
        default:
            analysis += 'I\'ve compiled a list of relevant emergency services that can assist with your situation.';
    }
    
    return analysis;
}

// Calculate relevance score for services based on query
function calculateRelevance(query, serviceInfo) {
    const queryWords = query.toLowerCase().split(' ');
    const serviceWords = serviceInfo.toLowerCase().split(' ');
    
    let matches = 0;
    queryWords.forEach(qWord => {
        if (qWord.length > 2) { // Ignore very short words
            serviceWords.forEach(sWord => {
                if (sWord.includes(qWord) || qWord.includes(sWord)) {
                    matches++;
                }
            });
        }
    });
    
    return Math.min(matches / queryWords.length, 1.0);
}

// Generate intelligent recommendations based on context
function generateIntelligentRecommendations(serviceType, urgency, query) {
    const baseRecommendations = [
        'Stay calm and speak clearly when calling for help',
        'Provide your exact location to emergency services',
        'Keep important contact numbers saved in your phone'
    ];
    
    const specificRecommendations = {
        police: [
            'Call 999 immediately for active crimes or threats',
            'Try to get to a safe location if possible',
            'Note down important details: time, location, description',
            'If reporting theft, gather any evidence you have'
        ],
        hospital: [
            'Call 199 for medical emergencies requiring ambulance',
            'If conscious, try to provide symptoms and medical history',
            'Bring ID and any medications you\'re currently taking',
            'For chest pain or stroke symptoms, seek immediate care'
        ],
        fire: [
            'Call 9555555 immediately for fire emergencies',
            'Evacuate the building using stairs, never elevators',
            'Stay low to avoid smoke inhalation',
            'Don\'t re-enter the building until cleared by fire department'
        ],
        ambulance: [
            'Call 999 for emergency ambulance service',
            'Be prepared to provide exact location and landmarks',
            'Describe the nature of the emergency clearly',
            'Stay with the patient if trained to provide first aid'
        ],
        pharmacy: [
            'Bring your prescription and ID',
            'Call ahead to confirm medication availability',
            'For emergency contraception, no prescription needed',
            'Ask pharmacist about generic alternatives if available'
        ]
    };
    
    let recommendations = [...baseRecommendations];
    
    if (specificRecommendations[serviceType]) {
        recommendations = [...specificRecommendations[serviceType], ...baseRecommendations.slice(0, 1)];
    }
    
    // Add urgency-specific recommendations
    if (urgency === 'high') {
        recommendations.unshift('This appears to be an urgent situation - prioritize immediate action');
    }
    
    // Add query-specific recommendations
    if (query.toLowerCase().includes('night') || query.toLowerCase().includes('late')) {
        recommendations.push('Be extra cautious during nighttime emergencies');
    }
    
    if (query.toLowerCase().includes('alone')) {
        recommendations.push('Consider calling a trusted friend or family member if safe to do so');
    }
    
    return recommendations.slice(0, 6); // Limit to 6 recommendations
}

// Helper function to calculate and display distance
function calculateDisplayDistance(lat1, lng1, lat2, lng2) {
    if (!lat2 || !lng2) return 'Nearby';
    
    const dist = calculateDistance(lat1, lng1, lat2, lng2);
    return dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
}

// Generate contextual recommendations
function generateRecommendations(serviceType, urgency) {
    const baseRecommendations = [
        'Stay calm and speak clearly when calling for help',
        'Provide your exact location to emergency services',
        'Keep your phone charged for emergencies'
    ];
    
    const specificRecommendations = {
        police: [
            'Call 999 immediately for serious crimes',
            'Note down important details if safe to do so',
            'Stay in a safe location while waiting for help'
        ],
        hospital: [
            'Call 199 for medical emergencies',
            'Describe symptoms clearly to medical staff',
            'Have your medical history ready if possible'
        ],
        fire: [
            'Call 9555555 for fire emergencies',
            'Evacuate the area if safe to do so',
            'Do not use elevators during fire emergencies'
        ],
        ambulance: [
            'Call 999 for emergency ambulance',
            'Provide clear directions to your location',
            'Stay with the patient until help arrives'
        ]
    };
    
    const urgencyRecommendations = {
        high: [
            '🚨 This appears urgent - call emergency services immediately',
            'Share your location with trusted contacts'
        ],
        medium: [
            'Consider if immediate emergency services are needed',
            'Contact relevant authorities if situation escalates'
        ]
    };
    
    return [
        ...(urgencyRecommendations[urgency] || []),
        ...(specificRecommendations[serviceType] || []),
        ...baseRecommendations
    ];
}

// Fallback initialization for search button
window.addEventListener('load', function() {
    console.log('Window load event fired');
    const searchBtn = document.getElementById('searchBtn');
    const emergencySearch = document.getElementById('emergencySearch');
    
    if (searchBtn && !searchBtn.hasEventListener) {
        console.log('Adding fallback event listener to search button');
        searchBtn.hasEventListener = true;
        searchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Fallback search button clicked!');
            const query = emergencySearch ? emergencySearch.value.trim() : '';
            if (query) {
                console.log('Performing search with query:', query);
                performAISearch(query);
            } else {
                alert('Please enter a search query');
            }
        });
    }
});
