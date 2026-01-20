# CRM System - Deployment Package

## 📦 What's Included

Your CRM system is now ready for deployment with all necessary files and guides!

---

## 📁 Project Structure

```
crm/
├── backend/                          # Node.js Backend API
│   ├── config/                       # Database configuration
│   ├── routes/                       # API routes
│   ├── services/                     # Business logic
│   ├── server.js                     # Main server file
│   ├── package.json                  # Dependencies
│   └── .env.production.example       # Production environment template
│
├── src/                              # React Frontend Source
│   ├── components/                   # Reusable components
│   ├── pages/                        # Page components
│   ├── context/                      # React context
│   └── config/
│       └── api.js                    # ✅ NEW: API URL configuration
│
├── dist/                             # Production build (after npm run build)
│   ├── index.html                    # Upload to Hostinger
│   └── assets/                       # Upload to Hostinger
│
├── .htaccess.production              # ✅ NEW: Apache config for React Router
├── generate-jwt-secret.js            # ✅ NEW: JWT secret generator
├── export-database.bat               # ✅ NEW: Database export script
├── HOSTINGER_DEPLOYMENT_GUIDE.md     # ✅ NEW: Complete deployment guide
└── QUICK_DEPLOYMENT_CHECKLIST.md    # ✅ NEW: Quick checklist
```

---

## 🚀 Quick Start - Deployment Steps

### Step 1: Prepare Files (5 minutes)

**Export Database:**
```bash
# Option 1: Double-click this file
export-database.bat

# Option 2: Use phpMyAdmin
http://localhost/phpmyadmin → crm_database → Export
```

**Build Frontend:**
```bash
npm run build
```
Creates `dist` folder with production files.

**Generate JWT Secret:**
```bash
node generate-jwt-secret.js
```
Copy the generated key for later.

---

### Step 2: Setup Hostinger (10 minutes)

**Create Database:**
- cPanel → MySQL Databases
- Create database, user, and password
- Note credentials

**Import Database:**
- cPanel → phpMyAdmin
- Select database → Import → Choose `crm_database_export_*.sql`

**Upload Files:**
- Backend → `public_html/api/`
- Frontend (dist contents) → `public_html/`
- .htaccess → `public_html/`

---

### Step 3: Configure Node.js (5 minutes)

**Setup App:**
- cPanel → Setup Node.js App
- Application root: `/public_html/api`
- Startup file: `server.js`
- Run NPM Install
- Start App

**Add Environment Variables:**
```
DB_HOST=localhost
DB_USER=[your db user]
DB_PASSWORD=[your db password]
DB_NAME=[your db name]
PORT=5000
NODE_ENV=production
JWT_SECRET=[generated key]
FRONTEND_URL=https://yourdomain.com
```

---

### Step 4: Test (2 minutes)

**Backend Test:**
- Visit: `https://yourdomain.com/api/health`
- Should return: `{"status":"OK"}`

**Frontend Test:**
- Visit: `https://yourdomain.com`
- Login: `admin@pulseeducation.com` / `admin123`

---

## 📚 Documentation Files

| File | Purpose | When to Use |
|------|---------|-------------|
| **HOSTINGER_DEPLOYMENT_GUIDE.md** | Complete step-by-step guide with troubleshooting | First-time deployment |
| **QUICK_DEPLOYMENT_CHECKLIST.md** | Quick checklist format | Re-deployment or quick reference |
| **.env.production.example** | Environment variables template | Setting up production config |
| **generate-jwt-secret.js** | Generate secure JWT key | First deployment |
| **export-database.bat** | Export database with one click | Database backup/migration |

---

## ⚙️ Configuration Files

### Frontend Configuration

**src/config/api.js**
```javascript
const API_URL = import.meta.env.PROD
  ? 'https://yourdomain.com/api'  // Change to your domain
  : 'http://localhost:5000/api';
```

**IMPORTANT:** Update `yourdomain.com` to your actual domain before building!

### Backend Configuration

**backend/.env.production.example**
- Copy to `.env` when deploying
- Fill in Hostinger database credentials
- Add generated JWT secret

### Apache Configuration

**.htaccess.production**
- Rename to `.htaccess` on server
- Enables React Router
- Configures CORS and security headers

---

## 🔐 Security Checklist

After deployment, immediately:

- [ ] Change Super Admin password
- [ ] Change all default user passwords
- [ ] Verify HTTPS is enabled (green padlock)
- [ ] Test CORS is working (no console errors)
- [ ] Enable Hostinger backups
- [ ] Keep JWT_SECRET secure (never commit to git)

---

## 🛠️ Troubleshooting

### Issue: White Screen

**Check:**
- Browser console (F12) for errors
- API URL in `src/config/api.js`
- `.htaccess` exists in `public_html/`

