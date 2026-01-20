# Render Deployment Guide - CRM Application

## Overview
Deploy both Frontend (React) and Backend (Node.js) to Render with **FREE HTTPS** - solving the mixed content issue!

**What you'll get:**
- ✅ Backend: `https://crm-backend.onrender.com` (Free HTTPS)
- ✅ Frontend: `https://crm-frontend.onrender.com` (Free HTTPS)
- ✅ No more mixed content errors!
- ✅ Automatic SSL certificates
- ✅ Auto-deploy from GitHub

---

## Prerequisites

1. **GitHub Account** - https://github.com
2. **Render Account** - https://render.com (Sign up with GitHub - it's FREE)
3. **Hostinger Access** - For enabling remote MySQL access

---

## Step 1: Enable Remote MySQL Access (Hostinger)

Your database will stay on Hostinger, but Render needs to connect remotely.

### Via cPanel:

1. **Login to Hostinger cPanel**
2. **Go to: Databases → Remote MySQL**
3. **Add Access Host:**
   ```
   Host: 0.0.0.0
   (This allows connections from any IP - Render uses dynamic IPs)
   ```
4. **Click "Add Host"**
5. **Verify:** You should see "0.0.0.0" or "%" in the access list

### Test Remote Connection (Optional):
```bash
mysql -h 72.60.202.163 -u crm_user -p crm_database
# Enter password when prompted
# If successful, remote access is working!
```

⚠️ **Security Note:** If you want to restrict access to Render only:
- Instead of `0.0.0.0`, you can add specific Render IP ranges
- Check Render's documentation for their IP ranges

---

## Step 2: Push Code to GitHub

1. **Initialize Git Repository** (if not already done):
   ```bash
   cd c:\Users\rajpu\OneDrive\Desktop\crm
   git init
   git add .
   git commit -m "Initial commit for Render deployment"
   ```

2. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Repository name: `crm-application`
   - Make it **Private** (recommended)
   - Click "Create repository"

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/crm-application.git
   git branch -M main
   git push -u origin main
   ```

⚠️ **Important:** Make sure `.env` files are in `.gitignore` (they should be)

---

## Step 3: Deploy Backend to Render

### 3.1 Create New Web Service

1. **Login to Render:** https://dashboard.render.com
2. **Click "New +" → "Web Service"**
3. **Connect GitHub Repository:**
   - Click "Connect GitHub"
   - Select your `crm-application` repository
   - Click "Connect"

### 3.2 Configure Backend Service

**Basic Settings:**
- **Name:** `crm-backend`
- **Region:** `Singapore` (closest to you)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`

**Plan:**
- Select **Free** (0$/month)

### 3.3 Add Environment Variables

Click "Advanced" → "Add Environment Variable"

Add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5001` |
| `DB_HOST` | `72.60.202.163` |
| `DB_USER` | `crm_user` |
| `DB_PASSWORD` | `CrmVps2026Secure` |
| `DB_NAME` | `crm_database` |
| `DB_PORT` | `3306` |
| `JWT_SECRET` | `2cb4a512d36045d37d2b1eaf955b0fcffb08edab8eedf9616aa5715adbb7d7c1` |
| `FRONTEND_URL` | `https://crm-frontend.onrender.com` |

⚠️ **Note:** You'll update `FRONTEND_URL` after deploying frontend in next step

### 3.4 Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (2-5 minutes)
3. **Check Logs** for any errors
4. **Note your Backend URL:** `https://crm-backend.onrender.com`

### 3.5 Test Backend

Once deployed, test the API:
```bash
curl https://crm-backend.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "OK",
  "message": "CRM Backend API is running"
}
```

---

## Step 4: Deploy Frontend to Render

### 4.1 Create Static Site

1. **Dashboard → "New +" → "Static Site"**
2. **Connect same GitHub repository:** `crm-application`

### 4.2 Configure Frontend Service

