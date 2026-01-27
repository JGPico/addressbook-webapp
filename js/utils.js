/**
 * Utility functions for the Address Book application
 */

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Escape HTML attributes to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML attribute value
 */
function escapeHtmlAttribute(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Parse a full name into first and last name
 * @param {string} name - Full name
 * @returns {Object} Object with firstName and lastName
 */
function parseName(name) {
    if (!name) return { firstName: '', lastName: '' };
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    const lastName = parts.pop();
    const firstName = parts.join(' ');
    return { firstName, lastName };
}

/**
 * Format first and last name into full name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Full name
 */
function formatName(firstName, lastName) {
    return `${firstName} ${lastName}`.trim();
}

/** Email pattern matching input[type=email] pattern attribute (RFC-style) */
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Check if a string is a valid email address
 * @param {string} email - Email string to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    return EMAIL_PATTERN.test(email.trim());
}
