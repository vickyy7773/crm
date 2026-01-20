# 📊 Hostinger Pe Database Kaise Banaye - Complete Guide

---

## STEP 1: Hostinger Login Karo

### 1.1 Website Open Karo
```
Browser mein type karo: https://hostinger.com
Ya: https://hpanel.hostinger.com
```

### 1.2 Login Karo
```
✅ Email/Username enter karo
✅ Password enter karo
✅ "Log In" button click karo
```

---

## STEP 2: cPanel Open Karo

### 2.1 Dashboard Pe Jaao
```
Login ke baad aapko dashboard dikhega
```

### 2.2 Hosting Section
```
Left side menu mein:
✅ "Hosting" pe click karo

Ya

Top menu mein:
✅ "Websites" pe click karo
```

### 2.3 Apni Hosting Select Karo
```
Agar multiple hostings hain:
✅ Jis domain pe CRM install karna hai, usko select karo
✅ "Manage" button pe click karo
```

### 2.4 cPanel Open Karo
```
Dashboard mein neeche scroll karo

"Advanced" section mein dikhega:
✅ "cPanel" ka icon/button
✅ Click karo

Ya

"Database" section mein directly:
✅ "MySQL Databases" option dikhega
✅ Directly click kar sakte ho
```

---

## STEP 3: Database Create Karo (MAIN STEP)

### 3.1 MySQL Databases Pe Jaao

```
cPanel mein search box hai (top right):

┌─────────────────────────────────┐
│ 🔍 Search...                    │
└─────────────────────────────────┘

Type karo: "mysql"

Ya

Scroll karo neeche "Databases" section mein:
✅ "MySQL Databases" pe click karo
```

### 3.2 Create New Database

```
Page open hoga, top pe dikhega:

┌──────────────────────────────────────────┐
│  Create New Database                     │
├──────────────────────────────────────────┤
│  New Database: [____________]  [Create]  │
└──────────────────────────────────────────┘

Steps:
1. Box mein type karo: crm
   (Simple naam, small letters recommended)

2. "Create Database" button pe click karo

3. Success message dikhega:
   ✅ "Added database u123456_crm"

4. IMPORTANT - Ye note kar lo:
   Full name: u123456_crm
   (u123456 automatically add hota hai)
```

**Screenshot Description:**
```
┌────────────────────────────────────────────┐
│ MySQL® Databases                           │
├────────────────────────────────────────────┤
│                                            │
│ Create New Database                        │
│ ┌────────────────────────────────────┐    │
│ │ New Database: crm              [C] │    │
│ └────────────────────────────────────┘    │
│ [Create Database]                          │
│                                            │
│ ✅ Success! Database u123456_crm created  │
└────────────────────────────────────────────┘
```

---

## STEP 4: Database User Create Karo

### 4.1 Create New User

```
Same page pe neeche scroll karo:

┌──────────────────────────────────────────┐
│  MySQL Users                             │
├──────────────────────────────────────────┤
│  Add New User                            │
│                                          │
│  Username: [____________]                │
│  Password: [____________]  [Generate]    │
│  Password (Again): [____________]        │
│                                          │
│  Strength: [████████████] Very Strong   │
│                            [Create User] │
└──────────────────────────────────────────┘

Steps:
1. Username mein type karo: crm_user
   (Ya jo bhi naam dena ho)

2. Password ke liye 2 options:

   Option A (Easy):
   ✅ "Generate" button click karo
   ✅ Strong password automatic ban jayega
   ✅ Copy kar lo (bahut important!)

   Option B (Manual):
   ✅ Khud strong password type karo
   ✅ Same password "Password (Again)" mein bhi
   ✅ Strength "Very Strong" dikhe toh best

3. "Create User" button click karo

4. Success message:
   ✅ "Added user u123456_crm_user"

5. IMPORTANT - Ye note kar lo:
   Username: u123456_crm_user
   Password: jo aapne copy kiya
```

**Screenshot Description:**
```
┌────────────────────────────────────────────┐
│ Add New User                               │
├────────────────────────────────────────────┤
│ Username:        crm_user                  │
│ Password:        ••••••••••    [Generate]  │
│ Password(Again): ••••••••••                │
│                                            │
│ Strength: [████████████] Very Strong      │
│                                            │
│ [Create User]                              │
│                                            │
│ ✅ Success! User u123456_crm_user created │
└────────────────────────────────────────────┘
```

---

## STEP 5: User Ko Database Se Connect Karo (CRITICAL!)

