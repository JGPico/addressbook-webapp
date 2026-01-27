/**
 * API service for Address Book application
 * Handles all HTTP requests to the backend and JWT auth
 */

const AUTH_STORAGE_KEY = 'addressbook_jwt';
const AUTH_USERNAME_KEY = 'addressbook_username';

class ApiService {
    constructor(baseUrl = null) {
        this.baseUrl = baseUrl || (window.API_BASE_URL || 'http://localhost:5000/api');
    }

    _getAuthHeaders() {
        try {
            const token = (typeof localStorage !== 'undefined') ? localStorage.getItem(AUTH_STORAGE_KEY) : null;
            return token ? { 'Authorization': 'Bearer ' + token } : {};
        } catch (_) {
            return {};
        }
    }

    _request(url, options = {}) {
        const headers = { ...this._getAuthHeaders(), ...(options.headers || {}) };
        return fetch(url, { ...options, headers });
    }

    setToken(token, username = null) {
        try {
            if (token) {
                localStorage.setItem(AUTH_STORAGE_KEY, token);
                if (username != null) localStorage.setItem(AUTH_USERNAME_KEY, username);
            } else {
                localStorage.removeItem(AUTH_STORAGE_KEY);
                localStorage.removeItem(AUTH_USERNAME_KEY);
            }
        } catch (_) {}
    }

    getUsername() {
        try {
            const stored = localStorage.getItem(AUTH_USERNAME_KEY);
            if (stored) return stored;
            const token = localStorage.getItem(AUTH_STORAGE_KEY);
            if (!token) return null;
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            b64 += '='.repeat((4 - (b64.length % 4)) % 4);
            const payload = JSON.parse(atob(b64));
            return payload.sub || null;
        } catch (_) {
            return null;
        }
    }

    hasToken() {
        try {
            return !!localStorage.getItem(AUTH_STORAGE_KEY);
        } catch (_) {
            return false;
        }
    }

    /**
     * Log in with username and password; returns { token } on success.
     * Stores token in localStorage on success.
     * @returns {Promise<{ token: string }>}
     */
    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        if (data.token) {
            this.setToken(data.token, data.username || undefined);
        }
        return data;
    }

    /**
     * Load all contacts from the API
     * @returns {Promise<Array>} Array of contacts
     */
    async loadContacts() {
        try {
            const response = await this._request(`${this.baseUrl}/contacts`);

            if (response.status === 401) {
                this.setToken(null);
                const e = new Error('Unauthorized');
                e.status = 401;
                throw e;
            }
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
            const response = await this._request(`${this.baseUrl}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            if (response.status === 401) {
                this.setToken(null);
                const e = new Error('Unauthorized');
                e.status = 401;
                throw e;
            }
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
            const response = await this._request(`${this.baseUrl}/contacts/${contactId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            if (response.status === 401) {
                this.setToken(null);
                const e = new Error('Unauthorized');
                e.status = 401;
                throw e;
            }
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
            const response = await this._request(`${this.baseUrl}/contacts/${contactId}`, { method: 'DELETE' });
            if (response.status === 401) {
                this.setToken(null);
                const e = new Error('Unauthorized');
                e.status = 401;
                throw e;
            }
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
