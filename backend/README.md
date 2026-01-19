# Address Book Backend API

Flask REST API backend for the Address Book web application.

## Features

- RESTful API endpoints for contact management
- JSON-based data storage
- CORS enabled for frontend communication
- Search functionality

## API Endpoints

### GET /api/contacts
Get all contacts.

**Response:**
```json
[
  {
    "id": "1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "address": "123 Main St"
  }
]
```

### POST /api/contacts
Create a new contact.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "123-456-7890",
  "address": "123 Main St"
}
```

**Response:** Created contact object (201)

### DELETE /api/contacts/<contact_id>
Delete a contact by ID.

**Response:** Success message (200) or error (404)

### GET /api/contacts/search?q=<query>
Search contacts by query string. Searches across name, email, phone, and address fields.

**Response:** Array of matching contacts (200)

### GET /api/health
Health check endpoint.

**Response:** `{"status": "healthy"}` (200)

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask application:
```bash
python app.py
```

The API will be available at `http://localhost:5000`

## Data Storage

Contacts are stored in `contacts.json` in the backend directory. The file is automatically created on first run.

## CORS

CORS is enabled to allow the frontend to communicate with the API. In production, you may want to restrict CORS to specific origins.