### 5.1 Add User To Database

```
Same page pe neeche scroll karo:

┌──────────────────────────────────────────┐
│  Add User To Database                    │
├──────────────────────────────────────────┤
│  User:     [Select User ▼]              │
│  Database: [Select Database ▼]          │
│                        [Add]             │
└──────────────────────────────────────────┘

Steps:
1. "User" dropdown click karo:
   ✅ u123456_crm_user select karo
   (Jo abhi aapne banaya)

2. "Database" dropdown click karo:
   ✅ u123456_crm select karo
   (Jo pehle banaya tha)

3. "Add" button click karo

4. Naya page open hoga:
   "Manage User Privileges"
```

**Screenshot Description:**
```
┌────────────────────────────────────────────┐
│ Add User To Database                       │
├────────────────────────────────────────────┤
│ User:     u123456_crm_user ▼              │
│ Database: u123456_crm ▼                   │
│                                            │
│ [Add]                                      │
└────────────────────────────────────────────┘
```

### 5.2 Set Privileges (Permissions)

```
"Manage User Privileges" page:

┌──────────────────────────────────────────┐
│  Manage User Privileges                  │
├──────────────────────────────────────────┤
│  ☑ ALL PRIVILEGES  ← CLICK THIS!         │
│                                          │
│  Data                                    │
│  ☑ SELECT                                │
│  ☑ INSERT                                │
│  ☑ UPDATE                                │
│  ☑ DELETE                                │
│                                          │
│  Structure                               │
│  ☑ CREATE                                │
│  ☑ ALTER                                 │
│  ☑ DROP                                  │
│  ☑ INDEX                                 │
│                                          │
│  [Make Changes]                          │
└──────────────────────────────────────────┘

Steps:
1. IMPORTANT: Top pe "ALL PRIVILEGES" checkbox
   ✅ Isko click karo
   ✅ Sabhi permissions automatic select ho jayenge

2. Neeche "Make Changes" button click karo

3. Success message:
   ✅ "User u123456_crm_user was added to database u123456_crm"
```

**Screenshot Description:**
```
┌────────────────────────────────────────────┐
│ Manage User Privileges                     │
├────────────────────────────────────────────┤
│                                            │
│ ☑ ALL PRIVILEGES  ← CLICK THIS!           │
│                                            │
│ Or select individually:                    │
│ ☑ SELECT    ☑ INSERT    ☑ UPDATE          │
│ ☑ DELETE    ☑ CREATE    ☑ ALTER           │
│ ☑ DROP      ☑ INDEX     ☑ CREATE TMP      │
│                                            │
│ [Make Changes]                             │
│                                            │
│ ✅ Privileges saved successfully!         │
└────────────────────────────────────────────┘
```

---

## ✅ DONE! Database Ready Hai

### Aapke paas ab ye details hain:

```
┌────────────────────────────────────────────┐
│  Your Database Details (SAVE THESE!)       │
├────────────────────────────────────────────┤
│                                            │
│  DB_HOST:     localhost                    │
│  DB_USER:     u123456_crm_user             │
│  DB_PASSWORD: [jo aapne set kiya]          │
│  DB_NAME:     u123456_crm                  │
│                                            │
│  ⚠️ In details ko safe jagah save karo!   │
└────────────────────────────────────────────┘
```

---

## STEP 6: Verify Karo (Optional but Recommended)

### 6.1 Check Database List

```
Same MySQL Databases page pe:

┌──────────────────────────────────────────┐
│  Current Databases                       │
├──────────────────────────────────────────┤
│  Database Name          Size     Actions │
├──────────────────────────────────────────┤
│  u123456_crm           0.00 MB   [Check] │
└──────────────────────────────────────────┘

✅ Aapka database list mein dikhe toh sahi hai
```

### 6.2 Check User List

```
┌──────────────────────────────────────────┐
│  Current Users                           │
├──────────────────────────────────────────┤
│  Username               Actions          │
├──────────────────────────────────────────┤
│  u123456_crm_user      [Delete] [Edit]   │
└──────────────────────────────────────────┘

✅ Aapka user list mein dikhe toh sahi hai
```

### 6.3 phpMyAdmin Se Test Karo

```
cPanel mein:

1. Search karo: "phpmyadmin"
   Ya "Databases" section mein "phpMyAdmin" pe click

2. phpMyAdmin open hoga

3. Left side mein database list:
   ✅ u123456_crm dikhe toh perfect!

4. Click karke open karo:
   ✅ Abhi koi table nahi hoga (empty)
   ✅ Ye normal hai
   ✅ Tables import ke baad aayenge
```

