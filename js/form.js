/**
 * Contact form management
 * Handles form rendering and data collection
 */

class ContactFormManager {
    constructor(emailManager) {
        this.emailManager = emailManager;
    }

    /**
     * Render the contact form with contact data
     * @param {Object|null} contact - Contact object or null for new contact
     */
    renderContactForm(contact) {
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const deleteBtn = document.getElementById('delete-btn');

        if (contact) {
            const { firstName, lastName } = parseName(contact.name);
            firstNameInput.value = firstName;
            lastNameInput.value = lastName;

            // Set saved emails from emails array or fallback to email field
            const emails = contact.emails && contact.emails.length > 0
                ? contact.emails
                : (contact.email ? [contact.email] : []);
            this.emailManager.setSavedEmails(emails);
            this.emailManager.renderSavedEmails();
            this.emailManager.resetEmailForm();

            deleteBtn.style.display = 'inline-block';
        } else {
            firstNameInput.value = '';
            lastNameInput.value = '';
            this.emailManager.setSavedEmails([]);
            this.emailManager.renderSavedEmails();
            this.emailManager.resetEmailForm();
            deleteBtn.style.display = 'none';
        }
    }

    /**
     * Collect form data
     * @returns {Object} Form data object
     */
    collectFormData() {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const emailInputs = document.querySelectorAll('.email-input');
        const inputEmail = Array.from(emailInputs)
            .map(input => input.value.trim())
            .filter(email => email.length > 0)[0];

        // Combine saved emails with any email in the input field
        const allEmails = [...this.emailManager.getSavedEmails()];
        if (inputEmail && !allEmails.includes(inputEmail)) {
            allEmails.push(inputEmail);
        }

        return {
            firstName,
            lastName,
            emails: allEmails
        };
    }

    /**
     * Validate form data
     * @param {Object} formData - Form data object
     * @returns {Object} Validation result with isValid and error message
     */
    validateFormData(formData) {
        if (!formData.firstName || !formData.lastName) {
            return {
                isValid: false,
                error: 'First name and last name are required'
            };
        }

        if (formData.emails && formData.emails.length > 0) {
            for (const email of formData.emails) {
                if (!isValidEmail(email)) {
                    return {
                        isValid: false,
                        error: 'All emails must be valid (e.g. name@example.com).'
                    };
                }
            }
        }

        return { isValid: true };
    }

    /**
     * Prepare contact data for API
     * @param {Object} formData - Form data object
     * @returns {Object} Contact data object for API
     */
    prepareContactData(formData) {
        const name = formatName(formData.firstName, formData.lastName);
        // Use first email if available, otherwise empty string
        const primaryEmail = formData.emails.length > 0 ? formData.emails[0] : '';
        return {
            name: name,
            email: primaryEmail, // Primary email for backward compatibility (empty if no emails)
            emails: formData.emails,   // Array of all emails (can be empty)
            phone: '', // Keep for backward compatibility
            address: '' // Keep for backward compatibility
        };
    }
}
