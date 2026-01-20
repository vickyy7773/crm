# Quick Deployment Checklist

## Pre-Deployment (Do on Local Machine)

### 1. Export Database ✅
```bash
# Method 1: phpMyAdmin
1. Open http://localhost/phpmyadmin
2. Select crm_database
3. Click Export → Quick → SQL → Go
4. Save as crm_database.sql

# Method 2: Command Line
cd c:\xampp\mysql\bin
mysql.exe -u root crm_database > C:\Users\rajpu\OneDrive\Desktop\crm\crm_database.sql
```

### 2. Build Frontend ✅
```bash
cd c:\Users\rajpu\OneDrive\Desktop\crm
npm run build
```
✅ Creates `dist` folder with production files

### 3. Update Production Config ✅

**File: src/config/api.js**
- Change `https://yourdomain.com/api` to your actual domain

**File: backend/.env.production.example**
- Copy to `.env`
- Fill in Hostinger database credentials

---

## On Hostinger (Do in cPanel)

### 4. Setup Database ✅

**Go to: MySQL Databases**
1. Create Database Name: `_______________________`
2. Create User: `_______________________`
3. Password: `_______________________`
4. Add user to database with ALL PRIVILEGES
5. Note: Host is always `localhost`

**Go to: phpMyAdmin**
1. Select your database
2. Import → Choose `crm_database.sql`
3. Click Go
4. ✅ Success message

### 5. Upload Files ✅

**Go to: File Manager**

**Upload Backend to public_html/api/**
- [ ] config/ folder
- [ ] routes/ folder
- [ ] services/ folder
- [ ] server.js
- [ ] package.json
- [ ] package-lock.json
- [ ] .env (renamed from .env.production)

**Upload Frontend to public_html/**
- [ ] index.html (from dist folder)
- [ ] assets/ folder (from dist folder)
- [ ] All files from dist folder

**Upload .htaccess**
- [ ] .htaccess.production → rename to .htaccess in public_html/

### 6. Setup Node.js App ✅

**Go to: Setup Node.js App**
1. Click CREATE APPLICATION
2. Fill in:
   - Node.js version: **18.x or latest**
   - Application mode: **Production**
   - Application root: `/public_html/api`
   - Application URL: `yourdomain.com/api`
   - Startup file: `server.js`
3. Click CREATE
4. Click **Run NPM Install**
5. Wait for installation to complete
6. Click **START APP**
7. ✅ Status should be "Running"

### 7. Add Environment Variables ✅

**In Node.js App Manager, add these:**
```
DB_HOST=localhost
DB_USER=[your database user]
DB_PASSWORD=[your database password]
DB_NAME=[your database name]
PORT=5000
NODE_ENV=production
JWT_SECRET=[generate random string]
FRONTEND_URL=https://yourdomain.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 8. Enable SSL ✅

**Go to: SSL/TLS Status**
- [ ] Check if SSL is active
- [ ] If not, go to SSL/TLS → Install SSL
- [ ] ✅ Site accessible via https://

---

## Testing (Do After Deployment)

### 9. Test Backend API ✅

Open in browser:
- [ ] `https://yourdomain.com/api/health`
  - Should return: `{"status":"OK","message":"CRM Backend API is running"}`

- [ ] `https://yourdomain.com/api/health/db`
  - Should return: `{"status":"OK","message":"Database connection successful"}`

### 10. Test Frontend ✅

- [ ] Visit `https://yourdomain.com`
- [ ] Page loads without errors (check F12 console)
- [ ] Login page appears

**Test Login:**
- [ ] Email: `admin@pulseeducation.com`
- [ ] Password: `admin123`
- [ ] ✅ Dashboard loads

**Test Features:**
- [ ] Dashboard shows stats
- [ ] Add new lead works
- [ ] Assign lead works
- [ ] Telecaller login works
- [ ] Call logs save correctly
- [ ] Follow-ups display

---

## Post-Deployment Security ✅

### 11. Change Default Passwords ✅

Login as each user and change password:
- [ ] Super Admin
- [ ] Manager 1
- [ ] All Telecallers

### 12. Verify Security ✅

- [ ] API only accessible from your domain (CORS working)
- [ ] HTTPS enabled (green padlock)
- [ ] No console errors
- [ ] Database credentials secure

---

## Monitoring ✅

### 13. Check Logs Regularly ✅

**Node.js App Logs:**
- cPanel → Node.js App → View Logs
- Check for errors daily

**Database Backups:**
- cPanel → Backups → Download Database
- Schedule: Weekly

---

## Common Issues & Solutions

### White Screen on Frontend
```
✅ Check: Browser console (F12)
✅ Verify: API_URL in src/config/api.js
✅ Check: .htaccess exists in public_html/
✅ Solution: Hard refresh (Ctrl+Shift+R)
```

### API Returns 404
```
✅ Check: Node.js app is Running
✅ Verify: Application root is /public_html/api
✅ Check: Environment variables are set
✅ Solution: Restart Node.js app
```

### Database Connection Failed
```
✅ Check: Database credentials in .env
✅ Verify: User has ALL PRIVILEGES
✅ Check: DB_HOST is localhost
✅ Solution: Test connection via phpMyAdmin
```

### CORS Errors
```
✅ Check: FRONTEND_URL in backend .env
✅ Verify: .htaccess CORS headers
✅ Solution: Restart Node.js app after changes
```

---

## Important Notes

⚠️ **Before Starting:**
- Backup local database
- Test build locally first
- Note all credentials

⚠️ **During Deployment:**
- Don't skip environment variables
- Wait for npm install to complete
- Verify each step before proceeding

⚠️ **After Deployment:**
- Change all default passwords immediately
- Test all features thoroughly
- Setup regular backups

---

## Contact Hostinger Support

If server-specific issues:
1. Open ticket in Hostinger Dashboard
2. Provide: Error message, steps taken
3. Mention: Node.js app deployment issue

---

## Success Criteria ✅

Your deployment is successful when:
- ✅ Frontend loads at https://yourdomain.com
- ✅ Backend API responds at https://yourdomain.com/api/health
- ✅ Database connection successful
- ✅ Login works for all user types
- ✅ All features functional
- ✅ No console errors
- ✅ HTTPS enabled (green padlock)
- ✅ Default passwords changed

---

**Deployment Date:** _______________
**Domain:** _______________
**Deployed By:** _______________

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

Good luck! 🚀