**Fix:** Hard refresh (Ctrl+Shift+R)

### Issue: API 404 Error

**Check:**
- Node.js app is Running in cPanel
- Application root path is correct
- Environment variables are set

**Fix:** Restart Node.js app

### Issue: Database Connection Failed

**Check:**
- Database credentials in `.env`
- User has ALL PRIVILEGES
- `DB_HOST=localhost`

**Fix:** Test in phpMyAdmin

### Issue: CORS Errors

**Check:**
- `FRONTEND_URL` in backend `.env`
- `.htaccess` CORS headers
- Backend server.js CORS config

**Fix:** Restart Node.js app after changes

---

## 📊 System Features

### For Super Admin
- ✅ User management (create, edit, delete)
- ✅ Lead management (add, edit, delete, bulk operations)
- ✅ Lead assignment (single & bulk)
- ✅ Password management (create, reset)
- ✅ System statistics and reports
- ✅ View all call logs

### For Managers
- ✅ View assigned leads
- ✅ Add call logs
- ✅ View statistics
- ✅ Manage follow-ups

### For Telecallers
- ✅ View assigned leads
- ✅ Add detailed call logs
- ✅ Update lead status
- ✅ Schedule follow-ups
- ✅ Daily call tracking
- ✅ Performance dashboard

---

## 📈 Technical Stack

**Frontend:**
- React 18.3.1
- Vite 5.4.21
- React Router 7.1.3
- Tailwind CSS 3.4.17
- Lucide React (icons)

**Backend:**
- Node.js
- Express 5.2.1
- MySQL (mysql2)
- bcrypt (password hashing)
- node-cron (scheduled tasks)

**Hosting:**
- Hostinger (Node.js + MySQL)
- Apache (.htaccess)
- Free SSL Certificate

---

## 🎯 Default Credentials

**Super Admin:**
- Email: `admin@pulseeducation.com`
- Password: `admin123`

**Manager:**
- Email: `manager1@pulseeducation.com`
- Password: `manager123`

**Telecaller:**
- Email: `telecaller1@pulseeducation.com`
- Password: `tele123`

⚠️ **CHANGE ALL PASSWORDS IMMEDIATELY AFTER DEPLOYMENT!**

---

## 🔄 Re-deployment Process

If you need to update the live site:

1. Make changes locally
2. Test thoroughly
3. Build frontend: `npm run build`
4. Upload only changed files:
   - Frontend: Upload new `dist` contents
   - Backend: Upload modified files only
5. Restart Node.js app if backend changed
6. Clear browser cache and test

---

## 💾 Backup Strategy

**Recommended Schedule:**

**Daily:**
- Automatic Hostinger backups (enable in cPanel)

**Weekly:**
- Download database backup
- Keep last 4 weeks of backups

**Before Updates:**
- Manual backup before deploying changes
- Export database
- Download critical files

---

## 📞 Support

**Hostinger Issues:**
- Open ticket in Hostinger Dashboard
- Live chat support available
- Specify: "Node.js application deployment"

**Application Issues:**
- Check Node.js app logs in cPanel
- Check browser console (F12)
- Verify environment variables

---

## ✅ Deployment Success Criteria

Your deployment is complete when:

- ✅ Frontend loads at your domain (HTTPS)
- ✅ Backend API responds correctly
- ✅ Database connection successful
- ✅ Login works for all user types
- ✅ All features functional (test each)
- ✅ No console errors (F12)
- ✅ SSL certificate active (green padlock)
- ✅ Default passwords changed
- ✅ Backups configured

---

## 🎉 Next Steps After Deployment

1. **Test Everything:**
   - Login as each user type
   - Add test leads
   - Assign leads
   - Add call logs
   - Verify statistics

2. **User Training:**
   - Train staff on system usage
   - Create user guides if needed
   - Set up workflows

3. **Monitoring:**
   - Check daily for errors in logs
   - Monitor server performance
   - Review user activity

4. **Optimization:**
   - Monitor page load times
   - Optimize database queries if needed
   - Scale server resources as needed

---

## 📝 Notes

- Total deployment time: ~20-30 minutes
- No coding knowledge required for deployment
- Follow guides step-by-step
- Keep credentials secure
- Regular backups are essential

---

## 🚨 Emergency Contacts

**Hosting Provider:**
- Hostinger Support: [Your ticket system]

**Developer:**
- [Your contact information]

---

**Last Updated:** January 2026
**Version:** 1.0.0
**Status:** Production Ready ✅

---

Good luck with your deployment! 🚀

For detailed instructions, see:
- 📖 HOSTINGER_DEPLOYMENT_GUIDE.md
- ✅ QUICK_DEPLOYMENT_CHECKLIST.md
