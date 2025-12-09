// Create a Book - Main Application Logic

// App State
const appState = {
    characters: {},
    relationships: [],
    storyElements: [],
    chatHistory: [],
    settings: {
        darkMode: false,
        autoAnalyze: true
    }
};

// DOM Elements
const elements = {
    messages: document.getElementById('messages'),
    chatInput: document.getElementById('chat-input'),
    charactersList: document.getElementById('characters-list'),
    relationshipsList: document.getElementById('relationships-list'),
    storyContent: document.getElementById('story-content'),
    characterCount: document.getElementById('character-count'),
    relationshipCount: document.getElementById('relationship-count'),
    settingsModal: document.getElementById('settings-modal'),
    characterModal: document.getElementById('character-modal'),
    darkModeToggle: document.getElementById('dark-mode-toggle'),
    autoAnalyzeToggle: document.getElementById('auto-analyze-toggle')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    updateUI();
});

// Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Chat Input
    elements.chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    elements.chatInput.addEventListener('input', () => {
        elements.chatInput.style.height = 'auto';
        elements.chatInput.style.height = Math.min(elements.chatInput.scrollHeight, 120) + 'px';
    });

    // Modal close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });
}

// Tab Navigation
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update content sections
    document.querySelectorAll('.tab-content').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(`${tabName}-section`).classList.add('active');
}

// Send Message
function sendMessage() {
    const text = elements.chatInput.value.trim();
    if (!text) return;

    // Add user message to chat
    addMessage(text, 'user');
    appState.chatHistory.push({ role: 'user', content: text });

    // Clear input
    elements.chatInput.value = '';
    elements.chatInput.style.height = 'auto';

    // Analyze message if auto-analyze is enabled
    if (appState.settings.autoAnalyze) {
        analyzeMessage(text);
    }

    // Generate AI response
    setTimeout(() => {
        const response = generateAIResponse(text);
        addMessage(response, 'ai');
        appState.chatHistory.push({ role: 'ai', content: response });
        saveData();
    }, 500);

    saveData();
}

