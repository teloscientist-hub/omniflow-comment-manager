document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = '';

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function createEl(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (typeof text !== 'undefined') element.textContent = text;
        return element;
    }

    function formatNumber(value) {
        return new Intl.NumberFormat('en-US').format(Number(value) || 0);
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    }

    function formatFreshness(timestamp) {
        if (!timestamp) return 'Local seed data';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return 'Local seed data';
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    async function apiFetch(path, options = {}) {
        const response = await fetch(`${API_BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });
        if (!response.ok) {
            const detail = await response.json().catch(() => ({}));
            throw new Error(detail.error || `Request failed: ${response.status}`);
        }
        return response.json();
    }

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
    // Time Range Selector Click Handler
    // -------------------------------------------------------------
    const rangeBtns = document.querySelectorAll(".time-range button");
    rangeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            rangeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderAnalyticsOverview();
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
    let chatsData = {
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

    const chatsScroller = document.querySelector('.chats-scroller');
    let chatItems = document.querySelectorAll('.chat-item');
    const messagesContainer = document.getElementById('messages-container');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-chat-btn');
    const toggleAiBtn = document.getElementById('toggle-ai');
    const logContentRequestBtn = document.getElementById('log-content-request');
    const recordConversionBtn = document.getElementById('record-conversion');
    const leadsTableBody = document.getElementById('leads-table-body');
    const exportSmmBtn = document.getElementById('btn-export-smm');
    const actionStatus = document.getElementById('actionStatus');
    const contentTopicInput = document.getElementById('content-topic-input');
    const conversionAmountInput = document.getElementById('conversion-amount-input');
    let flowCatalog = [];
    let activeFlowId = null;
    let conversionsData = [];
    let contentRequestsData = [];
    let statusData = null;
    let triggersData = null;

    const flowSelect = document.getElementById('flow-select');
    const btnNewFlow = document.getElementById('btn-new-flow');
    const btnDeleteFlow = document.getElementById('btn-delete-flow');
    const flowNameInput = document.getElementById('flow-name-input');
    const flowKeywordInput = document.getElementById('flow-keyword-input');
    const flowResponseInput = document.getElementById('flow-response-input');

    const draftsReviewContainer = document.getElementById('drafts-review-container');
    const draftEditTextarea = document.getElementById('draft-edit-textarea');
    const btnRejectDraft = document.getElementById('btn-reject-draft');
    const btnSaveDraftEdit = document.getElementById('btn-save-draft-edit');
    const btnApproveDraft = document.getElementById('btn-approve-draft');
    const draftTimeMeta = document.getElementById('draft-time-meta');
    const profileTimelineContainer = document.getElementById('profile-timeline-container');
    let activeDraft = null;
    
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
    const originPostVal = document.getElementById('origin-post-val');
    const originSourceVal = document.getElementById('origin-source-val');
    const triggerKeywordVal = document.getElementById('trigger-keyword-val');
    const flowNameVal = document.getElementById('flow-name-val');
    const revenueVal = document.getElementById('revenue-val');
    const tagCloud = document.querySelector('.tag-cloud');

    function platformIcon(channel) {
        if (channel === 'whatsapp') return 'fa-brands fa-whatsapp';
        if (channel === 'sms') return 'fa-solid fa-sms';
        if (channel === 'web') return 'fa-solid fa-globe';
        if (channel === 'facebook') return 'fa-brands fa-facebook-messenger';
        return 'fa-brands fa-instagram';
    }

    function platformBadgeClass(channel) {
        if (channel === 'whatsapp') return 'wa';
        if (channel === 'sms') return 'sms';
        if (channel === 'web') return 'web';
        return 'ig';
    }

    function showActionStatus(message, type = 'success') {
        if (!actionStatus) return;
        actionStatus.hidden = false;
        actionStatus.className = `action-status ${type}`;
        actionStatus.textContent = message;
        window.clearTimeout(showActionStatus.timer);
        showActionStatus.timer = window.setTimeout(() => {
            actionStatus.hidden = true;
        }, 5200);
    }

    function statusTagElement(chat) {
        if (!['converted', 'ai', 'enriched'].includes(chat.status)) return null;
        const labels = {
            converted: 'Converted',
            ai: 'AI Handled',
            enriched: 'Enriched'
        };
        const span = createEl('span', `tag tag-${chat.status === 'ai' ? 'ai' : chat.status}`, labels[chat.status]);
        return span;
    }

    function lastMessage(chat) {
        const last = chat.messages?.filter((msg) => msg.type !== 'system').at(-1);
        return last?.text || 'No messages yet.';
    }

    function renderConversationList() {
        const chats = Object.values(chatsData);
        chatsScroller.replaceChildren();
        chats.forEach((chat) => {
            const item = createEl('div', `chat-item ${chat.id === activeChatId ? 'active' : ''}`);
            item.dataset.id = chat.id;

            const header = createEl('div', 'chat-item-header');
            const meta = createEl('div', 'chat-meta');
            const badge = createEl('div', `platform-badge ${platformBadgeClass(chat.channel)}`);
            const icon = createEl('i', platformIcon(chat.channel));
            badge.appendChild(icon);
            meta.appendChild(badge);
            meta.appendChild(createEl('span', 'chat-name', chat.name));
            header.appendChild(meta);
            header.appendChild(createEl('span', 'time', chat.lastActivity || ''));

            item.appendChild(header);
            item.appendChild(createEl('p', 'last-msg', lastMessage(chat)));
            const tag = statusTagElement(chat);
            if (tag) item.appendChild(tag);
            chatsScroller.appendChild(item);
        });
        chatItems = document.querySelectorAll('.chat-item');
    }

    function renderLeadsTable() {
        if (!leadsTableBody) return;
        leadsTableBody.replaceChildren();
        Object.values(chatsData).forEach((chat) => {
            const attribution = chat.attribution || {};
            const row = document.createElement('tr');
            const socialCell = document.createElement('td');
            const social = createEl('div', 'social-cell');
            social.appendChild(createEl('i', platformIcon(chat.channel)));
            social.appendChild(createEl('span', null, chat.name));
            socialCell.appendChild(social);
            row.appendChild(socialCell);

            [
                chat.fullName,
                chat.email,
                chat.phone,
                chat.platform,
                attribution.origin_source_id || 'Not linked',
                attribution.flow_name || attribution.flow_id || 'No flow',
                `$${Number(attribution.revenue_usd || 0).toLocaleString()}`
            ].forEach((value) => row.appendChild(createEl('td', null, value)));

            const statusCell = document.createElement('td');
            const badgeClass = chat.status === 'converted'
                ? 'badge badge-success'
                : chat.status === 'ai'
                    ? 'badge badge-info'
                    : chat.status === 'enriched'
                        ? 'badge badge-warning'
                        : 'badge badge-neutral';
            statusCell.appendChild(createEl('span', badgeClass, chat.status ? chat.status.toUpperCase() : 'OPEN'));
            row.appendChild(statusCell);
            leadsTableBody.appendChild(row);
        });
    }

    // Function to render messages for active chat
    function renderMessages(chatId) {
        messagesContainer.innerHTML = '';
        const chat = chatsData[chatId];
        
        chat.messages.forEach(msg => {
            if (msg.type === 'system') {
                const systemDiv = document.createElement('div');
                systemDiv.className = 'msg-group system';
                const notice = document.createElement('div');
                notice.className = 'system-notification';
                const icon = document.createElement('i');
                icon.className = 'fa-solid fa-shield-halved';
                notice.appendChild(icon);
                notice.append(` ${msg.text}`);
                systemDiv.appendChild(notice);
                messagesContainer.appendChild(systemDiv);
            } else {
                const groupDiv = document.createElement('div');
                groupDiv.className = `msg-group ${msg.type} ${msg.isAI ? 'ai-agent' : ''}`;
                const bubble = document.createElement('div');
                bubble.className = 'msg-bubble';
                const text = document.createElement('p');
                text.textContent = msg.text;
                const time = document.createElement('span');
                time.className = 'msg-time';
                time.textContent = msg.time || '';
                if (msg.isAI) {
                    const aiTag = document.createElement('span');
                    aiTag.className = 'ai-tag';
                    aiTag.textContent = 'AI Agent';
                    time.append(' ');
                    time.appendChild(aiTag);
                }
                bubble.appendChild(text);
                bubble.appendChild(time);
                groupDiv.appendChild(bubble);
                messagesContainer.appendChild(groupDiv);
            }
        });
        
        // Load pending drafts
        loadAndRenderDraft(chatId);
        
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

        const attribution = chat.attribution || {};
        originPostVal.textContent = attribution.origin_post_id || 'Not attributed';
        originSourceVal.textContent = attribution.origin_source_id || 'Not linked';
        triggerKeywordVal.textContent = attribution.trigger_keyword || 'None';
        flowNameVal.textContent = attribution.flow_name || attribution.flow_id || 'No flow';
        revenueVal.textContent = `$${Number(attribution.revenue_usd || 0).toLocaleString()}`;
        
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

        // Render Lead Activity Timeline
        if (profileTimelineContainer) {
            profileTimelineContainer.innerHTML = '';
            if (chat.lead_id) {
                apiFetch(`/api/leads/${chat.lead_id}`).then(lead => {
                    if (lead && lead.timeline && lead.timeline.length > 0) {
                        profileTimelineContainer.innerHTML = lead.timeline.map(item => `
                            <div style="border-left: 2px solid var(--accent); padding-left: 8px; position: relative;">
                                <span style="position: absolute; left: -5px; top: 3px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent);"></span>
                                <div style="font-weight: 600; color: var(--text);">${escapeHtml(item.event)}</div>
                                <div style="color: var(--muted); margin-top: 2px;">${escapeHtml(item.detail)}</div>
                                <div style="font-size: 9px; color: var(--muted); margin-top: 2px;">${item.timestamp ? item.timestamp.slice(11, 16) : 'now'} UTC</div>
                            </div>
                        `).join('');
                    } else {
                        profileTimelineContainer.innerHTML = '<div style="color: var(--muted); font-style: italic;">No timeline events recorded.</div>';
                    }
                }).catch(err => {
                    console.error('Error fetching lead timeline:', err);
                    profileTimelineContainer.innerHTML = '<div style="color: var(--muted); font-style: italic;">Failed to load lead timeline.</div>';
                });
            } else {
                profileTimelineContainer.innerHTML = '<div style="color: var(--muted); font-style: italic;">Resolving profile...</div>';
            }
        }
    }

    // Conversation list item clicks
    chatsScroller.addEventListener('click', (event) => {
        const item = event.target.closest('.chat-item');
        if (!item) return;
        chatItems.forEach(c => c.classList.remove('active'));
        item.classList.add('active');
        
        activeChatId = item.getAttribute('data-id');
        renderMessages(activeChatId);
        updateProfilePanel(activeChatId);
    });

    // Send Message Action
    async function persistMessage(message) {
        const result = await apiFetch(`/api/conversations/${encodeURIComponent(activeChatId)}/messages`, {
            method: 'POST',
            body: JSON.stringify(message)
        });
        chatsData[activeChatId] = result.conversation;
        renderConversationList();
        renderLeadsTable();
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Append outgoing message
        const message = {
            type: 'outgoing',
            text: text,
            time: timeStr,
            isAI: false
        };
        chatsData[activeChatId].messages.push(message);
        
        renderMessages(activeChatId);
        chatInput.value = '';
        persistMessage(message).catch((error) => {
            console.error(error);
            showActionStatus(`Could not save message: ${error.message}`, 'error');
        });
        
        // Update sidebar preview
        const activeChatItem = document.querySelector(`.chat-item[data-id="${activeChatId}"]`);
        if (activeChatItem) {
            activeChatItem.querySelector('p').textContent = text;
        }

        // Mock automated response if AI is NOT paused
        if (!isAiPaused) {
            setTimeout(() => {
                let replyText = "Understood. Message Manager is analyzing your request. A team member will follow up shortly if needed.";
                
                if (text.toLowerCase().includes('price') || text.toLowerCase().includes('cost')) {
                    replyText = "The MML Growth Suite is priced at $97/mo. You can register via our secure payment gateway at mml-checkout.com/growth-book.";
                } else if (text.toLowerCase().includes('human') || text.toLowerCase().includes('help')) {
                    replyText = "Toggling human override agent mode. AI is pausing now.";
                    toggleAiMode(true);
                }
                
                apiFetch(`/api/conversations/${encodeURIComponent(activeChatId)}/drafts`, {
                    method: 'POST',
                    body: JSON.stringify({ text: replyText })
                }).then(() => {
                    renderMessages(activeChatId);
                    showActionStatus(`AI generated a new outbound response draft for review.`);
                }).catch(err => console.error(err));
                
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

    async function logContentRequest() {
        const chat = chatsData[activeChatId];
        if (!chat) return;
        const topic = (contentTopicInput?.value || '').trim();
        if (!topic) return;
        const latestIncoming = [...(chat.messages || [])].reverse().find((msg) => msg.type === 'incoming');
        try {
            const request = await apiFetch('/api/content-requests', {
                method: 'POST',
                body: JSON.stringify({
                    topic,
                    conversation_id: chat.id,
                    requester: chat.fullName || chat.name,
                    message_excerpt: latestIncoming?.text || lastMessage(chat),
                    priority: 'medium'
                })
            });
            contentRequestsData.push(request);
            renderAnalyticsOverview();
            renderHandoffStatus();
            showActionStatus(`Content request logged for SMM: ${request.topic}`);
        } catch (error) {
            showActionStatus(`Could not log content request: ${error.message}`, 'error');
        }
    }

    async function recordConversion() {
        const chat = chatsData[activeChatId];
        if (!chat) return;
        const attribution = chat.attribution || {};
        const amountInput = conversionAmountInput?.value || String(attribution.revenue_usd || 97);
        if (!amountInput) return;
        const revenue = Number(amountInput);
        if (!Number.isFinite(revenue) || revenue < 0) {
            showActionStatus('Revenue must be a non-negative number.', 'error');
            return;
        }
        try {
            const conversion = await apiFetch('/api/conversions', {
                method: 'POST',
                body: JSON.stringify({
                    post_id: attribution.origin_post_id || `manual_${chat.id}`,
                    lead_id: chat.id,
                    revenue_usd: revenue,
                    source_id: attribution.origin_source_id,
                    flow_id: attribution.flow_id,
                    trigger_keyword: attribution.trigger_keyword
                })
            });
            conversionsData.push(conversion);
            chat.status = 'converted';
            chat.attribution = { ...attribution, revenue_usd: revenue };
            renderConversationList();
            renderLeadsTable();
            updateProfilePanel(activeChatId);
            renderAnalyticsOverview();
            renderHandoffStatus();
            showActionStatus(`Conversion recorded for SMM: ${formatCurrency(revenue)}`);
        } catch (error) {
            showActionStatus(`Could not record conversion: ${error.message}`, 'error');
        }
    }

    logContentRequestBtn.addEventListener('click', logContentRequest);
    recordConversionBtn.addEventListener('click', recordConversion);

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
        
        const header = createEl('div', 'node-header');
        header.appendChild(createEl('i', 'fa-solid fa-envelope'));
        header.append(` Automated Step #${nodeCount}`);
        const body = createEl('div', 'node-body');
        const bodyText = document.createElement('p');
        bodyText.append('Action Type: ');
        bodyText.appendChild(createEl('strong', null, 'Multi-Channel Broadcast'));
        body.appendChild(bodyText);
        node.appendChild(header);
        node.appendChild(body);
        node.appendChild(createEl('div', 'connector connector-in'));
        node.appendChild(createEl('div', 'connector connector-out'));
        
        canvasWorkspace.appendChild(node);
        
        showActionStatus(`New Step #${nodeCount} appended to flow builder canvas.`);
    });

    // Save/Deploy Flow (PATCH to active flow ID)
    const btnSaveFlow = document.getElementById('btn-save-flow');
    btnSaveFlow.addEventListener('click', async () => {
        if (!activeFlowId) {
            showActionStatus('No active flow selected to save.', 'error');
            return;
        }
        
        const payload = {
            name: flowNameInput.value.trim() || 'Unnamed Flow',
            default_trigger_keyword: flowKeywordInput.value.trim() || 'TRIGGER',
            response_text: flowResponseInput.value.trim() || ''
        };
        
        showActionStatus(`Saving flow changes...`);
        try {
            await apiFetch(`/api/flows/${activeFlowId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            
            // Also register trigger
            const trigger = await apiFetch('/api/triggers/register', {
                method: 'POST',
                body: JSON.stringify({
                    post_id: 'ig_post_demo_004',
                    source_id: 'youtube-demo-growth-strategy',
                    trigger_keyword: payload.default_trigger_keyword,
                    flow_id: activeFlowId,
                    flow_name: payload.name,
                    status: 'active'
                })
            });
            
            await loadApiState();
            showActionStatus(`Flow "${payload.name}" deployed and trigger registered: "${payload.default_trigger_keyword}"`);
        } catch (error) {
            showActionStatus(`Could not deploy flow: ${error.message}`, 'error');
        }
    });

    // Create New Flow
    if (btnNewFlow) {
        btnNewFlow.addEventListener('click', async () => {
            const name = prompt('Enter a name for the new flow:', 'New Campaign Flow');
            if (name === null) return;
            const flowName = name.trim() || 'New Flow';
            const triggerKeyword = prompt('Enter trigger keyword for this flow:', 'GROW');
            if (triggerKeyword === null) return;
            const kw = triggerKeyword.trim() || 'PROMO';
            const text = prompt('Enter response DM message:', 'Here is your link: mml-checkout.com/promo');
            if (text === null) return;
            
            showActionStatus('Creating new flow...');
            try {
                const newFlow = await apiFetch('/api/flows', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: flowName,
                        default_trigger_keyword: kw,
                        response_text: text.trim(),
                        status: 'active'
                    })
                });
                activeFlowId = newFlow.id;
                await loadApiState();
                showActionStatus(`Created new flow: "${newFlow.name}"`);
            } catch (error) {
                showActionStatus(`Could not create flow: ${error.message}`, 'error');
            }
        });
    }

    // Delete Flow
    if (btnDeleteFlow) {
        btnDeleteFlow.addEventListener('click', async () => {
            if (!activeFlowId) return;
            if (!confirm('Are you sure you want to delete this flow? This cannot be undone.')) return;
            
            showActionStatus('Deleting flow...');
            try {
                await apiFetch(`/api/flows/${activeFlowId}`, {
                    method: 'DELETE'
                });
                activeFlowId = null;
                await loadApiState();
                showActionStatus('Flow deleted successfully.');
            } catch (error) {
                showActionStatus(`Could not delete flow: ${error.message}`, 'error');
            }
        });
    }

    // Flow Select dropdown change
    if (flowSelect) {
        flowSelect.addEventListener('change', (e) => {
            activeFlowId = e.target.value;
            const activeFlow = flowCatalog.find(f => f.id === activeFlowId);
            if (activeFlow) {
                flowNameInput.value = activeFlow.name || '';
                flowKeywordInput.value = activeFlow.default_trigger_keyword || '';
                flowResponseInput.value = activeFlow.response_text || '';
                updateFlowCanvas(activeFlow);
            }
        });
    }

    // -------------------------------------------------------------
    // Lead Enrichment Export Action
    // -------------------------------------------------------------
    const btnExportLeads = document.getElementById('btn-export-leads');
    btnExportLeads.addEventListener('click', () => {
        showActionStatus('Lead enrichment CSV queued. Use Export to SMM for cross-dashboard handoff files.');
    });

    exportSmmBtn.addEventListener('click', async () => {
        try {
            const result = await apiFetch('/api/smm/export', { method: 'POST', body: JSON.stringify({}) });
            renderHandoffStatus(result);
            showActionStatus(`SMM export complete: ${result.summary.conversations} inbox rows, ${result.summary.content_requests} content requests, ${result.summary.conversions} conversions.`);
        } catch (error) {
            showActionStatus(`Could not export SMM handoff files: ${error.message}`, 'error');
        }
    });

    function renderHandoffStatus(exportResult = null) {
        const handoffStatus = document.getElementById('handoffStatus');
        if (!handoffStatus) return;

        const conversations = Object.values(chatsData || {});
        const openConversations = conversations.filter((chat) => !['closed', 'converted'].includes(chat.status)).length;
        const requestCount = contentRequestsData.length;
        const conversionCount = conversionsData.length;
        const hasWork = requestCount > 0 || conversionCount > 0 || openConversations > 0;
        const statusClass = exportResult ? 'ready' : hasWork ? 'warning' : 'ready';
        const statusLabel = exportResult ? 'Exported' : hasWork ? 'Ready to export' : 'No pending handoff';
        const headline = exportResult ? 'SMM handoff files refreshed' : hasWork ? 'SMM handoff is ready' : 'SMM handoff is current';
        const exportFreshness = exportResult?.generated_at ? formatFreshness(exportResult.generated_at) : 'Run export when ready';

        handoffStatus.innerHTML = `
            <div class="handoff-copy">
                <span class="status-pill ${statusClass}">${escapeHtml(statusLabel)}</span>
                <h2>${escapeHtml(headline)}</h2>
                <p>${formatNumber(requestCount)} content requests, ${formatNumber(conversionCount)} conversions, and ${formatNumber(openConversations)} active conversations are available for SMM planning.</p>
            </div>
            <dl class="handoff-metadata">
                <div>
                    <dt>Export files</dt>
                    <dd>${exportResult ? 'Inbox, content requests, conversions' : 'Pending local refresh'}</dd>
                </div>
                <div>
                    <dt>Last action</dt>
                    <dd>${escapeHtml(exportFreshness)}</dd>
                </div>
                <div>
                    <dt>Next view</dt>
                    <dd>Open SMM publishing status / data integration</dd>
                </div>
            </dl>
        `;
    }

    function renderAnalyticsOverview() {
        const operationsStatus = document.getElementById('operationsStatus');
        const statsGrid = document.getElementById('statsGrid');
        if (!operationsStatus || !statsGrid) return;

        const triggerList = triggersData?.triggers || [];
        const activeTriggers = Number(triggersData?.summary?.active ?? triggerList.filter((trigger) => trigger.status === 'active').length);
        const totalTriggers = Number(triggersData?.summary?.total ?? triggerList.length);
        const conversations = Object.values(chatsData || {});
        const openConversations = conversations.filter((chat) => !['closed', 'converted'].includes(chat.status)).length;
        const conversionRevenue = conversionsData.reduce((sum, conversion) => sum + Number(conversion.revenue_usd || 0), 0);
        const requestCount = contentRequestsData.length;
        const summary = statusData?.summary || {};
        const hasLiveApi = Boolean(statusData?.status === 'ok');
        const isReady = hasLiveApi && activeTriggers > 0;
        const needsHandoff = requestCount > 0 || conversionsData.length > 0;
        const primaryAction = needsHandoff
            ? 'Export SMM readback files'
            : openConversations > 0
                ? 'Review open inbox conversations'
                : 'Monitor automation health';

        const headline = isReady
            ? 'Message automation is ready'
            : hasLiveApi
                ? 'Automation is connected, but triggers need review'
                : 'Using local dashboard fallback data';
        const detail = `${formatNumber(activeTriggers)} of ${formatNumber(totalTriggers)} triggers active. ${formatNumber(openConversations)} conversations need operator attention.`;
        const statusClass = isReady ? 'ready' : hasLiveApi ? 'warning' : 'error';
        const statusLabel = isReady ? 'Ready' : hasLiveApi ? 'Review triggers' : 'Offline fallback';

        operationsStatus.innerHTML = `
            <div class="operations-copy">
                <span class="status-pill ${statusClass}">${escapeHtml(statusLabel)}</span>
                <h2>${escapeHtml(headline)}</h2>
                <p>${escapeHtml(detail)}</p>
            </div>
            <dl class="operations-metadata">
                <div>
                    <dt>Scope</dt>
                    <dd>${formatNumber(summary.flows ?? flowCatalog.length)} flows / ${formatNumber(summary.conversations ?? conversations.length)} conversations</dd>
                </div>
                <div>
                    <dt>Primary action</dt>
                    <dd>${escapeHtml(primaryAction)}</dd>
                </div>
                <div>
                    <dt>Freshness</dt>
                    <dd>${escapeHtml(formatFreshness(statusData?.generated_at))}</dd>
                </div>
            </dl>
        `;

        const activeRange = document.querySelector('.time-range button.active')?.textContent || '7d';

        const cards = [
            {
                icon: 'fa-bolt',
                glow: 'purple-glow',
                value: `${activeTriggers} / ${totalTriggers}`,
                label: 'Triggers & Flows Active',
                trend: `Success Rate: 100% · ${activeRange}`,
                trendClass: activeTriggers > 0 ? 'positive' : 'neutral'
            },
            {
                icon: 'fa-comments',
                glow: 'blue-glow',
                value: formatNumber(openConversations),
                label: 'Operator Handled DMs',
                trend: `Response Delay: 1.4s · ${activeRange}`,
                trendClass: openConversations > 0 ? 'positive' : 'neutral'
            },
            {
                icon: 'fa-file-lines',
                glow: 'cyan-glow',
                value: formatNumber(requestCount),
                label: 'SMM Handoff Requests',
                trend: `Source: Exchange Bus`,
                trendClass: requestCount > 0 ? 'positive' : 'neutral'
            },
            {
                icon: 'fa-cart-shopping',
                glow: 'green-glow',
                value: formatCurrency(conversionRevenue),
                label: 'Conversion E-commerce Sales',
                trend: `Conv. Rate: 12.4% · ${activeRange}`,
                trendClass: conversionRevenue > 0 ? 'positive' : 'neutral'
            }
        ];

        statsGrid.innerHTML = cards.map((card) => `
            <div class="stat-card glass-card live-stat">
                <div class="stat-icon ${card.glow}"><i class="fa-solid ${card.icon}"></i></div>
                <div class="stat-details">
                    <h3>${escapeHtml(card.value)}</h3>
                    <p>${escapeHtml(card.label)}</p>
                    <span class="trend ${card.trendClass}">${escapeHtml(card.trend)}</span>
                </div>
            </div>
        `).join('');
    }

    async function loadApiState() {
        try {
            const [status, triggers, flows, conversations, conversions, contentRequests] = await Promise.all([
                apiFetch('/api/status'),
                apiFetch('/api/triggers'),
                apiFetch('/api/flows'),
                apiFetch('/api/conversations'),
                apiFetch('/api/conversions'),
                apiFetch('/api/content-requests')
            ]);
            statusData = status;
            triggersData = triggers;
            flowCatalog = flows;
            conversionsData = conversions;
            contentRequestsData = contentRequests;
            chatsData = Object.fromEntries(conversations.map((chat) => [chat.id, chat]));
            activeChatId = conversations[0]?.id || activeChatId;
            renderConversationList();
            renderLeadsTable();
            renderMessages(activeChatId);
            updateProfilePanel(activeChatId);
            renderAnalyticsOverview();
            renderHandoffStatus();
            renderFlowSelector();
        } catch (error) {
            console.error(error);
            renderConversationList();
            renderLeadsTable();
            renderAnalyticsOverview();
            renderHandoffStatus();
        }
    }

    function renderFlowSelector() {
        if (!flowSelect) return;
        
        flowSelect.innerHTML = flowCatalog.map(flow => `
            <option value="${flow.id}" ${flow.id === activeFlowId ? 'selected' : ''}>${flow.name}</option>
        `).join('');
        
        if (!activeFlowId && flowCatalog.length > 0) {
            activeFlowId = flowCatalog[0].id;
            flowSelect.value = activeFlowId;
        }
        
        const activeFlow = flowCatalog.find(f => f.id === activeFlowId);
        if (activeFlow) {
            flowNameInput.value = activeFlow.name || '';
            flowKeywordInput.value = activeFlow.default_trigger_keyword || '';
            flowResponseInput.value = activeFlow.response_text || '';
            updateFlowCanvas(activeFlow);
        } else {
            flowNameInput.value = '';
            flowKeywordInput.value = '';
            flowResponseInput.value = '';
        }
    }

    function updateFlowCanvas(flow) {
        const node1Body = document.querySelector('#node-1 .node-body');
        if (node1Body) {
            node1Body.innerHTML = `<p>If post comment contains: <strong>"${flow.default_trigger_keyword || 'GROWTH'}"</strong></p>`;
        }
        
        const node4Body = document.querySelector('#node-4 .node-body');
        if (node4Body) {
            node4Body.innerHTML = `<p>Send checkout link to user: <em>"${flow.response_text || ''}"</em></p>`;
        }
    }
    async function loadAndRenderDraft(chatId) {
        if (!draftsReviewContainer) return;
        
        try {
            const drafts = await apiFetch(`/api/conversations/${encodeURIComponent(chatId)}/drafts`);
            if (drafts && drafts.length > 0) {
                activeDraft = drafts[0];
                draftEditTextarea.value = activeDraft.text;
                
                const timeStr = activeDraft.created_at ? activeDraft.created_at.slice(11, 16) : 'now';
                draftTimeMeta.textContent = `Generated at ${timeStr} UTC`;
                draftsReviewContainer.style.display = 'block';
            } else {
                activeDraft = null;
                draftsReviewContainer.style.display = 'none';
            }
        } catch (err) {
            console.error('Failed to load drafts:', err);
            activeDraft = null;
            draftsReviewContainer.style.display = 'none';
        }
    }

    // Reject Draft click
    if (btnRejectDraft) {
        btnRejectDraft.addEventListener('click', async () => {
            if (!activeDraft) return;
            showActionStatus('Rejecting draft...');
            try {
                await apiFetch(`/api/conversations/${encodeURIComponent(activeChatId)}/drafts/${encodeURIComponent(activeDraft.id)}`, {
                    method: 'DELETE'
                });
                showActionStatus('Draft rejected.');
                await loadApiState();
            } catch (error) {
                showActionStatus(`Failed to reject draft: ${error.message}`, 'error');
            }
        });
    }

    // Save Draft Edit click
    if (btnSaveDraftEdit) {
        btnSaveDraftEdit.addEventListener('click', async () => {
            if (!activeDraft) return;
            const updatedText = draftEditTextarea.value.trim();
            if (!updatedText) return;
            
            showActionStatus('Saving draft edits...');
            try {
                await apiFetch(`/api/conversations/${encodeURIComponent(activeChatId)}/drafts/${encodeURIComponent(activeDraft.id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ text: updatedText })
                });
                showActionStatus('Draft edits saved.');
                await loadApiState();
            } catch (error) {
                showActionStatus(`Failed to save draft edit: ${error.message}`, 'error');
            }
        });
    }

    // Approve Draft click
    if (btnApproveDraft) {
        btnApproveDraft.addEventListener('click', async () => {
            if (!activeDraft) return;
            const updatedText = draftEditTextarea.value.trim();
            if (!updatedText) return;
            
            showActionStatus('Approving and sending draft...');
            try {
                await apiFetch(`/api/conversations/${encodeURIComponent(activeChatId)}/drafts/${encodeURIComponent(activeDraft.id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ text: updatedText })
                });
                
                await apiFetch(`/api/conversations/${encodeURIComponent(activeChatId)}/drafts/${encodeURIComponent(activeDraft.id)}/approve`, {
                    method: 'POST',
                    body: JSON.stringify({})
                });
                
                showActionStatus('Outbound response approved and sent.');
                await loadApiState();
                
                const activeChatItem = document.querySelector(`.chat-item[data-id="${activeChatId}"]`);
                if (activeChatItem) {
                    activeChatItem.querySelector('p').textContent = updatedText;
                }
            } catch (error) {
                showActionStatus(`Failed to send draft: ${error.message}`, 'error');
            }
        });
    }

    loadApiState();
});
