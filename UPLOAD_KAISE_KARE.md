# 🚀 Hostinger Pe Upload Kaise Kare - Simple Steps

## ✅ Jo kaam ho chuka hai (by me):

- ✅ Database export: `crm_database_export.sql` (15 KB)
- ✅ Frontend build: `dist` folder (production ready)
- ✅ JWT Secret generated: `2cb4a512d36045d37d2b1eaf955b0fcffb08edab8eedf9616aa5715adbb7d7c1`
- ✅ Configuration files ready
- ✅ .htaccess ready

---

## 📋 Ab aapko sirf ye 3 kaam karne hain:

---

## STEP 1: Database Setup (5 minutes)

### 1.1 Login Hostinger cPanel
```
1. Hostinger.com pe login karo
2. Dashboard → Hosting → Manage
3. cPanel button pe click karo
```

### 1.2 Create Database
```
cPanel mein:

1. "Databases" section → "MySQL Databases" pe click

2. "Create New Database" mein:
   - Database name: crm
   - Click "Create Database"
   - COPY karo full name (format: u123456_crm)

3. "Create New User" mein:
   - Username: crm_user
   - Password: [apna strong password]
   - Click "Create User"
   - COPY karo full username (format: u123456_crm_user)

4. "Add User To Database":
   - User select karo: u123456_crm_user
   - Database select karo: u123456_crm
   - Click "Add"
   - ✅ Check "ALL PRIVILEGES"
   - Click "Make Changes"

5. IMPORTANT - Ye note kar lo:
   ✅ Database Name: u123456_crm
   ✅ Username: u123456_crm_user
   ✅ Password: jo aapne banaya
   ✅ Host: localhost
```

### 1.3 Import Database
```
cPanel mein:

1. "phpMyAdmin" pe click karo (left sidebar mein)

2. Left side mein apna database select karo (u123456_crm)

3. Top menu mein "Import" tab pe click

4. "Choose File" pe click:
   - Location: C:\Users\rajpu\OneDrive\Desktop\crm\
   - File: crm_database_export.sql
   - Select karo

5. Niche scroll karo → "Go" button click

6. ✅ Success message dikhe toh done!
```

---

## STEP 2: Files Upload (10 minutes)

### 2.1 Backend Files Upload

```
cPanel → File Manager:

1. "public_html" folder open karo

2. "api" naam ka naya folder banao:
   - Click "+ Folder" (top left)
   - Name: api
   - Click "Create New Folder"

3. "api" folder ke andar jaao

4. Upload karo ye sab files:

LOCAL PATH: C:\Users\rajpu\OneDrive\Desktop\crm\backend\



❌ node_modules/ (skip)
❌ .env (abhi nahi, baad mein)

Upload karne ke liye:
- Click "Upload" button (top menu)
- Drag & drop ya "Select Files"
- Wait for upload complete
```

### 2.2 Create .env File

```
File Manager mein (api folder ke andar):

1. Click "+ File" button
2. File name: .env
3. Click "Create New File"

4. Right click on .env → Edit

5. Ye content paste karo:

---COPY FROM HERE---
DB_HOST=localhost
DB_USER=APNA_DB_USER_YAHA_DALE
DB_PASSWORD=APNA_DB_PASSWORD_YAHA_DALE
DB_NAME=APNA_DB_NAME_YAHA_DALE
PORT=5000
NODE_ENV=production
JWT_SECRET=2cb4a512d36045d37d2b1eaf955b0fcffb08edab8eedf9616aa5715adbb7d7c1
FRONTEND_URL=APNA_DOMAIN_YAHA_DALE
---COPY TILL HERE---

6. Replace karo:
   - APNA_DB_USER_YAHA_DALE → Step 1.2 se copy kiya hua username
   - APNA_DB_PASSWORD_YAHA_DALE → Step 1.2 ka password
   - APNA_DB_NAME_YAHA_DALE → Step 1.2 se copy kiya hua database name
   - APNA_DOMAIN_YAHA_DALE → yourdomain.com (https:// ke saath)

Example:
DB_USER=u123456_crm_user
DB_PASSWORD=MyStr0ng!Pass
DB_NAME=u123456_crm
FRONTEND_URL=https://crm.yourdomain.com

7. Click "Save Changes"
8. Close editor
```

### 2.3 Frontend Files Upload

```
File Manager mein:

1. Wapas "public_html" folder mein jaao (back button)

2. Upload karo:

LOCAL PATH: C:\Users\rajpu\OneDrive\Desktop\crm\dist\

UPLOAD SABKUCH:
✅ index.html
✅ assets/ (folder) → pura folder upload

NOTE: dist ke ANDAR ki files upload karo,
      dist folder khud mat upload karo

Result:
public_html/
  ├── index.html
  └── assets/
      ├── index-xxx.css
      └── index-xxx.js
```

### 2.4 .htaccess Upload