// Add Message to Chat
function addMessage(text, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.innerHTML = `<div class="message-bubble">${escapeHtml(text)}</div>`;
    elements.messages.appendChild(messageDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Analyze Message for Characters, Relationships, and Story Elements
function analyzeMessage(text) {
    const analysisResults = {
        characters: [],
        relationships: [],
        storyElements: []
    };

    // Enhanced character detection patterns
    const characterPatterns = [
        // "Name ist X Jahre alt" / "Name is X years old"
        /([A-ZÄÖÜ][a-zäöüß]+)\s+ist\s+(\d+)(?:\s+Jahre)?(?:\s+alt)?/gi,
        // "Name (X Jahre)"
        /([A-ZÄÖÜ][a-zäöüß]+)\s*\((\d+)(?:\s+Jahre)?\)/gi,
        // "der/die X-jährige Name"
        /(?:der|die)\s+(\d+)[-\s]?jährige[rn]?\s+([A-ZÄÖÜ][a-zäöüß]+)/gi,
        // "Name, X Jahre alt"
        /([A-ZÄÖÜ][a-zäöüß]+),\s*(\d+)\s+Jahre\s+alt/gi,
    ];

    // Character property patterns
    const propertyPatterns = [
        // Physical appearance
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+hat\s+((?:blonde|braune|schwarze|rote|graue|weiße|lange|kurze|lockige|glatte)\s+Haare)/gi, property: 'aussehen' },
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+hat\s+((?:blaue|grüne|braune|graue|schwarze)\s+Augen)/gi, property: 'aussehen' },
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+ist\s+(groß|klein|schlank|kräftig|dünn|sportlich)/gi, property: 'aussehen' },
        // Profession/Role
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+ist\s+(?:ein[e]?\s+)?(Lehrer|Arzt|Ärztin|Schüler|Schülerin|Student|Studentin|Polizist|Koch|Künstler|Musiker|Autor|Detektiv|König|Königin|Prinz|Prinzessin|Hexe|Zauberer|Ritter|Krieger)/gi, property: 'beruf' },
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+arbeitet\s+als\s+(\w+)/gi, property: 'beruf' },
        // Personality traits
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+ist\s+(freundlich|böse|nett|gemein|mutig|ängstlich|klug|dumm|lustig|ernst|schüchtern|selbstbewusst|neugierig|faul|fleißig|ehrlich|geheimnisvoll|mysteriös)/gi, property: 'persönlichkeit' },
        // Location/Origin
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+(?:kommt|stammt)\s+aus\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/gi, property: 'herkunft' },
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+lebt\s+in\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/gi, property: 'wohnort' },
        // Hobbies/Interests
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+(?:liebt|mag|interessiert sich für)\s+(.+?)(?:\.|,|$)/gi, property: 'interessen' },
        // Special abilities
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+kann\s+(zaubern|fliegen|unsichtbar werden|Gedanken lesen|heilen|kämpfen|singen|tanzen|malen)/gi, property: 'fähigkeiten' },
    ];

    // Relationship patterns
    const relationshipPatterns = [
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+und\s+([A-ZÄÖÜ][a-zäöüß]+)\s+sind\s+(Freunde|beste Freunde|Geschwister|Feinde|Rivalen|Partner|verheiratet|verliebt|Kollegen|Nachbarn)/gi, type: 'mutual' },
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+ist\s+(?:der|die)\s+(Mutter|Vater|Bruder|Schwester|Sohn|Tochter|Onkel|Tante|Opa|Oma|Cousin|Cousine|Freund|Freundin|Chef|Chefin|Lehrer|Lehrerin)\s+von\s+([A-ZÄÖÜ][a-zäöüß]+)/gi, type: 'directed' },
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+liebt\s+([A-ZÄÖÜ][a-zäöüß]+)/gi, type: 'love' },
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+hasst\s+([A-ZÄÖÜ][a-zäöüß]+)/gi, type: 'hate' },
        { pattern: /([A-ZÄÖÜ][a-zäöüß]+)\s+(?:kennt|trifft|begegnet)\s+([A-ZÄÖÜ][a-zäöüß]+)/gi, type: 'knows' },
    ];

    // Extract characters with ages
    characterPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            let name, age;
            if (pattern.source.includes('jährige')) {
                age = match[1];
                name = match[2];
            } else {
                name = match[1];
                age = match[2];
            }

            if (name && !isCommonWord(name)) {
                if (!appState.characters[name]) {
                    appState.characters[name] = {
                        name: name,
                        eigenschaften: {}
                    };
                }
                appState.characters[name].eigenschaften.alter = age + ' Jahre';
                analysisResults.characters.push(name);
            }
        }
    });

    // Extract character properties
    propertyPatterns.forEach(({ pattern, property }) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const name = match[1];
            const value = match[2];

            if (name && !isCommonWord(name)) {
                if (!appState.characters[name]) {
                    appState.characters[name] = {
                        name: name,
                        eigenschaften: {}
                    };
                }

                if (!appState.characters[name].eigenschaften[property]) {
                    appState.characters[name].eigenschaften[property] = [];
                }

                if (Array.isArray(appState.characters[name].eigenschaften[property])) {
                    if (!appState.characters[name].eigenschaften[property].includes(value)) {
                        appState.characters[name].eigenschaften[property].push(value);
                    }
                } else {
                    appState.characters[name].eigenschaften[property] = value;
                }

                if (!analysisResults.characters.includes(name)) {
                    analysisResults.characters.push(name);
                }
            }
        }
    });

    // Detect standalone character names (capitalized words that could be names)
    const namePattern = /\b([A-ZÄÖÜ][a-zäöüß]{2,})\b/g;
    let nameMatch;
    while ((nameMatch = namePattern.exec(text)) !== null) {
        const potentialName = nameMatch[1];
        if (!isCommonWord(potentialName) && isProbablyName(potentialName, text)) {
            if (!appState.characters[potentialName]) {
                appState.characters[potentialName] = {
                    name: potentialName,
                    eigenschaften: {}
                };
                analysisResults.characters.push(potentialName);
            }
        }
    }

    // Extract relationships
    relationshipPatterns.forEach(({ pattern, type }) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            let relationship;

            if (type === 'directed') {
                relationship = {
                    person1: match[1],
                    person2: match[3],
                    type: match[2],
                    description: `${match[1]} ist ${match[2]} von ${match[3]}`
                };
            } else if (type === 'mutual') {
                relationship = {
                    person1: match[1],
                    person2: match[2],
                    type: match[3],
                    description: `${match[1]} und ${match[2]} sind ${match[3]}`
                };
            } else if (type === 'love') {
                relationship = {
                    person1: match[1],
                    person2: match[2],
                    type: 'Liebe',
                    description: `${match[1]} liebt ${match[2]}`
                };
            } else if (type === 'hate') {
                relationship = {
                    person1: match[1],
                    person2: match[2],
                    type: 'Feindschaft',
                    description: `${match[1]} hasst ${match[2]}`
                };
            } else {
                relationship = {
                    person1: match[1],
                    person2: match[2],
                    type: 'Bekannt',
                    description: `${match[1]} kennt ${match[2]}`
                };
            }

            // Check if relationship already exists
            const exists = appState.relationships.some(r =>
                (r.person1 === relationship.person1 && r.person2 === relationship.person2) ||
                (r.person1 === relationship.person2 && r.person2 === relationship.person1 && type === 'mutual')
            );

            if (!exists) {
                appState.relationships.push(relationship);
                analysisResults.relationships.push(relationship);

                // Ensure both characters exist
                [relationship.person1, relationship.person2].forEach(name => {
                    if (!appState.characters[name]) {
                        appState.characters[name] = {
                            name: name,
                            eigenschaften: {}
                        };
                    }
                });
            }
        }
    });

    // Extract story elements
    const storyIndicators = [
        /(?:die\s+)?(?:Geschichte|Story|Handlung)\s+(?:beginnt|spielt|handelt)/gi,
        /(?:es\s+war\s+einmal|eines\s+Tages|am\s+Anfang)/gi,
        /(?:dann|danach|plötzlich|schließlich)\s+.+/gi,
        /(?:das\s+Abenteuer|die\s+Reise|der\s+Konflikt|das\s+Geheimnis)/gi,
    ];

    // Check if the message contains story elements
    const hasStoryContent = storyIndicators.some(pattern => pattern.test(text));

    // If the message is longer and contains narrative elements, treat it as story
    if (hasStoryContent || (text.length > 100 && containsNarrativeElements(text))) {
        const storyElement = {
            content: text,
            timestamp: new Date().toISOString(),
            characters: analysisResults.characters
        };
        appState.storyElements.push(storyElement);
        analysisResults.storyElements.push(storyElement);
    }

    // Update UI
    updateUI();

    // Show toast notification for detected elements
    if (analysisResults.characters.length > 0 || analysisResults.relationships.length > 0) {
        const notifications = [];
        if (analysisResults.characters.length > 0) {
            notifications.push(`${analysisResults.characters.length} Charakter(e) erkannt`);
        }
        if (analysisResults.relationships.length > 0) {
            notifications.push(`${analysisResults.relationships.length} Beziehung(en) erkannt`);
        }
        showToast(notifications.join(', '), 'success');
    }

    return analysisResults;
}

