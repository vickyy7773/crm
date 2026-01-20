# MySQL Database Setup Guide

## Prerequisites
You need one of these MySQL servers installed:
- **XAMPP** (Recommended for Windows)
- **WAMP**
- **MySQL Workbench**
- **Laragon**

## Step 1: Start MySQL Server

### Using XAMPP:
1. Open XAMPP Control Panel
2. Click "Start" button next to **MySQL**
3. Wait for it to show "Running" status

### Using WAMP:
1. Start WAMP server
2. Ensure MySQL service is running (green icon)

## Step 2: Access MySQL

### Option A: Using phpMyAdmin (Easiest)
1. Open browser and go to: `http://localhost/phpmyadmin`
2. Login with:
   - Username: `root`
   - Password: (leave empty if default)

### Option B: Using MySQL Command Line
```bash
# Open Command Prompt and navigate to MySQL bin folder
cd C:\xampp\mysql\bin

# Login to MySQL
mysql -u root -p
# Press Enter if no password set
```

## Step 3: Create Database

### Using phpMyAdmin:
1. Click "SQL" tab at the top
2. Paste this command:
```sql
CREATE DATABASE crm_database;
```
3. Click "Go" button

### Using Command Line:
```bash
CREATE DATABASE crm_database;
```

## Step 4: Import Schema

### Using phpMyAdmin:
1. Select `crm_database` from left sidebar
2. Click "SQL" tab
3. Open the file: `backend/config/schema.sql`
4. Copy ALL contents and paste into SQL box
5. Click "Go" button
6. You should see success message

### Using Command Line:
```bash
# Exit MySQL first if you're in it
exit

# Import the schema
mysql -u root -p crm_database < C:\Users\rajpu\OneDrive\Desktop\crm\backend\config\schema.sql

# Press Enter if no password
```

## Step 5: Verify Database Setup

### Using phpMyAdmin:
1. Select `crm_database` from left sidebar
2. You should see 3 tables:
   - ✅ users (with 2 default users)
   - ✅ leads
   - ✅ call_history

### Using MySQL Command Line:
```bash
mysql -u root -p
USE crm_database;
SHOW TABLES;

# Should show:
# +-------------------------+
# | Tables_in_crm_database  |
# +-------------------------+
# | call_history            |
# | leads                   |
# | users                   |
# +-------------------------+
```

## Step 6: Check Default Users

Run this query to see default users:
```sql
SELECT id, name, email, role FROM users;
```

You should see:
| id | name | email | role |
|----|------|-------|------|
| 1 | Super Admin | admin@pulse.com | Super Admin |
| 2 | Telecaller Demo | telecaller@pulse.com | Telecaller |

**Default Login Credentials:**

**Super Admin:**
- Email: `admin@pulse.com`
- Password: `admin123`

**Telecaller:**
- Email: `telecaller@pulse.com`
- Password: `tele123`

## Step 7: Update .env File (if needed)

Check your `backend/.env` file:
```env
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=          # Add your MySQL password if you have one
DB_NAME=crm_database

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**If you have a MySQL password:**
- Update `DB_PASSWORD=your_password`

## Step 8: Start Backend Server

```bash
cd backend
npm start
```

Expected output:
```
✅ Database connected successfully
🚀 Server is running on port 5000
📊 API available at http://localhost:5000/api
🏥 Health check: http://localhost:5000/api/health
💾 Database check: http://localhost:5000/api/health/db
```

## Step 9: Test Database Connection

Open browser or Postman:
- **Server Health:** `http://localhost:5000/api/health`
- **Database Health:** `http://localhost:5000/api/health/db`

Both should return `{ "status": "OK", ... }`

## Step 10: Test Login API

**Using Postman or Thunder Client:**

**Request:**
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@pulse.com",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": 1,
    "name": "Super Admin",
    "email": "admin@pulse.com",
    "role": "Super Admin",
    "permissions": ["all"],
    "status": "active"
  }
}
```

---

## Troubleshooting

### Error: "connect ECONNREFUSED"
- MySQL server is not running
- Start XAMPP/WAMP MySQL service

### Error: "Access denied for user 'root'"
- Wrong password in `.env` file
- Check your MySQL root password

### Error: "Unknown database 'crm_database'"
- Database not created
- Follow Step 3 again

### Error: "Table doesn't exist"
- Schema not imported
- Follow Step 4 again

### Port 5000 already in use
- Change `PORT=5001` in `.env` file
- Restart server

---

## Next Steps After Database Setup

1. ✅ Database is ready
2. ✅ Backend APIs are working
3. 🔄 Next: Update frontend to use real authentication
4. 🔄 Create Telecaller dashboard pages
5. 🔄 Test complete workflow

---

## Quick Commands Reference

```bash
# Start MySQL (XAMPP)
# Open XAMPP Control Panel → Start MySQL

# Check if database exists
mysql -u root -p -e "SHOW DATABASES;"

# Check tables
mysql -u root -p crm_database -e "SHOW TABLES;"

# Check users
mysql -u root -p crm_database -e "SELECT id, name, email, role FROM users;"

# Reset database (WARNING: Deletes all data)
mysql -u root -p -e "DROP DATABASE crm_database; CREATE DATABASE crm_database;"
mysql -u root -p crm_database < backend/config/schema.sql
```

---

**Need Help?** Check the error messages carefully and match them with the Troubleshooting section above.
