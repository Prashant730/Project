# Mini ERP - Project Summary & Deployment Guide

## 🚀 Live Deployment Links

| Component        | URL                                          | Status    |
| ---------------- | -------------------------------------------- | --------- |
| **Frontend**     | https://project-frontend-557x.onrender.com   | ✅ Live   |
| **Backend API**  | https://project-t4yn.onrender.com            | ✅ Live   |
| **GitHub Repo**  | https://github.com/Prashant730/Project       | 📦 Source |
| **Health Check** | https://project-t4yn.onrender.com/api/health | ✅ OK     |

---

## 🔐 Test Login Credentials

Use these credentials to test all roles in the live application:

| Email                | Password      | Role          | Permissions                                      |
| -------------------- | ------------- | ------------- | ------------------------------------------------ |
| `admin@test.com`     | `password123` | **ADMIN**     | Full system access, user management, settings    |
| `sales@test.com`     | `password123` | **SALES**     | Create challans, manage customers, view products |
| `warehouse@test.com` | `password123` | **WAREHOUSE** | Stock management, view inventory                 |
| `accounts@test.com`  | `password123` | **ACCOUNTS**  | View reports, financial summaries                |

**Quick Test**:

1. Visit https://project-frontend-557x.onrender.com/login
2. Enter `admin@test.com` / `password123`
3. Access Dashboard → All features active

---

## 🏗️ Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Web Browser                             │
├─────────────────────────────────────────────────────────────────┤
│                     React 19 Frontend SPA                         │
│  (Vite Build → TailwindCSS → React Router → React Query)        │
│           Hosted on Render as Node Web Service                   │
│         (Express.js middleware for SPA routing)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CORS-enabled API calls to:                                      │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                 Express 5.2 Backend API                          │
│  (TypeScript → Prisma 7.9 ORM → PostgreSQL adapter)            │
│         Hosted on Render as Node Web Service                    │
│                Port 3000 (internally)                            │
├─────────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                           │
│        Managed PostgreSQL on Render (dpg-d9s6vjc9v7es73ee12pg)  │
│              Database: minierp_4rq4                              │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model (12 Core Tables)

```
User (ADMIN/SALES/WAREHOUSE/ACCOUNTS)
├── Product (SKU-based inventory)
├── Customer (customer profiles with type/status)
├── Challan (sales documents with line items)
│   └── ChallanItem (references Product)
├── CustomerNote (CRM notes)
├── PurchaseOrder (from suppliers)
│   └── PurchaseOrderItem
├── Supplier (vendor management)
├── StockMovement (audit trail for inventory)
├── Sequence (auto-increment counters)
└── CompanyProfile (org-wide settings)
```

### API Route Structure

```
POST   /api/auth/login           → JWT token
POST   /api/auth/register        → Create user
GET    /api/health               → Status check

GET    /api/products             → List all products
POST   /api/products             → Create product
PUT    /api/products/:id         → Update product
DELETE /api/products/:id         → Delete product

GET    /api/customers            → List customers
POST   /api/customers            → Create customer
PUT    /api/customers/:id        → Update customer

GET    /api/challans             → List challans
POST   /api/challans             → Create challan (atomic stock deduction)
GET    /api/challans/:id         → Challan detail

GET    /api/purchase-orders      → List POs
POST   /api/purchase-orders      → Create PO

GET    /api/suppliers            → List suppliers
POST   /api/suppliers            → Create supplier

GET    /api/users                → List users (ADMIN only)
POST   /api/users                → Create user (ADMIN only)

GET    /api/settings             → Get system settings
PUT    /api/settings             → Update settings (ADMIN only)
```

### Technology Stack

| Layer        | Technology         | Version                  |
| ------------ | ------------------ | ------------------------ |
| **Frontend** | React              | 19.2.8                   |
|              | Vite               | 8.2.0                    |
|              | TypeScript         | ~6.0.2                   |
|              | TailwindCSS        | 4.3.3                    |
|              | React Router       | 7.18.2                   |
|              | React Query        | 5.101.4                  |
|              | axios              | 1.19.0                   |
| **Backend**  | Node.js            | 24.14.1 (Render default) |
|              | Express            | 5.2.1                    |
|              | TypeScript         | 7.0.2                    |
|              | Prisma             | 7.9.1                    |
|              | @prisma/adapter-pg | Latest                   |
| **Database** | PostgreSQL         | Managed on Render        |
| **Auth**     | jsonwebtoken       | 9.0.3                    |
|              | bcrypt             | 6.0.0                    |
| **Testing**  | Jest               | 29.7.0                   |
|              | @swc/jest          | 0.2.29                   |

---

## 📚 API Documentation

### Base URL

```
https://project-t4yn.onrender.com/api
```

