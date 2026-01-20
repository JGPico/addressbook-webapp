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
                <input type="email" id="${emailId}" name="email" value="${escapeHtmlAttribute(email)}" class="email-input" placeholder="Enter email" autocomplete="email">
                ${index > 0 ? `<button type="button" class="btn-remove-email-input" data-index="${index}"><i class="fa-solid fa-minus"></i></button>` : ''}
            </div>
        `;
    }

    /**
     * Toggle email entry form visibility
     */
    toggleEmailEntryForm() {
        const emailList = document.getElementById('email-list');
        const addEmailBtn = document.getElementById('add-email-btn');
        const icon = addEmailBtn.querySelector('i');

        if (emailList.classList.contains('visible')) {
            // If form is visible, add the email and hide the form
            this.addEmailFromInput();
            emailList.classList.remove('visible');
            // Change icon back to plus
            icon.className = 'fa-solid fa-plus';
        } else {
            // Show the form
            emailList.classList.add('visible');
            // Change icon to minimize
            icon.className = 'fa-solid fa-minimize';
            // Focus on the input field
            setTimeout(() => {
                const emailInput = emailList.querySelector('.email-input');
                if (emailInput) {
                    emailInput.focus();
                }
            }, 100);
        }
    }

    /**
     * Add email from input field to saved emails
     */
    addEmailFromInput() {
        const emailList = document.getElementById('email-list');
        const emailInputs = emailList.querySelectorAll('.email-input');

        // Get the email value from the first input
        const currentEmail = emailInputs.length > 0 ? emailInputs[0].value.trim() : '';

        if (currentEmail) {
            this.addEmail(currentEmail);
            // Clear the input field
            emailInputs[0].value = '';
        }
    }

    /**
     * Initialize email list (hide by default)
     */
    initEmailList() {
        const emailList = document.getElementById('email-list');
        if (emailList) {
            emailList.classList.remove('visible');
            emailList.innerHTML = this.createEmailField('', 0);
        }
    }

    /**
     * Reset email form (hide and clear)
     */
    resetEmailForm() {
        const emailList = document.getElementById('email-list');
        const addEmailBtn = document.getElementById('add-email-btn');
        const icon = addEmailBtn.querySelector('i');

        emailList.classList.remove('visible');
        emailList.innerHTML = this.createEmailField('', 0);
        
        // Reset icon to plus
        if (icon) {
            icon.className = 'fa-solid fa-plus';
        }
    }
}
