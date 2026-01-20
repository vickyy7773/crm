# Backend Deployment Guide - Hostinger

## Prerequisites
- Hostinger account with Node.js hosting
- MySQL database access
- SSH/cPanel access

---

## Step 1: Database Setup

### 1.1 Create MySQL Database (via cPanel)
1. Go to cPanel → MySQL Databases
2. Create new database: `pulsembbs_crm`
3. Create new user: `pulsembbs_crm_user`
4. Set a strong password and **save it**
5. Add user to database with ALL PRIVILEGES

### 1.2 Import Database
```bash
# Via cPanel phpMyAdmin:
1. Select database: pulsembbs_crm
2. Click "Import" tab
3. Choose file: database_export.sql
4. Click "Go"

# OR via SSH:
mysql -u pulsembbs_crm_user -p pulsembbs_crm < database_export.sql
```

### 1.3 Verify Database
```sql
USE pulsembbs_crm;
SHOW TABLES;
-- Should show: audit_logs, call_history, leads, notifications, student_applications, users, etc.
```

---

## Step 2: Backend Deployment

### 2.1 Upload Files to Hostinger
```bash
# Upload entire backend folder to:
/home/pulsembbs/public_html/api/

# Folder structure should be:
/public_html/
  └── api/
      ├── server.js
      ├── package.json
      ├── .env (create this)
      ├── config/
      ├── routes/
      ├── services/
      └── utils/
```

### 2.2 Configure Environment (.env)
1. Copy `.env.PRODUCTION` to `.env`
2. Edit `/public_html/api/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=pulsembbs_crm_user
DB_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
DB_NAME=pulsembbs_crm

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret
JWT_SECRET=2cb4a512d36045d37d2b1eaf955b0fcffb08edab8eedf9616aa5715adbb7d7c1

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

⚠️ **IMPORTANT:**
- Replace `YOUR_ACTUAL_PASSWORD_HERE` with your MySQL password
- Replace `https://yourdomain.com` with your actual frontend domain

### 2.3 Install Dependencies
```bash
# Via SSH:
cd /home/pulsembbs/public_html/api
npm install --production
```

### 2.4 Start Backend
```bash
# Test run:
node server.js

# Should see:
# ✅ MySQL Connection successful!
# 🚀 Server is running on port 5000
# 📊 API available at http://localhost:5000/api
```

---

## Step 3: Setup Node.js App (Hostinger)

### 3.1 Via cPanel → Setup Node.js App
1. Application root: `api`
2. Application URL: `yourdomain.com/api`
3. Application startup file: `server.js`
4. Node.js version: `18.x` or higher
5. Click "Create"

### 3.2 Environment Variables (in cPanel Node.js App)
Add these in the Environment Variables section:
```
DB_HOST=localhost
DB_USER=pulsembbs_crm_user
DB_PASSWORD=your_password
DB_NAME=pulsembbs_crm
PORT=5000
NODE_ENV=production
JWT_SECRET=2cb4a512d36045d37d2b1eaf955b0fcffb08edab8eedf9616aa5715adbb7d7c1
FRONTEND_URL=https://yourdomain.com
```

### 3.3 Restart Application
Click "Restart" in the Node.js App panel

---

## Step 4: Testing

### 4.1 Health Check
```bash
curl https://yourdomain.com/api/health
# Expected: {"status":"OK","message":"CRM Backend API is running"}
```

### 4.2 Database Check
```bash
curl https://yourdomain.com/api/health/db
# Expected: {"status":"OK","message":"Database connection successful"}
```

### 4.3 Test Login
```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

---

## Step 5: Configure .htaccess (for API routing)

Create `/public_html/api/.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]

# CORS Headers
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header set Access-Control-Allow-Headers "Content-Type, Authorization"
```

---

## Default Admin Credentials

**Email:** `admin@example.com`
**Password:** `admin123`

⚠️ **Change these immediately after first login!**

---

## API Endpoints

All endpoints are prefixed with `/api`:

- **Auth:** `/api/auth/login`, `/api/auth/logout`
- **Leads:** `/api/leads`, `/api/leads/bulk-upload`, `/api/leads/import`
- **Users:** `/api/users`
- **Dashboard:** `/api/dashboard/stats`
- **Activities:** `/api/activities`
- **Notifications:** `/api/notifications`
- **Analytics:** `/api/analytics`

---

## Troubleshooting

### Issue: "Cannot connect to database"
**Fix:**
1. Verify MySQL credentials in `.env`
2. Check database exists: `SHOW DATABASES LIKE 'pulsembbs_crm';`
3. Check user privileges: `SHOW GRANTS FOR 'pulsembbs_crm_user'@'localhost';`

### Issue: "Port 5000 already in use"
**Fix:** Change PORT in `.env` and restart app

### Issue: "Module not found"
**Fix:** Run `npm install` in `/public_html/api/`

### Issue: "CORS error from frontend"
**Fix:** Update `FRONTEND_URL` in `.env` with correct domain

---

## Files Checklist

Backend folder should contain:
- ✅ `server.js` - Main server file
- ✅ `package.json` - Dependencies
- ✅ `.env` - Environment config (created from `.env.PRODUCTION`)
- ✅ `config/database.js` - DB connection
- ✅ `routes/` - API routes
- ✅ `services/` - Business logic
- ✅ `utils/` - Helper functions
- ✅ `uploads/` - File upload directory (create if missing)

Database:
- ✅ `database_export.sql` - Import this to MySQL

---

## Maintenance

### View Logs
```bash
# Via cPanel Node.js App → View Logs
# OR via SSH:
pm2 logs
```

### Restart Server
```bash
# Via cPanel: Node.js App → Restart
# OR via SSH:
pm2 restart all
```

### Update Code
```bash
cd /public_html/api
git pull origin main  # if using git
npm install --production
pm2 restart all
```

---

## Security Checklist

- ✅ Change default admin password
- ✅ Use strong MySQL password
- ✅ Never commit `.env` to git
- ✅ Enable HTTPS on domain
- ✅ Regular database backups
- ✅ Update Node.js dependencies regularly

---

## Support

For issues:
1. Check logs in cPanel Node.js App
2. Verify database connection
3. Test API endpoints with curl
4. Check `.env` configuration

---

**Deployment Date:** January 17, 2026
**Backend Version:** 1.0.0
**Node.js Version:** 18.x or higher