---

## 📝 Important Notes Yaad Rakho

### ⚠️ Database Prefix
```
Hostinger automatically prefix add karta hai:

Aap type karo:     crm
Save hota hai:     u123456_crm

Aap type karo:     crm_user
Save hota hai:     u123456_crm_user

Ye normal hai! Prefix har hosting account ka alag hota hai.
```

### ⚠️ Password Save Karo
```
Password ek baar hi dikhta hai!

✅ Immediately copy karo
✅ Notepad mein save karo
✅ Ya screenshot lo

Agar bhul gaye:
- User delete karo
- Naya user banao with new password
```

### ⚠️ ALL PRIVILEGES Zaruri Hai
```
Agar ALL PRIVILEGES nahi diye:
❌ Database import fail hoga
❌ Tables create nahi honge
❌ Application error dega

✅ Hamesha ALL PRIVILEGES select karo
```

---

## 🎯 Quick Summary - Pure Steps

```
1. Hostinger login → Dashboard

2. Hosting select → cPanel open

3. MySQL Databases pe jaao

4. Create Database:
   - Name: crm
   - Note: u123456_crm

5. Create User:
   - Username: crm_user
   - Password: Generate/Enter
   - Note: u123456_crm_user & password

6. Add User To Database:
   - User: u123456_crm_user
   - Database: u123456_crm
   - Click Add

7. Set Privileges:
   - Check: ALL PRIVILEGES
   - Click: Make Changes

8. Done! Database ready!
```

---

## ✅ Credentials Note Karne Ka Format

```
Ye copy karke notepad mein save karo:

===========================================
HOSTINGER DATABASE DETAILS
===========================================

Created Date: 4 Jan 2026

DB_HOST: localhost
DB_USER: [paste your u123456_crm_user]
DB_PASSWORD: [paste your password]
DB_NAME: [paste your u123456_crm]

cPanel URL: https://cpanel.yourdomain.com
phpMyAdmin: https://yourdomain.com/phpmyadmin

===========================================
⚠️ KEEP THIS SECURE - DON'T SHARE!
===========================================
```

---

## 🆘 Common Problems & Solutions

### Problem 1: "Database already exists"
```
FIX:
- Different naam try karo: crm_new, crm2, mycrm
- Ya existing database use karo
```

### Problem 2: Password bhul gaye
```
FIX:
- User delete karo (Current Users section mein)
- Naya user banao
- Same steps repeat karo
```

### Problem 3: Privileges set nahi ho rahe
```
FIX:
- "Add User To Database" step dobara karo
- ALL PRIVILEGES confirm karo
- "Make Changes" zaroor click karo
```

### Problem 4: Database list mein nahi dikh raha
```
FIX:
- Page refresh karo (F5)
- Ya logout karke login karo
- cPanel dashboard se dobara MySQL Databases open karo
```

---

## 📸 Visual Guide Summary

```
Step 1: Login
┌──────────────┐
│ Hostinger.com│
│ [Login Page] │
└──────────────┘
       ↓

Step 2: Dashboard
┌──────────────┐
│  Dashboard   │
│  Hosting →   │
│  Manage →    │
└──────────────┘
       ↓

Step 3: cPanel
┌──────────────┐
│   cPanel     │
│ MySQL Dbs →  │
└──────────────┘
       ↓

Step 4: Create Database
┌──────────────────┐
│ Name: crm        │
│ [Create Database]│
│ ✅ u123456_crm   │
└──────────────────┘
       ↓

Step 5: Create User
┌──────────────────┐
│ User: crm_user   │
│ Pass: [generate] │
│ [Create User]    │
│ ✅ u123456_...   │
└──────────────────┘
       ↓

Step 6: Connect
┌──────────────────┐
│ Add User to DB   │
│ ALL PRIVILEGES ✅│
│ [Make Changes]   │
└──────────────────┘
       ↓

✅ DONE!
```

---

## 🎉 Next Step

Database ban gaya? Perfect!

Ab next:
1. **[UPLOAD_KAISE_KARE.md](UPLOAD_KAISE_KARE.md)** open karo
2. "STEP 1.3 Import Database" se continue karo
3. SQL file upload karo

---

**Total Time:** 5 minutes
**Difficulty:** Easy
**Cost:** Free (included in hosting)

Koi problem ho toh screenshot bhejo! 📸
