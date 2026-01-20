/**
 * API service for Address Book application
 * Handles all HTTP requests to the backend
 */

class ApiService {
    constructor(baseUrl = 'http://localhost:5000/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Load all contacts from the API
     * @returns {Promise<Array>} Array of contacts
     */
    async loadContacts() {
        try {
            const response = await fetch(`${this.baseUrl}/contacts`);

            if (!response.ok) {
                throw new Error('Failed to load contacts');
            }

            return await response.json();
        } catch (error) {
            console.error('Error loading contacts:', error);
            throw error;
        }
    }

    /**
     * Create a new contact
     * @param {Object} contactData - Contact data object
     * @returns {Promise<Object>} Created contact
     */
    async createContact(contactData) {
        try {
            const response = await fetch(`${this.baseUrl}/contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create contact');
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating contact:', error);
            throw error;
        }
    }

    /**
     * Update an existing contact
     * @param {string} contactId - Contact ID
     * @param {Object} contactData - Contact data object
     * @returns {Promise<Object>} Updated contact
     */
    async updateContact(contactId, contactData) {
        try {
            const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to update contact');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating contact:', error);
            throw error;
        }
    }

    /**
     * Delete a contact
     * @param {string} contactId - Contact ID
     * @returns {Promise<void>}
     */
    async deleteContact(contactId) {
        try {
            const response = await fetch(`${this.baseUrl}/contacts/${contactId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to delete contact');
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            throw error;
        }
    }
}