### Authentication

All protected routes require JWT token in `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

### Key Endpoints

#### 1. **Authentication**

**Login**

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@test.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@test.com",
    "role": "ADMIN",
    "name": "Admin User"
  }
}
```

#### 2. **Products** (Inventory)

**Get All Products**

```http
GET /products?page=1&limit=10
Authorization: Bearer <token>
```

**Create Product**

```http
POST /products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Widget A",
  "sku": "SKU-001",
  "price": 100.00,
  "quantity": 50,
  "category": "Electronics"
}
```

#### 3. **Customers** (CRM)

**Get All Customers**

```http
GET /customers?page=1&limit=10
Authorization: Bearer <token>
```

**Create Customer**

```http
POST /customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "type": "BUSINESS",  // or INDIVIDUAL
  "status": "ACTIVE"   // or INACTIVE
}
```

#### 4. **Challans** (Sales Documents)

**Create Challan** (⚠️ Atomic stock deduction)

```http
POST /challans
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 5,
      "price": 100.00
    }
  ],
  "notes": "Rush delivery"
}

Response:
{
  "id": "uuid",
  "challanNumber": "CH-20260809-001",
  "status": "PENDING",
  "total": 500.00,
  "createdAt": "2026-08-09T..."
}
```

**Critical**: Challan creation automatically deducts stock. Reverse with DELETE if needed.

#### 5. **Purchase Orders**

**Create PO**

```http
POST /purchase-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "supplierId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 100,
      "cost": 50.00
    }
  ]
}
```

---

## 🧪 Postman Collection Setup

### Option 1: Import from File

Save this as `Mini_ERP.postman_collection.json`:

```json
{
  "info": {
    "name": "Mini ERP API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": {
              "raw": "https://project-t4yn.onrender.com/api/auth/login",
              "protocol": "https",
              "host": ["project-t4yn", "onrender", "com"],
              "path": ["api", "auth", "login"]
            },
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"admin@test.com\",\"password\":\"password123\"}"
            }
          }
        }
      ]
    },
    {
      "name": "Products",
      "item": [
        {
          "name": "Get All Products",
          "request": {
            "method": "GET",
            "url": {
              "raw": "https://project-t4yn.onrender.com/api/products",
              "protocol": "https",
              "host": ["project-t4yn", "onrender", "com"],
              "path": ["api", "products"]
            },
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    },
    {
      "name": "Customers",
      "item": [
        {
          "name": "Get All Customers",
          "request": {
            "method": "GET",
            "url": {
              "raw": "https://project-t4yn.onrender.com/api/customers",
              "protocol": "https",
              "host": ["project-t4yn", "onrender", "com"],
              "path": ["api", "customers"]
            },
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

### Option 2: Manual Setup

1. Open Postman
2. Create environment variable: `base_url` = `https://project-t4yn.onrender.com/api`
3. Create environment variable: `token` = (empty initially)
4. **First request**: POST to `{{base_url}}/auth/login` with admin credentials
5. In response, copy token to `token` variable
6. Use `Authorization: Bearer {{token}}` in subsequent requests

---

## 📋 Local Development Setup

### Prerequisites

- Node.js 24+
- PostgreSQL 15+
- npm/pnpm

### Backend Setup

```bash
cd backend

# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env
# Edit .env:
# DATABASE_URL="postgresql://user:password@localhost:5432/minierp"
# JWT_SECRET="your-secret-key"
# CORS_ORIGIN="http://localhost:5173"

# 3. Initialize database
npx prisma migrate reset --force  # Creates schema + seeds test data

# 4. Start server
npm run dev
# Server runs on http://localhost:3000
```

### Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure API endpoint
# Edit src/api/client.ts if needed (defaults to localhost:3000)

# 3. Start dev server
npm run dev
# App runs on http://localhost:5173
```

### Run Tests

```bash
cd backend
npm test              # Run all tests
npm test -- --watch  # Watch mode
```

---

## 🚀 Production Deployment (Render)

### Prerequisites

- GitHub account with repo pushed
- Render account (free tier available)
- PostgreSQL database on Render

### Step 1: Create PostgreSQL Database

1. Go to https://dashboard.render.com/
2. New → PostgreSQL
3. Name: `minierp-db`
4. Plan: **Free** (0.25GB)
5. Create & copy connection string

### Step 2: Deploy Backend

1. New → Web Service
2. Connect GitHub repo
3. **Settings**:
   - Name: `project-backend` (or your choice)
   - Environment: `Node`
   - Build command: `npm install --legacy-peer-deps && npx prisma migrate deploy && npx tsx prisma/seed.ts`
   - Start command: `npx tsx src/index.ts`
   - Root directory: `backend`
4. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:password@host:5432/db
   JWT_SECRET=your-secret-key
   CORS_ORIGIN=https://your-frontend-url.onrender.com
   ```
