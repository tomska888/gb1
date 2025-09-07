# GoalBuddy

https://goalbuddyone.d00ed23ca0jv2.eu-central-1.cs.amazonlightsail.com/

## 📚 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
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
- **Buddy Access**: Share goals with buddies via email invitations.
- **Database Migrations**: Structured migration system for database schema evolution.
- **Scalable Architecture**: Modular and clean codebase ready for expansion.

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Kysely
- **Authentication**: JWT
- **Testing**: Vitest + Supertest + Playwright
- **Linting & Formatting**: ESLint + Prettier
- **Project Structure**: Monorepo
- **Migrations**: Kysely custom file-based migrations (Windows-compatible)
- **Validation**: Zod
- **Infra**: Github Actions (CI/CD), Docker + ECR, AWS LightSail (hosting)

---

## 📋 Prerequisites

Ensure you have the following installed:

- Node.js (v18+)
- NPM
- PostgreSQL
- pgAdmin4

---

## ⚙️ Setup & Installation

### 1. Install and Configure PostgreSQL & pgAdmin4
Install PostgreSQL and pgAdmin4 on your system:
- Windows: Download from postgresql.org
- macOS: brew install postgresql pgadmin4
- Ubuntu: sudo apt install postgresql pgadmin4

### 2. Create Development Databases
1. Open pgAdmin4
2. Connect to PostgreSQL server using default credentials:
- Host: localhost
- Port: 5432
- Username: postgres
- Password: admin (or your configured password)
3. Create databases:
- Right-click "Databases" → Create → Database
- Create: goalbuddy (for development)
- Create: goalbuddy_test (for testing)

### 3. Clone the Repository

```bash
git clone <your-repository-url>
cd goalbuddy
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Environment Configuration
Create `.env.development` in the root directory:
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://postgres:admin@localhost:5432/goalbuddy"
JWT_SECRET="your-super-secret-key-that-is-long-and-random"
TEST_DATABASE_URL="postgresql://postgres:admin@localhost:5432/goalbuddy_test"
ENABLE_EMAIL=false
PUBLIC_APP_URL=http://localhost:5173
```

Create `client/.env.development`:
```bash
VITE_API_URL=http://localhost:3001
NODE_ENV=development
VITE_API_PROXY_TARGET=http://localhost:3001
```

### 6. Running Development Environment
From the root directory, run:
```bash
npm run dev
```
Migrations will run automatically on server start.

---
## 📡 Testing API Endpoints

You can use tools like Postman or Insomnia to test the API.

### Health Check
```bash
# Basic health check
curl http://localhost:3001/health

# Database health check
curl http://localhost:3001/api/health
```

### 🔐 Authentication
| Method | Endpoint           | Description             |
| ------ | ------------------ | ----------------------- |
| POST   | `/api/auth/signup` | Creates a new user      |
| POST   | `/api/auth/login`  | Logs in and returns JWT |

Example requests:

```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/signup
  -H "Content-Type: application/json"
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login
  -H "Content-Type: application/json"
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
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

```bash
# Get user's goals
curl http://localhost:3001/api/goals
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a new goal
curl -X POST http://localhost:3001/api/goals
  -H "Content-Type: application/json"
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
  -d '{
    "title": "Learn TypeScript",
    "description": "Master TypeScript fundamentals",
    "category": "Learning",
    "target_date": "2025-06-01"
  }'
```
---
Collaboration API
---
```bash
# Share a goal with another user
curl -X POST http://localhost:3001/api/collab/goals/1/share
  -H "Content-Type: application/json"
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
  -d '{
    "email": "buddy@example.com",
    "permissions": "checkin"
  }'

# Get shared goals
curl http://localhost:3001/api/collab/goals/shared
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

```

## 🧪 Running Tests

This project uses **Vitest** with **Supertest** for integration and unit tests and Playwright for end-to-end tests.

```bash
npm run test -w server
```

Run tests with coverage:
```bash
npm run test:coverage -w server
```

- ✅ Current coverage: >90% line coverage

Frontend tests:
```bash
npm run test:e2e
```
