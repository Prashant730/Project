# Mini ERP � Project README

> A full-stack, role-based ERP system for small businesses. Manages customers (CRM), inventory, and sales challans with atomic stock deduction.

## 🎯 Live Deployment

| Component       | URL                                        |
| --------------- | ------------------------------------------ |
| **Frontend**    | https://project-frontend-557x.onrender.com |
| **Backend API** | https://project-t4yn.onrender.com          |
| **GitHub**      | https://github.com/Prashant730/Project     |

**Quick Test**: Visit frontend → Login with `admin@test.com` / `password123`

---

## Tech Stack

- **Backend**: Node.js, Express 5.2, TypeScript 7, Prisma 7.9, PostgreSQL
- **Frontend**: React 19, Vite, TypeScript, TailwindCSS, React Router, React Query
- **Auth**: JWT + bcrypt
- **Testing**: Jest + @swc/jest

## Quick Start

### ⚡ Live Demo (Fastest!)

Just visit: https://project-frontend-557x.onrender.com/login

### 🏗️ Local Development

cp .env.example .env # set DATABASE_URL and JWT_SECRET
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev

````

### Frontend

```bash
cd frontend
npm install
npm run dev
````

## Seed Accounts

| Email                | Password      | Role      | Access                        |
| -------------------- | ------------- | --------- | ----------------------------- |
| `admin@test.com`     | `password123` | ADMIN     | Full system access            |
| `sales@test.com`     | `password123` | SALES     | Customers, Challans, Products |
| `warehouse@test.com` | `password123` | WAREHOUSE | Inventory management          |
| `accounts@test.com`  | `password123` | ACCOUNTS  | Reports, dashboards           |

---

## 📚 Complete Documentation

- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** ← Start here! Full architecture, API docs, deployment guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Development guidelines
- **[Mini_ERP_Postman_Collection.json](./Mini_ERP_Postman_Collection.json)** - Import to Postman for API testing

## Running Tests

```bash
cd backend
npm test
```

Note: Ensure `DATABASE_URL` in `[backend]/.env` points to a test database and seed accounts exist (see `prisma/seed.ts`).

## Key Business Rules

- Stock can NEVER go negative (enforced at DB level with atomic UPDATE).
- Challans snapshot product data at creation time (name, SKU, price).