// Check if word is a common German word (not a name)
function isCommonWord(word) {
    const commonWords = [
        'Der', 'Die', 'Das', 'Ein', 'Eine', 'Und', 'Oder', 'Aber', 'Wenn', 'Weil',
        'Also', 'Dann', 'Jetzt', 'Hier', 'Dort', 'Heute', 'Morgen', 'Gestern',
        'Jahre', 'Jahr', 'Tag', 'Tage', 'Zeit', 'Mal', 'Art', 'Weg', 'Teil',
        'Geschichte', 'Story', 'Buch', 'Kapitel', 'Anfang', 'Ende', 'Mitte',
        'Freunde', 'Familie', 'Liebe', 'Hass', 'Angst', 'Mut', 'Kraft',
        'Geschwister', 'Feinde', 'Rivalen', 'Partner', 'Kollegen', 'Nachbarn',
        'Außerdem', 'Allerdings', 'Jedoch', 'Trotzdem', 'Deshalb', 'Daher',
        'Vielleicht', 'Eigentlich', 'Natürlich', 'Sicher', 'Bestimmt'
    ];
    return commonWords.includes(word);
}

// Check if a word is probably a name based on context
function isProbablyName(word, text) {
    // Check if the word is followed by verbs commonly used with names
    const nameContextPatterns = [
        new RegExp(`${word}\\s+(ist|war|hat|hatte|kann|konnte|wird|wurde|sagt|sagte|geht|ging|kommt|kam|macht|machte|liebt|hasst|kennt|trifft)`, 'i'),
        new RegExp(`(der|die|den|dem)\\s+${word}`, 'i'),
        new RegExp(`${word}\\s+(und|oder)\\s+[A-ZÄÖÜ]`, 'i'),
    ];

    return nameContextPatterns.some(pattern => pattern.test(text));
}

