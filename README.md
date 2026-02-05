# Bug Tracker (Jira-like Issue Tracker)

A robust, industry-standard Bug Tracker application built with the **MERN Stack** (MongoDB, Express.js, React, Node.js). This project enables teams to collaborate, manage projects, and track issues using a modern Kanban board interface.

## 🚀 Features

### Core Features
- **Project Management**: Create, update, and manage multiple projects within a single dashboard.
- **Issue Tracking**: Report bugs, feature requests, or tasks as individual tickets.
- **Kanban Board**: Drag-and-drop tickets across "To Do", "In Progress", and "Done" statuses.
- **User Authentication**: Secure Login and Registration using JWT and bcrypt.
- **Collaboration**: Assign tickets to team members and communicate via threaded comments.
- **Search & Filter**: Find tickets quickly by status, priority, assignee, or keyword.

### Advanced Features
- **Real-Time Collaboration**: Live ticket updates and notifications powered by Socket.io.
- **Role-Based Access Control (RBAC)**: Manage permissions for Admins, Managers, Developers, and Viewers.
- **File Attachments**: Upload screenshots and logs to bug reports for better clarity.
- **Mobile Responsive**: Fully optimized for a seamless experience across desktop and mobile devices.

## 🛠️ Tech Stack

### Frontend
- **React.js**: For building a dynamic and responsive UI.
- **Tailwind CSS**: Modern styling with a professional, minimal Jira-like aesthetic.
- **dnd-kit**: Reliable and smooth drag-and-drop functionality for the Kanban board.
- **Socket.io Client**: Real-time communication with the backend.
- **Axios**: HTTP client for API communication.
- **React Router**: Seamless client-side navigation.

### Backend
- **Node.js & Express.js**: High-performance RESTful API.
- **MongoDB & Mongoose**: Scalable NoSQL database with structured schemas.
- **JWT & bcryptjs**: Secure authentication and password hashing.
- **Socket.io**: Real-time events and data synchronization.
- **Helmet**: Essential security headers for the Express application.
- **Multer**: Handling file uploads and attachments.

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (Local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd bug-tracker
   ```

2. **Setup Backend:**
   ```bash
   cd bug-tracker-backend
   npm install
   ```
   Create a `.env` file in `bug-tracker-backend/` and add the following:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

3. **Setup Frontend:**
   ```bash
   cd ../bug-tracker-frontend
   npm install
   ```
   Create a `.env` file in `bug-tracker-frontend/` (if needed) or ensure `src/api.js` points to your backend URL.

### Running the Project

- **Start Backend:**
  ```bash
  cd bug-tracker-backend
  npm run dev
  ```

- **Start Frontend:**
  ```bash
  cd bug-tracker-frontend
  npm run dev
  ```

## 📂 Project Structure

```
bug-tracker/
├── bug-tracker-backend/    # Node.js + Express + MongoDB
│   ├── controllers/        # Business logic
│   ├── models/             # Database schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & security
│   └── index.js            # Entry point
└── bug-tracker-frontend/   # React + Tailwind
    ├── src/
    │   ├── pages/          # Full-page components
    │   ├── components/     # Reusable UI elements
    │   └── assets/         # Static files
    └── package.json
```

## 🔒 Security
- **CORS**: Configured for secure frontend-backend communication.
- **Helmet**: Protecting well-known web vulnerabilities by setting HTTP headers.
- **JWT Authorization**: Protecting private routes and user data.

## 📝 License
This project is licensed under the ISC License.
