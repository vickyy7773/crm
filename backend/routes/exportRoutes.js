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
        l.father_name,
        l.phone,
        l.email,
        l.city,
        l.source,
        l.course,
        l.neet,
        l.other_score,
        l.destination,
        l.status,
        l.remark,
        l.assigned_to_name,
        l.next_followup_date,
        ch.call_outcome   AS last_call_outcome,
        ch.call_reason    AS last_call_reason,
        ch.call_remark    AS last_call_remark,
        ch.caller_name    AS last_caller,
        ch.call_date      AS last_call_date,
        l.created_at,
        l.updated_at
      FROM leads l
      LEFT JOIN (
        SELECT lead_id, call_outcome, call_reason, call_remark, caller_name, call_date
        FROM call_history
        WHERE id IN (
          SELECT MAX(id) FROM call_history GROUP BY lead_id
        )
      ) ch ON ch.lead_id = l.id
      ORDER BY l.created_at DESC
    `;

    const [leads] = await pool.query(query);

    const esc = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
    const fmt = (val) => val || '';

    const csvHeader = [
      'ID', 'Student Name', 'Father Name', 'Phone', 'Email',
      'City', 'Source', 'Course', 'NEET Score', 'Other Score',
      'Destination', 'Status', 'Remark', 'Assigned To', 'Next Follow-up',
      'Last Call Outcome', 'Last Call Reason', 'Last Call Remark', 'Last Caller', 'Last Call Date',
      'Created At', 'Updated At'
    ].join(',') + '\n';

    const csvRows = leads.map(lead => [
      fmt(lead.id),
      esc(lead.name),
      esc(lead.father_name),
      fmt(lead.phone),
      esc(lead.email),
      esc(lead.city),
      esc(lead.source),
      esc(lead.course),
      esc(lead.neet),
      esc(lead.other_score),
      esc(lead.destination),
      esc(lead.status),
      esc(lead.remark),
      esc(lead.assigned_to_name || 'Unassigned'),
      fmt(lead.next_followup_date),
      esc(lead.last_call_outcome),
      esc(lead.last_call_reason),
      esc(lead.last_call_remark),
      esc(lead.last_caller),
      fmt(lead.last_call_date),
      fmt(lead.created_at),
      fmt(lead.updated_at)
    ].join(',')).join('\n');

    const filename = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('﻿' + csvHeader + csvRows); // BOM for Excel UTF-8
  } catch (error) {
    console.error('Error exporting leads to CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export leads',
      error: error.message
    });
  }
});

// Create database backup (pure JS SQL dump — no mysqldump binary required)
router.get('/database-backup', async (req, res) => {
  try {
    const dbName = process.env.DB_NAME;
    if (!dbName) {
      return res.status(500).json({ success: false, message: 'Database name not configured' });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `crm_backup_${timestamp}.sql`;

    let sql = `-- CRM Database Backup\n-- Generated: ${new Date().toISOString()}\n-- Database: ${dbName}\n\nSET FOREIGN_KEY_CHECKS=0;\n\n`;

    // Get all tables in the database
    const [tables] = await pool.query('SHOW TABLES');
    const tableKey = `Tables_in_${dbName}`;

    for (const tableRow of tables) {
      const tableName = tableRow[tableKey];

      // Get CREATE TABLE statement
      const [[createResult]] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSQL = createResult['Create Table'];
      sql += `-- Table: ${tableName}\nDROP TABLE IF EXISTS \`${tableName}\`;\n${createSQL};\n\n`;

      // Get all rows
      const [rows] = await pool.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const columns = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
        const valuesList = rows.map(row => {
          const vals = Object.values(row).map(val => {
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return `'${String(val).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
          });
          return `(${vals.join(', ')})`;
        });
        sql += `INSERT INTO \`${tableName}\` (${columns}) VALUES\n${valuesList.join(',\n')};\n\n`;
      }
    }

    sql += 'SET FOREIGN_KEY_CHECKS=1;\n';

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(sql);
  } catch (error) {
    console.error('Error creating database backup:', error);
    res.status(500).json({ success: false, message: 'Failed to create backup', error: error.message });
  }
});

module.exports = router;
