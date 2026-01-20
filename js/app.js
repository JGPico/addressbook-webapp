/**
 * Main Address Book Application
 * Coordinates all components
 */

class AddressBook {
    constructor() {
        this.apiService = new ApiService('http://localhost:5000/api');
        this.emailManager = new EmailManager();
        this.formManager = new ContactFormManager(this.emailManager);
        this.contactListManager = new ContactListManager(
            this.apiService,
            (contact) => this.handleContactSelect(contact)
        );
        this.init();
    }

    async init() {
        await this.loadContacts();
        this.contactListManager.renderContacts();
        this.formManager.renderContactForm(null);
        this.emailManager.initEmailList();
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
                const emailList = document.getElementById('email-list');
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
        this.formManager.renderContactForm(contact);
    }

    newContact() {
        this.contactListManager.clearSelection();
        this.formManager.renderContactForm(null);
    }

    cancelEdit() {
        // Clear everything in one action
        // Set selected contact ID to null first (without re-rendering)
        this.contactListManager.setSelectedContact(null);
        // Clear the form and emails (this also calls resetEmailForm internally)
        this.formManager.renderContactForm(null);
        // Update the contacts list display to remove selection highlight
        this.contactListManager.renderContacts();
    }

    async loadContacts() {
        try {
            const contacts = await this.apiService.loadContacts();
            this.contactListManager.setContacts(contacts);
        } catch (error) {
            alert(`Error loading contacts: ${error.message}. Make sure the backend server is running.`);
            this.contactListManager.setContacts([]);
        }
    }

    async saveContact() {
        const formData = this.formManager.collectFormData();
        const validation = this.formManager.validateFormData(formData);

        if (!validation.isValid) {
            alert(validation.error);
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

            // Update saved emails for the contact
            this.emailManager.setSavedEmails(formData.emails);

            // Reload contacts
            await this.loadContacts();
            this.contactListManager.selectContact(contact.id);
            this.contactListManager.renderContacts();
        } catch (error) {
            alert(`Error saving contact: ${error.message}`);
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
            alert(`Error deleting contact: ${error.message}`);
            console.error('Error deleting contact:', error);
        }
    }
}

// Initialize the application
const addressBook = new AddressBook();
