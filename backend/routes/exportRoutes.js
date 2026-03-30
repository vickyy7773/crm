const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Export leads as CSV
router.get('/leads-csv', async (req, res) => {
  try {
    const query = `
      SELECT
        l.id,
        l.name,
        l.phone,
        l.city,
        l.destination,
        l.status,
        l.remark,
        l.assigned_to_name,
        l.next_followup_date,
        l.created_at,
        l.updated_at
      FROM leads l
      ORDER BY l.created_at DESC
    `;

    const [leads] = await pool.query(query);

    // Create CSV header
    const csvHeader = 'ID,Name,Phone,City,Destination,Status,Remark,Assigned To,Next Follow-up,Created At,Updated At\n';

    // Create CSV rows
    const csvRows = leads.map(lead => {
      return [
        lead.id,
        `"${(lead.name || '').replace(/"/g, '""')}"`,
        lead.phone || '',
        `"${(lead.city || '').replace(/"/g, '""')}"`,
        `"${(lead.destination || '').replace(/"/g, '""')}"`,
        lead.status || '',
        `"${(lead.remark || '').replace(/"/g, '""')}"`,
        `"${(lead.assigned_to_name || 'Unassigned').replace(/"/g, '""')}"`,
        lead.next_followup_date || '',
        lead.created_at || '',
        lead.updated_at || ''
      ].join(',');
    }).join('\n');

    const csvContent = csvHeader + csvRows;

    const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting leads to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export leads',
      error: error.message
    });
  }
});

// Create database backup (SQL dump)
router.get('/database-backup', async (req, res) => {
  try {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME;

    if (!dbUser || !dbName) {
      return res.status(500).json({
        success: false,
        message: 'Database credentials not configured'
      });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `crm_backup_${timestamp}.sql`;
    const backupPath = path.join(__dirname, '..', 'backups', filename);

    // Create backups directory if it doesn't exist
    const backupsDir = path.join(__dirname, '..', 'backups');
    try {
      await fs.mkdir(backupsDir, { recursive: true });
    } catch (err) {
      // Directory might already exist, ignore error
    }

    // Use mysqldump to create backup
    const mysqldumpPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
    const passwordFlag = dbPassword ? `-p${dbPassword}` : '';
    const command = `"${mysqldumpPath}" -h ${dbHost} -u ${dbUser} ${passwordFlag} ${dbName} > "${backupPath}"`;

    exec(command, async (error, stdout, stderr) => {
      if (error) {
        console.error('Backup error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create database backup',
          error: error.message
        });
      }

      try {
        const backupContent = await fs.readFile(backupPath, 'utf8');

        res.setHeader('Content-Type', 'application/sql');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        res.send(backupContent);

        setTimeout(async () => {
          try {
            await fs.unlink(backupPath);
          } catch (err) {
            console.error('Error deleting temp backup file:', err);
          }
        }, 1000);
      } catch (readError) {
        console.error('Error reading backup file:', readError);
        res.status(500).json({
          success: false,
          message: 'Failed to read backup file',
          error: readError.message
        });
      }
    });
  } catch (error) {
    console.error('Error creating database backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create database backup',
      error: error.message
    });
  }
});

module.exports = router;
