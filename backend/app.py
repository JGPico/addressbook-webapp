"""
Flask REST API for Address Book Application
Provides endpoints for managing contacts
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Data file path
DATA_FILE = 'contacts.json'

def load_contacts():
    """Load contacts from JSON file"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []

def save_contacts(contacts):
    """Save contacts to JSON file"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(contacts, f, indent=2, ensure_ascii=False)

def generate_id():
    """Generate a unique ID for a contact"""
    return str(int(datetime.now().timestamp() * 1000))

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    """Get all contacts"""
    contacts = load_contacts()
    return jsonify(contacts), 200

@app.route('/api/contacts', methods=['POST'])
def create_contact():
    """Create a new contact"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name') or not data.get('email') or not data.get('phone'):
        return jsonify({'error': 'Missing required fields: name, email, phone'}), 400
    
    # Create contact object
    contact = {
        'id': generate_id(),
        'name': data.get('name'),
        'email': data.get('email'),
        'phone': data.get('phone'),
        'address': data.get('address', '')
    }
    
    # Load existing contacts and add new one
    contacts = load_contacts()
    contacts.append(contact)
    save_contacts(contacts)
    
    return jsonify(contact), 201

@app.route('/api/contacts/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """Delete a contact by ID"""
    contacts = load_contacts()
    
    # Find and remove the contact
    original_count = len(contacts)
    contacts = [c for c in contacts if c.get('id') != contact_id]
    
    if len(contacts) == original_count:
        return jsonify({'error': 'Contact not found'}), 404
    
    save_contacts(contacts)
    return jsonify({'message': 'Contact deleted successfully'}), 200

@app.route('/api/contacts/search', methods=['GET'])
def search_contacts():
    """Search contacts by query string"""
    query = request.args.get('q', '').lower()
    
    if not query:
        return jsonify([]), 200
    
    contacts = load_contacts()
    filtered = [
        contact for contact in contacts
        if (
            query in contact.get('name', '').lower() or
            query in contact.get('email', '').lower() or
            query in contact.get('phone', '') or
            query in contact.get('address', '').lower()
        )
    ]
    
    return jsonify(filtered), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    # Create data file if it doesn't exist
    if not os.path.exists(DATA_FILE):
        save_contacts([])
    
    app.run(debug=True, host='0.0.0.0', port=5000)
