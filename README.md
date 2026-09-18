# Live Polling Tool

A real-time polling web application where users can create polls, share a public link, vote, and watch results update instantly without refreshing the page.

## 🚀 Live Demo

Frontend: https://live-polling-tool-1.onrender.com

Backend API: https://live-polling-tool-oeqz.onrender.com

## ✨ Features

- User registration and login
- JWT-based authentication
- Create and manage polls
- Add multiple poll options
- Share polls using a public link
- Vote on polls without authentication
- Real-time result updates without page refresh
- Owner-only poll management
- Delete polls
- MongoDB persistence
- Redis Pub/Sub for real-time updates
- Responsive React interface

## 🛠️ Technologies Used

### Frontend
- React
- Vite
- JavaScript
- CSS
- Server-Sent Events (SSE)

### Backend
- Go
- Gin Framework
- JWT
- bcrypt

### Database and Realtime
- MongoDB Atlas
- Redis Cloud
- Redis Pub/Sub

### Deployment
- Render
- GitHub

## 📁 Project Structure

```text
live-polling-tool/
├── backend/
│   ├── auth/
│   ├── database/
│   ├── handlers/
│   ├── middleware/
│   ├── models/
│   ├── redis/
│   └── main.go
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
└── README.md

```

## 🔄 How It Works
1. A user logs in.
2. The authenticated user creates a poll.
3. The backend stores the poll in MongoDB.
4. The generated poll link can be shared with an audience.
5. Audience members vote through the public poll page.
6. The vote is stored in MongoDB.
7. Redis increments the vote count and publishes a poll update.
8. The backend sends the update through Server-Sent Events.
9. Connected browsers update their results automatically without refreshing.

## 🔐 Security
1. Passwords are hashed using bcrypt.
2. Protected poll-management APIs require JWT authentication.
3. Poll deletion is restricted to the poll owner.
4. Environment variables are used for database and Redis credentials.
5. Secrets are not stored in the application source code.

## 🧪 Real-Time Testing
The application was tested using two browser windows.

When a user voted from one browser, the poll results in the second browser updated automatically without refreshing the page.

## 👨‍💻 Author
Easu chandra reens A
