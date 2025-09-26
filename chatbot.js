class ChatBot {
    constructor() {
        this.createChatInterface();
        this.messages = [];
        this.sessionId = this.generateSessionId();
        this.isProcessing = false;
    }

    generateSessionId() {
        return 'session_' + Math.random().toString(36).substr(2, 9);
    }

    createChatInterface() {
        const chatContainer = document.createElement('div');
        chatContainer.className = 'chat-container';
        chatContainer.innerHTML = `
            <div class="chat-icon" id="chatIcon" role="button" aria-label="Open chat assistant" tabindex="0">
                <i class="fas fa-robot" aria-hidden="true"></i>
                <span class="sr-only">Chat with Aarogyam Assistant</span>
            </div>
            <div class="chat-box" id="chatBox" role="dialog" aria-labelledby="chatTitle">
                <div class="chat-header">
                    <h3 id="chatTitle">Aarogyam Assistant</h3>
                    <div class="chat-controls">
                        <button class="font-size-btn" id="decreaseFontBtn" aria-label="Decrease font size">A-</button>
                        <button class="font-size-btn" id="increaseFontBtn" aria-label="Increase font size">A+</button>
                        <button class="minimize-btn" id="minimizeChat" aria-label="Minimize chat">
                            <i class="fas fa-minus" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                <div class="chat-messages" id="chatMessages" role="log" aria-live="polite">
                    <div class="bot-message" role="article">
                        <div class="message-content">
                            <p>Hello! I'm your Aarogyam assistant. I'm here to help you with:</p>
                            <ul>
                                <li>Information about cognitive disabilities</li>
                                <li>Support resources</li>
                                <li>Daily living guidance</li>
                            </ul>
                            <p>How can I assist you today?</p>
                        </div>
                    </div>
                </div>
                <div class="chat-input">
                    <input 
                        type="text" 
                        id="userInput" 
                        placeholder="Type your message..." 
                        aria-label="Type your message"
                        autocomplete="off"
                    >
                    <button id="sendMessage" aria-label="Send message">
                        <i class="fas fa-paper-plane" aria-hidden="true"></i>
                        <span class="sr-only">Send</span>
                    </button>
                </div>
                <div class="chat-status" id="chatStatus" role="status" aria-live="polite"></div>
                <div class="chat-error" id="chatError" role="alert"></div>
            </div>
        `;
        document.body.appendChild(chatContainer);
        this.setupEventListeners();
        this.setupAccessibilityFeatures();
    }

    setupEventListeners() {
        const chatIcon = document.getElementById('chatIcon');
        const chatBox = document.getElementById('chatBox');
        const minimizeChat = document.getElementById('minimizeChat');
        const sendMessage = document.getElementById('sendMessage');
        const userInput = document.getElementById('userInput');

        chatIcon.addEventListener('click', () => {
            chatBox.style.display = 'flex';
            chatIcon.style.display = 'none';
            userInput.focus();
        });

        minimizeChat.addEventListener('click', () => {
            chatBox.style.display = 'none';
            chatIcon.style.display = 'flex';
        });

        sendMessage.addEventListener('click', () => this.handleUserMessage());
        
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleUserMessage();
            }
        });

        // Add accessibility keyboard support
        chatBox.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                chatBox.style.display = 'none';
                chatIcon.style.display = 'flex';
            }
        });
    }

    setupAccessibilityFeatures() {
        const chatBox = document.getElementById('chatBox');
        const userInput = document.getElementById('userInput');
        const increaseFontBtn = document.getElementById('increaseFontBtn');
        const decreaseFontBtn = document.getElementById('decreaseFontBtn');

        // Font size adjustment
        let currentFontSize = 16;
        const minFontSize = 14;
        const maxFontSize = 24;

        increaseFontBtn.addEventListener('click', () => {
            if (currentFontSize < maxFontSize) {
                currentFontSize += 2;
                chatBox.style.fontSize = `${currentFontSize}px`;
            }
        });

        decreaseFontBtn.addEventListener('click', () => {
            if (currentFontSize > minFontSize) {
                currentFontSize -= 2;
                chatBox.style.fontSize = `${currentFontSize}px`;
            }
        });

        // Keyboard navigation
        document.getElementById('chatIcon').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                chatBox.style.display = 'flex';
                document.getElementById('chatIcon').style.display = 'none';
                userInput.focus();
            }
        });

        // Add progress announcements for screen readers
        this.announceProgress = (message) => {
            const status = document.getElementById('chatStatus');
            status.textContent = message;
            setTimeout(() => {
                status.textContent = '';
            }, 3000);
        };
    }

    async handleUserMessage() {
        if (this.isProcessing) {
            return;
        }

        const userInput = document.getElementById('userInput');
        const message = userInput.value.trim();

        if (!message) return;

        this.isProcessing = true;
        const sendButton = document.getElementById('sendMessage');
        sendButton.disabled = true;
        userInput.disabled = true;

        try {
            // Clear any previous errors
            this.showError('');

            // Add user message to chat
            this.addMessageToChat('user', message);
            userInput.value = '';

            // Show typing indicator
            const typingIndicator = this.addTypingIndicator();

            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Remove typing indicator and add AI response
            typingIndicator.remove();
            this.addMessageToChat('bot', response);

            // Text-to-speech for accessibility
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(response);
                utterance.rate = 0.9;
                utterance.pitch = 1;
                speechSynthesis.speak(utterance);
            }

        } catch (error) {
            console.error('Chat error:', error);
            typingIndicator?.remove();
            this.showError(error.message || 'Failed to get response. Please try again.');
        } finally {
            this.isProcessing = false;
            sendButton.disabled = false;
            userInput.disabled = false;
            userInput.focus();
        }
    }

    addMessageToChat(sender, message) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'user' ? 'user-message' : 'bot-message';
        messageDiv.setAttribute('role', 'article');
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        // Convert URLs to accessible links and format lists
        const formattedMessage = message
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" aria-label="Opens in new tab">$1</a>')
            .replace(/\n- /g, '</li><li>')
            .replace(/\n/g, '<br>');
        
        if (formattedMessage.includes('<li>')) {
            messageContent.innerHTML = `<ul>${formattedMessage}</ul>`;
        } else {
            messageContent.innerHTML = formattedMessage;
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Announce new messages for screen readers
        if (sender === 'bot') {
            this.announceProgress('New message from assistant');
        }
    }

    addTypingIndicator() {
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'bot-message typing';
        typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return typingDiv;
    }

    showStatus(message, type = 'info') {
        const statusDiv = document.getElementById('chatStatus');
        statusDiv.textContent = message;
        statusDiv.className = `chat-status ${type}`;
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'chat-status';
        }, 3000);
    }

    showError(message) {
        const errorDiv = document.getElementById('chatError');
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
    }

    async getAIResponse(message) {
        // Normalize user input
        const userMsg = message.trim().toLowerCase();
        // Helper to generate variants
        function variants(base) {
            return [
                base.toLowerCase(),
                base.charAt(0).toUpperCase() + base.slice(1),
                base.toLowerCase() + '?',
                base.charAt(0).toUpperCase() + base.slice(1) + '?'
            ];
        }
        // Helper for keyword fallback
        function keywordMatch(keywords) {
            return keywords.some(k => userMsg.includes(k));
        }
        // Hi/Hello
        if (["hi", "hello", "hey", "hii", "helo", "hlo", "hy"].some(q => userMsg === q)) {
            return "Hello! How can I help you today?";
        }
        if ([
            ...variants("how are you"),
            ...variants("what about you"),
            ...variants("how about you")
        ].some(q => userMsg.includes(q)) || keywordMatch(["how are you", "about you"])) {
            return "I'm Good, Thanks for Asking! What can I do for you?";
        }
        if ([
            ...variants("i want to know about your website aarogyam")
        ].some(q => userMsg.includes(q)) || keywordMatch(["about your website", "about Aarogyam", "website Aarogyam"])) {
            return "Aarogyam is a well supportive website for people with cognitive disabilities and their familities to get the best supportand resources to help them in their daily life.";
        }
        if ([...variants("your name")].some(q => userMsg.includes(q)) || keywordMatch(["your name", "who are you", "what is your name"])) {
            return "I'm Aarogyam Assistant, your cognitive support chatbot.";
        }
        // Expanded Cognitive Disabilities Q&A
        if ([
            ...variants("what causes cognitive disabilities"),
            ...variants("causes of cognitive disabilities"),
            ...variants("causes of cognitive impairment"),
            ...variants("why do people have cognitive disabilities"),
            ...variants("what are the reasons for cognitive disabilities"),
            ...variants("can cognitive disabilities be cured"),
            ...variants("is there a cure for cognitive disabilities"),
            ...variants("can you recover from cognitive disabilities"),
            ...variants("how are cognitive disabilities diagnosed"),
            ...variants("diagnosis of cognitive disabilities"),
            ...variants("how do you diagnose cognitive disabilities"),
            ...variants("what are the symptoms of cognitive disabilities"),
            ...variants("symptoms of cognitive disabilities"),
            ...variants("signs of cognitive disabilities"),
            ...variants("what are signs of cognitive disabilities"),
            ...variants("how can i support someone with cognitive disabilities"),
            ...variants("how to help someone with cognitive disabilities"),
            ...variants("supporting people with cognitive disabilities"),
            ...variants("how do i help a friend with cognitive disabilities"),
            ...variants("are cognitive disabilities common"),
            ...variants("how common are cognitive disabilities"),
            ...variants("is it common to have a cognitive disability"),
            ...variants("can cognitive disabilities affect adults"),
            ...variants("can cognitive disabilities affect children"),
            ...variants("do cognitive disabilities affect adults"),
            ...variants("do cognitive disabilities affect children"),
            ...variants("are cognitive disabilities genetic"),
            ...variants("is cognitive disability hereditary"),
            ...variants("can you inherit cognitive disabilities"),
            ...variants("can cognitive disabilities change over time"),
            ...variants("do cognitive disabilities get worse"),
            ...variants("do cognitive disabilities improve")
        ].some(q => userMsg.includes(q)) || keywordMatch([
            "cognitive disability", "cognitive disabilities", "cognitive impairment", "cognitive disorder", "cognitive", "disability", "impairment", "disorder", "diagnose", "symptom", "hereditary", "genetic", "cure", "recover", "common", "children", "adults", "change", "worse", "improve"
        ])) {
            return (
                "Here are common perameters,poins or factors to explain cognitive disabilities:\n" +
                "\n- Causes: Cognitive disabilities can result from genetic factors, brain injuries, illnesses, or environmental influences.\n" +
                "- Cure: While many cognitive disabilities are lifelong, early intervention, therapy, and support can greatly improve quality of life.\n" +
                "- Diagnosis: Diagnosis typically involves medical evaluations, cognitive tests, and observations by specialists.\n" +
                "- Symptoms: Symptoms may include difficulties with memory, attention, problem-solving, communication, and learning.\n" +
                "- Supporting Others: Offer patience, clear communication, encouragement, and help with daily tasks.\n" +
                "- Prevalence: Cognitive disabilities are relatively common and can affect people of all ages.\n" +
                "- Age: Both children and adults can have cognitive disabilities.\n" +
                "- Genetics: Some cognitive disabilities have a genetic component, while others are acquired.\n" +
                "- Changes Over Time: The impact of cognitive disabilities can change, sometimes improving with support or changing with age or health.\n" +
                "\nIf you have a specific question about a type of cognitive disability or want more details, just ask!"
            );
        }
        // Navigation Q&A
        if ([...variants("how do i navigate the Aarogyam website")].some(q => userMsg.includes(q)) || keywordMatch(["navigate", "menu", "section", "main menu"])) {
            return "Use the main menu at the top of the page to access different sections. Each section is labeled clearly for easy understanding.";
        }
        if ([...variants("accessible for screen readers")].some(q => userMsg.includes(q)) || keywordMatch(["screen reader", "accessible", "accessibility"])) {
            return "Yes, Aarogyam is designed to be fully compatible with screen readers, ensuring all users can access content effectively.";
        }
        if ([...variants("adjust the text size")].some(q => userMsg.includes(q)) || keywordMatch(["text size", "font size", "increase text", "decrease text"])) {
            return "Absolutely! Use the text size adjustment tool located at the top right corner to increase or decrease font size as per your preference.";
        }
        if ([...variants("keyboard navigation")].some(q => userMsg.includes(q)) || keywordMatch(["keyboard", "shortcut", "tab navigation"])) {
            return "Yes, all interactive elements on Aarogyam can be accessed using keyboard shortcuts for users who prefer or require keyboard navigation.";
        }
        if ([...variants("alternative text descriptions for images")].some(q => userMsg.includes(q)) || keywordMatch(["alt text", "image description", "image accessibility"])) {
            return "Yes, all images on Aarogyam include descriptive alt text to assist users relying on screen readers.";
        }
        // Cognitive Support Features
        if ([...variants("features support users with cognitive disabilities")].some(q => userMsg.includes(q)) || keywordMatch(["cognitive support", "support features", "assistive", "help cognitive", "support", "upport"])) {
            return "Aarogyam offers simplified language, consistent layouts, visual aids, and step-by-step guides to assist users with cognitive challenges.";
        }
        if ([...variants("distraction-free mode")].some(q => userMsg.includes(q)) || keywordMatch(["distraction free", "focus mode", "minimize distractions"])) {
            return "Yes, Aarogyam provides a focus mode that minimizes on-screen distractions, helping users concentrate on the content.";
        }
        if ([...variants("customize the website's appearance")].some(q => userMsg.includes(q)) || keywordMatch(["customize", "appearance", "color scheme", "contrast", "font style"])) {
            return "Certainly! Users can change color schemes, font styles, and contrast settings to suit their preferences.";
        }
        if ([...variants("audio versions of content")].some(q => userMsg.includes(q)) || keywordMatch(["audio version", "listen", "read aloud", "tts"])) {
            return "Yes, most articles and guides have accompanying audio versions for users who prefer listening over reading.";
        }
        if ([...variants("visual cues to guide me through tasks")].some(q => userMsg.includes(q)) || keywordMatch(["visual cue", "icon", "progress indicator", "step guide"])) {
            return "Aarogyam incorporates icons and progress indicators to visually guide users through multi-step processes.";
        }
        // Chatbot Interaction
        if ([...variants("how do i start a conversation with the chatbot")].some(q => userMsg.includes(q)) || keywordMatch(["start chat", "open chatbot", "chat icon"])) {
            return "Click on the chat icon located at the bottom right corner of the screen to initiate a conversation.";
        }
        if ([...variants("what kind of assistance can the chatbot provide")].some(q => userMsg.includes(q)) || keywordMatch(["chatbot help", "chatbot support", "chatbot guide"])) {
            return "The chatbot can answer FAQs, guide you through website features, and provide support resources.";
        }
        if ([...variants("is the chatbot available 24/7")].some(q => userMsg.includes(q)) || keywordMatch(["24/7", "always available", "anytime chatbot"])) {
            return "Yes, the chatbot is accessible at all times to assist you whenever needed.";
        }
        if ([...variants("can the chatbot understand voice commands")].some(q => userMsg.includes(q)) || keywordMatch(["voice command", "speak to chatbot", "voice input"])) {
            return "Currently, the chatbot operates via text. Voice command functionality is in development for future updates.";
        }
        if ([...variants("is my conversation with the chatbot confidential")].some(q => userMsg.includes(q)) || keywordMatch(["confidential", "private chat", "privacy chatbot"])) {
            return "Absolutely. All interactions are private and adhere to strict confidentiality protocols.";
        }
        // Account Management
        if ([...variants("how do i create an account on Aarogyam")].some(q => userMsg.includes(q)) || keywordMatch(["create account", "sign up", "register Aarogyam"])) {
            return "Click on the 'Sign Up' button at the top right corner and fill in the required information to register.";
        }
        if ([...variants("forgot my password")].some(q => userMsg.includes(q)) || keywordMatch(["forgot password", "reset password", "recover password"])) {
            return "Click on 'Forgot Password' on the login page and follow the instructions to reset your password.";
        }
        if ([...variants("delete my Aarogyam account")].some(q => userMsg.includes(q)) || keywordMatch(["delete account", "remove account", "close account"])) {
            return "Yes, go to account settings and select 'Delete Account.' Follow the prompts to complete the process.";
        }
        if ([...variants("update my personal information")].some(q => userMsg.includes(q)) || keywordMatch(["update info", "edit profile", "change details"])) {
            return "Navigate to your profile settings and edit the necessary fields to update your information.";
        }
        if ([...variants("is my personal data secure on Aarogyam")].some(q => userMsg.includes(q)) || keywordMatch(["data secure", "privacy", "data protection"])) {
            return "Yes, Aarogyam employs advanced security measures to protect your personal information.";
        }
        // Resources & Support
        if ([...variants("what types of resources does Aarogyam offer")].some(q => userMsg.includes(q)) || keywordMatch(["resources", "support group", "tools", "articles", "tutorials"])) {
            return "Aarogyam provides articles, tutorials, support group information, and tools tailored for individuals with cognitive disabilities.";
        }
        if ([...variants("community forums available")].some(q => userMsg.includes(q)) || keywordMatch(["community forum", "discussion", "peer support"])) {
            return "Yes, registered users can participate in community forums to share experiences and seek support.";
        }
        if ([...variants("access professional support through Aarogyam")].some(q => userMsg.includes(q)) || keywordMatch(["professional support", "consultation", "specialist", "expert"])) {
            return "Aarogyam offers directories of certified professionals and organizations specializing in cognitive disabilities.";
        }
        if ([...variants("downloadable materials")].some(q => userMsg.includes(q)) || keywordMatch(["download", "pdf", "audio file", "material"])) {
            return "Yes, many resources are available for download in PDF and audio formats.";
        }
        if ([...variants("live webinars or workshops")].some(q => userMsg.includes(q)) || keywordMatch(["webinar", "workshop", "live session", "event"])) {
            return "Aarogyam regularly hosts live sessions. Check the events calendar for upcoming webinars and workshops.";
        }
        // Troubleshooting & Technical Support
        if ([...variants("website isn't loading properly")].some(q => userMsg.includes(q)) || keywordMatch(["not loading", "website issue", "site problem", "error"])) {
            return "Try refreshing the page or clearing your browser's cache. If the issue persists, contact our support team.";
        }
        if ([...variants("experiencing issues with the chatbot")].some(q => userMsg.includes(q)) || keywordMatch(["chatbot issue", "chatbot problem", "report chatbot"])) {
            return "Use the 'Report a Problem' link located in the chatbot window to notify our technical team.";
        }
        if ([...variants("can't i access certain features")].some(q => userMsg.includes(q)) || keywordMatch(["can't access", "feature unavailable", "not working"])) {
            return "Some features may require you to be logged in. Ensure you're signed into your account.";
        }
        if ([...variants("report inappropriate content")].some(q => userMsg.includes(q)) || keywordMatch(["report content", "inappropriate", "abuse"])) {
            return "Click on the 'Report' button near the content or contact our support team directly.";
        }
        if ([...variants("help center i can refer to")].some(q => userMsg.includes(q)) || keywordMatch(["help center", "faq", "guide"])) {
            return "Yes, visit our Help Center for detailed guides and FAQs.";
        }
        // Privacy & Security
        if ([...variants("how does Aarogyam protect my privacy")].some(q => userMsg.includes(q)) || keywordMatch(["privacy", "data protection", "secure"])) {
            return "Aarogyam follows strict data protection policies and uses encryption to safeguard your information.";
        }
        if ([...variants("will my data be shared with third parties")].some(q => userMsg.includes(q)) || keywordMatch(["share data", "third party", "data sharing"])) {
            return "No, Aarogyam does not share personal data without your explicit consent.";
        }
        if ([...variants("control what information is visible to others")].some(q => userMsg.includes(q)) || keywordMatch(["visibility", "privacy settings", "who can see"])) {
            return "Yes, adjust your privacy settings in your account to control visibility.";
        }
        if ([...variants("report a security concern")].some(q => userMsg.includes(q)) || keywordMatch(["security concern", "security issue", "report security"])) {
            return "Contact our security team via the 'Report a Security Issue' link in the footer.";
        }
        if ([...variants("comply with data protection regulations")].some(q => userMsg.includes(q)) || keywordMatch(["data regulation", "compliance", "law"])) {
            return "Yes, Aarogyam complies with all relevant data protection laws and regulations.";
        }
        // Mobile Accessibility
        if ([...variants("Aarogyam mobile app")].some(q => userMsg.includes(q)) || keywordMatch(["mobile app", "app", "mobile version"])) {
            return "Currently, Aarogyam is accessible via mobile browsers. A dedicated app is in development.";
        }
        if ([...variants("website function well on mobile devices")].some(q => userMsg.includes(q)) || keywordMatch(["mobile device", "responsive", "mobile friendly"])) {
            return "Yes, Aarogyam is optimized for mobile use, ensuring a seamless experience across devices.";
        }
        if ([...variants("use the chatbot on my smartphone")].some(q => userMsg.includes(q)) || keywordMatch(["smartphone", "mobile chatbot", "chatbot on phone"])) {
            return "Absolutely! The chatbot is fully functional on mobile devices.";
        }
        if ([...variants("mobile notifications available")].some(q => userMsg.includes(q)) || keywordMatch(["mobile notification", "push notification", "alert"])) {
            return "Yes, you can enable notifications in your mobile browser settings.";
        }
        if ([...variants("adjust settings on the mobile version")].some(q => userMsg.includes(q)) || keywordMatch(["mobile settings", "settings on phone", "settings mobile"])) {
            return "Access the settings menu by tapping the gear icon on the top right corner of the mobile interface.";
        }
        // Feedback & Suggestions
        if ([...variants("provide feedback about Aarogyam")].some(q => userMsg.includes(q)) || keywordMatch(["feedback", "suggestion", "comment"])) {
            return "Use the 'Feedback' form located at the bottom of each page to share your thoughts.";
        }
        if ([...variants("suggest new features")].some(q => userMsg.includes(q)) || keywordMatch(["feature request", "new feature", "suggestion"])) {
            return "Yes, we welcome suggestions! Submit your ideas through the 'Feature Request' section in your account settings.";
        }
        if ([...variants("report bugs or issues")].some(q => userMsg.includes(q)) || keywordMatch(["bug", "issue", "problem"])) {
            return "Report any technical issues via the 'Report a Problem' link in the footer.";
        }
        if ([...variants("user satisfaction survey")].some(q => userMsg.includes(q)) || keywordMatch(["survey", "satisfaction", "feedback survey"])) {
            return "Yes, periodic surveys are sent to users to gather feedback and improve our services.";
        }
        if ([...variants("volunteer to help improve Aarogyam")].some(q => userMsg.includes(q)) || keywordMatch(["volunteer", "help improve", "contribute"])) {
            return "Absolutely! Visit our 'Get Involved' page to learn about volunteer opportunities.";
        }
        // Miscellaneous
        if ([...variants("available in multiple languages")].some(q => userMsg.includes(q)) || keywordMatch(["language", "multilingual", "other languages"])) {
            return "Currently, Aarogyam is available in English. We are working on adding more languages soon.";
        }
        if ([...variants("bookmark resources for later")].some(q => userMsg.includes(q)) || keywordMatch(["bookmark", "save resource", "favorite"])) {
            return "Yes, logged-in users can bookmark articles and resources for easy access later.";
        }
        if ([...variants("does Aarogyam offer newsletters")].some(q => userMsg.includes(q)) || keywordMatch(["newsletter", "email update", "news update"])) {
            return "Yes, subscribe to our monthly newsletter for updates and new resources.";
        }
        if ([...variants("costs associated with using Aarogyam")].some(q => userMsg.includes(q)) || keywordMatch(["cost", "price", "free", "subscription"])) {
            return "Aarogyam is free to use. Some advanced features may require a subscription in the future.";
        }
        if ([...variants("contact Aarogyam support directly")].some(q => userMsg.includes(q)) || keywordMatch(["contact support", "support team", "help contact"])) {
            return "Use the 'Contact Us' form located in the footer to reach our support team.";
        }
        if (userMsg.includes(
            "what are cognitive disabilities","what are cognitive disabilities?","Can you explain cognitive impairments?","Can you explain cognitive impairments",
            "What are cognitive disabilities","What are cognitive disabilities?","can you explain cognitive impairments?","can you explain cognitive impairments",
            "What does it mean to have a cognitive disorder?","what does it mean to have a cognitive disorder?","What does it mean to have a cognitive disorder",
            "what does it mean to have a cognitive disorder","Define cognitive disabilities?","Define cognitive disabilities","define cognitive disabilities",
            "define cognitive disabilities?","what are examples of cognitive disabilities?","what are examples of cognitive disabilities",
            "What are examples of cognitive disabilities","What are examples of cognitive disabilities?")) {
            return "Cognitive disabilities are impairments in mental processes such as memory, problem-solving, attention, and comprehension. Examples include dyslexia, ADHD, autism spectrum disorders, and dementia.";
        }
        
        if (userMsg.includes(
            "how do I use Aarogyam","guide me through Aarogyam","where can I find resources on Aarogyam","how is Aarogyam structured",
            "what sections are available on Aarogyam","How do I use Aarogyam?","Guide me through Aarogyam","Where can I find resources on Aarogyam?",
            "How is Aarogyam structured?","What sections are available on Aarogyam?")) {
            return "Aarogyam offers sections like Home, Resources, Support Groups, Professional Help, and FAQs. Use the top navigation bar to explore these areas.";
        }
        
        if (userMsg.includes(
            "what tools does Aarogyam offer","are there any assistive technologies on Aarogyam","does Aarogyam have a reading aid",
            "can I customize my Aarogyam interface","are there interactive exercises on Aarogyam","What tools does Aarogyam offer?",
            "Are there any assistive technologies on Aarogyam?","Does Aarogyam have a reading aid?","Can I customize my Aarogyam interface?",
            "Are there interactive exercises on Aarogyam?")) {
            return "Aarogyam provides text-to-speech, adjustable text size, high-contrast mode, and interactive cognitive exercises to assist users.";
        }
        
        if (userMsg.includes(
            "how can I contact a specialist through Aarogyam","is there a chat support available","can I join support groups via Aarogyam",
            "how do I get peer support on Aarogyam","are there forums on Aarogyam","How can I contact a specialist through Aarogyam?",
            "Is there a chat support available?","Can I join support groups via Aarogyam?","How do I get peer support on Aarogyam?","Are there forums on Aarogyam?")) {
            return "Yes, Aarogyam offers chat support, access to professional consultations, and community forums for peer interactions.";
        }
        
        if (userMsg.includes(
            "how do I create an account on Aarogyam","is my data safe on Aarogyam","can I delete my Aarogyam account","how do I change my password",
            "what is Aarogyam's privacy policy","How do I create an account on Aarogyam?","Is my data safe on Aarogyam?","Can I delete my Aarogyam account?",
            "How do I change my password?","What is Aarogyam's privacy policy?")) {
            return "Aarogyam ensures user data is encrypted and stored securely. You can manage your account settings, including password changes and account deletion, through your profile.";
        }
        
        if (userMsg.includes(
            "does Aarogyam offer educational materials","where can I learn about cognitive therapies","are there articles on managing cognitive disabilities",
            "can I access webinars on Aarogyam","does Aarogyam provide video tutorials","Does Aarogyam offer educational materials?",
            "Where can I learn about cognitive therapies?","Are there articles on managing cognitive disabilities?","Can I access webinars on Aarogyam?",
            "Does Aarogyam provide video tutorials?")) {
            return "Aarogyam hosts a library of articles, video tutorials, and webinars covering various aspects of cognitive disabilities and management strategies.";
        }
        
        if (userMsg.includes(
            "can I set reminders on Aarogyam","does Aarogyam have a calendar feature","how do I schedule appointments via Aarogyam",
            "are there alerts for upcoming events","can Aarogyam notify me about new content","Can I set reminders on Aarogyam?",
            "Does Aarogyam have a calendar feature?","How do I schedule appointments via Aarogyam?","Are there alerts for upcoming events?",
            "Can Aarogyam notify me about new content?")) {
            return "Aarogyam includes a calendar for scheduling, setting reminders for appointments, and notifications for new content and events.";
        }
        
        if (userMsg.includes(
            "how can I track my progress on Aarogyam","does Aarogyam offer assessments","can I monitor improvements over time",
            "are there quizzes to test my knowledge","how do I view my activity history","How can I track my progress on Aarogyam?",
            "Does Aarogyam offer assessments?","Can I monitor improvements over time?","Are there quizzes to test my knowledge?",
            "How do I view my activity history?")) {
            return "Aarogyam provides self-assessment tools, progress tracking dashboards, and activity logs to help monitor your journey.";
        }
        
        if (userMsg.includes(
            "is Aarogyam accessible for screen readers","can I navigate Aarogyam using a keyboard","does Aarogyam support voice commands",
            "are there alternative text descriptions for images","can I adjust the color contrast on Aarogyam","Is Aarogyam accessible for screen readers?",
            "Can I navigate Aarogyam using a keyboard?","Does Aarogyam support voice commands?","Are there alternative text descriptions for images?",
            "Can I adjust the color contrast on Aarogyam?")) {
            return "Aarogyam is designed with accessibility in mind, supporting screen readers, keyboard navigation, voice commands, alt text for images, and customizable color contrasts.";
        }
        
        if (userMsg.includes(
            "I'm having trouble logging in","Aarogyam is not loading properly","features are not displaying correctly","I can't access certain sections",
            "how do I report a bug on Aarogyam","I'm having trouble logging in.","Aarogyam is not loading properly.","Features are not displaying correctly.",
            "I can't access certain sections.","How do I report a bug on Aarogyam?")) {
            return "For technical issues, try refreshing the page, clearing your browser cache, or using a different browser. If problems persist, contact Aarogyam support through the 'Help' section.";
        }
        
        // Fallback to API for other questions
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message,
                    sessionId: this.sessionId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await response.json();
            if (!data.response) {
                throw new Error('Invalid response from server');
            }

            return data.response;
        } catch (error) {
            console.error('API error:', error);
            throw error;
        }
    }
}

// Initialize chatbot when the page loads
window.addEventListener('load', () => {
    new ChatBot();
}); 