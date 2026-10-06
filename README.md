# Salon Appointment Booking System

Backend API built with NestJS, Prisma and PostgreSQL.

## Features
- JWT authentication (register, login) and role-based authorization (CUSTOMER, ADMIN)
- Services, staff, time slots, appointments (book, update, cancel)
- Pagination, DTO validation, global exception filter

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill the values
3. `docker compose up -d`
4. `npx prisma migrate dev`
5. `npx prisma db seed`
6. `npm run start:dev`

Seeded admin: `admin@salon.com` / `Admin@123`

## Double booking prevention
A partial unique index on `Appointment(slotId) WHERE status = 'BOOKED'` makes the
database reject a second active booking for the same slot, even when two requests
arrive at the same moment. The API turns the violation (Prisma `P2002`) into a
`409 Conflict`. Cancelled appointments do not block the slot, so it can be rebooked.

## API overview
| Area | Endpoints |
|---|---|
| Auth | POST /auth/register, POST /auth/login, GET /auth/me |
| Services | GET /services, GET /services/:id, admin: POST, PATCH, DELETE |
| Staff | GET /staff, GET /staff/:id, admin: POST, PATCH, DELETE |
| Slots | GET /staff/:id/slots, admin: POST, DELETE |
| Appointments | POST, GET, GET /:id, PATCH /:id, DELETE /:id (cancel) |

## Testing
Import the files in the `postman/` folder into Postman, select the
"Salon API - Local" environment and run the collection.