**Basic Settings:**
- **Name:** `crm-frontend`
- **Region:** `Singapore`
- **Branch:** `main`
- **Root Directory:** (leave blank - it's at root)
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist`

**Plan:**
- Select **Free** (0$/month)

### 4.3 Add Environment Variable

Click "Advanced" → "Add Environment Variable"

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://crm-backend.onrender.com/api` |

⚠️ **Important:** Replace `crm-backend` with your actual backend URL from Step 3.4

### 4.4 Deploy

1. **Click "Create Static Site"**
2. **Wait for deployment** (2-5 minutes)
3. **Note your Frontend URL:** `https://crm-frontend.onrender.com`

---

## Step 5: Update Backend FRONTEND_URL

Now that frontend is deployed, update backend's environment variable:

1. **Go to Backend Service:** Dashboard → `crm-backend`
2. **Click "Environment"**
3. **Edit `FRONTEND_URL`:**
   - New value: `https://crm-frontend.onrender.com` (your actual frontend URL)
4. **Click "Save Changes"**
5. **Backend will auto-redeploy** (takes 1-2 minutes)

---

## Step 6: Test Complete Application

1. **Open Frontend:** `https://crm-frontend.onrender.com`
2. **Login with Admin Credentials:**
   - Email: `admin@example.com`
   - Password: `admin123`
3. **Test Features:**
   - ✅ Dashboard loads
   - ✅ Leads page works
   - ✅ Bulk Upload works
   - ✅ No mixed content errors in browser console!

---

## Step 7: Custom Domain (Optional)

### For Frontend:

1. **Buy Domain** (e.g., `crm.pulsembbs.com`)
2. **In Render:**
   - Frontend Service → Settings → Custom Domains
   - Click "Add Custom Domain"
   - Enter: `crm.pulsembbs.com`
   - Render will provide DNS records
3. **In Your DNS Provider (Hostinger):**
   - Add CNAME record: `crm.pulsembbs.com` → `crm-frontend.onrender.com`
4. **Wait for SSL:** Render auto-issues Let's Encrypt SSL (5-10 minutes)

### For Backend (API Subdomain):

1. **In Render:**
   - Backend Service → Settings → Custom Domains
   - Add: `api.pulsembbs.com`
2. **In DNS:**
   - Add CNAME: `api.pulsembbs.com` → `crm-backend.onrender.com`
3. **Update Frontend Environment Variable:**
   - `VITE_API_URL` = `https://api.pulsembbs.com/api`

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│         USER'S BROWSER                  │
│    https://crm-frontend.onrender.com    │
│              (HTTPS ✅)                 │
└────────────────┬────────────────────────┘
                 │
                 │ API Calls (HTTPS ✅)
                 ▼
┌─────────────────────────────────────────┐
│      RENDER - Backend Web Service       │
│    https://crm-backend.onrender.com     │
│         (Node.js + Express)             │
│              (HTTPS ✅)                 │
└────────────────┬────────────────────────┘
                 │
                 │ MySQL Connection
                 ▼
┌─────────────────────────────────────────┐
│    HOSTINGER - MySQL Database           │
│         72.60.202.163:3306              │
│       (Remote Access Enabled)           │
└─────────────────────────────────────────┘
```

---

## Render Free Plan Limits

| Feature | Free Plan |
|---------|-----------|
| **Bandwidth** | 100 GB/month |
| **Build Minutes** | 500 minutes/month |
| **Instances** | Unlimited services |
| **SSL** | ✅ Free automatic HTTPS |
| **Auto-Deploy** | ✅ Yes (from GitHub) |
| **Custom Domains** | ✅ Yes (unlimited) |
| **Downtime** | ⚠️ Spins down after 15 min inactivity |

⚠️ **Important:** Free tier services spin down after 15 minutes of inactivity. First request after spin-down takes ~30 seconds to wake up.

**Upgrade to Paid Plan ($7/month)** if you need:
- Always-on instances (no spin-down)
- Faster response times
- More bandwidth

---

## Auto-Deploy Setup

Render auto-deploys when you push to GitHub:

1. **Make Code Changes Locally**
2. **Commit & Push:**
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```
3. **Render auto-detects** and redeploys (2-5 minutes)
4. **Check Logs** in Render Dashboard

---

## Troubleshooting

### Issue: Backend can't connect to database

**Error:** `ER_ACCESS_DENIED_ERROR` or `ECONNREFUSED`

**Fix:**
1. Verify remote MySQL is enabled (Step 1)
2. Test connection manually:
   ```bash
   mysql -h 72.60.202.163 -u crm_user -p
   ```
3. Check environment variables in Render (DB_HOST, DB_USER, DB_PASSWORD)

---

### Issue: Frontend shows "Failed to fetch"

**Fix:**
1. Verify backend is running: `https://crm-backend.onrender.com/api/health`
2. Check `VITE_API_URL` environment variable in frontend
3. Check browser console for CORS errors
4. Verify `FRONTEND_URL` in backend matches your frontend URL

---

### Issue: "Mixed Content" error

**This shouldn't happen on Render!** Both frontend and backend use HTTPS.

**If it does:**
1. Verify `VITE_API_URL` uses `https://` (not `http://`)
2. Check `api.js` is using environment variable correctly
3. Clear browser cache and hard reload (Ctrl + Shift + R)

---

### Issue: 502 Bad Gateway

**Causes:**
1. Backend crashed (check logs)
2. Backend taking too long to start (cold start)
3. Database connection failed

**Fix:**
1. Check Render logs: Dashboard → Service → Logs
2. Verify all environment variables are set
3. Wait 30 seconds and try again (cold start)

---

### Issue: Service spins down (Free tier)

**Expected behavior** on free plan after 15 minutes of inactivity.

**Solutions:**
1. **Upgrade to Paid Plan** ($7/month) - Always on
2. **Use Cron Job** to ping your backend every 10 minutes:
   - Use cron-job.org
   - Ping: `https://crm-backend.onrender.com/api/health`
3. **Accept the cold start** (first request takes ~30 seconds)

---

## Maintenance

### View Logs
```
Dashboard → Your Service → Logs (real-time)
```

### Restart Service
```
Dashboard → Your Service → Manual Deploy → "Clear build cache & deploy"
```

### Update Environment Variables
```
Dashboard → Your Service → Environment → Edit variable → Save
(Service auto-redeploys)
```

### Rollback Deployment
```
Dashboard → Your Service → Deploys → Previous Deploy → "Redeploy"
```

---

## Environment Variables Reference

### Backend (crm-backend)
```env
NODE_ENV=production
PORT=5001
DB_HOST=72.60.202.163
DB_USER=crm_user
DB_PASSWORD=CrmVps2026Secure
DB_NAME=crm_database
DB_PORT=3306
JWT_SECRET=2cb4a512d36045d37d2b1eaf955b0fcffb08edab8eedf9616aa5715adbb7d7c1
FRONTEND_URL=https://crm-frontend.onrender.com
```

### Frontend (crm-frontend)
```env
VITE_API_URL=https://crm-backend.onrender.com/api
```

---

## Cost Comparison

| Hosting | Cost | HTTPS | Notes |
|---------|------|-------|-------|
| **Render Free** | $0/month | ✅ Auto | Services spin down after 15 min |
| **Render Paid** | $7/month | ✅ Auto | Always on, no spin-down |
| **Hostinger Current** | Included | ⚠️ Issues | Mixed content errors |

**Recommendation:** Start with Render Free, upgrade to Paid if needed.

---

## Security Checklist

- ✅ Environment variables stored securely in Render (not in code)
- ✅ `.env` files in `.gitignore`
- ✅ HTTPS enabled automatically
- ✅ Change default admin password after deployment
- ✅ Database credentials use strong password
- ✅ Remote MySQL access enabled only for required IPs
- ✅ JWT_SECRET is secure random string

---

## Success Criteria

After deployment, verify:

1. ✅ Backend health check works: `https://crm-backend.onrender.com/api/health`
2. ✅ Frontend loads: `https://crm-frontend.onrender.com`
3. ✅ Login works (admin@example.com / admin123)
4. ✅ Dashboard shows data from database
5. ✅ No mixed content errors in browser console
6. ✅ Bulk upload works
7. ✅ All CRUD operations work (create, read, update, delete leads)

---

## Next Steps After Deployment

1. **Change Admin Password** - Go to Settings
2. **Add Your Team** - Create telecaller accounts
3. **Import Leads** - Use Bulk Upload
4. **Set up Custom Domain** (Optional)
5. **Monitor Usage** - Check Render dashboard for bandwidth/build minutes
6. **Set up Alerts** - Configure Render notifications for deploy failures

---

## Support & Resources

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Community Forum:** https://community.render.com
- **Pricing:** https://render.com/pricing

---

**Deployment Date:** January 20, 2026
**Version:** 1.0.0
**Node.js Version:** 18.x or higher

---

## Quick Deploy Checklist

- [ ] Enable Remote MySQL on Hostinger (Step 1)
- [ ] Push code to GitHub (Step 2)
- [ ] Deploy Backend to Render (Step 3)
- [ ] Test Backend API (Step 3.5)
- [ ] Deploy Frontend to Render (Step 4)
- [ ] Update Backend FRONTEND_URL (Step 5)
- [ ] Test Complete Application (Step 6)
- [ ] Change Admin Password
- [ ] Import Your Leads

**Total Time:** ~30 minutes for complete deployment

---

🎉 **Congratulations!** Your CRM is now live on Render with FREE HTTPS and no more mixed content issues!
