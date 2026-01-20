"""
Flask REST API for Address Book Application
Provides endpoints for managing contacts
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Database file path
DB_FILE = 'addressbook.db'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    return conn

def init_db():
    """Initialize the database with contacts table"""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT DEFAULT ''
        )
    ''')
    conn.commit()
    conn.close()

def generate_id():
    """Generate a unique ID for a contact"""
    return str(int(datetime.now().timestamp() * 1000))

def contact_to_dict(row):
    """Convert database row to dictionary"""
    return {
        'id': row['id'],
        'name': row['name'],
        'email': row['email'],
        'phone': row['phone'],
        'address': row['address'] or ''
    }

@app.route('/api/contacts', methods=['GET'])
def get_contacts():
    """Get all contacts"""
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM contacts ORDER BY name').fetchall()
    conn.close()
    
    contacts = [contact_to_dict(row) for row in rows]
    return jsonify(contacts), 200

@app.route('/api/contacts', methods=['POST'])
def create_contact():
    """Create a new contact"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Missing required fields: name, email'}), 400
    
    contact_id = generate_id()
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '')
    address = data.get('address', '')
    
    try:
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO contacts (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            (contact_id, name, email, phone, address)
        )
        conn.commit()
        conn.close()
        
        contact = {
            'id': contact_id,
            'name': name,
            'email': email,
            'phone': phone,
            'address': address
        }
        
        return jsonify(contact), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Contact ID already exists'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts/<contact_id>', methods=['PUT'])
def update_contact(contact_id):
    """Update an existing contact"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name') or not data.get('email'):
        return jsonify({'error': 'Missing required fields: name, email'}), 400
    
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone', '')
    address = data.get('address', '')
    
    try:
        conn = get_db_connection()
        cursor = conn.execute(
            'UPDATE contacts SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            (name, email, phone, address, contact_id)
        )
        updated_count = cursor.rowcount
        conn.commit()
        conn.close()
        
        if updated_count == 0:
            return jsonify({'error': 'Contact not found'}), 404
        
        contact = {
            'id': contact_id,
            'name': name,
            'email': email,
            'phone': phone,
            'address': address
        }
        
        return jsonify(contact), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/contacts/<contact_id>', methods=['DELETE'])
def delete_contact(contact_id):
    """Delete a contact by ID"""
    conn = get_db_connection()
    cursor = conn.execute('DELETE FROM contacts WHERE id = ?', (contact_id,))
    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()
    
    if deleted_count == 0:
        return jsonify({'error': 'Contact not found'}), 404
    
    return jsonify({'message': 'Contact deleted successfully'}), 200

@app.route('/api/contacts/search', methods=['GET'])
def search_contacts():
    """Search contacts by query string"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify([]), 200
    
    # Use SQL LIKE for case-insensitive search
    search_pattern = f'%{query}%'
    conn = get_db_connection()
    rows = conn.execute('''
        SELECT * FROM contacts 
        WHERE LOWER(name) LIKE LOWER(?) 
           OR LOWER(email) LIKE LOWER(?) 
           OR phone LIKE ? 
           OR LOWER(address) LIKE LOWER(?)
        ORDER BY name
    ''', (search_pattern, search_pattern, search_pattern, search_pattern)).fetchall()
    conn.close()
    
    contacts = [contact_to_dict(row) for row in rows]
    return jsonify(contacts), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    # Initialize database on startup
    init_db()
    
    app.run(debug=True, host='0.0.0.0', port=5000)
