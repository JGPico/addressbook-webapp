# Address Book Backend API

Flask REST API backend for the Address Book web application. Provides a RESTful interface for managing contacts with support for multiple email addresses per contact.

## Features

- RESTful API endpoints for contact management (CRUD operations)
- SQLite database with foreign key relationships
- Support for multiple emails per contact
- Search functionality across all contact fields and emails
- CORS enabled for frontend communication
- Input validation and error handling
- Health check endpoint

## API Endpoints

### GET /api/contacts
Get all contacts with their associated emails.

**Response:**
```json
[
  {
    "id": "1234567890",
    "name": "John Doe",
    "email": "john@example.com",
    "emails": ["john@example.com", "john.doe@work.com"],
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
  "emails": ["john@example.com", "john.doe@work.com"],
  "phone": "123-456-7890",
  "address": "123 Main St"
}
```

**Note:** 
- `name` is required
- `emails` is an array (optional, can be empty)
- If `emails` is not provided but `email` is, it will be used as the first email
- `phone` and `address` are optional

**Response:** Created contact object (201)

### PUT /api/contacts/<contact_id>
Update an existing contact.

**Request Body:** Same as POST

**Response:** Updated contact object (200) or error (404 if contact not found)

### DELETE /api/contacts/<contact_id>
Delete a contact by ID. All associated emails are automatically deleted via CASCADE.

**Response:** Success message (200) or error (404)

### GET /api/contacts/search?q=<query>
Search contacts by query string. Searches across:
- Contact name
- Primary email
- All emails in the contact_emails table
- Phone number
- Address

**Example:**
```
GET /api/contacts/search?q=john
```

**Response:** Array of matching contacts (200)

### GET /api/health
Health check endpoint for monitoring.

**Response:** 
```json
{
  "status": "healthy"
}
```

## Setup

### Development

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Flask application:**
   ```bash
   python app.py
   ```

   The API will be available at `http://localhost:5000`

### Production

For production deployment, use Gunicorn:

```bash
gunicorn app:app --bind 0.0.0.0:5000
```

See `DEPLOYMENT.md` in the root directory for platform-specific deployment instructions.

## Data Storage

Contacts are stored in a SQLite database (`addressbook.db`) in the backend directory. The database and tables are automatically created on first run via `init_db()`.

### Database Schema

**contacts table:**
```sql
CREATE TABLE contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',           -- Primary email (for backward compatibility)
    phone TEXT DEFAULT '',
    address TEXT DEFAULT ''
)
```

**contact_emails table:**
```sql
CREATE TABLE contact_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id TEXT NOT NULL,
    email TEXT NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
)
```

**Indexes:**
- Index on `contact_emails.contact_id` for faster lookups

### Database Management

**Reset the database:**
```bash
python reset_db.py
```

**Note:** Make sure the Flask server is stopped before running `reset_db.py` to avoid database lock errors.

## Data Model

### Contact Object

```json
{
  "id": "string",           // Unique identifier (timestamp-based)
  "name": "string",         // Full name (required)
  "email": "string",        // Primary email (first in emails array, or empty)
  "emails": ["string"],     // Array of all email addresses (can be empty)
  "phone": "string",        // Phone number (optional)
  "address": "string"       // Address (optional)
}
```

### Backward Compatibility

The API maintains backward compatibility:
- Returns both `email` (primary) and `emails` (array) fields
- Accepts either `email` or `emails` in POST/PUT requests
- If only `email` is provided, it's converted to an `emails` array

## Dependencies

- **Flask 3.0.0** - Web framework
- **flask-cors 4.0.0** - CORS support
- **gunicorn 21.2.0** - Production WSGI server

## CORS Configuration

CORS is currently enabled for all origins (`CORS(app)`). For production, you should restrict this to specific origins:

```python
CORS(app, origins=["https://your-frontend-domain.com"])
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include a JSON object with an `error` field:
```json
{
  "error": "Missing required field: name"
}
```

## Development Notes

- The database uses foreign key constraints with `ON DELETE CASCADE` for automatic email cleanup
- Foreign keys are enabled via `PRAGMA foreign_keys = ON` on each connection
- Contact IDs are generated using timestamp-based unique identifiers
- The `contact_to_dict()` function fetches associated emails from the `contact_emails` table
