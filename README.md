# WorkLog

This project is a comprehensive productivity tool designed to help users manage their online time effectively. It consists of a backend API built with the MERN (MongoDB, Express.js, React/Node.js) stack and a powerful Chrome Extension that tracks website usage and blocks distracting sites.

## Features

### Chrome Extension
* **Website Time Tracking:** Monitors and records the time spent on various websites.
* **Site Blocking:** Allows users to add specific websites to a blocked list, preventing access to them.
* **Intuitive Popup Interface:** A user-friendly popup provides a quick overview of daily productivity and allows for easy management of blocked sites.
* **Data Synchronization:** Automatically syncs website usage data and blocked site lists with the backend server.

### Backend API (MERN Stack)
* **User Authentication:** Secure user registration and login using JWT (JSON Web Tokens).
* **Productivity Data Storage:** Stores daily website time usage for each user in MongoDB.
* **Blocked Site Management:** Manages user-specific lists of blocked websites.
* **User Preferences:** Allows users to set preferences such as report frequency and notification settings.
* **Reporting:** Provides API endpoints for fetching daily and monthly productivity reports.
* **Data Synchronization Endpoint:** Handles incoming productivity and blocked site data from the Chrome Extension, merging it with existing records.
* **Database Connectivity:** Establishes a connection to MongoDB using Mongoose.

## Technologies Used

### Frontend (Chrome Extension)
* **JavaScript**
* **HTML**
* **CSS**
* **Chrome Extension APIs**

### Backend
* **Node.js**
* **Express.js**
* **MongoDB** (via Mongoose ODM)
* **bcrypt.js** (for password hashing - implied by `matchPassword` in `auth.js` and `user.js` models)
* **jsonwebtoken** (for authentication)
* **dotenv** (for environment variables)
* **cors** (for cross-origin resource sharing)

## Getting Started

To get a copy of the project up and running on your local machine for development and testing purposes, follow these steps.

### Prerequisites

* Node.js (LTS version recommended)
* MongoDB (local installation or a cloud service like MongoDB Atlas)
* npm or yarn
* Google Chrome browser

### Installation

#### 1. Backend Setup


• Clone the repository (if not already cloned)

<i>git clone <your-repository-url></i>

<i>cd <your-repository-directory>/backend</i>

(Assuming your backend code is in a 'backend' folder)

• Install backend dependencies

<i>npm install</i>

• Create a .env file in the backend directory and add your environment variables

<i>touch .env</i>

(Paste following in your .env file)

<i>MONGO_URI=your_mongodb_connection_string</i>

<i>JWT_SECRET=a_strong_secret_key_for_jwt</i>

<i>PORT=5000</i>

(Replace your_mongodb_connection_string with your MongoDB URI (e.g., mongodb://localhost:27017/productivity_db or your MongoDB Atlas connection string).)

(Replace a_strong_secret_key_for_jwt with a long, random string.)



• Start the backend server

<i>npm start</i>

(The backend server should now be running, typically on http://localhost:5000.)

### 2. Chrome Extension Setup


• Navigate to the frontend (Chrome Extension) directory

<i>cd <your-repository-directory>/frontend</i> 

(Assuming your frontend code is in a 'frontend' folder)

Open Google Chrome.

Go to chrome://extensions.

Enable "Developer mode" in the top right corner.

Click on "Load unpacked".

Select the directory where your Chrome Extension files (manifest.json, popup.html, background.js, etc.) are located.

The extension should now be installed and visible in your browser's extension list and toolbar.

### Usage

Register/Login: Click on the extension icon. If you're a new user, you'll likely need to register. Existing users can log in. The extension will communicate with your backend for authentication.

Browse Websites: As you browse, the extension will track your time spent on different websites.

Block Sites: From the extension popup, you can add websites to your blocked list. When you try to access a blocked site, you will be redirected to a blocked.html page.

View Reports: Access your daily and monthly productivity reports through the extension's interface (or by making direct API calls to the backend's /api/reports endpoints).

Manage Preferences: Update your user preferences via the extension (which interacts with the backend's /api/user/preferences endpoint).

### API Endpoints

The backend exposes the following API endpoints:

• Authentication
POST /api/auth/register - Register a new user

POST /api/auth/login - Log in a user and get a JWT token

• User Management
GET /api/user/preferences - Get user preferences (requires authentication)

PUT /api/user/preferences - Update user preferences (requires authentication)

• Data Synchronization & Blocked Sites
POST /api/data/sync - Sync productivity data and blocked sites from the extension to the server (requires authentication)

GET /api/data/blocked-sites - Get the list of blocked sites for the authenticated user

• Reports
GET /api/reports/daily - Get today's productivity report for the authenticated user

GET /api/reports/daily/:date - Get a daily productivity report for a specific date (e.g., /api/reports/daily/2023-10-26)

GET /api/reports/monthly/:year/:month - Get a monthly aggregated productivity report (e.g., /api/reports/monthly/2023/10)

### Project Structure
Project Structure
```bash
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB connection setup
│   ├── middleware/
│   │   └── auth.js             # Authentication middleware (e.g., protect)
│   ├── models/
│   │   ├── BlockedSiteList.js  # Mongoose model for blocked sites
│   │   ├── ProductivityData.js # Mongoose model for productivity data
│   │   └── user.js             # Mongoose model for user
│   ├── routes/
│   │   ├── auth.js             # Authentication routes (register, login)
│   │   ├── data.js             # Data sync and blocked sites routes
│   │   ├── reports.js          # Productivity reports routes
│   │   └── user.js             # User preferences routes
│   └── server.js               # Main backend server file
├── frontend/ (Chrome Extension)
│   ├── background.js           # Background script for tracking and blocking
│   ├── blocked.css             # Styles for the blocked page
│   ├── blocked.html            # HTML for the blocked page
│   ├── blocked.js              # JavaScript for the blocked page
│   ├── content.js              # Content script for website interaction
│   ├── manifest.json           # Chrome Extension manifest file
│   ├── popup.css               # Styles for the extension popup
│   ├── popup.html              # HTML for the extension popup
│   └── popup.js                # JavaScript for the extension popup
└── .gitignore                  # Git ignore file
└── README.md                   # This README file
