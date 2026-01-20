# CRM System - Hostinger Deployment Guide

## Prerequisites
- Hostinger Hosting Account with Node.js support
- cPanel Access
- FTP/SSH Access
- Domain/Subdomain configured

---

## STEP 1: Export Local Database

### 1.1 Open phpMyAdmin (XAMPP)
1. Go to http://localhost/phpmyadmin
2. Click on `crm_database` in left sidebar
3. Click **Export** tab
4. Choose **Quick** export method
5. Format: **SQL**
6. Click **Go** button
7. Save file as `crm_database.sql`

**Alternative - Command Line Export:**
```bash
# Open Command Prompt in c:\xampp\mysql\bin\
cd c:\xampp\mysql\bin
mysql.exe -u root -p crm_database > C:\Users\rajpu\OneDrive\Desktop\crm\crm_database.sql
# Press Enter (no password)
```

---

## STEP 2: Prepare Backend for Production

### 2.1 Create Production Environment File

Create file: `backend\.env.production`

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_hostinger_db_user
DB_PASSWORD=your_hostinger_db_password
DB_NAME=your_hostinger_db_name

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here_change_this

# Frontend URL (Your actual domain)
FRONTEND_URL=https://yourdomain.com
```

### 2.2 Update Backend Package.json

Add production start script in `backend/package.json`:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "production": "NODE_ENV=production node server.js"
  }
}
```

### 2.3 Update CORS Configuration

In `backend/server.js`, update CORS:

```javascript
// Production CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));
```

---

## STEP 3: Build Frontend for Production

### 3.1 Update API URL for Production

Create file: `src\config\api.js`

```javascript
// API Configuration
const API_URL = import.meta.env.PROD
  ? 'https://yourdomain.com/api'  // Production API
  : 'http://localhost:5000/api';  // Development API

export default API_URL;
```

### 3.2 Update All API Calls

Replace `http://localhost:5000/api` with imported API_URL:

In all files:
- `src/pages/Leads.jsx`
- `src/pages/AssignedLeads.jsx`
- `src/pages/telecaller/TelecallerLeads.jsx`
- `src/pages/telecaller/TelecallerDashboard.jsx`
- `src/components/CallLogModal.jsx`
- `src/context/AuthContext.jsx`
- etc.

**Example:**
```javascript
import API_URL from '../config/api';

// Replace:
const response = await fetch('http://localhost:5000/api/leads');

// With:
const response = await fetch(`${API_URL}/leads`);
```

### 3.3 Build Production Frontend

```bash
cd c:\Users\rajpu\OneDrive\Desktop\crm
npm run build
```

This creates a `dist` folder with optimized production files.

---

## STEP 4: Setup Database on Hostinger

### 4.1 Login to Hostinger cPanel
1. Go to Hostinger Dashboard
2. Click **Manage** on your hosting plan
3. Click **cPanel** or **Database Manager**

### 4.2 Create MySQL Database
1. Go to **MySQL Databases**
2. Create new database: `u123456_crm` (example)
3. Create new user: `u123456_crm_user`
4. Set strong password
5. **Add user to database** with **ALL PRIVILEGES**
6. Note down:
   - Database Name: `u123456_crm`
   - Username: `u123456_crm_user`
   - Password: [your password]
   - Host: `localhost`

### 4.3 Import Database
1. Go to **phpMyAdmin** in cPanel
2. Select your database (`u123456_crm`)
3. Click **Import** tab
4. Click **Choose File** → Select `crm_database.sql`
5. Click **Go** button
6. Wait for success message

---

## STEP 5: Upload Files to Hostinger

### 5.1 Using File Manager (Recommended)

**Upload Backend:**
1. Go to cPanel → **File Manager**
2. Navigate to `public_html/api` (or create this folder)
3. Upload entire `backend` folder contents:
   - `config/`
   - `routes/`
   - `services/`
   - `server.js`
   - `package.json`
   - `.env.production` (rename to `.env`)
   - All other files

**Upload Frontend:**
1. Navigate to `public_html/`
2. Upload contents of `dist` folder (NOT the dist folder itself):
   - `index.html`
   - `assets/`
   - All other files from dist

### 5.2 Using FTP (Alternative)

Download FileZilla:
- Host: `ftp.yourdomain.com`
- Username: [Hostinger FTP username]
- Password: [Hostinger FTP password]
- Port: 21

Upload same files as above.

---

## STEP 6: Setup Node.js Application on Hostinger

### 6.1 Access Node.js Manager
1. Login to Hostinger cPanel
2. Go to **Software** section
3. Click **Setup Node.js App**

