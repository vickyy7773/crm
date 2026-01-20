# 🚀 CRM Deployment Guide for cPanel

**Domain:** https://pulsembbs.com

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- ✅ cPanel login credentials
- ✅ Database created in cPanel (MySQL)
- ✅ FTP/File Manager access
- ✅ Node.js app support (already confirmed ✅)

---

## 🗄️ STEP 1: Database Setup

### 1.1 Create Database in cPanel

1. **Login to cPanel** → https://pulsembbs.com:2083
2. **Find "MySQL® Databases"** (Database section)
3. **Create New Database:**
   - Database Name: `crm_database` (or any name)
   - Note the full name (usually: `username_crm_database`)
4. **Create Database User:**
   - Username: `crm_user` (or any name)
   - Password: **Generate strong password** (save it!)
5. **Add User to Database:**
   - Select user and database
   - Grant **ALL PRIVILEGES**

### 1.2 Import Database

**Option A: Using phpMyAdmin (Recommended)**
1. cPanel → **phpMyAdmin**
2. Select your database (left sidebar)
3. Click **Import** tab
4. Click **Choose File** → Select `database_export.sql`
5. Click **Go** (Import ho jayega)

**Option B: Using cPanel MySQL Import**
1. cPanel → **MySQL® Databases**
2. Scroll to **Import Database**
3. Upload `database_export.sql`

**Important:** Save these credentials for later:
```
DB_NAME: username_crm_database
DB_USER: username_crm_user
DB_PASSWORD: [your password]
DB_HOST: localhost
```

---

## 📁 STEP 2: Frontend Deployment

### 2.1 Upload Frontend Files

1. **Open File Manager** in cPanel
2. Navigate to **public_html** folder
3. **Delete default files** (if any): index.html, etc.
4. **Upload entire `dist` folder contents:**
   - Go to: `C:\Users\rajpu\OneDrive\Desktop\crm\dist\`
   - Select ALL files inside dist folder
   - Upload to `public_html/`

**Expected files in public_html:**
```
public_html/
├── index.html
├── assets/
│   ├── index-XXXXX.js
│   ├── index-XXXXX.css
│   └── other asset files
```

### 2.2 Create .htaccess for React Routing

Create `.htaccess` file in `public_html/`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🔧 STEP 3: Backend Deployment (Node.js)

### 3.1 Create Node.js Application

1. **Go to Node.js section** (screenshot wala page)
2. Click **"CREATE APPLICATION"** button
3. **Fill the form:**

```
Node.js Version: Latest (18.x or higher recommended)
Application Mode: Production
Application Root: backend
Application URL: pulsembbs.com/api  (or api.pulsembbs.com if using subdomain)
Application Startup File: server.js
```

4. Click **CREATE**

### 3.2 Upload Backend Files

1. **File Manager** → Navigate to `backend/` folder (created automatically)
2. **Upload these files/folders from local:**
   ```
   C:\Users\rajpu\OneDrive\Desktop\crm\backend\
   ├── server.js
   ├── package.json
   ├── routes/
   ├── middleware/
   ├── config/
   ├── uploads/
   └── .env (we'll create this)
   ```

3. **DO NOT upload:**
   - `node_modules/` folder
   - `.env` file (we'll create new one)

### 3.3 Create Production .env File

In `backend/` folder, create `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=username_crm_user
DB_PASSWORD=your_database_password_here
DB_NAME=username_crm_database

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret (Generate new one)
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars

# CORS Settings
FRONTEND_URL=https://pulsembbs.com
```

**⚠️ Important:** Replace:
- `username_crm_user` with actual database user
- `username_crm_database` with actual database name
- `your_database_password_here` with actual database password
- `your_super_secret_jwt_key_here_min_32_chars` with a random 32+ character string

### 3.4 Install Dependencies

1. **Back to Node.js App Manager**
2. Your created app will show
3. Click **"Run NPM Install"** button
4. Wait for installation to complete (may take 2-5 minutes)

### 3.5 Start the Application

1. In Node.js App Manager
2. Click **"Start App"** button
3. App should show **"Running"** status

### 3.6 Setup Proxy (Important!)

**Option A: Using Application URL**
- If you used `pulsembbs.com/api` as Application URL, cPanel should auto-configure

**Option B: Using .htaccess (if needed)**

Add to `public_html/.htaccess` (before React routing rules):

```apache
# Proxy API requests to Node.js backend
RewriteCond %{REQUEST_URI} ^/api
RewriteRule ^api/(.*)$ http://localhost:5000/api/$1 [P,L]
```

---

## 🔐 STEP 4: Security & Permissions

### 4.1 Set Folder Permissions

Using File Manager:
```
backend/ → 755
backend/uploads/ → 755
backend/.env → 644
```

### 4.2 Create uploads Directory

Make sure this exists and is writable:
```
backend/uploads/
```

---

## ✅ STEP 5: Testing

### 5.1 Test Frontend
Visit: https://pulsembbs.com
- Should load login page
- No errors in browser console (F12)

### 5.2 Test Backend API
Visit: https://pulsembbs.com/api/health
- Should show: `{"status": "ok"}`

Visit: https://pulsembbs.com/api/health/db
- Should show database connected

### 5.3 Test Full Application
1. Login with existing user
2. Check dashboard loads
3. Try creating a lead
4. Try uploading a document

---

## 🐛 Troubleshooting

### Frontend shows blank page
- Check browser console (F12) for errors
- Verify .htaccess exists in public_html
- Check if all dist files uploaded correctly

### API not working (404 errors)
- Check Node.js app is **Running** in cPanel
- Verify Application URL is correct
- Check backend/.env file has correct database credentials
- Look at error logs in Node.js App Manager

### Database connection error
- Verify database credentials in .env
- Check database user has ALL PRIVILEGES
- Test connection: `api/health/db`

### Upload not working
- Check `backend/uploads/` folder exists
- Set permissions to 755
- Check disk space in cPanel

### Node.js app won't start
- Check package.json exists
- Run NPM Install again
- Check error logs in App Manager
- Verify Node.js version compatibility

---

## 📊 Post-Deployment Checklist

After successful deployment:

- [ ] Frontend loads at https://pulsembbs.com
- [ ] Login works
- [ ] Dashboard displays data
- [ ] Can create new leads
- [ ] Can create applications
- [ ] Documents upload works
- [ ] PDF generation works
- [ ] Notifications work
- [ ] All pages load without errors

---

## 🔄 Future Updates

To update the application:

### Update Frontend:
1. Run `npm run build` locally
2. Upload new `dist/` contents to `public_html/`

### Update Backend:
1. Upload changed files to `backend/`
2. If package.json changed, run NPM Install
3. Restart Node.js app

### Update Database:
1. Export only schema changes
2. Import to production via phpMyAdmin

---

## 📞 Support

If any issues:
1. Check cPanel error logs
2. Check browser console (F12)
3. Check Node.js app logs in cPanel
4. Verify all environment variables

---

## 🎉 Deployment Complete!

Your CRM is now live at: **https://pulsembbs.com**

Good luck! 🚀
