# Mini ERP � Project README

> A full-stack, role-based ERP system for small businesses. Manages customers (CRM), inventory, and sales challans with atomic stock deduction.

## Tech Stack

- Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL
- Frontend: React 19, Vite, TailwindCSS v4, React Query v5
- Auth: JWT + bcrypt
- Testing: Jest + @swc/jest + Supertest

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Seed Accounts

| Email              | Password    | Role      |
| ------------------ | ----------- | --------- |
| admin@test.com     | password123 | ADMIN     |
| sales@test.com     | password123 | SALES     |
| warehouse@test.com | password123 | WAREHOUSE |
| accounts@test.com  | password123 | ACCOUNTS  |

## Running Tests

```bash
cd backend
npm test
```

Note: Ensure `DATABASE_URL` in `[backend]/.env` points to a test database and seed accounts exist (see `prisma/seed.ts`).

## Key Business Rules

- Stock can NEVER go negative (enforced at DB level with atomic UPDATE).
- Challans snapshot product data at creation time (name, SKU, price).
