# PostgreSQL Migration Guide for Render Deployment

## Overview

Your CRM application is being migrated from MySQL to PostgreSQL for Render deployment. This guide will help you migrate your existing data.

**Why PostgreSQL?**
- ✅ Render provides FREE PostgreSQL database
- ✅ Automatic backups included
- ✅ Better performance for complex queries
- ✅ No external database configuration needed
- ✅ HTTPS connection built-in

---

## Current Status

✅ **Backend already configured for PostgreSQL!**
- Using `pg` npm package
- database.js already set up
- Ready to connect to Render PostgreSQL

✅ **Schema converted!**
- File: `database_postgresql_schema.sql`
- All tables, indexes, and constraints ready
- Auto-update triggers configured

---

## Migration Options

### Option 1: Fresh Start (Recommended for Testing)

Deploy with empty database and add data manually.

**Steps:**
1. Deploy to Render (database auto-created)
2. Schema automatically applied
3. Login with default admin credentials
4. Add your leads manually or via bulk upload

**Best for:**
- Testing the deployment first
- Small amount of data (<50 leads)
- Learning the new system

---

### Option 2: Data Migration (For Production)

Migrate existing MySQL data to PostgreSQL.

#### Step 1: Export MySQL Data (Your Local Machine)

```bash
# Export only data (no schema) from local MySQL
cd c:\Users\rajpu\OneDrive\Desktop\crm

# This file already exists: database_export.sql
# It has both schema and data
```

#### Step 2: Convert MySQL Data to PostgreSQL Format

Use online converter or manual conversion:

**Online Tool (Easiest):**
- Upload `database_export.sql` to: https://www.rebasedata.com/convert-mysql-to-postgresql-online
- Download PostgreSQL-compatible SQL file

**OR Manual Conversion:**

Create file: `data_migration.sql`

```sql
-- PostgreSQL Data Import (Converted from MySQL)

-- Clear existing data
TRUNCATE TABLE call_history, audit_logs, notifications, telecaller_daily_stats,
                student_applications, other_courses_applications CASCADE;
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE users CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE leads_id_seq RESTART WITH 1;
ALTER SEQUENCE call_history_id_seq RESTART WITH 1;

-- Insert users
INSERT INTO users (id, name, email, password, role, phone, department, status, permissions, created_at, updated_at)
VALUES
(1, 'Super Admin', 'admin@pulseeducation.com', '$2b$10$0t4LV5qLIj6izeIoDg8rc.3D9ruy108.HkIfvxkvWQwantPnsNn4G', 'Super Admin', '+919999999999', 'Management', 'active', '["all"]', '2025-12-30 19:28:18+00', '2025-12-30 19:36:23+00'),
(2, 'Telecaller 1', 'telecaller@pulseeducation.com', '$2b$10$3XlRO/N7fTP3gSr.iqYUg.WoW.HtVaSKUfjuxJuXo4pIoTICcAHNy', 'Telecaller', '+919888888888', 'Sales', 'active', '["view_assigned_leads", "add_call_logs", "update_lead_status"]', '2025-12-30 19:28:18+00', '2026-01-03 18:42:42+00'),
(3, 'vikram', 'rajputvikram470@gmail.com', '$2b$10$FVATfey/NU9xgpWEtxefKOsvhn2y57msa89XHeNYr6jaYO4hN3TyW', 'Telecaller', '+919351445876', 'Telecalling', 'active', '["view_assigned_leads","add_call_logs","update_lead_status"]', '2026-01-04 14:27:31+00', '2026-01-04 14:27:31+00');

-- Update user sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Insert leads (example - you'll need to add all your leads)
INSERT INTO leads (id, name, phone, email, city, neet, course, destination, remark, notes, source, status, assigned_to, assigned_to_name, assigned_date, last_call_date, next_followup_date, is_transferred, created_at, updated_at)
VALUES
(2, 'Rahul Kumar', '9876543210', NULL, 'Delhi', '520', 'MBBS', 'Russia', 'Interested in premium package', NULL, 'Facebook Ad', 'Converted', 2, 'Telecaller 1', '2026-01-04 15:01:43', '2026-01-04 15:03:30', NULL, FALSE, '2025-12-30 20:22:00+00', '2026-01-04 09:33:30+00');
-- Add more leads here...

-- Update leads sequence
SELECT setval('leads_id_seq', (SELECT MAX(id) FROM leads));

-- Insert company settings
INSERT INTO company_settings (id, companyName, email, phone, address, website, timezone, currency)
VALUES (1, 'Study Abroad Consultancy', 'contact@studyabroad.com', '+91 987654321', 'Udaipur, Rajasthan, India', 'www.studyabroad.com', 'Asia/Kolkata', 'INR')
ON CONFLICT (id) DO UPDATE SET
    companyName = EXCLUDED.companyName,
    email = EXCLUDED.email;
```

#### Step 3: Import to Render PostgreSQL

**After Render deployment:**

1. **Get Database Connection String:**
   - Render Dashboard → Your Database → "Info"
   - Copy "External Connection String"

2. **Connect via psql:**
   ```bash
   # Install PostgreSQL client if not installed
   # Then connect:
   psql "postgresql://crm_admin:PASSWORD@dpg-xxxxx.singapore-postgres.render.com/crm_database"
   ```

3. **Import Data:**
   ```sql
   \i data_migration.sql
   ```

