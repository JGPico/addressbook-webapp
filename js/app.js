// Contact Management Application
class AddressBook {
    constructor() {
        this.contacts = this.loadContacts();
        this.init();
    }

    init() {
        this.renderContacts();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('contact-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addContact();
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            this.filterContacts(e.target.value);
        });
    }

    addContact() {
        const form = document.getElementById('contact-form');
        const formData = new FormData(form);
        
        const contact = {
            id: Date.now().toString(),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            address: formData.get('address')
        };

        this.contacts.push(contact);
        this.saveContacts();
        this.renderContacts();
        form.reset();
    }

    deleteContact(id) {
        this.contacts = this.contacts.filter(contact => contact.id !== id);
        this.saveContacts();
        this.renderContacts();
    }

    filterContacts(searchTerm) {
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

    saveContacts() {
        localStorage.setItem('addressBookContacts', JSON.stringify(this.contacts));
    }

    loadContacts() {
        const stored = localStorage.getItem('addressBookContacts');
        return stored ? JSON.parse(stored) : [];
    }
}

// Initialize the application
const addressBook = new AddressBook();

