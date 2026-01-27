"""
Flask REST API for Address Book Application
Provides endpoints for managing contacts and JWT authentication
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
import sqlite3
import os
import json
from datetime import datetime, timedelta
import jwt

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Database file path
DB_FILE = 'addressbook.db'
JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRY_HOURS = 24

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # This enables column access by name
    # Enable foreign key constraints
    conn.execute('PRAGMA foreign_keys = ON')
    return conn

def init_db():
    """Initialize the database with contacts, emails, and users tables"""
    conn = get_db_connection()

    # Create users table for JWT auth
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    # Seed default user if none exist (username: admin, password: admin)
    default_user = conn.execute('SELECT id FROM users WHERE username = ?', ('admin',)).fetchone()
    if not default_user:
        conn.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            ('admin', generate_password_hash('admin', method='pbkdf2:sha256'))
        )

    # Create contacts table
    conn.execute('''
        CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT DEFAULT '',
            phone TEXT DEFAULT '',
            address TEXT DEFAULT ''
        )
    ''')

    # Create emails table for multiple emails per contact
    conn.execute('''
        CREATE TABLE IF NOT EXISTS contact_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id TEXT NOT NULL,
            email TEXT NOT NULL,
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
        )
    ''')

    # Create index for faster lookups
    conn.execute('''
        CREATE INDEX IF NOT EXISTS idx_contact_emails_contact_id
        ON contact_emails(contact_id)
    ''')

    conn.commit()
    conn.close()

def generate_id():
    """Generate a unique ID for a contact"""
    return str(int(datetime.now().timestamp() * 1000))

def get_contact_emails(conn, contact_id):
    """Get all emails for a contact"""
    rows = conn.execute(
        'SELECT email FROM contact_emails WHERE contact_id = ? ORDER BY id',
        (contact_id,)
    ).fetchall()
    return [row['email'] for row in rows]

def contact_to_dict(row, conn=None):
    """Convert database row to dictionary with emails"""
    contact_id = row['id']
    emails = []

    # If connection provided, fetch emails
    if conn:
        emails = get_contact_emails(conn, contact_id)

    # If no emails found but email field exists, use it as primary email
    # Access row columns directly (sqlite3.Row supports bracket notation)
    row_email = row['email'] if row['email'] else ''
    if not emails and row_email:
        emails = [row_email]

    return {
        'id': contact_id,
        'name': row['name'],
        'email': emails[0] if emails else row_email,
        'emails': emails,
        'phone': row['phone'] if row['phone'] else '',
        'address': row['address'] if row['address'] else ''
    }


def require_jwt(f):
    """Decorator that requires a valid JWT in Authorization: Bearer <token>."""
    from functools import wraps
    @wraps(f)
    def wrapped(*args, **kwargs):
        auth = request.headers.get('Authorization')
        if not auth or not auth.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        token = auth[7:].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            request.current_user = payload.get('sub')
            return f(*args, **kwargs)
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid or expired token'}), 401
    return wrapped


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate username/password and return a JWT."""
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    password = data.get('password') or ''
    if not username:
        return jsonify({'error': 'Please enter a username.'}), 400
    if not password:
        return jsonify({'error': 'Please enter a password.'}), 400
    conn = get_db_connection()
    row = conn.execute('SELECT id, password_hash FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Username not found.'}), 401
    if not check_password_hash(row['password_hash'], password):
        return jsonify({'error': 'Incorrect password.'}), 401
    expiry = datetime.utcnow() + timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {'sub': username, 'exp': expiry, 'iat': datetime.utcnow()}
    raw = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    token = raw.decode('utf-8') if isinstance(raw, bytes) else raw
    return jsonify({'token': token, 'username': username})


@app.route('/api/contacts', methods=['GET'])
@require_jwt
def get_contacts():
    """Get all contacts with their emails"""
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM contacts ORDER BY name').fetchall()
    contacts = [contact_to_dict(row, conn) for row in rows]
    conn.close()
    return jsonify(contacts), 200

