// Contact Management Application
class AddressBook {
    constructor() {
        this.contacts = [];
        this.selectedContactId = null;
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.init();
    }

    async init() {
        await this.loadContacts();
        this.renderContacts();
        this.setupEventListeners();
    }

    setupEventListeners() {
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
            if (this.selectedContactId) {
                if (confirm('Are you sure you want to delete this contact?')) {
                    this.deleteContact(this.selectedContactId);
                }
            }
        });

        // Add email button
        document.getElementById('add-email-btn').addEventListener('click', () => {
            this.addEmailField();
        });
    }

    newContact() {
        this.selectedContactId = null;
        this.renderContactForm(null);
    }

    cancelEdit() {
        if (this.selectedContactId) {
            const contact = this.contacts.find(c => c.id === this.selectedContactId);
            this.renderContactForm(contact);
        } else {
            this.renderContactForm(null);
        }
    }

    parseName(name) {
        if (!name) return { firstName: '', lastName: '' };
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return { firstName: parts[0], lastName: '' };
        const lastName = parts.pop();
        const firstName = parts.join(' ');
        return { firstName, lastName };
    }

    formatName(firstName, lastName) {
        return `${firstName} ${lastName}`.trim();
    }

    renderContacts(contactsToRender = null) {
        const contactsList = document.getElementById('contacts-list');
        const contacts = contactsToRender || this.contacts;

        if (contacts.length === 0) {
            contactsList.innerHTML = `
                <div class="empty-state">
                    <p>No contacts</p>
                </div>
            `;
            return;
        }

        contactsList.innerHTML = contacts.map(contact => {
            const name = contact.name || '';
            const isSelected = contact.id === this.selectedContactId ? 'selected' : '';
            return `
                <div class="contact-item ${isSelected}" data-contact-id="${this.escapeHtmlAttribute(contact.id)}">
                    ${this.escapeHtml(name)}
                </div>
            `;
        }).join('');

        // Attach click listeners to contact items
        contactsList.querySelectorAll('.contact-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const contactId = e.currentTarget.getAttribute('data-contact-id');
                this.selectContact(contactId);
            });
        });
    }

    selectContact(contactId) {
        this.selectedContactId = contactId;
        const contact = this.contacts.find(c => c.id === contactId);
        this.renderContactForm(contact);
        this.renderContacts();
    }

    renderContactForm(contact) {
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailList = document.getElementById('email-list');
        const deleteBtn = document.getElementById('delete-btn');

        if (contact) {
            const { firstName, lastName } = this.parseName(contact.name);
            firstNameInput.value = firstName;
            lastNameInput.value = lastName;

            // Render emails
            const emails = contact.email ? [contact.email] : [];
            emailList.innerHTML = emails.map((email, index) => this.createEmailField(email, index)).join('');

            // Attach remove listeners to email remove buttons
            emailList.querySelectorAll('.btn-remove-email').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.currentTarget.closest('.email-item').remove();
                });
            });

            deleteBtn.style.display = 'inline-block';
        } else {
            firstNameInput.value = '';
            lastNameInput.value = '';
            emailList.innerHTML = this.createEmailField('', 0);
            deleteBtn.style.display = 'none';
        }
    }

    createEmailField(email, index) {
        const emailId = `email-${index}`;
        return `
            <div class="email-item">
                <input type="email" id="${emailId}" name="email" value="${this.escapeHtmlAttribute(email)}" class="email-input">
                ${index > 0 ? `<button type="button" class="btn-remove-email" data-index="${index}"><i class="fa-solid fa-minus"></i></button>` : ''}
            </div>
        `;
    }

    addEmailField() {
        const emailList = document.getElementById('email-list');
        const index = emailList.children.length;
        const emailField = document.createElement('div');
        emailField.className = 'email-item';
        emailField.innerHTML = `
            <input type="email" id="email-${index}" name="email" value="" class="email-input">
            <button type="button" class="btn-remove-email" data-index="${index}"><i class="fa-solid fa-minus"></i></button>
        `;
        emailList.appendChild(emailField);

        // Attach remove listener
        emailField.querySelector('.btn-remove-email').addEventListener('click', (e) => {
            e.currentTarget.closest('.email-item').remove();
        });
    }

    async saveContact() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const emailInputs = document.querySelectorAll('.email-input');
        const emails = Array.from(emailInputs)
            .map(input => input.value.trim())
            .filter(email => email.length > 0);

        if (!firstName || !lastName) {
            alert('First name and last name are required');
            return;
        }

        if (emails.length === 0) {
            alert('At least one email is required');
            return;
        }

        const name = this.formatName(firstName, lastName);
        const primaryEmail = emails[0];
        const contactData = {
            name: name,
            email: primaryEmail,
            phone: '', // Keep for backward compatibility
            address: '' // Keep for backward compatibility
        };

        try {
            let response;
            if (this.selectedContactId) {
                // Update existing contact
                response = await fetch(`${this.apiBaseUrl}/contacts/${this.selectedContactId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(contactData)
                });
            } else {
                // Create new contact
                response = await fetch(`${this.apiBaseUrl}/contacts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(contactData)
                });
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save contact');
            }

            const contact = await response.json();

            // Reload contacts
            await this.loadContacts();
            this.selectContact(contact.id);
            this.renderContacts();
        } catch (error) {
            alert(`Error saving contact: ${error.message}`);
            console.error('Error saving contact:', error);
        }
    }

    async deleteContact(id) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/contacts/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete contact');
            }

            this.contacts = this.contacts.filter(contact => contact.id !== id);
            this.selectedContactId = null;
            this.renderContactForm(null);
            this.renderContacts();
        } catch (error) {
            alert(`Error deleting contact: ${error.message}`);
            console.error('Error deleting contact:', error);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeHtmlAttribute(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    async loadContacts() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/contacts`);

            if (!response.ok) {
                throw new Error('Failed to load contacts');
            }

            this.contacts = await response.json();
        } catch (error) {
            console.error('Error loading contacts:', error);
            alert(`Error loading contacts: ${error.message}. Make sure the backend server is running.`);
            this.contacts = [];
        }
    }
}

// Initialize the application
const addressBook = new AddressBook();
