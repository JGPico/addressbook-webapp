# Address Book Web Application

A modern, full-stack address book application built with vanilla JavaScript, Flask, and SQLite. Features a clean, responsive UI with component-based architecture.

## Features

- **Contact Management**
  - Add, edit, and delete contacts
  - Separate first name and last name fields
  - Multiple email addresses per contact
  - Optional phone and address fields

- **User Interface**
  - Clean, modern design with CSS Grid and Flexbox
  - Responsive layout that works on desktop and mobile
  - Font Awesome icons for better UX
  - Real-time contact list updates

- **Data Persistence**
  - SQLite database backend
  - RESTful API for all operations
  - Automatic database initialization

- **Security**
  - XSS protection with HTML escaping
  - Input validation and sanitization
  - CORS-enabled API

## Project Structure

```
addressbook-webapp/
├── index.html              # Main HTML structure
├── css/                    # Component-based CSS files
│   ├── base.css           # Global styles and CSS variables
│   ├── contacts-list.css  # Contact list styling
│   ├── contact-form.css   # Form layout and styling
│   ├── email.css          # Email management UI
│   └── buttons.css        # Button styles
├── js/                     # Component-based JavaScript
│   ├── utils.js           # Utility functions (HTML escaping, name parsing)
│   ├── api.js             # API service for backend communication
│   ├── contacts.js        # Contact list management
│   ├── email.js           # Email list and input management
│   ├── form.js            # Form rendering and validation
│   └── app.js             # Main application orchestrator
├── backend/                # Flask backend API
│   ├── app.py             # Flask application and routes
│   ├── requirements.txt   # Python dependencies
│   ├── reset_db.py        # Database reset utility
│   ├── addressbook.db     # SQLite database (created on first run)
│   └── README.md          # Backend documentation
├── DEPLOYMENT.md          # Deployment guide
└── README.md              # This file
```

## Getting Started

### Prerequisites

- Python 3.11+ (for backend)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Local Development

1. **Start the Backend Server:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```
   The API will be available at `http://localhost:5000`

2. **Open the Frontend:**
   - Open `index.html` in your web browser
   - Or use a local web server:
     ```bash
     # Using Python's built-in server
     python -m http.server 8000
     # Then navigate to http://localhost:8000
     ```

3. **Start Adding Contacts:**
   - Click the "+" button to add a new contact
   - Fill in first name and last name (required)
   - Add one or more email addresses (optional)
   - Click "Save" to store the contact

## Technologies

### Frontend
- **Vanilla JavaScript (ES6+)** - No frameworks, pure JavaScript
- **HTML5** - Semantic markup
- **CSS3** - Modern CSS with Grid, Flexbox, and CSS variables
- **Font Awesome** - Icon library

### Backend
- **Flask** - Python web framework
- **SQLite** - Lightweight database
- **Flask-CORS** - Cross-origin resource sharing

## Architecture

The application follows a component-based architecture:

- **API Service** (`api.js`) - Handles all HTTP requests to the backend
- **Contact List Manager** (`contacts.js`) - Manages contact list rendering and selection
- **Email Manager** (`email.js`) - Handles saved emails display and input form
- **Form Manager** (`form.js`) - Manages form rendering, validation, and data collection
- **Main App** (`app.js`) - Orchestrates all components and handles user interactions

CSS is similarly organized by component for better maintainability.

## Configuration

### API Base URL

By default, the frontend connects to `http://localhost:5000/api`. To change this for production:

1. Edit `index.html` and uncomment/modify the script tag:
   ```html
   <script>
       window.API_BASE_URL = 'https://your-backend-url.com/api';
   </script>
   ```

2. Or set it programmatically before the app initializes.

## Database

The application uses SQLite with the following schema:

- **contacts** table: Stores contact information (id, name, email, phone, address)
- **contact_emails** table: Stores multiple emails per contact with foreign key relationships

See `backend/README.md` for detailed API documentation and database schema.

## License

See LICENSE file for details.
