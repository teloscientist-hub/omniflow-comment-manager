document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // Tab Navigation Logic
    // -------------------------------------------------------------
    const navItems = document.querySelectorAll('.nav-item');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // Update active states in sidebar
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Switch tab content
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `${targetTab}-pane`) {
                    pane.classList.add('active');
                }
            });
        });
    });

    // -------------------------------------------------------------
    // Dark/Light Theme Toggle Logic
    // -------------------------------------------------------------
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-theme');
        const icon = themeToggleBtn.querySelector('i');
        
        if (body.classList.contains('light-theme')) {
            icon.className = 'fa-regular fa-sun';
            themeToggleBtn.setAttribute('title', 'Switch to Dark Theme');
        } else {
            icon.className = 'fa-regular fa-moon';
            themeToggleBtn.setAttribute('title', 'Switch to Light Theme');
        }
    });

    // -------------------------------------------------------------
    // Interactive Unified Inbox Mock Data & Logic
    // -------------------------------------------------------------
    const chatsData = {
        'chat-1': {
            name: 'johndoe_creative',
            platform: 'Instagram Direct',
            avatar: 'JD',
            fullName: 'John Doe',
            email: 'john.doe@gmail.com',
            phone: '+1 (415) 382-9021',
            location: 'San Francisco, CA',
            match: '98% (High)',
            matchClass: 'match-high',
            tags: ['Instagram Lead', 'E-commerce Quiz', 'Enriched'],
            messages: [
                { type: 'incoming', text: 'YES', time: '09:12 AM' },
                { type: 'system', text: 'Customers.ai resolved profile: John Doe (john.doe@gmail.com, +1-415-382-9021)' },
                { type: 'outgoing', text: 'Hey John! Great to connect with you. I see you\'re interested in the MML Growth Book. Click here to check out: mml-checkout.com/growth-book. We also sent a discount code to your phone number +1-415-382-9021!', time: '09:12 AM', isAI: true }
            ]
        },
        'chat-2': {
            name: '+1 (555) 381-9921',
            platform: 'WhatsApp Business',
            avatar: 'SJ',
            fullName: 'Sarah Jenkins',
            email: 's.jenkins@outlook.com',
            phone: '+1 (555) 381-9921',
            location: 'New York, NY',
            match: '95% (High)',
            matchClass: 'match-high',
            tags: ['WhatsApp Lead', 'Broadcasting', 'Enriched'],
            messages: [
                { type: 'incoming', text: 'Hey, I saw your broadcast about the SMM strategies checklist.', time: '10:04 AM' },
                { type: 'outgoing', text: 'Hi Sarah! That\'s right, the checklist is fully updated for 2026. What are the pricing options for the package?', time: '10:05 AM', isAI: true },
                { type: 'incoming', text: 'What are the pricing options for the package?', time: '10:06 AM' }
            ]
        },
        'chat-3': {
            name: '+1 (310) 902-1244',
            platform: 'SMS Messaging',
            avatar: 'AR',
            fullName: 'Alex Rivera',
            email: 'alex.rivera@gmail.com',
            phone: '+1 (310) 902-1244',
            location: 'Los Angeles, CA',
            match: '91% (High)',
            matchClass: 'match-high',
            tags: ['SMS Lead', 'Promo Code', 'Converted'],
            messages: [
                { type: 'incoming', text: 'Need the discount code.', time: '07:30 AM' },
                { type: 'outgoing', text: 'Here is your 20% discount code: MML20. Use it at checkout within 24 hours!', time: '07:31 AM', isAI: true },
                { type: 'incoming', text: 'Awesome, just checked out. Thanks!', time: '07:45 AM' },
                { type: 'outgoing', text: 'Thank you! Sent discount code confirmation.', time: '07:46 AM', isAI: false }
            ]
        },
        'chat-4': {
            name: 'Sarah Jenkins (Web)',
            platform: 'Web Live Chat',
            avatar: 'SJ',
            fullName: 'Sarah Jenkins',
            email: 's.jenkins@outlook.com',
            phone: '+1 (555) 381-9921',
            location: 'New York, NY',
            match: '99% (Matched)',
            matchClass: 'match-high',
            tags: ['Website Visitor', 'Support Chat'],
            messages: [
                { type: 'incoming', text: 'Hello, having trouble downloading the PDF resource.', time: 'Yesterday' },
                { type: 'outgoing', text: 'Hi Sarah! I\'ve refreshed the download link for your account. Can you try again?', time: 'Yesterday', isAI: false },
                { type: 'incoming', text: 'Thank you, that solved my issue!', time: 'Yesterday' }
            ]
        }
    };

    let activeChatId = 'chat-1';
    let isAiPaused = false;

    const chatItems = document.querySelectorAll('.chat-item');
    const messagesContainer = document.getElementById('messages-container');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat-btn');
    const toggleAiBtn = document.getElementById('toggle-ai');
    
    // Profile Panel Elements
    const avatarLarge = document.querySelector('.avatar-large');
    const avatarHuge = document.querySelector('.avatar-huge');
    const chatHeaderName = document.querySelector('.chat-window-header h3');
    const chatHeaderPlatform = document.querySelector('.chat-window-header p');
    const profileName = document.querySelector('.profile-summary h4');
    const profileHandle = document.querySelector('.profile-summary p');
    const profileFullNameVal = document.querySelector('.enrichment-data .data-row:nth-child(2) .val');
    const profileEmailVal = document.querySelector('.enrichment-data .data-row:nth-child(3) .val');
    const profilePhoneVal = document.querySelector('.enrichment-data .data-row:nth-child(4) .val');
    const profileLocationVal = document.querySelector('.enrichment-data .data-row:nth-child(5) .val');
    const profileMatchVal = document.querySelector('.enrichment-data .data-row:nth-child(6) .val');
    const tagCloud = document.querySelector('.tag-cloud');

    // Function to render messages for active chat
    function renderMessages(chatId) {
        messagesContainer.innerHTML = '';
        const chat = chatsData[chatId];
        
        chat.messages.forEach(msg => {
            if (msg.type === 'system') {
                const systemDiv = document.createElement('div');
                systemDiv.className = 'msg-group system';
                systemDiv.innerHTML = `<div class="system-notification"><i class="fa-solid fa-shield-halved"></i> ${msg.text}</div>`;
                messagesContainer.appendChild(systemDiv);
            } else {
                const groupDiv = document.createElement('div');
                groupDiv.className = `msg-group ${msg.type} ${msg.isAI ? 'ai-agent' : ''}`;
                
                let aiTag = msg.isAI ? ' <span class="ai-tag">AI Agent</span>' : '';
                groupDiv.innerHTML = `
                    <div class="msg-bubble">
                        <p>${msg.text}</p>
                        <span class="msg-time">${msg.time}${aiTag}</span>
                    </div>
                `;
                messagesContainer.appendChild(groupDiv);
            }
        });
        
        // Auto scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Function to update Profile Panel Metadata
    function updateProfilePanel(chatId) {
        const chat = chatsData[chatId];
        
        // Header
        avatarLarge.textContent = chat.avatar;
        chatHeaderName.textContent = chat.name;
        chatHeaderPlatform.textContent = `Active just now via ${chat.platform}`;
        
        // Profile Right Panel
        avatarHuge.textContent = chat.avatar;
        profileName.textContent = chat.fullName;
        profileHandle.textContent = chat.name.startsWith('@') ? chat.name : `@${chat.name.replace(/[^\w]/g, '')}`;
        
        profileFullNameVal.textContent = chat.fullName;
        profileEmailVal.textContent = chat.email;
        profilePhoneVal.textContent = chat.phone;
        profileLocationVal.textContent = chat.location;
        profileMatchVal.textContent = chat.match;
        profileMatchVal.className = `val ${chat.matchClass}`;
        
        // Tags
        tagCloud.innerHTML = '';
        chat.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-pill';
            span.textContent = tag;
            tagCloud.appendChild(span);
        });
        const addTagSpan = document.createElement('span');
        addTagSpan.className = 'tag-pill';
        addTagSpan.textContent = '+ Add Tag';
        tagCloud.appendChild(addTagSpan);
    }

    // Conversation list item clicks
    chatItems.forEach(item => {
        item.addEventListener('click', () => {
            chatItems.forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            
            activeChatId = item.getAttribute('data-id');
            renderMessages(activeChatId);
            updateProfilePanel(activeChatId);
        });
    });

    // Send Message Action
    function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Append outgoing message
        chatsData[activeChatId].messages.push({
            type: 'outgoing',
            text: text,
            time: timeStr,
            isAI: false
        });
        
        renderMessages(activeChatId);
        chatInput.value = '';
        
        // Update sidebar preview
        const activeChatItem = document.querySelector(`.chat-item[data-id="${activeChatId}"]`);
        if (activeChatItem) {
            activeChatItem.querySelector('p').textContent = text;
        }

        // Mock automated response if AI is NOT paused
        if (!isAiPaused) {
            setTimeout(() => {
                let replyText = "Understood. The OmniFlow engine is analyzing your request. A team member will follow up shortly if needed.";
                
                if (text.toLowerCase().includes('price') || text.toLowerCase().includes('cost')) {
                    replyText = "The MML Growth Suite is priced at $97/mo. You can register via our secure payment gateway at mml-checkout.com/growth-book.";
                } else if (text.toLowerCase().includes('human') || text.toLowerCase().includes('help')) {
                    replyText = "Toggling human override agent mode. AI is pausing now.";
                    toggleAiMode(true);
                }
                
                chatsData[activeChatId].messages.push({
                    type: 'outgoing',
                    text: replyText,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isAI: true
                });
                renderMessages(activeChatId);
                
                if (activeChatItem) {
                    activeChatItem.querySelector('p').textContent = replyText;
                }
            }, 1000);
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Toggle AI Handled State
    function toggleAiMode(pausedState) {
        isAiPaused = typeof pausedState === 'boolean' ? pausedState : !isAiPaused;
        
        if (isAiPaused) {
            toggleAiBtn.innerHTML = '<i class="fa-solid fa-play"></i> Resume AI Agent';
            toggleAiBtn.className = 'btn btn-outline';
            chatInput.placeholder = 'Type a message (Human takeover active)...';
        } else {
            toggleAiBtn.innerHTML = '<i class="fa-solid fa-robot"></i> Pause AI Agent';
            toggleAiBtn.className = 'btn btn-outline';
            chatInput.placeholder = 'Type a message (AI is currently handling)...';
        }
    }
    toggleAiBtn.addEventListener('click', () => toggleAiMode());

    // -------------------------------------------------------------
    // Interactive Flow Builder Node Appending
    // -------------------------------------------------------------
    const btnAddNode = document.getElementById('btn-add-node');
    const canvasWorkspace = document.getElementById('canvas-area');
    let nodeCount = 5;

    btnAddNode.addEventListener('click', () => {
        nodeCount++;
        const node = document.createElement('div');
        node.className = 'flow-node action-node';
        node.id = `node-${nodeCount}`;
        node.style.top = `${150 + (nodeCount * 10) % 100}px`;
        node.style.left = `${400 + (nodeCount * 25) % 300}px`;
        
        node.innerHTML = `
            <div class="node-header"><i class="fa-solid fa-envelope"></i> Automated Step #${nodeCount}</div>
            <div class="node-body">
                <p>Action Type: <strong>Multi-Channel Broadcast</strong></p>
            </div>
            <div class="connector connector-in"></div>
            <div class="connector connector-out"></div>
        `;
        
        canvasWorkspace.appendChild(node);
        
        // Notify User
        alert(`New Step #${nodeCount} appended to flow builder canvas! Drag to configure.`);
    });

    // Simulated Save/Deploy Flow
    const btnSaveFlow = document.getElementById('btn-save-flow');
    btnSaveFlow.addEventListener('click', () => {
        alert("OmniFlow Live Update: Visual flow successfully built and deployed across Facebook, Instagram, and WhatsApp APIs!");
    });

    // -------------------------------------------------------------
    // Lead Enrichment Export Action
    // -------------------------------------------------------------
    const btnExportLeads = document.getElementById('btn-export-leads');
    btnExportLeads.addEventListener('click', () => {
        alert("Enriched CSV generation successful: 1,429 resolved identities matching social profiles have been compiled and sent to CRM Integration pipeline.");
    });
});
