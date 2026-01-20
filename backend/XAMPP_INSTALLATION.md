# XAMPP Installation Guide for Windows

## Download XAMPP

**Official Download Link:** https://www.apachefriends.org/download.html

**Choose:**
- XAMPP for Windows (latest version)
- File size: ~150-160 MB
- Version: 8.2.x or higher (includes PHP 8.2 + MySQL/MariaDB)

**Direct Download Link:** https://sourceforge.net/projects/xampp/files/XAMPP%20Windows/

## Installation Steps

### 1. Run Installer
- Double-click the downloaded `.exe` file
- Click "Yes" if Windows asks for permission

### 2. Setup Wizard
**Warning about UAC:**
- If you see UAC warning, click "OK"
- It's recommended to install in `C:\xampp` (default)

### 3. Select Components
**Required Components (Check these):**
- ✅ Apache
- ✅ MySQL
- ✅ PHP
- ✅ phpMyAdmin

**Optional (can uncheck):**
- ❌ Perl
- ❌ Tomcat
- ❌ FileZilla FTP Server
- ❌ Mercury Mail Server
- ❌ Webalizer

### 4. Installation Folder
- Default: `C:\xampp` (recommended)
- Click "Next"

### 5. Language
- Select "English"
- Click "Next"

### 6. Ready to Install
- Uncheck "Learn more about Bitnami" (optional)
- Click "Next"
- Wait for installation (2-5 minutes)

### 7. Finish Installation
- Check "Do you want to start the Control Panel now?"
- Click "Finish"

---

## First Time Setup

### 1. XAMPP Control Panel Opens
You'll see:
- Apache (Web Server)
- MySQL (Database)
- FileZilla
- Mercury
- Tomcat

### 2. Start MySQL
- Click "Start" button next to **MySQL**
- Wait for it to show green highlight and "Running"
- Port: 3306 (default)

### 3. (Optional) Start Apache
- If you want to use phpMyAdmin
- Click "Start" next to **Apache**
- Port: 80 and 443

**If Port 80 is blocked:**
- Skype or other apps might be using it
- You can change Apache port or close those apps

### 4. Test phpMyAdmin
- Open browser
- Go to: `http://localhost/phpmyadmin`
- You should see phpMyAdmin login page
- Username: `root`
- Password: (leave empty)
- Click "Go"

---

## Common Installation Issues

### Issue 1: Port 80 Already in Use
**Error:** "Apache port 80 is already in use"

**Solution Option A - Stop conflicting app:**
```bash
# Open Command Prompt as Administrator
netstat -ano | findstr :80

# Find the PID (Process ID) and kill it
taskkill /PID <number> /F
```

**Solution Option B - Change Apache Port:**
1. XAMPP Control Panel → Apache Config → httpd.conf
2. Find line: `Listen 80`
3. Change to: `Listen 8080`
4. Save and restart Apache
5. Access phpMyAdmin: `http://localhost:8080/phpmyadmin`

### Issue 2: MySQL Won't Start
**Possible causes:**
- Port 3306 already in use
- Another MySQL service running

**Solution:**
```bash
# Open Services (Win + R → services.msc)
# Look for "MySQL" or "MySQL80"
# Right-click → Stop
# Then try starting XAMPP MySQL again
```

### Issue 3: Firewall Blocking
- Windows Firewall might block XAMPP
- When prompted, click "Allow access"
- Or add exception manually in Windows Defender Firewall

---

## After XAMPP is Running

### Quick Check:
1. ✅ XAMPP Control Panel → MySQL shows "Running" (green)
2. ✅ Can access: `http://localhost/phpmyadmin`
3. ✅ Can login with username `root` and no password

### Create Database:
Follow the main setup guide: `SETUP_GUIDE.md`

---

## Alternative: Standalone MySQL (if XAMPP has issues)

If XAMPP gives problems, you can install MySQL directly:

**MySQL Installer:**
- Download: https://dev.mysql.com/downloads/installer/
- Choose: MySQL Installer for Windows
- Install only MySQL Server and MySQL Workbench
- Lighter than XAMPP (~50 MB vs 150 MB)

---

## XAMPP Control Tips

**To make XAMPP start with Windows:**
1. XAMPP Control Panel → Config (top right)
2. Check "Autostart of modules: MySQL"
3. Check "Autostart of modules: Apache" (optional)

**XAMPP Shell (MySQL Command Line):**
1. XAMPP Control Panel → Shell button
2. Type: `mysql -u root -p`
3. Press Enter (no password)

**phpMyAdmin Access:**
- URL: `http://localhost/phpmyadmin`
- Default username: `root`
- Default password: (empty)

---

## After Installation Complete

Return to main setup guide and continue from Step 2:
👉 `SETUP_GUIDE.md` - "Step 2: Access MySQL"

---

**Installation Time:** 5-10 minutes
**Disk Space:** ~500 MB
**Internet Required:** Only for download
