// Utility functions
const utils = {
    encrypt: (text) => {
        return btoa(encodeURIComponent(text));
    },
    decrypt: (text) => {
        return decodeURIComponent(atob(text));
    },
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Typing effect class
class TypeWriter {
    constructor(element, text, speed = 50) {
        this.element = element;
        this.text = text;
        this.speed = speed;
        this.index = 0;
    }

    type() {
        if (this.index < this.text.length) {
            this.element.textContent += this.text.charAt(this.index);
            this.index++;
            setTimeout(() => this.type(), this.speed);
        }
    }
}

// Message state management
class MessageState {
    constructor() {
        this.messages = JSON.parse(localStorage.getItem('sentMessages') || '[]');
        this.lastSentTime = localStorage.getItem('lastSentTime');
    }

    addMessage(message) {
        const timestamp = new Date().toISOString();
        this.messages.push({ message, timestamp });
        this.lastSentTime = timestamp;
        localStorage.setItem('sentMessages', JSON.stringify(this.messages));
        localStorage.setItem('lastSentTime', timestamp);
    }

    getMessageCount() {
        return this.messages.length;
    }

    getLastMessageTime() {
        return this.lastSentTime;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById("messageForm");
    const messageInput = document.getElementById("message");
    const submitButton = form.querySelector("button[type='submit']");
    const statusMessage = document.getElementById("statusMessage");
    const messageState = new MessageState();

    // Initialize typing effect for intro text
    const introText = document.querySelector('.intro');
    const originalText = introText.textContent;
    introText.textContent = '';
    new TypeWriter(introText, originalText, 30).type();

    // Add floating decorations
    for (let i = 0; i < 5; i++) {
        const decoration = document.createElement('div');
        decoration.className = 'decoration';
        decoration.style.setProperty('--delay', `${i * 0.5}s`);
        decoration.style.setProperty('--size', `${15 + Math.random() * 10}px`);
        document.body.appendChild(decoration);
    }

    // Advanced status message handling
    function showStatus(message, isError = false) {
        statusMessage.textContent = '';
        statusMessage.className = 'status show' + (isError ? ' error' : '');
        new TypeWriter(statusMessage, message, 20).type();
        
        setTimeout(() => {
            statusMessage.className = 'status';
        }, 5000);
    }

    // Enhanced loading state
    function setLoading(isLoading) {
        submitButton.disabled = isLoading;
        submitButton.className = isLoading ? 'loading' : '';
        submitButton.innerHTML = isLoading ? 
            '<span class="loading-spinner"></span> Sending...' : 
            'Send Message ✨';
    }

    // Message validation with advanced checks
    function validateMessage(message) {
        if (!message.trim()) {
            return { valid: false, error: "Hey, don't forget to write something! 😊" };
        }
        if (message.length < 3) {
            return { valid: false, error: "That's a bit too short! Write a bit more 😄" };
        }
        if (message.length > 500) {
            return { valid: false, error: "Whoa, that's a bit long! Keep it under 500 characters 😅" };
        }
        return { valid: true };
    }

    // Rate limiting check
    function checkRateLimit() {
        const lastSent = messageState.getLastMessageTime();
        if (lastSent) {
            const timeSinceLastMessage = Date.now() - new Date(lastSent).getTime();
            if (timeSinceLastMessage < 30000) { // 30 second cooldown
                return {
                    allowed: false,
                    waitTime: Math.ceil((30000 - timeSinceLastMessage) / 1000)
                };
            }
        }
        return { allowed: true };
    }

    // Checkbox bullet point logic
    const checkboxes = document.querySelectorAll('.option-checkbox');
    let userMessage = '';

    function getCheckedBullets() {
        return Array.from(checkboxes)
            .filter(cb => cb.checked)
            .map(cb => `• ${cb.parentElement.textContent.trim().replace(/^\s*\u2022\s*/, '')}`);
    }

    function updateTextareaFromCheckboxes() {
        const bullets = getCheckedBullets();
        // Remove bullets from the current textarea value
        let current = messageInput.value;
        // Remove all bullet lines from the top
        current = current.replace(/^(• .*(\r?\n|$))+/, '');
        // Add bullets at the top
        messageInput.value = (bullets.length ? bullets.join('\n') + '\n' : '') + userMessage;
    }

    // Save user-typed message (excluding bullets)
    messageInput.addEventListener('input', function(e) {
        // Remove bullet lines from the top
        let val = messageInput.value.replace(/^(• .*(\r?\n|$))+/, '');
        userMessage = val;
    });

    checkboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            updateTextareaFromCheckboxes();
        });
    });

    // Enhanced form submission
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        const message = messageInput.value.trim();
        
        const validation = validateMessage(message);
        if (!validation.valid) {
            showStatus(validation.error, true);
            return;
        }

        const rateLimit = checkRateLimit();
        if (!rateLimit.allowed) {
            showStatus(`Take a breather! Wait ${rateLimit.waitTime} seconds before sending another message 😊`, true);
            return;
        }

        setLoading(true);

        try {
            const plainMessage = message;
            await emailjs.send("service_qgh9dcz", "template_5pvuhk9", {
                message: plainMessage,
                title: "New Message 💬",
                timestamp: new Date().toISOString()
            });

            messageState.addMessage(message);
            showStatus("Message sent! ✨");
            form.reset();
            
            // Enhanced success animation
            const container = document.querySelector('.container');
            container.style.transform = 'scale(1.02)';
            container.style.boxShadow = '0 20px 40px rgba(74, 144, 226, 0.2)';
            setTimeout(() => {
                container.style.transform = 'scale(1)';
                container.style.boxShadow = '0 10px 30px rgba(74, 144, 226, 0.1)';
            }, 200);

            // Update message counter
            updateMessageCounter();
        } catch (error) {
            console.error("Failed to send message:", error);
            showStatus("Oops, something went wrong. Try again! 😅", true);
        } finally {
            setLoading(false);
        }
    });

    // Enhanced character counter with debouncing
    const maxLength = 500;
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    counter.style.cssText = 'text-align: right; font-size: 12px; color: #666; margin-top: 5px;';
    messageInput.parentNode.insertBefore(counter, messageInput.nextSibling);

    const updateCounter = utils.debounce(function() {
        const remaining = maxLength - (this.value ? this.value.length : 0);
        counter.textContent = `${remaining} characters left`;
        counter.style.color = remaining < 50 ? '#4a90e2' : '#666';
        
        // Add visual feedback
        if (remaining < 50) {
            counter.style.transform = 'scale(1.1)';
            setTimeout(() => {
                counter.style.transform = 'scale(1)';
            }, 200);
        }
    }, 100);

    messageInput.addEventListener('input', updateCounter);

    // Add message counter
    function updateMessageCounter() {
        const count = messageState.getMessageCount();
        const counterElement = document.createElement('div');
        counterElement.className = 'message-counter';
        counterElement.textContent = `Messages sent: ${count} 💬`;
        counterElement.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: rgba(255,255,255,0.9); padding: 10px 15px; border-radius: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); font-size: 14px;';
        
        const existingCounter = document.querySelector('.message-counter');
        if (existingCounter) {
            existingCounter.remove();
        }
        document.body.appendChild(counterElement);
    }

    // Initialize message counter
    updateMessageCounter();
});
  