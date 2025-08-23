# GoalBuddy API


## 📚 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Installation](#setup--installation)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Goals (Protected)](#goals-protected)
- [Running Tests](#running-tests)
---

## ✅ Features

- **Secure User Authentication**: JWT-based authentication with bcrypt password hashing.
- **User Registration & Login**: Endpoints for creating accounts and logging in.
- **Goal Management**: Authenticated users can create and view their personal goals.
- **Database Migrations**: Structured migration system for database schema evolution.
- **Scalable Architecture**: Modular and clean codebase ready for expansion.

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Kysely
- **Authentication**: JWT
- **Testing**: Vitest + Supertest
- **Project Structure**: Monorepo-ready (includes `server/` folder)
- **Migrations**: Kysely custom file-based migrations (Windows-compatible)
- **Validation**: Zod

---

## 📁 Project Structure

```
goalbuddy/
├── client/                      # (Future front-end app)
├── node_modules/
├── server/
│   ├── dist/                    # Compiled output
│   └── src/                     # Source code
│       ├── api/                 # API route handlers
│       │   ├── auth/
│       │   │   └── auth.router.ts
│       │   └── goals/
│       │       └── goals.router.ts
│       ├── config/
│       │   └── database.ts      # DB connection setup
│       ├── lib/
│       │   └── windows-migration-provider.ts
│       ├── middleware/
│       │   └── middleware.ts
│       ├── migrations/          # DB migration scripts
│       │   ├── kysely-migrate.config.ts
│       │   ├── 1751386205669_create-users.ts
│       │   └── 1751388060534_create-goals.ts
│       ├── types/
│       │   ├── db.ts
│       │   ├── express.d.ts
│       ├── tests/               # Unit/integration tests
│       │   ├── auth.router.test.ts
│       │   ├── goals.router.test.ts
│       │   ├── middleware.test.ts
│       │   └── windows-migration-provider.test.ts
│       ├── index.ts
│   ├── .env                         # Local environment variables
│   ├── .env.example                 # Sample env file
│   ├── vitest.config.ts              # Vitest configuration
│   ├── tsconfig.ts                   # TypeScript configuration
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json                # TypeScript config
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
```
---

## 📋 Prerequisites

Ensure you have the following installed:

- Node.js (v18+)
- NPM
- PostgreSQL

---

## ⚙️ Setup & Installation

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd goalbuddy
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up the Database
Create a new PostgreSQL database named goalbuddy.

### 4. Configure Environment Variables
```bash
cd server
cp .env.example .env
```
Edit .env and fill in your local DB credentials.

### 5. Run Migrations
From the root project directory:

```bash
npm run migrate -w server
```

---

## 🚀 Running the Application
From the root directory:

```bash
npm run dev -w server
```
Your server will be running at: http://localhost:3000

---
## 📡 API Endpoints

You can use tools like Postman or Insomnia to test the API.

### 🔐 Authentication
| Method | Endpoint           | Description             |
| ------ | ------------------ | ----------------------- |
| POST   | `/api/auth/signup` | Creates a new user      |
| POST   | `/api/auth/login`  | Logs in and returns JWT |

Example Signup Request:

```json
POST /api/auth/signup
{
  "email": "testuser@example.com",
  "password": "password123"
}
```
Example Login Request:

```json
POST /api/auth/login
{
  "email": "testuser@example.com",
  "password": "password123"
}
```
---
## 🎯 Goals (Protected)
Note: All goal routes require a valid JWT in the `Authorization` header:
`Authorization: Bearer <your_token>`

| Method | Endpoint     | Description             |
| ------ | ------------ | ----------------------- |
| POST   | `/api/goals` | Create a new goal       |
| GET    | `/api/goals` | Retrieve all user goals |

Example Create Goal Request:

```json
POST /api/goals
{
  "title": "Learn TypeScript",
  "description": "Complete the official handbook.",
  "target_date": "2025-09-30"
}
```

## 🧪 Running Tests

This project uses **Vitest** with **Supertest** for integration and unit tests.

```bash
npm run test -w server
```

Run tests with coverage:
```bash
npm run test:coverage -w server
```

- ✅ Current coverage: >80% line coverage
- 🧪 Covers: `auth.router`, `goals.router`, `middleware`, and `windows-migration-provider`
