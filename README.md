# 🏏 Leamington Royals Cricket Club Management System

A full-stack web application for managing a cricket club, including players, teams, tournaments, finances, sponsorships, and administration.

Built with **React (Vite)** on the frontend and **Node.js + Express + PostgreSQL** on the backend, using **JWT authentication** and **Socket.IO** for real-time capabilities.

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Protected routes using `RequireAuth`
- Role-based access control (`role` / `club_role`)
- Persistent login via `/api/auth/me`

### 🏏 Club Management
- Teams & team players
- Tournaments, matches & participants
- Seasons & competitions
- Events & RSVPs
- Memberships

### 💰 Finance & Sponsorships
- Sponsors & sponsor payments
- Player payments & charges
- Transactions & invoices
- Finance categories
- Admin-only finance views

### ⚡ Real-Time
- Socket.IO integration
- Room-based events (extensible for live scoring & notifications)

### 🗄️ Database
- PostgreSQL
- Centralized schema (`schema.sql`)
- Snake_case, pluralized table names (industry standard)

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- React Router
- Context API
- Fetch-based API client

### Backend
- Node.js
- Express
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- bcrypt
- Socket.IO

---

## 📁 Project Structure

```
leamingtonroyalscc/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── api/
│   │   │   ├── app/
│   │   │   └── layout/
│   │   ├── pages/
│   │   ├── providers/
│   │   └── router.jsx
│   └── vite.config.js
│
├── backend/
│   ├── server.js
│   ├── schema.sql
│   └── .env
│
└── README.md
```

---

## 🛠️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone https://github.com/mohdroshanzameer/leamingtonroyalscc.git
cd leamingtonroyalscc
```

---

### 2️⃣ Database Setup (PostgreSQL)

Create a database:

```sql
CREATE DATABASE cricket_club;
```

Import the schema:

```bash
psql -d cricket_club -f backend/schema.sql
```

---

### 3️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cricket_club
DB_USER=postgres
DB_PASSWORD=yourpassword
JWT_SECRET=super-secret-key
FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
node server.js
```

Backend runs at:

```
http://localhost:5000
```

Health check:

```
http://localhost:5000/api/health
```

---

### 4️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

## 🔑 Authentication Flow

1. User logs in → receives JWT
2. Token stored in `localStorage`
3. `AuthProvider` calls `/api/auth/me` on app load
4. Protected routes enforced by `RequireAuth`
5. Only **401 / 403** responses trigger redirect to `/signin`

---

## 🔄 Generic Entity API

The backend exposes safe, generic entity endpoints that map frontend entity names to actual database tables.

### Endpoints

```http
GET  /api/entities/:entityName
POST /api/entities/:entityName/filter
```

Example:

```http
GET /api/entities/TeamPlayer?sort=player_name&limit=500
```

---

## 🧠 Best Practices Applied

- Snake_case plural table names
- Entity → table resolution using DB metadata
- Safe SQL (validated identifiers + parameterized values)
- No auth redirects on 404 / 500 errors
- Clear separation of frontend & backend concerns

---

## 🚧 Future Improvements

- Full generic CRUD (POST / PUT / DELETE)
- Pagination metadata
- Admin role management UI
- Replace plaintext password column with hash-only
- Deployment documentation

---

## 🤝 Contributing

Pull requests are welcome.
Please follow existing patterns for:
- Database naming
- Auth handling
- Error handling (401/403 only)

---

## 📄 License

Private / internal use.
