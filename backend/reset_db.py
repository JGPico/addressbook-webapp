"""
Script to reset the database
Deletes the existing database file and recreates it with fresh tables

Usage:
    python reset_db.py

Note: Make sure the Flask server is stopped before running this script.
"""

import os
import sqlite3
import sys

DB_FILE = 'addressbook.db'

def reset_database():
    """Delete existing database and recreate it"""
    # Check if database is locked
    if os.path.exists(DB_FILE):
        try:
            # Try to open and close the database to check if it's locked
            test_conn = sqlite3.connect(DB_FILE)
            test_conn.close()
        except sqlite3.OperationalError:
            print("ERROR: Database is locked. Please stop the Flask server first.")
            print("Then run this script again.")
            sys.exit(1)
        
        # Delete existing database file
        try:
            os.remove(DB_FILE)
            print(f"✓ Deleted existing database: {DB_FILE}")
        except PermissionError:
            print("ERROR: Cannot delete database file. It may be in use.")
            print("Please stop the Flask server and try again.")
            sys.exit(1)
    
    # Create new database with tables
    conn = sqlite3.connect(DB_FILE)
    
    # Enable foreign keys
    conn.execute('PRAGMA foreign_keys = ON')
    
    # Create contacts table
    conn.execute('''
        CREATE TABLE contacts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT DEFAULT ''
        )
    ''')
    
    # Create emails table for multiple emails per contact
    conn.execute('''
        CREATE TABLE contact_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id TEXT NOT NULL,
            email TEXT NOT NULL,
            FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
        )
    ''')
    
    # Create index for faster lookups
    conn.execute('''
        CREATE INDEX idx_contact_emails_contact_id 
        ON contact_emails(contact_id)
    ''')
    
    conn.commit()
    conn.close()
    
    print(f"✓ Created new database: {DB_FILE}")
    print("✓ Database reset complete!")
    print("\nYou can now start the Flask server with: python app.py")

if __name__ == '__main__':
    reset_database()