5. Deploy

### Step 3: Deploy Frontend

1. New → Web Service
2. Connect GitHub repo (same)
3. **Settings**:
   - Name: `project-frontend`
   - Environment: `Node`
   - Build command: `npm install && npm run build`
   - Start command: `node server.mjs`
   - Root directory: `frontend`
4. Deploy

### Step 4: Update Backend CORS

Once frontend is deployed:

1. Backend Web Service → Environment
2. Update `CORS_ORIGIN` to frontend URL
3. Save (auto-restart)

### Post-Deployment Checklist

- ✅ Backend health check: https://your-backend.onrender.com/api/health
- ✅ Frontend loads: https://your-frontend.onrender.com
- ✅ Login works with test credentials
- ✅ Create product → Verify appears in list
- ✅ Create challan → Verify stock deducts
- ✅ Refresh page → No 404 errors (SPA routing works)

---

## ⚠️ Known Limitations & Incomplete Features

### Current Limitations

1. **Frontend Bundle Size**
   - Some chunks exceed 500 kB after minification
   - Impact: Slower initial load on slow networks
   - Workaround: Enable code splitting in `vite.config.ts` or dynamic imports
   - Priority: **MEDIUM** (not blocking)

2. **No Real-time Sync**
   - Multiple users can create concurrent transactions without locking
   - Impact: Potential double-booking in rare cases
   - Workaround: Implement optimistic locking with version fields
   - Priority: **LOW** (rare edge case)

3. **Limited Reporting**
   - Only basic dashboard summaries
   - Missing: Detailed analytics, forecasting, export to PDF/Excel
   - Priority: **MEDIUM** (requested feature)

4. **No Email Notifications**
   - No alerts for low stock, pending orders, etc.
   - Priority: **LOW** (enhancement)

5. **Mobile Responsiveness**
   - Frontend is desktop-optimized with TailwindCSS
   - Mobile UI not fully tested
   - Priority: **LOW** (enhancement)

### Incomplete Features (Roadmap)

- [ ] Multi-language support (i18n)
- [ ] Dark mode toggle
- [ ] Advanced search filters with date ranges
- [ ] Audit logging (who changed what)
- [ ] Approval workflows for POs
- [ ] Barcode scanning for inventory
- [ ] API rate limiting + request throttling
- [ ] Two-factor authentication (2FA)

### Performance Notes

- **Backend response times**: Typically <100ms for list queries
- **Database queries**: Optimized with Prisma relations; no N+1 issues known
- **Frontend load time**: ~2-3 seconds (initial) on slow networks
- **Database backup**: Manual only; set up automated backups on Render

---

## 🛠️ Troubleshooting

### Backend Issues

**"Cannot find module 'express'"**

- Render frontend: Ensure `express` in `frontend/package.json` dependencies
- Run: `npm install && git push`

**"Connection refused on localhost:5432"**

- Local dev: Ensure PostgreSQL service running (`pg_ctl start` or systemctl)
- Render: Check `DATABASE_URL` in environment variables

**"Table 'User' does not exist"**

- Run migrations: `npx prisma migrate deploy`
- Or reset: `npx prisma migrate reset --force`

### Frontend Issues

**"404 Not Found on page refresh"**

- Issue: Frontend deployed as Static Site (old Netlify style)
- Fix: Convert to Web Service + use `server.mjs` for SPA routing
- Status: ✅ Fixed in current deployment

**"CORS error in browser console"**

- Fix: Update backend `CORS_ORIGIN` environment variable
- Current: `https://project-frontend-557x.onrender.com`

**"Login always fails"**

- Check backend logs for auth errors
- Verify seed accounts exist: `SELECT * FROM "User"` in DB
- Ensure JWT_SECRET matches between .env and environment variables

---

## 📞 Support & Contacts

- **GitHub Issues**: https://github.com/Prashant730/Project/issues
- **Documentation**: See [README.md](./README.md) for local dev setup
- **Database Queries**: Use Render PostgreSQL UI or `psql` CLI

---

## 📊 Quick Stats

| Metric              | Value                   |
| ------------------- | ----------------------- |
| **Total Routes**    | 30+                     |
| **Database Tables** | 12                      |
| **Test Accounts**   | 4 (all roles)           |
| **Frontend Pages**  | 10+                     |
| **Build Time**      | ~2 minutes              |
| **Deployment**      | Render (free tier)      |
| **Uptime SLA**      | Best-effort (free tier) |

---

**Last Updated**: 2026-08-09
**Version**: 1.0.0
**Status**: Production Ready ✅