```
File Manager mein (public_html ke andar):

1. Click "+ File"
2. Name: .htaccess
3. Click "Create New File"

4. Right click → Edit

5. Paste this content:

---COPY FROM HERE---
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{REQUEST_URI} ^/api
  RewriteRule ^ - [L]

  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l

  RewriteRule ^ /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
  Header set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
  Header set Access-Control-Allow-Headers "Content-Type, Authorization"
</IfModule>
---COPY TILL HERE---

6. Save Changes
```

---

## STEP 3: Node.js Setup (5 minutes)

### 3.1 Setup Node.js App

```
cPanel mein:

1. Search box mein type karo: "setup nodejs"

2. "Setup Node.js App" pe click

3. Click "CREATE APPLICATION" button (green)

4. Fill karo:

   Node.js version: 18.x (ya jo latest available ho)

   Application mode: Production

   Application root: /home/username/public_html/api
                     (ya directly select karo file manager se)

   Application URL: yourdomain.com/api

   Application startup file: server.js

   Passenger log file: (leave default)

5. Click "CREATE" button

6. Wait... (30 seconds tak)

7. ✅ App show hoga in list
```

### 3.2 Install Dependencies

```
Node.js App screen mein:

1. "Run NPM Install" button pe click

2. Wait... (1-2 minutes)

3. ✅ "Installed" status dikhe
```

### 3.3 Environment Variables Add

```
Same screen mein:

1. "Environment Variables" section mein

2. Click "Add Variable" (8 baar - har variable ke liye)

Add these one by one:

Key: DB_HOST          Value: localhost
Key: DB_USER          Value: u123456_crm_user (apna wala)
Key: DB_PASSWORD      Value: your_password (apna wala)
Key: DB_NAME          Value: u123456_crm (apna wala)
Key: PORT             Value: 5000
Key: NODE_ENV         Value: production
Key: JWT_SECRET       Value: 2cb4a512d36045d37d2b1eaf955b0fcffb08edab8eedf9616aa5715adbb7d7c1
Key: FRONTEND_URL     Value: https://yourdomain.com (apna domain)

3. Save each variable
```

### 3.4 Start Application

```
1. Top pe green "START APP" button

2. Click karo

3. Wait... (10 seconds)

4. ✅ Status change hoga: "Running" (green dot)
```

---

## ✅ TESTING - Kaam kar raha hai ya nahi?

### Test 1: Backend API

```
Browser mein open karo:

https://yourdomain.com/api/health

✅ EXPECTED RESULT:
{
  "status": "OK",
  "message": "CRM Backend API is running"
}

Agar ye dikhe toh backend working! 🎉
```

### Test 2: Database Connection

```
Browser mein:

https://yourdomain.com/api/health/db

✅ EXPECTED RESULT:
{
  "status": "OK",
  "message": "Database connection successful"
}

Agar ye dikhe toh database connected! 🎉
```

### Test 3: Frontend

```
Browser mein:

https://yourdomain.com

✅ EXPECTED RESULT:
- Login page load ho
- Koi error na ho (F12 press karke console check karo)

Login try karo:
Email: admin@pulseeducation.com
Password: admin123

✅ Dashboard load ho toh PERFECT! 🚀
```

---

## ❌ Agar kuch problem ho:

### Problem 1: White Screen

```
FIX:
1. F12 press karo → Console tab
2. Error ka screenshot bhejo mujhe
3. Check karo: src/config/api.js mein domain correct hai?
```

### Problem 2: API 404 Error

```
FIX:
1. cPanel → Setup Node.js App
2. Check: Status "Running" hai?
3. Nahi hai toh "Restart" button click
4. Environment variables check karo
```

### Problem 3: Database Error

```
FIX:
1. .env file check karo
2. DB credentials sahi hain?
3. phpMyAdmin mein login try karo same credentials se
```

---

## 🎯 Quick Checklist

Tick karte jao:

### Database:
- [ ] Database created
- [ ] User created and added to database
- [ ] SQL file imported
- [ ] All tables visible in phpMyAdmin

### Files:
- [ ] Backend files in public_html/api/
- [ ] .env file created with correct values
- [ ] Frontend files in public_html/
- [ ] .htaccess file created

### Node.js:
- [ ] Application created
- [ ] Dependencies installed
- [ ] Environment variables added
- [ ] App started (Status: Running)

### Testing:
- [ ] /api/health returns OK
- [ ] /api/health/db returns OK
- [ ] Frontend loads
- [ ] Login works

---

## 🆘 Help Needed?

Agar kisi bhi step mein problem:

1. Screenshot lo
2. Error message copy karo
3. Mujhe bhejo

Main immediately help karunga! 💪

---

## 📝 Important Files Location

```
Local Machine:
C:\Users\rajpu\OneDrive\Desktop\crm\

Database: crm_database_export.sql
Frontend: dist\ folder
Backend: backend\ folder
JWT Secret: Already in .env template
```

---

## 🎉 Success!

Agar sab kaam kar gaya toh:

1. Password change karo (admin account ka)
2. Test karo sabkuch
3. Enjoy your live CRM! 🚀

---

**Total Time:** 20-25 minutes
**Difficulty:** Easy (bas copy-paste)
**Help Available:** Mujhe zarurat pade toh batana!

Good luck! 💪
