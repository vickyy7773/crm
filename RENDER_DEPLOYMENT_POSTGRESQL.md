# Render Deployment Guide - CRM with PostgreSQL

## Overview
Deploy complete CRM application to Render with **FREE PostgreSQL database** and HTTPS!

**What you'll get:**
- ✅ Backend: `https://crm-backend.onrender.com` (Free HTTPS)
- ✅ Frontend: `https://crm-frontend.onrender.com` (Free HTTPS)
- ✅ PostgreSQL Database: 1GB free storage
- ✅ No mixed content errors!
- ✅ Automatic SSL certificates
- ✅ Auto-deploy from GitHub

---

## Prerequisites

1. **GitHub Account** - https://github.com
2. **Render Account** - https://render.com (Sign up with GitHub - it's FREE)

---

## Quick Deployment (30 Minutes)

### Step 1: Push Code to GitHub

✅ **Git repository already initialized!**

1. **Create GitHub Repository:**
   - Go to: https://github.com/new
   - Repository name: `crm-application`
   - Privacy: **Private** (recommended)
   - Don't initialize with README
   - Click "Create repository"

2. **Push Code:**
   ```bash
   cd c:\Users\rajpu\OneDrive\Desktop\crm
   git remote add origin https://github.com/YOUR_USERNAME/crm-application.git
   git branch -M master
   git push -u origin master
   ```

3. **Verify:**
   - Check GitHub repo has: `backend/`, `src/`, `render.yaml`
   - `.env` files should NOT be there ✅

---

### Step 2: Deploy to Render (One-Click)

**Option A: Deploy with render.yaml (Recommended)**

1. **Login to Render:** https://dashboard.render.com
2. **Click:** "New +" → "Blueprint"
3. **Connect GitHub Repository:**
   - Select `crm-application`
   - Click "Connect"
4. **Review Blueprint:**
   - Database: `crm-database` (PostgreSQL)
   - Backend: `crm-backend` (Node.js)
   - Frontend: `crm-frontend` (Static Site)
5. **Click:** "Apply"
6. **Wait:** 5-10 minutes for deployment

---

**Option B: Manual Deployment (Step by Step)**

#### 2.1 Create PostgreSQL Database

1. **Dashboard** → "New +" → "PostgreSQL"
2. **Settings:**
   - Name: `crm-database`
   - Database: `crm_database`
   - User: `crm_admin`
   - Region: **Singapore**
   - Plan: **Free**
3. **Click:** "Create Database"
4. **Wait:** 2-3 minutes
5. **Note:** Copy "Internal Connection String"

#### 2.2 Import Schema

1. **Database Dashboard** → "Connect" → "External Connection"
2. **Copy connection string**
3. **Use psql or pgAdmin:**
   ```bash
   psql "postgresql://crm_admin:PASSWORD@dpg-xxxxx.singapore-postgres.render.com/crm_database"
   ```
4. **Import schema:**
   ```sql
   \i database_postgresql_schema.sql
   ```
5. **Verify:**
   ```sql
   \dt  -- List all tables
   SELECT * FROM users;  -- Check default admin user
   ```

#### 2.3 Deploy Backend

1. **Dashboard** → "New +" → "Web Service"
2. **Connect GitHub** → Select `crm-application`
3. **Settings:**
   - Name: `crm-backend`
   - Region: **Singapore**
   - Branch: `master`
   - Root Directory: `backend`
   - Runtime: **Node**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: **Free**

4. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `5001` |
   | `DATABASE_URL` | (From database - select crm-database) |
   | `JWT_SECRET` | (Auto-generate) |
   | `FRONTEND_URL` | `https://crm-frontend.onrender.com` |

5. **Click:** "Create Web Service"
6. **Wait:** 3-5 minutes
7. **Note:** Your backend URL (e.g., `https://crm-backend.onrender.com`)

#### 2.4 Test Backend

```bash
curl https://crm-backend.onrender.com/api/health
```

**Expected:**
```json
{
  "status": "OK",
  "message": "CRM Backend API is running"
}
```

#### 2.5 Deploy Frontend

1. **Dashboard** → "New +" → "Static Site"
2. **Connect GitHub** → Select `crm-application`
3. **Settings:**
   - Name: `crm-frontend`
   - Region: **Singapore**
   - Branch: `master`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Plan: **Free**

4. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://crm-backend.onrender.com/api` |

5. **Click:** "Create Static Site"
6. **Wait:** 3-5 minutes
7. **Note:** Your frontend URL

#### 2.6 Update Backend FRONTEND_URL

1. **Go to Backend Service** → "Environment"
2. **Edit** `FRONTEND_URL` to your actual frontend URL
3. **Save** (auto-redeploys)

---

### Step 3: Test Application

1. **Open:** `https://crm-frontend.onrender.com`
2. **Login:**
   - Email: `admin@pulseeducation.com`
   - Password: `admin123`
3. **Test:**
   - ✅ Dashboard loads
   - ✅ Create a test lead
   - ✅ Add call log
   - ✅ Check notifications

---

## Architecture

```
┌─────────────────────────┐
│  USER'S BROWSER         │
│  crm-frontend           │
│  (React + Vite)         │
│  HTTPS ✅               │
└────────┬────────────────┘
         │ API Calls
         ▼
┌─────────────────────────┐
│  RENDER BACKEND         │
│  crm-backend            │
│  (Node.js + Express)    │
│  HTTPS ✅               │
└────────┬────────────────┘
         │ SQL Queries
         ▼
┌─────────────────────────┐
│  RENDER POSTGRESQL      │
│  crm-database           │
│  (1GB Free)             │
│  Encrypted ✅           │
└─────────────────────────┘
```

