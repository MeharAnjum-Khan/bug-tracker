# Bug Tracker - Backend

This is the backend API for the Bug Tracker application. It handles user authentication, project management, ticket tracking, and real-time updates.

## 🛠️ Tech Stack
- **Node.js & Express.js**: High-performance RESTful API.
- **MongoDB & Mongoose**: Scalable NoSQL database with **TTL indexing** for automated data cleanup.
- **JWT & bcryptjs**: Secure authentication and password hashing.
- **Socket.io**: Real-time events and data synchronization.
- **Helmet**: Essential security headers.
- **Multer**: Handling file uploads.
- **CORS**: Secure Cross-Origin Resource Sharing.
- **Dotenv**: Environment variable management.

## 🚀 Features
- **Secure Authentication**: JWT-based auth with bcrypt password hashing.
- **Real-Time Event Engine**: Socket.io integration for instant data synchronization.
- **Trash & Recover Engine**: Professional soft-delete implementation allowing project restoration within a 60-day window.
- **60-Day Auto-Deletion**: Automated permanent data scrubbing using MongoDB TTL indexes.
- **Scalable Data Models**: Mongoose-driven schemas for Projects, Tickets, and Users.
- **Security-First Design**: Implementation of Helmet and CORS for robust API protection.

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

## 🛠️ Scheduled Maintenance & Fixes
- **Assignee Update Notifications**: Fixing the notification trigger logic when a ticket's assignee is changed.
- **Environment Configuration**: Ensuring seamless transition between local and production environments.
