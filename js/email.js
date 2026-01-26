/**
 * Email management component
 * Handles saved emails list and email entry form
 */

class EmailManager {
    constructor() {
        this.savedEmails = [];
    }

    /**
     * Set saved emails
     * @param {Array} emails - Array of email strings
     */
    setSavedEmails(emails) {
        this.savedEmails = emails || [];
    }

    /**
     * Get saved emails
     * @returns {Array} Array of saved emails
     */
    getSavedEmails() {
        return this.savedEmails;
    }

    /**
     * Render the saved emails list
     */
    renderSavedEmails() {
        const savedEmailsList = document.getElementById('saved-emails-list');

        if (this.savedEmails.length === 0) {
            savedEmailsList.innerHTML = '';
            return;
        }

        savedEmailsList.innerHTML = this.savedEmails.map((email, index) => `
            <div class="saved-email-item">
                <span class="saved-email-text">${escapeHtml(email)}</span>
                <button type="button" class="btn-remove-email" data-email-index="${index}"><i class="fa-solid fa-minus"></i></button>
            </div>
        `).join('');

        // Attach remove listeners to saved email remove buttons
        savedEmailsList.querySelectorAll('.btn-remove-email').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.getAttribute('data-email-index'));
                this.removeEmail(index);
            });
        });
    }

    /**
     * Remove an email from saved emails
     * @param {number} index - Index of email to remove
     */
    removeEmail(index) {
        this.savedEmails.splice(index, 1);
        this.renderSavedEmails();
    }

    /**
     * Add an email to saved emails
     * @param {string} email - Email address to add
     */
    addEmail(email) {
        if (email && !this.savedEmails.includes(email)) {
            this.savedEmails.push(email);
            this.renderSavedEmails();
        }
    }

    /**
     * Create email input field HTML
     * @param {string} email - Email value
     * @param {number} index - Field index
     * @returns {string} HTML string
     */
    createEmailField(email, index) {
        const emailId = `email-${index}`;
        return `
            <div class="email-item">
                <input type="email" id="${emailId}" name="email" value="${escapeHtmlAttribute(email)}" class="email-input" placeholder="Enter email" autocomplete="email" pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" title="Please enter a valid email address (e.g., name@example.com)">
                ${index > 0 ? `<button type="button" class="btn-remove-email-input" data-index="${index}"><i class="fa-solid fa-minus"></i></button>` : ''}
            </div>
        `;
    }

    /**
     * Toggle email entry form visibility
     */
    toggleEmailEntryForm() {
        const emailList = document.getElementById('email-form');
        const addEmailBtn = document.getElementById('add-email-btn');
        const icon = addEmailBtn.querySelector('i');

        if (emailList.classList.contains('visible')) {
            // If form is visible, add the email only when valid; hide form only when add succeeded
            if (!this.addEmailFromInput()) return;
            emailList.classList.remove('visible');
            icon.className = 'fa-solid fa-plus';
        } else {
            // Show the form
            this.clearEmailError();
            emailList.classList.add('visible');
            icon.className = 'fa-solid fa-minimize';
            setTimeout(() => {
                const emailInput = emailList.querySelector('.email-input');
                if (emailInput) {
                    emailInput.focus();
                }
            }, 100);
        }
    }

    /**
     * Show an error message near the email input
     * @param {string} message - Error message text
     */
    showEmailError(message) {
        const el = document.getElementById('email-error');
        if (el) {
            el.textContent = message;
            el.classList.add('visible');
        }
    }

    /**
     * Clear the email inline error message
     */
    clearEmailError() {
        const el = document.getElementById('email-error');
        if (el) {
            el.textContent = '';
            el.classList.remove('visible');
        }
    }

    /**
     * Add email from input field to saved emails.
     * @returns {boolean} True if an email was added (and form can close), false if invalid/empty (form stays open)
     */
    addEmailFromInput() {
        const emailList = document.getElementById('email-form');
        const emailInputs = emailList.querySelectorAll('.email-input');

        const currentEmail = emailInputs.length > 0 ? emailInputs[0].value.trim() : '';
        if (!currentEmail) {
            this.clearEmailError();
            return false;
        }

        if (!isValidEmail(currentEmail)) {
            this.showEmailError('Please enter a valid email address (e.g. name@example.com).');
            return false;
        }

        this.clearEmailError();
        this.addEmail(currentEmail);
        emailInputs[0].value = '';
        return true;
    }

    /**
     * Initialize email list (hide by default)
     */
    initEmailList() {
        const emailList = document.getElementById('email-form');
        if (emailList) {
            emailList.classList.remove('visible');
            emailList.innerHTML = this.createEmailField('', 0);
        }
    }

    /**
     * Reset email form (hide and clear)
     */
    resetEmailForm() {
        const emailList = document.getElementById('email-form');
        const addEmailBtn = document.getElementById('add-email-btn');
        const icon = addEmailBtn.querySelector('i');

        this.clearEmailError();
        emailList.classList.remove('visible');
        emailList.innerHTML = this.createEmailField('', 0);

        if (icon) {
            icon.className = 'fa-solid fa-plus';
        }
    }
}
