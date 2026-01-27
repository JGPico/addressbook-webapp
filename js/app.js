/**
 * Main Address Book Application
 * Coordinates all components
 */

class AddressBook {
    constructor() {
        // Use environment variable or default to localhost for development
        const apiBaseUrl = window.API_BASE_URL || 'http://localhost:5000/api';
        this.apiService = new ApiService(apiBaseUrl);
        this.emailManager = new EmailManager();
        this.formManager = new ContactFormManager(this.emailManager);
        this.contactListManager = new ContactListManager(
            this.apiService,
            (contact) => this.handleContactSelect(contact)
        );
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.updateAuthGreeting();
        await this.loadContacts();
        this.contactListManager.renderContacts();
        this.formManager.renderContactForm(null);
        this.emailManager.initEmailList();
        this.updateAuthGreeting();
    }

    setupEventListeners() {
        // Login button and dialog
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => openLoginDialog());
        }
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('login-username').value.trim();
                const password = document.getElementById('login-password').value;
                if (!username) {
                    showLoginError('Please enter a username.');
                    return;
                }
                if (!password) {
                    showLoginError('Please enter a password.');
                    return;
                }
                try {
                    await this.apiService.login(username, password);
                    closeLoginDialog();
                    this.updateAuthGreeting();
                    await this.loadContacts();
                    this.contactListManager.renderContacts();
                } catch (err) {
                    showLoginError(err.message || 'Login failed.');
                }
            });
        }
        const loginCancelBtn = document.getElementById('login-cancel-btn');
        if (loginCancelBtn) {
            loginCancelBtn.addEventListener('click', () => closeLoginDialog());
        }
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.apiService.setToken(null);
                this.updateAuthGreeting();
                this.loadContacts();
            });
        }

        // Add contact button
        document.getElementById('add-contact-btn').addEventListener('click', () => {
            this.newContact();
        });

        // Form submission
        const form = document.getElementById('contact-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.saveContact();
        });

        // Cancel button
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Delete button
        document.getElementById('delete-btn').addEventListener('click', () => {
            if (this.contactListManager.getSelectedContactId()) {
                if (confirm('Are you sure you want to delete this contact?')) {
                    this.deleteContact(this.contactListManager.getSelectedContactId());
                }
            }
        });

        // Add email button - show/hide email entry form
        document.getElementById('add-email-btn').addEventListener('click', () => {
            this.emailManager.toggleEmailEntryForm();
        });

        // Allow Enter key in email input to save contact
        document.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('email-input') && e.key === 'Enter') {
                e.preventDefault();
                // If email form is visible, save the contact
                const emailList = document.getElementById('email-form');
                if (emailList.classList.contains('visible')) {
                    // First add the email if there's a value, then save
                    this.emailManager.addEmailFromInput();
                    this.saveContact();
                } else {
                    // If form is not visible, toggle it to show
                    this.emailManager.toggleEmailEntryForm();
                }
            }
        });
    }

    handleContactSelect(contact) {
        this.clearValidationErrors();
        this.formManager.renderContactForm(contact);
    }

    newContact() {
        this.contactListManager.clearSelection();
        this.clearValidationErrors();
        this.formManager.renderContactForm(null);
    }

    cancelEdit() {
        this.contactListManager.setSelectedContact(null);
        this.clearValidationErrors();
        this.formManager.renderContactForm(null);
        this.contactListManager.renderContacts();
    }

    updateAuthGreeting() {
        const el = document.getElementById('auth-greeting');
        if (!el) return;
        const username = this.apiService.getUsername();
        el.textContent = username ? `Hello ${username}` : 'Login to access contacts';
    }

    async loadContacts() {
        try {
            const contacts = await this.apiService.loadContacts();
            this.contactListManager.setContacts(contacts);
        } catch (error) {
            this.contactListManager.setContacts([]);
            this.updateAuthGreeting();
            if (error.status === 401) {
                openLoginDialog();
            } else {
                alert(`Error loading contacts: ${error.message}. Make sure the backend server is running.`);
            }
        }
    }

    clearValidationErrors() {
        this.emailManager.clearEmailError();
        const formEl = document.getElementById('form-validation-error');
        if (formEl) {
            formEl.textContent = '';
            formEl.classList.remove('visible');
        }
    }

    async saveContact() {
        const formData = this.formManager.collectFormData();
        const validation = this.formManager.validateFormData(formData);

        this.clearValidationErrors();
        if (!validation.isValid) {
            if (validation.error.includes('email') || validation.error.includes('valid')) {
                this.emailManager.showEmailError(validation.error);
            } else {
                const formEl = document.getElementById('form-validation-error');
                if (formEl) {
                    formEl.textContent = validation.error;
                    formEl.classList.add('visible');
                }
            }
            return;
        }

        const contactData = this.formManager.prepareContactData(formData);

        try {
            const selectedId = this.contactListManager.getSelectedContactId();
            let contact;

            if (selectedId) {
                // Update existing contact
                contact = await this.apiService.updateContact(selectedId, contactData);
            } else {
                // Create new contact
                contact = await this.apiService.createContact(contactData);
            }

            this.emailManager.setSavedEmails(formData.emails);
            this.clearValidationErrors();

            await this.loadContacts();
            this.contactListManager.selectContact(contact.id);
            this.contactListManager.renderContacts();
        } catch (error) {
            if (error.status === 401) {
                openLoginDialog();
            } else {
                alert(`Error saving contact: ${error.message}`);
            }
            console.error('Error saving contact:', error);
        }
    }

    async deleteContact(id) {
        try {
            await this.apiService.deleteContact(id);
            await this.loadContacts();
            this.contactListManager.clearSelection();
            this.formManager.renderContactForm(null);
            this.contactListManager.renderContacts();
        } catch (error) {
            if (error.status === 401) {
                openLoginDialog();
            } else {
                alert(`Error deleting contact: ${error.message}`);
            }
            console.error('Error deleting contact:', error);
        }
    }
}

// Initialize the application
const addressBook = new AddressBook();