@app.route('/api/contacts', methods=['POST'])
@require_jwt
def create_contact():
    """Create a new contact with emails array"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name'):
        return jsonify({'error': 'Missing required field: name'}), 400
    
    # Get emails array (optional)
    emails = data.get('emails', [])
    
    # Support backward compatibility: if emails not provided, check for single email field
    if not emails and data.get('email'):
        emails = [data.get('email')]
    
    # Email is optional - no validation needed
    
    contact_id = generate_id()
    name = data.get('name')
    primary_email = emails[0] if emails else ''  # Store first email or empty string
    phone = data.get('phone', '')
    address = data.get('address', '')
    
    try:
        conn = get_db_connection()
        
        # Insert contact (keep email column for backward compatibility with existing data)
        conn.execute(
            'INSERT INTO contacts (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            (contact_id, name, primary_email, phone, address)
        )
        
        # Insert all emails into contact_emails table
        for email in emails:
            conn.execute(
                'INSERT INTO contact_emails (contact_id, email) VALUES (?, ?)',
                (contact_id, email)
            )
        
        conn.commit()
        contact = contact_to_dict(conn.execute('SELECT * FROM contacts WHERE id = ?', (contact_id,)).fetchone(), conn)
        conn.close()
        
        return jsonify(contact), 201
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': f'Database integrity error: {str(e)}'}), 400
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': f'Error creating contact: {str(e)}'}), 500

@app.route('/api/contacts/<contact_id>', methods=['PUT'])
@require_jwt
def update_contact(contact_id):
    """Update an existing contact with emails array"""
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('name'):
        return jsonify({'error': 'Missing required field: name'}), 400
    
    # Get emails array (optional)
    emails = data.get('emails', [])
    
    # Support backward compatibility: if emails not provided, check for single email field
    if not emails and data.get('email'):
        emails = [data.get('email')]
    
    # Email is optional - no validation needed
    
    name = data.get('name')
    primary_email = emails[0] if emails else ''  # Store first email or empty string
    phone = data.get('phone', '')
    address = data.get('address', '')
    
    try:
        conn = get_db_connection()
        
        # Check if contact exists
        existing = conn.execute('SELECT id FROM contacts WHERE id = ?', (contact_id,)).fetchone()
        if not existing:
            conn.close()
            return jsonify({'error': 'Contact not found'}), 404
        
        # Update contact (keep email column for backward compatibility)
        conn.execute(
            'UPDATE contacts SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
            (name, primary_email, phone, address, contact_id)
        )
        
        # Delete existing emails and insert new ones
        conn.execute('DELETE FROM contact_emails WHERE contact_id = ?', (contact_id,))
        for email in emails:
            conn.execute(
                'INSERT INTO contact_emails (contact_id, email) VALUES (?, ?)',
                (contact_id, email)
            )
        
        conn.commit()
        contact = contact_to_dict(conn.execute('SELECT * FROM contacts WHERE id = ?', (contact_id,)).fetchone(), conn)
        conn.close()
        
        return jsonify(contact), 200
    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': f'Database integrity error: {str(e)}'}), 400
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': f'Error updating contact: {str(e)}'}), 500

@app.route('/api/contacts/<contact_id>', methods=['DELETE'])
@require_jwt
def delete_contact(contact_id):
    """Delete a contact by ID (emails will be cascade deleted)"""
    conn = get_db_connection()
    
    # Check if contact exists
    existing = conn.execute('SELECT id FROM contacts WHERE id = ?', (contact_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'error': 'Contact not found'}), 404
    
    # Delete contact (emails will be cascade deleted due to FOREIGN KEY constraint)
    conn.execute('DELETE FROM contacts WHERE id = ?', (contact_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Contact deleted successfully'}), 200

@app.route('/api/contacts/search', methods=['GET'])
@require_jwt
def search_contacts():
    """Search contacts by query string (including emails)"""
    query = request.args.get('q', '').strip()
    
    if not query:
        return jsonify([]), 200
    
    # Use SQL LIKE for case-insensitive search
    search_pattern = f'%{query}%'
    conn = get_db_connection()
    
    # Search in contacts and also match contacts that have emails matching the query
    rows = conn.execute('''
        SELECT DISTINCT c.* FROM contacts c
        LEFT JOIN contact_emails ce ON c.id = ce.contact_id
        WHERE LOWER(c.name) LIKE LOWER(?) 
           OR LOWER(c.email) LIKE LOWER(?) 
           OR c.phone LIKE ? 
           OR LOWER(c.address) LIKE LOWER(?)
           OR LOWER(ce.email) LIKE LOWER(?)
        ORDER BY c.name
    ''', (search_pattern, search_pattern, search_pattern, search_pattern, search_pattern)).fetchall()
    
    contacts = [contact_to_dict(row, conn) for row in rows]
    conn.close()
    return jsonify(contacts), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'}), 200

@app.route('/api/', methods=['GET'])
def root():
    """Root endpoint"""
    return jsonify({'message': 'Address Book API is running'}), 200

# Initialize database when module is imported (works for both direct execution and gunicorn)
# This ensures the database is initialized regardless of how the app is run
init_db()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
