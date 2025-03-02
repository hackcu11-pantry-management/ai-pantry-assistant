# PantryPal

## Overview

AI Pantry Assistant is a smart kitchen management system that helps you track your pantry inventory, monitor expiration dates, and generate recipe suggestions based on what you have on hand. The application uses barcode scanning, AI-powered recipe generation, and expiration date tracking to reduce food waste and simplify meal planning.

## Features

### 🔍 Product Scanning & Management
- Scan product barcodes (UPC) to automatically add items to your pantry
- Lookup product information from online databases
- Manually add products with custom details
- Track quantity and expiration dates

### 📅 Expiration Date Tracking
- Visual calendar interface showing when items will expire
- Color-coded expiration warnings (expired, expiring soon, expiring this week)
- Reduce food waste by staying aware of expiration dates

### 🍳 AI Recipe Generation
- Get recipe suggestions based on your current pantry inventory
- Prioritizes recipes using ingredients that will expire soon
- "Cook" recipes to automatically update your pantry inventory

### 👤 User Authentication
- Secure signup and login system
- JWT-based authentication
- Personal pantry management

## Technology Stack

### Frontend
- React 19
- Redux for state management
- React Router for navigation
- Material UI components
- FullCalendar for expiration date visualization
- Framer Motion for animations

### Backend
- Flask (Python)
- PostgreSQL database
- OpenAI API for recipe generation
- Go-UPC API for product lookups
- JWT for authentication
- bcrypt for password hashing

## Installation

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   GOUPC_API_KEY=your_goupc_api_key
   JWT_SECRET=your_jwt_secret
   DB_HOST=localhost
   DB_NAME=pantry_db
   DB_USER=postgres
   DB_PASSWORD=your_db_password
   ```

5. Set up the database:
   ```
   psql -U postgres -f create.sql
   ```

6. Start the backend server:
   ```
   python app.py
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Create an account or log in
2. Add products to your pantry by scanning barcodes or manual entry
3. View your pantry inventory and expiration dates on the calendar
4. Generate recipe suggestions based on your pantry items
5. "Cook" recipes to automatically update your inventory

## API Endpoints

### Authentication
- `POST /api/signup` - Create a new user account
- `POST /api/login` - Log in to an existing account

### Product Management
- `GET /api/lookup-upc` - Look up product information by UPC
- `POST /api/products` - Add a new product to the database
- `GET /api/products/<product_upc>` - Get product details by UPC

### Pantry Management
- `POST /api/pantry` - Add a product to user's pantry
- `GET /api/pantry` - Get user's pantry inventory
- `PUT /api/pantry/<pantry_id>` - Update a pantry item
- `DELETE /api/pantry/<pantry_id>` - Remove an item from pantry

### Recipe Generation
- `POST /api/get-recipes` - Generate recipe suggestions
- `POST /api/cook-recipe` - Update pantry after cooking a recipe

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for recipe generation capabilities
- Go-UPC for product database access
- All contributors who have helped build this project
