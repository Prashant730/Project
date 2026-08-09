# Render Deployment Checklist

Follow these steps to deploy your application to Render.

## Pre-Deployment Setup

### 1. Prepare Your Code

- [ ] Push your code to GitHub (main branch)
- [ ] Ensure all environment variables are documented in `.env.example` files
- [ ] Test locally: `npm run dev` in both frontend and backend

### 2. Set Up Database

- [ ] Create PostgreSQL database (Render managed or external)
- [ ] Note your connection string: `postgresql://user:password@host:port/database`
- [ ] Run migrations locally: `cd backend && npx prisma migrate deploy`

### 3. Prepare Environment Variables

Backend needs:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Generate a strong random string
- [ ] `CORS_ORIGIN` - Your frontend URL (set after frontend deployment)
- [ ] `NODE_ENV` - Set to `production`

Frontend needs:

- [ ] `VITE_API_BASE_URL` - Your backend URL (set after backend deployment)

## Render Deployment Steps

### Phase 1: Deploy Backend

1. [ ] Go to https://dashboard.render.com/
2. [ ] Click "New +" → "Web Service"
3. [ ] Connect your GitHub repository
4. [ ] Select root directory: `backend`
5. [ ] Configure:
   - Name: `your-app-backend`
   - Environment: `Node`
   - Build: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start: `npm start`
6. [ ] Add environment variables:
   ```
   DATABASE_URL=your_connection_string
   JWT_SECRET=your_secret_key
   NODE_ENV=production
   PORT=3000
   ```
7. [ ] Click "Create Web Service"
8. [ ] Wait for deployment to complete
9. [ ] Note your backend URL: `https://your-app-backend.onrender.com`

### Phase 2: Update Backend CORS

1. [ ] In Render backend service settings, add environment variable:
   ```
   CORS_ORIGIN=https://your-app-frontend.onrender.com
   ```
2. [ ] Render will auto-redeploy

### Phase 3: Deploy Frontend

1. [ ] Go to https://dashboard.render.com/
2. [ ] Click "New +" → "Static Site"
3. [ ] Connect your GitHub repository
4. [ ] Select root directory: `frontend`
5. [ ] Configure:
   - Name: `your-app-frontend`
   - Build: `npm install && npm run build`
   - Publish directory: `dist`
6. [ ] Add environment variables:
   ```
   VITE_API_BASE_URL=https://your-app-backend.onrender.com/api
   ```
7. [ ] Click "Create Static Site"
8. [ ] Wait for deployment to complete
9. [ ] Note your frontend URL: `https://your-app-frontend.onrender.com`

## Post-Deployment Testing

- [ ] Visit frontend URL in browser
- [ ] Test login functionality
- [ ] Create/read/update/delete test data
- [ ] Check backend health: `https://your-app-backend.onrender.com/api/health`
- [ ] Check browser console for errors (F12)
- [ ] Check Render logs for backend errors

## Enable Auto-Deploy

Both services auto-deploy on main branch pushes by default. To disable:

1. Service Settings → Deploys
2. Toggle "Auto-Deploy" on/off

## Monitoring

- **Backend Logs**: Render Dashboard → Backend Service → Logs
- **Frontend Logs**: Render Dashboard → Frontend Site → Logs
- **Metrics**: Render Dashboard → Your Service → Metrics

## Troubleshooting

### Frontend can't connect to backend

- Verify `VITE_API_BASE_URL` matches backend URL exactly
- Check CORS_ORIGIN on backend includes frontend URL
- Look at browser DevTools Network tab

### Backend won't start

- Check DATABASE_URL is correct
- Verify JWT_SECRET is set
- Check logs for migration errors

### Database connection fails

- Verify DATABASE_URL format
- Ensure database exists and is accessible
- Check PostgreSQL is running and accessible from Render

## Getting Help

- Render Docs: https://render.com/docs
- Backend Logs: Check "Logs" tab in Render dashboard
- Frontend Logs: Open browser DevTools (F12)

---

🎉 Once all tests pass, your application is live!
