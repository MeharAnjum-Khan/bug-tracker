# Bug Tracker - Backend

This is the backend API for the Bug Tracker application. It handles user authentication, project management, ticket tracking, and real-time updates.

## 🛠️ Tech Stack
- **Node.js & Express.js**: High-performance RESTful API.
- **MongoDB & Mongoose**: Scalable NoSQL database with structured schemas.
- **JWT & bcryptjs**: Secure authentication and password hashing.
- **Socket.io**: Real-time events and data synchronization.
- **Helmet**: Essential security headers.
- **Multer**: Handling file uploads.

## ⚙️ Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in this directory and add the following (see `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

3. **Run the server:**
   ```bash
   npm run dev
   ```

## 📂 Structure
- `controllers/`: Business logic.
- `models/`: Database schemas.
- `routes/`: API endpoints.
- `middleware/`: Authentication and security.
- `uploads/`: Local storage for attachments.