4. **Verify:**
   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM leads;
   SELECT * FROM users LIMIT 5;
   ```

---

## Post-Migration Checklist

After deploying to Render:

- [ ] Database created automatically
- [ ] Schema applied from `database_postgresql_schema.sql`
- [ ] Backend connects successfully
- [ ] Login works (admin@pulseeducation.com / admin123)
- [ ] Dashboard loads
- [ ] Can create new leads
- [ ] Can add call logs
- [ ] Data migrated (if Option 2)

---

## Database Schema Differences

### MySQL → PostgreSQL Changes:

| MySQL | PostgreSQL | Notes |
|-------|-----------|-------|
| `int(11) AUTO_INCREMENT` | `SERIAL` | Auto-incrementing IDs |
| `tinyint(1)` | `BOOLEAN` | True/false values |
| `enum('A','B')` | Custom ENUM type | More strict typing |
| `datetime` | `TIMESTAMP` | Timezone-aware |
| `timestamp` | `TIMESTAMP WITH TIME ZONE` | UTC storage |
| `longtext` JSON | `JSONB` | Binary JSON storage |
| `ON UPDATE current_timestamp()` | Trigger function | Auto-update via trigger |

### Key Improvements:

✅ **JSONB instead of JSON:**
- Faster queries
- Can index JSON fields
- Better for complex queries

✅ **Proper BOOLEAN:**
- `TRUE`/`FALSE` instead of `0`/`1`
- More readable code

✅ **Timezone Support:**
- All timestamps stored in UTC
- Auto-converted to local timezone

✅ **ENUMs as Types:**
- Type-safe
- Better validation
- Can't insert invalid values

---

## Render PostgreSQL Limits (Free Plan)

| Feature | Free Plan |
|---------|-----------|
| **Storage** | 1 GB |
| **Connections** | 97 concurrent |
| **Backups** | Daily automatic |
| **Retention** | 7 days |
| **Bandwidth** | Unlimited |
| **Expires** | Never (90 days inactivity) |

**1GB Storage = Approximately:**
- ~10,000 leads with call history
- ~1,000 student applications
- ~500 other course applications
- All with full audit logs

**Upgrade if needed:** $7/month for 10GB

---

## Troubleshooting

### Issue: Schema not applied

**Solution:**
```sql
-- Connect to database
psql "YOUR_CONNECTION_STRING"

-- Run schema manually
\i database_postgresql_schema.sql
```

---

### Issue: Backend can't connect

**Check:**
1. DATABASE_URL environment variable set correctly
2. Connection string includes `ssl=true`
3. Database is in same region as backend (Singapore)

**Test connection:**
```bash
# In Render backend shell
node -e "const {pool} = require('./config/database'); pool.query('SELECT NOW()', (err, res) => { console.log(err || res.rows); process.exit(); });"
```

---

### Issue: Data types don't match

**Common fixes:**
```sql
-- Boolean instead of 0/1
UPDATE leads SET is_transferred = FALSE WHERE is_transferred = 0;

-- NULL dates instead of '0000-00-00'
UPDATE call_history SET next_followup_date = NULL WHERE next_followup_date = '0000-00-00';

-- Enum values must match exactly (case-sensitive)
UPDATE users SET role = 'Telecaller' WHERE role = 'telecaller';
```

---

### Issue: Sequences out of sync

**Fix:**
```sql
-- Reset all sequences to max ID
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('leads_id_seq', (SELECT MAX(id) FROM leads));
SELECT setval('call_history_id_seq', (SELECT MAX(id) FROM call_history));
-- Repeat for all tables with auto-increment IDs
```

---

## Testing Your Migration

### 1. Test Authentication:
```bash
curl -X POST https://crm-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pulseeducation.com","password":"admin123"}'
```

### 2. Test Lead Creation:
```bash
curl -X POST https://crm-backend.onrender.com/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Test Lead","phone":"9999999999","city":"Delhi"}'
```

### 3. Test Database Query:
```sql
-- In psql
SELECT
    u.name as telecaller,
    COUNT(l.id) as total_leads,
    COUNT(CASE WHEN l.status = 'Converted' THEN 1 END) as converted
FROM users u
LEFT JOIN leads l ON l.assigned_to = u.id
WHERE u.role = 'Telecaller'
GROUP BY u.id, u.name;
```

---

## Backup & Restore

### Backup (From Render):
```bash
# Get connection string from Render Dashboard
pg_dump "postgresql://user:pass@host/dbname" > backup.sql
```

### Restore (To Render):
```bash
psql "postgresql://user:pass@host/dbname" < backup.sql
```

---

## Next Steps

1. ✅ Review `database_postgresql_schema.sql`
2. ✅ Choose migration option (Fresh vs Data Migration)
3. ✅ Deploy to Render (will auto-create database)
4. ✅ Test connection and basic operations
5. ✅ Migrate data if needed
6. ✅ Update DNS to point to Render

---

## Support Resources

- **Render PostgreSQL Docs:** https://render.com/docs/databases
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **pgAdmin (GUI Tool):** https://www.pgadmin.org/
- **DBeaver (Universal DB Tool):** https://dbeaver.io/

---

**Migration Status:** Ready for deployment!
**Backend:** ✅ PostgreSQL-compatible
**Schema:** ✅ Converted
**Render Config:** ✅ Updated

🚀 **Ready to deploy!**
