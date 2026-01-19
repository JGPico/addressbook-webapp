// Contact Management Application
class AddressBook {
    constructor() {
        this.contacts = [];
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.init();
    }

    async init() {
        await this.loadContacts();
        this.renderContacts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('contact-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.addContact();
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            // Debounce search to avoid too many API calls
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.filterContacts(e.target.value);
            }, 300);
        });
    }

    async addContact() {
        const form = document.getElementById('contact-form');
        const formData = new FormData(form);
        
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address') || ''
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to add contact');
            }

            const contact = await response.json();
            this.contacts.push(contact);
            this.renderContacts();
            form.reset();
        } catch (error) {
            alert(`Error adding contact: ${error.message}`);
            console.error('Error adding contact:', error);
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
            this.renderContacts();
        } catch (error) {
            alert(`Error deleting contact: ${error.message}`);
            console.error('Error deleting contact:', error);
        }
    }

    async filterContacts(searchTerm) {
        if (!searchTerm.trim()) {
            // If search is empty, show all contacts
            await this.loadContacts();
            this.renderContacts();
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/contacts/search?q=${encodeURIComponent(searchTerm)}`);
            
            if (!response.ok) {
                throw new Error('Failed to search contacts');
            }

            const filtered = await response.json();
            this.renderContacts(filtered);
        } catch (error) {
            console.error('Error searching contacts:', error);
            // Fallback to client-side filtering if API fails
            const filtered = this.contacts.filter(contact => {
                const term = searchTerm.toLowerCase();
                return (
                    contact.name.toLowerCase().includes(term) ||
                    contact.email.toLowerCase().includes(term) ||
                    contact.phone.includes(term) ||
                    (contact.address && contact.address.toLowerCase().includes(term))
                );
            });
            this.renderContacts(filtered);
        }
    }

    renderContacts(contactsToRender = null) {
        const contactsList = document.getElementById('contacts-list');
        const contacts = contactsToRender || this.contacts;

        if (contacts.length === 0) {
            contactsList.innerHTML = `
                <div class="empty-state">
                    <h3>No contacts found</h3>
                    <p>Add your first contact using the form on the left</p>
                </div>
            `;
            return;
        }

        contactsList.innerHTML = contacts.map(contact => `
            <div class="contact-card">
                <div class="contact-header">
                    <div>
                        <div class="contact-name">${this.escapeHtml(contact.name)}</div>
                    </div>
                    <div class="contact-actions">
                        <button class="btn btn-danger" data-contact-id="${this.escapeHtmlAttribute(contact.id)}">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="contact-info">
                    <div class="contact-info-item">
                        <strong>Email:</strong> ${this.escapeHtml(contact.email)}
                    </div>
                    <div class="contact-info-item">
                        <strong>Phone:</strong> ${this.escapeHtml(contact.phone)}
                    </div>
                    ${contact.address ? `
                        <div class="contact-info-item">
                            <strong>Address:</strong> ${this.escapeHtml(contact.address)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Attach event listeners to delete buttons
        contactsList.querySelectorAll('.btn-danger').forEach(button => {
            button.addEventListener('click', (e) => {
                const contactId = e.target.getAttribute('data-contact-id');
                this.deleteContact(contactId);
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    escapeHtmlAttribute(text) {
        // Escape characters that are dangerous in HTML attributes
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

