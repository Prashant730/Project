# Deployment Guide - Render

This guide walks you through deploying this full-stack application to Render.

## Architecture Overview

- **Backend**: Node.js Express server deployed as a Web Service
- **Frontend**: React + Vite deployed as a Static Site
- **Database**: PostgreSQL (assumed to be already set up)

## Prerequisites

1. **Render Account**: Sign up at https://render.com
2. **GitHub Repository**: Push your code to GitHub
3. **PostgreSQL Database**: Either:
   - Use Render's managed PostgreSQL
   - Connect to existing database (cloud or on-premises)
4. **Environment Variables**: Prepare the values for your backend

## Step-by-Step Deployment

### 1. Deploy Backend (Web Service)

#### a) Connect your GitHub repository to Render

- Go to https://dashboard.render.com/
- Click "New +" → "Web Service"
- Select your GitHub repository
- Choose the `backend` directory as the root directory

#### b) Configure the Web Service

- **Name**: `your-app-backend` (or your preferred name)
- **Environment**: `Node`
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm start`
- **Plan**: Choose appropriate tier (Free/Standard/Pro)

#### c) Set Environment Variables

Add these environment variables in the "Environment" section:

```
DATABASE_URL=postgresql://user:password@your-db-host:5432/your-db-name
NODE_ENV=production
JWT_SECRET=your-secret-key-here
# Add any other backend environment variables
```

#### d) Deploy

- Click "Create Web Service"
- Render will automatically build and deploy your backend
- Once deployed, you'll get a service URL like: `https://your-app-backend.onrender.com`

### 2. Deploy Frontend (Static Site)

#### a) Create a new Static Site

- Go to https://dashboard.render.com/
- Click "New +" → "Static Site"
- Select your GitHub repository
- Choose the `frontend` directory as the root directory

#### b) Configure the Static Site

- **Name**: `your-app-frontend` (or your preferred name)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`

#### c) Set Environment Variables

Add these environment variables:

```
VITE_API_BASE_URL=https://your-app-backend.onrender.com/api
```

(Replace with your actual backend URL from Step 1)

#### d) Deploy

- Click "Create Static Site"
- Render will build and deploy your frontend
- You'll get a frontend URL like: `https://your-app-frontend.onrender.com`

### 3. Database Setup

If using Render's managed PostgreSQL:

1. Create a PostgreSQL database on Render
2. Get the connection string
3. Add it as `DATABASE_URL` in your backend environment variables
4. Run migrations: The build command includes `npx prisma migrate deploy`

If using existing database:

- Ensure it's accessible from Render
- Update `DATABASE_URL` accordingly

### 4. Connect Frontend to Backend

The frontend will automatically use the `VITE_API_BASE_URL` environment variable set in Step 2c.

### 5. Test the Deployment

1. Visit your frontend URL
2. Test login and main functionality
3. Check backend logs in Render dashboard if issues occur

## Troubleshooting

### Backend build fails

- Check that `npm install` completes without errors
- Ensure `DATABASE_URL` format is correct
- Review build logs in Render dashboard

### Frontend can't connect to backend

- Verify `VITE_API_BASE_URL` is set correctly
- Check backend service is running
- Look at browser console for CORS errors

### Database migration fails

- Ensure database exists and is accessible
- Check `DATABASE_URL` in backend environment
- Verify schema is up to date

## Environment Variables Reference

### Backend (.env)

```
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
JWT_SECRET=your-secret-key
# Add other variables as needed
```

### Frontend (.env)

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
```

## Auto-Deploy on Git Push

Both services are configured to automatically redeploy when you push to the main branch (default). You can configure this in Render dashboard under service settings.

## Maintenance

- Monitor logs: Render dashboard → Your Service → Logs
- View metrics: Render dashboard → Your Service → Metrics
- Update environment variables: Render dashboard → Your Service → Environment

## Cost Considerations

- **Web Service**: Billed per hour (Free tier available with limitations)
- **Static Site**: Free
- **PostgreSQL Database**: Paid plans start around $7/month

For production workloads, consider upgrading to Standard or higher plans.
