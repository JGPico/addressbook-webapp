/**
 * Contact list management
 * Handles rendering and selection of contacts
 */

class ContactListManager {
    constructor(apiService, onContactSelect) {
        this.apiService = apiService;
        this.onContactSelect = onContactSelect;
        this.contacts = [];
        this.selectedContactId = null;
    }

    /**
     * Set the contacts array
     * @param {Array} contacts - Array of contact objects
     */
    setContacts(contacts) {
        this.contacts = contacts;
    }

    /**
     * Set the selected contact ID
     * @param {string} contactId - Contact ID to select
     */
    setSelectedContact(contactId) {
        this.selectedContactId = contactId;
    }

    /**
     * Render the contacts list
     * @param {Array|null} contactsToRender - Optional filtered contacts array
     */
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
                <div class="contact-item ${isSelected}" data-contact-id="${escapeHtmlAttribute(contact.id)}">
                    ${escapeHtml(name)}
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

    /**
     * Select a contact by ID
     * @param {string} contactId - Contact ID to select
     */
    selectContact(contactId) {
        this.selectedContactId = contactId;
        const contact = this.contacts.find(c => c.id === contactId);
        this.renderContacts();
        if (this.onContactSelect) {
            this.onContactSelect(contact);
        }
    }

    /**
     * Get the selected contact ID
     * @returns {string|null} Selected contact ID
     */
    getSelectedContactId() {
        return this.selectedContactId;
    }

    /**
     * Get a contact by ID
     * @param {string} contactId - Contact ID
     * @returns {Object|undefined} Contact object
     */
    getContactById(contactId) {
        return this.contacts.find(c => c.id === contactId);
    }

    /**
     * Clear the selection
     */
    clearSelection() {
        this.selectedContactId = null;
        this.renderContacts();
    }
}