---

## Environment Variables Reference

### Backend:
```env
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://user:pass@host:5432/crm_database
JWT_SECRET=(auto-generated by Render)
FRONTEND_URL=https://crm-frontend.onrender.com
```

### Frontend:
```env
VITE_API_URL=https://crm-backend.onrender.com/api
```

---

## Default Credentials

**Admin Account:**
- Email: `admin@pulseeducation.com`
- Password: `admin123`

**Telecaller Account:**
- Email: `telecaller@pulseeducation.com`
- Password: `admin123`

⚠️ **Change passwords immediately after first login!**

---

## Free Plan Limits

### PostgreSQL Database:
- Storage: 1 GB
- Connections: 97 concurrent
- Backups: Daily (7 days retention)
- Expires: Never (unless 90 days inactive)

### Backend Web Service:
- Memory: 512 MB
- Bandwidth: 100 GB/month
- Spin down: After 15 min inactivity (free tier)
- Build Minutes: 500/month

### Frontend Static Site:
- Bandwidth: 100 GB/month
- Always on: Yes (no spin down)
- Custom domains: Unlimited

---

## Troubleshooting

### Backend can't connect to database

**Check:**
1. DATABASE_URL is set correctly
2. Database is in same region (Singapore)
3. Backend has database connection permissions

**Test:**
```bash
# In Render backend shell
node -e "const {pool} = require('./config/database'); pool.query('SELECT NOW()').then(r => console.log(r.rows));"
```

---

### Frontend shows "Failed to fetch"

**Fix:**
1. Check `VITE_API_URL` in frontend environment variables
2. Verify backend is running: `https://crm-backend.onrender.com/api/health`
3. Check browser console for CORS errors
4. Verify `FRONTEND_URL` in backend matches your frontend URL

---

### Service spins down (Free tier)

**Expected behavior:** Free tier services sleep after 15 minutes of inactivity.

**Solutions:**
1. **Wait ~30 seconds** for first request after spin-down
2. **Upgrade to Starter ($7/month)** for always-on
3. **Use cron-job.org** to ping backend every 10 minutes

---

### Database storage full

**Check usage:**
```sql
SELECT pg_size_pretty(pg_database_size('crm_database'));
```

**Solutions:**
1. Delete old audit logs:
   ```sql
   DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '30 days';
   ```
2. Archive old leads
3. Upgrade to paid plan (10GB for $7/month)

---

## Data Migration

If you have existing MySQL data:

1. **See:** [POSTGRESQL_MIGRATION_GUIDE.md](POSTGRESQL_MIGRATION_GUIDE.md)
2. **Option 1:** Fresh start (recommended for testing)
3. **Option 2:** Migrate existing data (for production)

---

## Custom Domain Setup

### For Frontend:

1. **Render Dashboard** → Frontend Service → "Settings" → "Custom Domains"
2. **Add:** `crm.yourdomain.com`
3. **In DNS Provider:**
   - Add CNAME: `crm` → `crm-frontend.onrender.com`
4. **Wait:** 5-10 minutes for SSL

### For Backend (API):

1. **Add:** `api.yourdomain.com`
2. **In DNS:**
   - Add CNAME: `api` → `crm-backend.onrender.com`
3. **Update Frontend Env:**
   - `VITE_API_URL` = `https://api.yourdomain.com/api`

---

## Monitoring & Logs

### View Logs:
```
Dashboard → Service → "Logs" tab
```

### Metrics:
```
Dashboard → Service → "Metrics" tab
```

### Database Queries:
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, calls, total_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

---

## Backup & Restore

### Automated Backups:
- Render automatically backs up database daily
- Retention: 7 days (free plan)
- Location: Dashboard → Database → "Backups"

### Manual Backup:
```bash
pg_dump "YOUR_CONNECTION_STRING" > backup.sql
```

### Restore:
```bash
psql "YOUR_CONNECTION_STRING" < backup.sql
```

---

## Cost Breakdown

| Service | Free Plan | Paid Plan |
|---------|-----------|-----------|
| **PostgreSQL** | 1GB - $0/mo | 10GB - $7/mo |
| **Backend** | 512MB - $0/mo | 2GB - $7/mo |
| **Frontend** | Unlimited - $0/mo | Same |
| **Total** | **$0/month** | $14/month |

**Free plan is perfect for:**
- Testing
- Small teams (<10 users)
- Up to ~5,000 leads
- Development environments

---

## Security Checklist

- ✅ HTTPS enabled (automatic)
- ✅ Database encrypted at rest
- ✅ Environment variables secured
- ✅ No .env files in Git
- ✅ JWT tokens for authentication
- ✅ CORS configured
- ✅ Password hashing (bcrypt)
- ⚠️ Change default admin password!
- ⚠️ Add 2FA for super admin (manual)

---

## Success Criteria

After deployment, verify:

- [x] Backend health check works
- [x] Frontend loads
- [x] Login successful
- [x] Dashboard shows data
- [x] Can create leads
- [x] Can add call logs
- [x] Notifications work
- [x] No console errors
- [x] No mixed content warnings

---

## Next Steps

1. ✅ Change admin password
2. ✅ Add your team members
3. ✅ Configure company settings
4. ✅ Import/add your leads
5. ✅ Set up custom domain (optional)
6. ✅ Configure email notifications (optional)
7. ✅ Set up monitoring alerts (optional)

---

## Support

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Community:** https://community.render.com

---

**Deployment Time:** ~30 minutes
**Difficulty:** Easy
**Cost:** FREE (or $14/month for production)

🎉 **Happy Deploying!**