### 6.2 Create Node.js Application
1. Click **CREATE APPLICATION**
2. Fill in:
   - **Node.js version**: Select latest (18.x or higher)
   - **Application mode**: Production
   - **Application root**: `/public_html/api`
   - **Application URL**: `yourdomain.com/api` or `api.yourdomain.com`
   - **Application startup file**: `server.js`
   - **Environment variables**: Add from `.env` file

3. Click **CREATE**

### 6.3 Install Dependencies
1. After creating app, click **Run NPM Install**
2. Or use SSH:
```bash
cd ~/public_html/api
npm install --production
```

### 6.4 Start Application
1. Click **START APP** button
2. Application should show status: **Running**

---

## STEP 7: Configure Environment Variables

In Node.js App Manager, add environment variables:

```
DB_HOST=localhost
DB_USER=u123456_crm_user
DB_PASSWORD=your_db_password
DB_NAME=u123456_crm
PORT=5000
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=https://yourdomain.com
```

---

## STEP 8: Setup Domain/Subdomain

### Option A: Main Domain
- Your site will be at: `https://yourdomain.com`
- API will be at: `https://yourdomain.com/api`

### Option B: Subdomain
1. Go to cPanel → **Domains** → **Subdomains**
2. Create: `crm.yourdomain.com`
3. Document root: `public_html`
4. Create subdomain
5. Your site: `https://crm.yourdomain.com`

---

## STEP 9: Setup .htaccess for React Router

Create `public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite API requests
  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^ - [L]

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Rewrite everything else to index.html
  RewriteRule ^ /index.html [L]
</IfModule>

# Enable CORS
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
```

---

## STEP 10: SSL Certificate (HTTPS)

1. Go to cPanel → **SSL/TLS Status**
2. Hostinger provides **Free SSL** automatically
3. If not activated:
   - Go to **SSL/TLS**
   - Click **Install SSL**
   - Select your domain
   - Click **Install**

Website will be accessible via `https://`

---

## STEP 11: Test Deployment

### 11.1 Test Backend API
Visit: `https://yourdomain.com/api/health`

Should return:
```json
{
  "status": "OK",
  "message": "CRM Backend API is running"
}
```

Test database:
Visit: `https://yourdomain.com/api/health/db`

Should return:
```json
{
  "status": "OK",
  "message": "Database connection successful"
}
```

### 11.2 Test Frontend
1. Visit `https://yourdomain.com`
2. Login with Super Admin credentials:
   - Email: `admin@pulseeducation.com`
   - Password: `admin123`

3. Test all features:
   - Dashboard loads
   - Add leads
   - Assign leads
   - Telecaller login
   - Call logs
   - Statistics

---

## STEP 12: Post-Deployment Tasks

### 12.1 Change Default Passwords
1. Login as Super Admin
2. Go to Profile → Change Password
3. Update all default user passwords

### 12.2 Monitor Logs
Check Node.js app logs in Hostinger:
- cPanel → Node.js App → View Logs
- Check for errors

### 12.3 Setup Backup
1. Enable automatic backups in Hostinger
2. Schedule database backups
3. Download backup files regularly

---

## Troubleshooting

### Issue: White Screen on Frontend
**Solution:**
- Check browser console for errors
- Verify API_URL is correct in `src/config/api.js`
- Check .htaccess file exists

### Issue: API Returns 404
**Solution:**
- Check Node.js app is running in cPanel
- Verify application root path is correct
- Check environment variables

### Issue: Database Connection Failed
**Solution:**
- Verify database credentials in `.env`
- Check database user has privileges
- Ensure database host is `localhost`

### Issue: CORS Errors
**Solution:**
- Check `FRONTEND_URL` in backend `.env`
- Verify CORS configuration in `server.js`
- Check .htaccess CORS headers

---

## Quick Checklist

- [ ] Database exported from local
- [ ] Database created on Hostinger
- [ ] Database imported successfully
- [ ] Backend files uploaded to `public_html/api`
- [ ] Frontend build uploaded to `public_html`
- [ ] Node.js app created and configured
- [ ] Environment variables set
- [ ] Dependencies installed (npm install)
- [ ] Node.js app started
- [ ] .htaccess file created
- [ ] SSL certificate activated
- [ ] Backend API tested (/api/health)
- [ ] Frontend loads successfully
- [ ] Login works
- [ ] All features tested

---

## Support

If you face any issues:
1. Check Node.js app logs in cPanel
2. Check browser console (F12)
3. Verify all environment variables
4. Contact Hostinger support for server-specific issues

---

**Deployment Date:** [Fill after deployment]
**Domain:** [Your domain]
**Database Name:** [Your DB name]
**Node.js Version:** [Selected version]

---

Good luck with deployment!
