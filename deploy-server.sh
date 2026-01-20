#!/bin/bash
# ========================================
# CRM Backend Deployment Script
# ========================================
# Run this script on your Hostinger server after uploading files
# Usage: bash deploy-server.sh YOUR_MYSQL_PASSWORD YOUR_FRONTEND_URL

set -e

echo "🚀 Starting CRM Backend Deployment..."

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root (or with sudo)"
  exit 1
fi

# Get parameters
MYSQL_PASSWORD="$1"
FRONTEND_URL="$2"

if [ -z "$MYSQL_PASSWORD" ] || [ -z "$FRONTEND_URL" ]; then
  echo "❌ Usage: bash deploy-server.sh MYSQL_PASSWORD FRONTEND_URL"
  echo "   Example: bash deploy-server.sh mypassword123 https://yourdomain.com"
  exit 1
fi

echo "📦 Parameters received:"
echo "   MySQL Password: ****"
echo "   Frontend URL: $FRONTEND_URL"

# ========================================
# Step 1: Extract backend files
# ========================================
echo ""
echo "📂 Step 1: Extracting backend files..."

cd /root

if [ -f "backend.tar.gz" ]; then
  tar -xzf backend.tar.gz
  echo "✅ Backend files extracted"
else
  echo "⚠️  backend.tar.gz not found, assuming backend folder already exists"
fi

# ========================================
# Step 2: Setup MySQL Database
# ========================================
echo ""
echo "🗄️  Step 2: Setting up MySQL database..."

# Create database and user
mysql -u root <<MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS pulsembbs_crm;
CREATE USER IF NOT EXISTS 'pulsembbs_crm_user'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON pulsembbs_crm.* TO 'pulsembbs_crm_user'@'localhost';
FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo "✅ Database and user created"

# Import database
if [ -f "/root/database_export.sql" ]; then
  echo "📥 Importing database..."
  mysql -u pulsembbs_crm_user -p"$MYSQL_PASSWORD" pulsembbs_crm < /root/database_export.sql
  echo "✅ Database imported successfully"
else
  echo "❌ database_export.sql not found!"
  exit 1
fi

# ========================================
# Step 3: Configure Environment
# ========================================
echo ""
echo "⚙️  Step 3: Configuring environment..."

cd /root/backend

# Create .env file
cat > .env <<ENV
# Database Configuration
DB_HOST=localhost
DB_USER=pulsembbs_crm_user
DB_PASSWORD=$MYSQL_PASSWORD
DB_NAME=pulsembbs_crm

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Secret
JWT_SECRET=2cb4a512d36045d37d2b1eaf955b0fcffb08edab8eedf9616aa5715adbb7d7c1

# Frontend URL
FRONTEND_URL=$FRONTEND_URL
ENV

echo "✅ .env file created"

# ========================================
# Step 4: Install Node.js Dependencies
# ========================================
echo ""
echo "📦 Step 4: Installing dependencies..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "❌ npm not found! Please install Node.js first"
  exit 1
fi

npm install --production

echo "✅ Dependencies installed"

# ========================================
# Step 5: Create uploads directory
# ========================================
echo ""
echo "📁 Step 5: Creating uploads directory..."

mkdir -p uploads
chmod 755 uploads

echo "✅ Uploads directory created"

# ========================================
# Step 6: Test the application
# ========================================
echo ""
echo "🧪 Step 6: Testing application..."

# Test if server starts (run for 3 seconds)
timeout 3 node server.js || true

if [ $? -eq 124 ]; then
  echo "✅ Server test successful (timeout as expected)"
else
  echo "⚠️  Server test completed"
fi

# ========================================
# Step 7: Setup PM2 (if available)
# ========================================
echo ""
echo "🔄 Step 7: Setting up process manager..."

if command -v pm2 &> /dev/null; then
  echo "Using PM2..."
  pm2 delete crm-backend 2>/dev/null || true
  pm2 start server.js --name crm-backend
  pm2 save
  pm2 startup
  echo "✅ PM2 configured"
else
  echo "⚠️  PM2 not installed. Install with: npm install -g pm2"
  echo "   For now, start manually with: node server.js"
fi

# ========================================
# Deployment Complete
# ========================================
echo ""
echo "✅ =========================================="
echo "✅  DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "✅ =========================================="
echo ""
echo "📋 Next Steps:"
echo "   1. Test API: curl http://localhost:5000/api/health"
echo "   2. Test DB: curl http://localhost:5000/api/health/db"
echo "   3. Start server: node server.js (or pm2 start server.js)"
echo ""
echo "📊 Default Admin Login:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "🔒 Security Reminder:"
echo "   - Change admin password immediately"
echo "   - Never commit .env to git"
echo "   - Setup regular database backups"
echo ""
echo "📂 Backend Location: /root/backend"
echo "🗄️  Database: pulsembbs_crm"
echo "🌐 Frontend: $FRONTEND_URL"
echo ""