// Check if text contains narrative elements
function containsNarrativeElements(text) {
    const narrativePatterns = [
        /\b(ging|kam|sah|hörte|fühlte|dachte|sagte|rief|lief|stand|saß|lag)\b/gi,
        /\b(plötzlich|langsam|schnell|leise|laut|heimlich|vorsichtig)\b/gi,
        /\b(eines\s+Tages|am\s+nächsten\s+Tag|in\s+der\s+Nacht|am\s+Morgen)\b/gi,
    ];

    let matchCount = 0;
    narrativePatterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) matchCount += matches.length;
    });

    return matchCount >= 2;
}

// Generate AI Response
function generateAIResponse(userMessage) {
    const characterCount = Object.keys(appState.characters).length;
    const relationshipCount = appState.relationships.length;
    const storyCount = appState.storyElements.length;

    // Check what was detected
    const lastAnalysis = analyzeMessageSilent(userMessage);

    if (lastAnalysis.characters.length > 0 && lastAnalysis.relationships.length > 0) {
        return `Interessant! Ich habe ${lastAnalysis.characters.length} Charakter(e) und ${lastAnalysis.relationships.length} Beziehung(en) in deiner Beschreibung gefunden. Die Profile wurden aktualisiert. Erzähl mir mehr über deine Charaktere oder ihre Geschichte!`;
    } else if (lastAnalysis.characters.length > 0) {
        const names = lastAnalysis.characters.join(', ');
        return `Ich habe ${lastAnalysis.characters.length === 1 ? 'einen neuen Charakter' : 'neue Charaktere'} erkannt: ${names}. ${lastAnalysis.characters.length === 1 ? 'Das Profil wurde' : 'Die Profile wurden'} im Charaktere-Tab gespeichert. Möchtest du mir mehr über ${lastAnalysis.characters.length === 1 ? 'diesen Charakter' : 'diese Charaktere'} erzählen?`;
    } else if (lastAnalysis.relationships.length > 0) {
        return `Ich habe ${lastAnalysis.relationships.length} neue Beziehung(en) zwischen deinen Charakteren erkannt und im Beziehungen-Tab gespeichert. Gibt es weitere Verbindungen zwischen deinen Charakteren?`;
    } else if (lastAnalysis.storyElements.length > 0) {
        return `Ich habe Story-Elemente erkannt und im Story-Tab gespeichert. Du hast jetzt ${storyCount} Story-Element(e). Wie geht die Geschichte weiter?`;
    } else if (userMessage.toLowerCase().includes('hilfe') || userMessage.toLowerCase().includes('help')) {
        return `Ich helfe dir gerne! Du kannst mir Folgendes erzählen:\n\n• Charaktere: "Tim ist 10 Jahre alt" oder "Maria hat blonde Haare"\n• Beziehungen: "Tim und Nora sind Geschwister" oder "Max ist der Vater von Tim"\n• Story: Beschreibe einfach deine Geschichte!\n\nIch analysiere automatisch alles und ordne es den entsprechenden Tabs zu.`;
    } else {
        const responses = [
            `Danke für die Information! Aktuell hast du ${characterCount} Charakter(e), ${relationshipCount} Beziehung(en) und ${storyCount} Story-Element(e). Erzähl mir mehr!`,
            `Ich habe das notiert. Möchtest du mir mehr über deine Charaktere erzählen? Zum Beispiel ihr Aussehen, ihre Persönlichkeit oder ihre Beziehungen?`,
            `Interessant! Kannst du mir mehr Details geben? Zum Beispiel: Wie alt sind deine Charaktere? Wo spielt die Geschichte?`,
            `Ich höre zu! Vergiss nicht, mir Altersangaben, Beziehungen zwischen Charakteren oder Handlungsstränge zu erzählen - ich sortiere alles automatisch.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Silent analysis (for response generation)
function analyzeMessageSilent(text) {
    const results = { characters: [], relationships: [], storyElements: [] };

    // Check for new characters
    const characterPatterns = [
        /([A-ZÄÖÜ][a-zäöüß]+)\s+ist\s+(\d+)(?:\s+Jahre)?(?:\s+alt)?/gi,
        /([A-ZÄÖÜ][a-zäöüß]+)\s+hat\s+/gi,
    ];

    characterPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const name = match[1];
            if (!isCommonWord(name) && !results.characters.includes(name)) {
                results.characters.push(name);
            }
        }
    });

    // Check for relationships
    const relPattern = /([A-ZÄÖÜ][a-zäöüß]+)\s+und\s+([A-ZÄÖÜ][a-zäöüß]+)\s+sind/gi;
    let relMatch;
    while ((relMatch = relPattern.exec(text)) !== null) {
        results.relationships.push({ person1: relMatch[1], person2: relMatch[2] });
    }

    // Check for story content
    if (text.length > 100 || containsNarrativeElements(text)) {
        results.storyElements.push(text);
    }

    return results;
}

// Update UI
function updateUI() {
    updateCharactersList();
    updateRelationshipsList();
    updateStoryContent();
    updateCounts();
}

// Update Characters List
function updateCharactersList() {
    const characters = Object.values(appState.characters);

    if (characters.length === 0) {
        elements.charactersList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👤</div>
                <p>Noch keine Charaktere</p>
                <span>Beschreibe Charaktere im Chat und sie erscheinen hier automatisch.</span>
            </div>
        `;
        return;
    }

    elements.charactersList.innerHTML = characters.map(char => {
        const properties = Object.entries(char.eigenschaften)
            .map(([key, value]) => {
                if (Array.isArray(value)) {
                    return value.join(', ');
                }
                return value;
            })
            .filter(v => v)
            .join(' • ');

        return `
            <div class="character-card" onclick="openCharacterDetail('${char.name}')">
                <div class="character-header">
                    <div class="character-avatar">${char.name.charAt(0)}</div>
                    <div class="character-name">${char.name}</div>
                </div>
                <div class="character-preview">${properties || 'Noch keine Details'}</div>
            </div>
        `;
    }).join('');
}

// Update Relationships List
function updateRelationshipsList() {
    if (appState.relationships.length === 0) {
        elements.relationshipsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔗</div>
                <p>Noch keine Beziehungen</p>
                <span>Beschreibe Beziehungen zwischen Charakteren im Chat.</span>
            </div>
        `;
        return;
    }

    elements.relationshipsList.innerHTML = appState.relationships.map(rel => `
        <div class="relationship-card">
            <div class="relationship-header">
                <div class="relationship-person">
                    <div class="relationship-avatar">${rel.person1.charAt(0)}</div>
                    <span class="relationship-name">${rel.person1}</span>
                </div>
                <div class="relationship-connector">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                </div>
                <div class="relationship-person">
                    <div class="relationship-avatar">${rel.person2.charAt(0)}</div>
                    <span class="relationship-name">${rel.person2}</span>
                </div>
            </div>
            <div class="relationship-description">${rel.description}</div>
        </div>
    `).join('');
}

// Update Story Content
function updateStoryContent() {
    if (appState.storyElements.length === 0) {
        elements.storyContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📖</div>
                <p>Noch keine Story-Elemente</p>
                <span>Erzähle deine Geschichte im Chat und sie wird hier zusammengefasst.</span>
            </div>
        `;
        return;
    }

    elements.storyContent.innerHTML = appState.storyElements.map((element, index) => {
        const date = new Date(element.timestamp);
        const timeStr = date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="story-element">
                <p>${escapeHtml(element.content)}</p>
                <div class="timestamp">Hinzugefügt: ${timeStr}</div>
            </div>
        `;
    }).join('');
}

// Update Counts
function updateCounts() {
    elements.characterCount.textContent = Object.keys(appState.characters).length;
    elements.relationshipCount.textContent = appState.relationships.length;
}

// Open Character Detail
function openCharacterDetail(name) {
    const char = appState.characters[name];
    if (!char) return;

    document.getElementById('character-modal-name').textContent = char.name;

    const eigenschaften = char.eigenschaften;
    let content = '';

    const propertyLabels = {
        alter: 'Alter',
        aussehen: 'Aussehen',
        beruf: 'Beruf/Rolle',
        persönlichkeit: 'Persönlichkeit',
        herkunft: 'Herkunft',
        wohnort: 'Wohnort',
        interessen: 'Interessen',
        fähigkeiten: 'Fähigkeiten'
    };

    Object.entries(eigenschaften).forEach(([key, value]) => {
        const label = propertyLabels[key] || key;
        let displayValue = Array.isArray(value) ? value.join(', ') : value;

        content += `
            <div class="character-detail-section">
                <h4>${label}</h4>
                <div class="character-detail-content">${displayValue}</div>
            </div>
        `;
    });

    if (content === '') {
        content = '<p style="color: var(--text-secondary); text-align: center;">Noch keine Details vorhanden. Erzähle mehr über diesen Charakter im Chat!</p>';
    }

    // Add relationships
    const characterRelationships = appState.relationships.filter(
        r => r.person1 === name || r.person2 === name
    );

    if (characterRelationships.length > 0) {
        content += `
            <div class="character-detail-section">
                <h4>Beziehungen</h4>
                <div class="character-detail-content">
                    ${characterRelationships.map(r => r.description).join('<br>')}
                </div>
            </div>
        `;
    }

    document.getElementById('character-modal-content').innerHTML = content;
    elements.characterModal.classList.add('active');
}

// Close Character Modal
function closeCharacterModal() {
    elements.characterModal.classList.remove('active');
}

// Settings Functions
function openSettings() {
    elements.settingsModal.classList.add('active');
}

function closeSettings() {
    elements.settingsModal.classList.remove('active');
}

function toggleDarkMode() {
    appState.settings.darkMode = elements.darkModeToggle.checked;
    document.documentElement.setAttribute('data-theme', appState.settings.darkMode ? 'dark' : 'light');
    saveData();
}

function exportData() {
    const data = JSON.stringify(appState, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'create-a-book-data.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Daten exportiert!', 'success');
}

function clearAllData() {
    if (confirm('Möchtest du wirklich alle Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        appState.characters = {};
        appState.relationships = [];
        appState.storyElements = [];
        appState.chatHistory = [];

        // Clear chat messages except welcome message
        elements.messages.innerHTML = `
            <div class="message ai-message">
                <div class="message-bubble">
                    Willkommen bei Create a Book! 📚 Erzähl mir von deiner Buchidee, deinen Charakteren oder deiner Story. Ich analysiere automatisch alles und ordne es den entsprechenden Bereichen zu.
                </div>
            </div>
        `;

        updateUI();
        saveData();
        closeSettings();
        showToast('Alle Daten gelöscht!', 'info');
    }
}

// Data Persistence
function saveData() {
    try {
        localStorage.setItem('createABookData', JSON.stringify(appState));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem('createABookData');
        if (saved) {
            const data = JSON.parse(saved);
            Object.assign(appState, data);

            // Restore dark mode
            if (appState.settings.darkMode) {
                document.documentElement.setAttribute('data-theme', 'dark');
                elements.darkModeToggle.checked = true;
            }

            // Restore auto-analyze setting
            elements.autoAnalyzeToggle.checked = appState.settings.autoAnalyze;

            // Restore chat history
            if (appState.chatHistory.length > 0) {
                elements.messages.innerHTML = '';
                // Add welcome message
                addMessage('Willkommen zurück! 📚 Deine vorherigen Daten wurden geladen.', 'ai');
                // Restore messages
                appState.chatHistory.forEach(msg => {
                    addMessage(msg.content, msg.role);
                });
            }
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

// Toast Notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    document.querySelectorAll('.toast').forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after delay
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {
            // Service worker registration failed, but app still works
        });
    });
}
