# Clinica Bello Horizonte - Backend API REST

NestJS + PostgreSQL + Prisma backend for the Clinica Bello Horizonte Flutter mobile application.

---

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL
- **ORM**: Prisma 5
- **Auth**: JWT (access + refresh tokens) via Passport
- **Password hashing**: bcrypt (salt rounds = 10)
- **Validation**: class-validator + class-transformer
- **Docs**: Swagger / OpenAPI at `/api/docs`

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

## Setup & Installation

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/bello_horizonte_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
PORT=3000
NODE_ENV=development
```

### 3. Create the PostgreSQL database

```sql
CREATE DATABASE bello_horizonte_db;
```

### 4. Run database migrations

```bash
npm run db:migrate
```

When prompted for a migration name, enter something like `initial_schema`.

### 5. Generate Prisma client

```bash
npm run db:generate
```

> Note: `db:migrate` already runs generate automatically, but you can run it separately if needed.

### 6. Seed the database

```bash
npm run db:seed
```

This creates:
- 12 medical specialties
- 15 doctors with Peruvian names
- 1 demo user (role: USER)
- 1 admin user (role: ADMIN)
- 3 patient records for the demo user

### 7. Start the development server

```bash
npm run start:dev
```

The server will start at: `http://localhost:3000`

---

## Demo Credentials

> IMPORTANT: Passwords are hashed with bcrypt. These are NOT the same as any SHA-256 hashed passwords that may exist in a local Flutter SQLite database.

### Demo User (role: USER)
- Email: `demo@bellohorizonte.pe`
- DNI: `00000000`
- Password: `demo123`

### Admin User (role: ADMIN)
- Email: `admin@bellohorizonte.pe`
- DNI: `11111111`
- Password: `admin123`

---

## API Documentation

Swagger UI is available at: `http://localhost:3000/api/docs`

Base URL for all endpoints: `http://localhost:3000/api/v1`

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/login` | None | Login with email or DNI |
| POST | `/api/v1/auth/register` | None | Register new user |
| POST | `/api/v1/auth/logout` | JWT | Logout (invalidates refresh token) |
| POST | `/api/v1/auth/refresh` | Refresh JWT | Get new access + refresh tokens |
| POST | `/api/v1/auth/forgot-password` | None | Request password reset |
| GET | `/api/v1/auth/me` | JWT | Get current user data |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/users/profile` | JWT | Get authenticated user's profile |
| PATCH | `/api/v1/users/profile` | JWT | Update user profile (name, phone, birthDate) |

### Specialties
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/specialties` | None | List all specialties |
| GET | `/api/v1/specialties/:id` | None | Get specialty by ID (includes doctors) |

### Doctors
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/doctors` | None | List doctors (optional: ?search=name&specialtyId=uuid) |
| GET | `/api/v1/doctors/:id` | None | Get doctor by ID |
| POST | `/api/v1/doctors` | JWT (ADMIN) | Create new doctor |
| PATCH | `/api/v1/doctors/:id` | JWT (ADMIN) | Update doctor data |

### Appointments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/appointments` | JWT | List all user's appointments |
| GET | `/api/v1/appointments/upcoming` | JWT | List upcoming appointments (PENDING/CONFIRMED) |
| GET | `/api/v1/appointments/booked-slots?doctorId=&date=` | JWT | Get booked time slots for a doctor on a date |
| GET | `/api/v1/appointments/:id` | JWT | Get appointment by ID (ownership enforced) |
| POST | `/api/v1/appointments` | JWT | Create new appointment |
| PATCH | `/api/v1/appointments/:id/cancel` | JWT | Cancel an appointment |
| PATCH | `/api/v1/appointments/:id/reschedule` | JWT | Reschedule an appointment |

### Patient Records
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/patient-records` | JWT | List all patient records for the user |
| GET | `/api/v1/patient-records/:id` | JWT | Get patient record by ID (ownership enforced) |

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2024-05-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "timestamp": "2024-05-15T10:30:00.000Z",
  "path": "/api/v1/endpoint"
}
```

---

## Authentication Flow

1. Call `POST /api/v1/auth/login` with `{ identifier, password }`
2. Receive `{ accessToken, refreshToken, user }`
3. Send `Authorization: Bearer <accessToken>` header on protected requests
4. When access token expires (15 min), call `POST /api/v1/auth/refresh` with the refresh token as the bearer token
5. Receive new `{ accessToken, refreshToken }` pair (rotation)
6. Call `POST /api/v1/auth/logout` to invalidate the refresh token

---

## Available Scripts

```bash
npm run start:dev      # Start in development/watch mode
npm run build          # Compile TypeScript
npm run start:prod     # Start compiled app
npm run db:migrate     # Run pending Prisma migrations
npm run db:generate    # Generate Prisma client
npm run db:seed        # Seed the database
npm run db:studio      # Open Prisma Studio (GUI)
npm run db:reset       # Reset database and re-run migrations (DESTRUCTIVE)
```

---

## Entity Summary

### User
`id, dni (unique), email (unique), phone, firstName, lastName, birthDate?, passwordHash, role (USER|ADMIN), createdAt, updatedAt`

### Specialty
`id, name (unique), description?, icon?, color?`

### Doctor
`id, firstName, lastName, specialtyId (FK), description?, photoUrl?, rating, yearsExperience, consultationFee, availableDays (int[]), createdAt`

### Appointment
`id, userId (FK), doctorId (FK), specialtyId (FK), appointmentDate, appointmentTime, status (PENDING|CONFIRMED|CANCELLED|COMPLETED|RESCHEDULED), reason?, notes?, createdAt, updatedAt`

Unique constraint: `(doctorId, appointmentDate, appointmentTime)` prevents double-booking.

### PatientRecord
`id, userId (FK), appointmentId? (FK unique), diagnosis?, treatment?, notes?, recordDate, doctorName?, specialtyName?, createdAt, updatedAt`

### RefreshToken
`id, userId (FK cascade delete), tokenHash, expiresAt, createdAt`

---

## Notes

- Email and DNI cannot be changed via profile update endpoints (immutable identifiers).
- Passwords are hashed with bcrypt (10 salt rounds). They are NOT compatible with SHA-256 hashed passwords from a local Flutter SQLite database.
- Refresh tokens are rotated on each use (old token is deleted, new one is issued).
- Double-booking prevention: appointments have a unique constraint on `(doctorId, appointmentDate, appointmentTime)` for non-cancelled statuses.
- All timestamps are in ISO 8601 format (UTC).
