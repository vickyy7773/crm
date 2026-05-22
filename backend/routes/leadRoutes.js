const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const { createNotification } = require('./notificationRoutes');
const { logAudit, getIpAddress } = require('../utils/auditLogger');

// Multer configuration for CSV upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET all leads (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { status, assigned_to, city, destination, search } = req.query;

    // Modified query to include latest call remark using LEFT JOIN with subquery
    let query = `
      SELECT
        leads.*,
        ch.call_remark as latest_call_remark,
        ch.call_date as latest_call_date,
        ch.call_reason as latest_call_reason,
        ch.call_outcome as latest_call_outcome
      FROM leads
      LEFT JOIN (
        SELECT
          lead_id,
          call_remark,
          call_date,
          call_reason,
          call_outcome,
          ROW_NUMBER() OVER (PARTITION BY lead_id ORDER BY call_date DESC) as rn
        FROM call_history
      ) ch ON ch.lead_id = leads.id AND ch.rn = 1
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND leads.status = ?`;
      params.push(status);
    }

    if (assigned_to) {
      query += ` AND assigned_to = ?`;
      params.push(assigned_to);
    }

    if (city) {
      query += ` AND city = ?`;
      params.push(city);
    }

    if (destination) {
      query += ` AND destination = ?`;
      params.push(destination);
    }

    if (search) {
      query += ` AND (name LIKE ? OR phone LIKE ? OR city LIKE ? OR source LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leads',
      error: error.message
    });
  }
});

// GET leads assigned to specific user (Telecaller)
router.get('/assigned/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, search } = req.query;

    let query = `
      SELECT
        leads.*,
        ch.call_remark as latest_call_remark,
        ch.call_date as latest_call_date,
        ch.call_reason as latest_call_reason,
        ch.call_outcome as latest_call_outcome
      FROM leads
      LEFT JOIN (
        SELECT lead_id, call_remark, call_date, call_reason, call_outcome,
          ROW_NUMBER() OVER (PARTITION BY lead_id ORDER BY call_date DESC) as rn
        FROM call_history
      ) ch ON ch.lead_id = leads.id AND ch.rn = 1
      WHERE leads.assigned_to = ?
    `;
    const params = [userId];

    if (status && status !== 'all') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (leads.name LIKE ? OR leads.phone LIKE ? OR leads.city LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY leads.next_followup_date ASC, leads.created_at DESC';

    const [rows] = await pool.query(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows
    });
  } catch (error) {
    console.error('Get assigned leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching assigned leads',
      error: error.message
    });
  }
});

// GET today's and overdue follow-ups for telecaller
router.get('/follow-ups/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(
      `SELECT * FROM leads
       WHERE assigned_to = ?
         AND next_followup_date IS NOT NULL
         AND next_followup_date <= NOW() + INTERVAL 1 DAY
         AND is_transferred = FALSE
       ORDER BY next_followup_date ASC`,
      [userId]
    );

    // Separate into today and overdue
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayLeads = [];
    const overdueLeads = [];

    rows.forEach(lead => {
      const followUpDate = new Date(lead.next_followup_date);
      if (followUpDate < today) {
        overdueLeads.push(lead);
      } else {
        todayLeads.push(lead);
      }
    });

    res.json({
      success: true,
      data: {
        today: todayLeads,
        overdue: overdueLeads,
        total: rows.length
      }
    });
  } catch (error) {
    console.error('Get follow-ups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching follow-ups',
      error: error.message
    });
  }
});

// GET all converted leads (accessible to all roles)
// IMPORTANT: This route must be BEFORE /:id to avoid route conflicts
router.get('/converted', async (req, res) => {
  try {
    const query = `
      SELECT * FROM leads
      WHERE status = 'Converted'
      ORDER BY updated_at DESC
    `;

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching converted leads:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch converted leads',
      error: error.message
    });
  }
});

// GET call history for a specific lead
router.get('/:id/call-history', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        ch.*,
        l.name as lead_name,
        l.phone as lead_phone,
        l.next_followup_date
      FROM call_history ch
      JOIN leads l ON ch.lead_id = l.id
      WHERE ch.lead_id = ?
      ORDER BY ch.call_date DESC
    `;

    const [rows] = await pool.query(query, [id]);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching call history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch call history',
      error: error.message
    });
  }
});

// GET single lead by ID
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Get call history for this lead
    const [callHistoryRows] = await pool.query(
      'SELECT * FROM call_history WHERE lead_id = ? ORDER BY call_date DESC',
      [req.params.id]
    );

    const leadData = {
      ...rows[0],
      callHistory: callHistoryRows
    };

    res.json({
      success: true,
      data: leadData
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching lead',
      error: error.message
    });
  }
});

// POST new lead
router.post('/', async (req, res) => {
  try {
    const {
      name,
      phone,
      city,
      neet,
      course,
      destination,
      remark,
      source,
      father_name
    } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required fields'
      });
    }

    // Check for duplicate phone number
    const [existing] = await pool.query('SELECT id FROM leads WHERE phone = ?', [phone.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: `A lead with phone number ${phone} already exists (Lead #${1000 + existing[0].id})`
      });
    }

    // Ensure course is null for raw leads
    const courseValue = course ? course : null;

    const [insertResult] = await pool.query(
      `INSERT INTO leads (
        name, father_name, phone, city, neet, course, destination, remark, source, status, assigned_to_name, imported_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', 'Unassigned', ?)`,
      [
        name,
        father_name || null,
        phone,
        city || null,
        neet || null,
        courseValue,
        destination || null,
        remark || null,
        source || null,
        new Date().toLocaleString()
      ]
    );

    const newLeadId = insertResult.insertId;
    const [newLeadRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [newLeadId]);

    // Create notification for new lead (visible to all users)
    await createNotification({
      userId: null, // null means all users can see this
      type: 'new_lead',
      title: 'New Lead Added',
      message: `${name} submitted inquiry for ${course || 'MBBS'} in ${destination || 'abroad'}`,
      leadId: newLeadId,
      leadName: name
    });

    // Log audit trail
    await logAudit({
      userId: req.body.createdBy || null,
      userName: req.body.createdByName || 'System',
      action: 'CREATE',
      entityType: 'Lead',
      entityId: newLeadId,
      details: { name, phone, city, course, destination, source },
      ipAddress: getIpAddress(req),
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: newLeadRows[0]
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating lead',
      error: error.message
    });
  }
});

// POST CSV import - JSON data (from frontend CSV parsing)
router.post('/import', async (req, res) => {
  try {
    // Check if JSON data is sent
    if (req.body.leads && Array.isArray(req.body.leads)) {
      const leadsData = req.body.leads;
      await importLeadsToDatabase(leadsData, res);
    } else {
      return res.status(400).json({
        success: false,
        message: 'No leads data provided. Expected { leads: [...] }'
      });
    }
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing leads',
      error: error.message
    });
  }
});

// POST bulk-upload (alias for /import/file used by frontend)
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const results = [];
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => { await importLeadsToDatabase(results, res, req.body.source || null); });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ success: false, message: 'Error uploading file', error: error.message });
  }
});

// POST CSV file upload (alternative method)
router.post('/import/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const results = [];
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    bufferStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        await importLeadsToDatabase(results, res, req.body.source || null);
      });
  } catch (error) {
    console.error('File import error:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing file',
      error: error.message
    });
  }
});

// Helper function to import leads to database
async function importLeadsToDatabase(leadsData, res, defaultSource) {
  try {
    let imported = 0;
    let failed = 0;

    for (const row of leadsData) {
      try {
        await pool.query(
          `INSERT INTO leads (
            name, father_name, phone, city, neet, course, destination, remark, source, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')`,
          [
            row.name || '',
            row.father_name || null,
            row.phone || '',
            row.city || null,
            row.neet || null,
            row.course || null,
            row.destination || null,
            row.remark || null,
            row.source || defaultSource || null
          ]
        );
        imported++;
      } catch (err) {
        console.error('Import row error:', err);
        failed++;
      }
    }

    res.json({
      success: true,
      message: `Import completed. ${imported} leads imported${failed > 0 ? `, ${failed} failed` : ''}.`,
      data: { importedCount: imported, failed, total: leadsData.length }
    });
  } catch (error) {
    console.error('Import processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing import data'
    });
  }
}

// POST assign lead to telecaller
router.post('/:id/assign', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { assignedTo, assignedToName } = req.body;

    if (!assignedTo || !assignedToName) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user ID and name are required'
      });
    }

    // Check if lead exists
    const [rows] = await pool.query('SELECT id FROM leads WHERE id = ?', [leadId]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update lead assignment
    await pool.query(
      `UPDATE leads
       SET assigned_to = ?, assigned_to_name = ?, assigned_date = NOW(), updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [assignedTo, assignedToName, leadId]
    );

    const [updatedRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    // Create notification for assigned user
    await createNotification({
      userId: assignedTo,
      type: 'assignment',
      title: 'Lead Assigned',
      message: `You have been assigned to ${updatedRows[0].name}'s application`,
      leadId: leadId,
      leadName: updatedRows[0].name
    });

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning lead',
      error: error.message
    });
  }
});

// POST add call log
router.post('/:id/call-log', async (req, res) => {
  try {
    const leadId = req.params.id;
    const {
      callerId,
      callerName,
      callRemark,
      callOutcome,
      callReason,
      nextFollowUpDate,
      duration,
      isSuperAdmin // Flag to bypass validations for super admin
    } = req.body;

    // Validation
    if (!callerId || !callerName || !callRemark || !callOutcome) {
      return res.status(400).json({
        success: false,
        message: 'Caller ID, name, remark, and outcome are required'
      });
    }

    // Validate call reason for negative outcomes - Skip for Super Admin
    const negativeOutcomes = ['Not Interested', 'Wrong Number', 'Not Reachable', 'Switched Off', 'Drop', 'Invalid Lead'];
    if (!isSuperAdmin && negativeOutcomes.includes(callOutcome) && !callReason) {
      return res.status(400).json({
        success: false,
        message: 'Call reason is required for negative outcomes (Not Interested, Wrong Number, etc.)'
      });
    }

    // Check if lead exists and get current status
    const [leadRows] = await pool.query('SELECT id, status, is_transferred FROM leads WHERE id = ?', [leadId]);
    if (leadRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (leadRows[0].is_transferred) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add call log to transferred lead'
      });
    }

    // STATUS CHANGE GUARD - Validate status transitions (Skip for Super Admin)
    const currentStatus = leadRows[0].status || 'New';

    if (!isSuperAdmin) {
      const finalStatuses = ['converted', 'drop'];
      if (finalStatuses.includes(currentStatus.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `"${currentStatus}" lead ka status change nahi ho sakta.`
        });
      }

      // Same-day call limit check (max 5 attempts per day per telecaller)
      const [todayCallsRows] = await pool.query(
        `SELECT COUNT(*) as count FROM call_history
         WHERE lead_id = ?
         AND caller_id = ?
         AND DATE(call_date) = CURRENT_DATE`,
        [leadId, callerId]
      );

      if (todayCallsRows[0].count >= 5) {
        return res.status(400).json({
          success: false,
          message: 'You have already contacted this lead 5 times today. Please try again tomorrow.'
        });
      }
    }

    // Capture IP and User Agent for audit
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    // DEBUG: Log all values before insert
    console.log('=== CALL LOG DEBUG START ===');
    console.log('leadId:', leadId, typeof leadId);
    console.log('callerId:', callerId, typeof callerId);
    console.log('callerName:', callerName);
    console.log('callRemark length:', callRemark?.length);
    console.log('callOutcome:', callOutcome);
    console.log('callReason:', callReason);
    console.log('nextFollowUpDate:', nextFollowUpDate);
    console.log('duration:', duration);
    console.log('clientIp:', clientIp);

    // Insert call log with audit fields and call_reason
    try {
      console.log('Attempting INSERT into call_history...');
      await pool.query(
        `INSERT INTO call_history (
          lead_id, caller_id, caller_name, call_date, call_remark, call_outcome, call_reason,
          next_followup_date, duration, created_ip, user_agent
        ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
        [leadId, callerId, callerName, callRemark, callOutcome, callReason || null, nextFollowUpDate || null, duration || null, clientIp, userAgent]
      );
      console.log('INSERT successful!');
    } catch (insertError) {
      console.error('INSERT FAILED:', insertError.message);
      console.error('INSERT error code:', insertError.code);
      throw insertError;
    }

    // Update lead
    try {
      console.log('Attempting UPDATE leads...');
      await pool.query(
        `UPDATE leads
         SET status = ?, last_call_date = NOW(), next_followup_date = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [callOutcome, nextFollowUpDate || null, leadId]
      );
      console.log('UPDATE successful!');
    } catch (updateError) {
      console.error('UPDATE FAILED:', updateError.message);
      throw updateError;
    }
    console.log('=== CALL LOG DEBUG END ===');

    // Get updated lead with call history
    const [updatedLeadRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);
    const [callHistoryRows] = await pool.query(
      'SELECT * FROM call_history WHERE lead_id = ? ORDER BY call_date DESC',
      [leadId]
    );

    // Create notification for all call log outcomes
    const _leadName = updatedLeadRows[0].name;
    const _subStatusText = callReason ? ` (${callReason})` : "";
    await createNotification({
      userId: null,
      type: callOutcome === "Converted" ? "lead_converted" : "status_change",
      title: callOutcome === "Converted" ? "Lead Converted!" : "Enquiry: " + callOutcome,
      message: _leadName + " → " + JSON.stringify(callOutcome) + _subStatusText + " by " + callerName,
      leadId: leadId,
      leadName: _leadName
    });

    res.json({
      success: true,
      message: 'Call log added successfully',
      data: {
        ...updatedLeadRows[0],
        callHistory: callHistoryRows
      }
    });
  } catch (error) {
    console.error('Add call log error:', error);
    console.error('Error details:', {
      leadId: req.params.id,
      body: req.body,
      errorMessage: error.message,
      errorStack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error adding call log',
      error: error.message,
      details: error.detail || null
    });
  }
});

// PUT transfer lead to counsellor
router.put('/:id/transfer', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { transferredTo, transferReason } = req.body;

    if (!transferredTo) {
      return res.status(400).json({
        success: false,
        message: 'Transferred user ID is required'
      });
    }

    // Check if lead exists and is in "Interested" status
    const [leadRows] = await pool.query('SELECT id, status, is_transferred FROM leads WHERE id = ?', [leadId]);

    if (leadRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (leadRows[0].is_transferred) {
      return res.status(400).json({
        success: false,
        message: 'Lead has already been transferred'
      });
    }

    if (leadRows[0].status !== 'Interested') {
      return res.status(400).json({
        success: false,
        message: 'Only interested leads can be transferred'
      });
    }

    // Get counsellor name
    const [counsellorRows] = await pool.query(
      'SELECT id, name FROM users WHERE id = ?',
      [transferredTo]
    );

    if (counsellorRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Counsellor not found'
      });
    }

    const counsellorName = counsellorRows[0].name;

    // Transfer lead
    await pool.query(
      `UPDATE leads
       SET is_transferred = TRUE,
           transferred_to = ?,
           transferred_to_name = ?,
           transferred_date = NOW(),
           status = 'Converted',
           remark = CONCAT(COALESCE(remark, ''), ' | Transfer Reason: ', ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [transferredTo, counsellorName, transferReason || 'No reason provided', leadId]
    );

    const [updatedRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    res.json({
      success: true,
      message: 'Lead transferred successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Transfer lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error transferring lead',
      error: error.message
    });
  }
});

// POST request re-open for "Not Interested" leads
router.post('/:id/request-reopen', async (req, res) => {
  try {
    const leadId = req.params.id;
    const { requesterId, requesterName, reason } = req.body;

    if (!requesterId || !requesterName) {
      return res.status(400).json({
        success: false,
        message: 'Requester ID and name are required'
      });
    }

    // Check if lead exists and is "Not Interested"
    const [leadRows] = await pool.query(
      'SELECT id, status, reopen_requested FROM leads WHERE id = ?',
      [leadId]
    );

    if (leadRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (leadRows[0].status !== 'Not Interested') {
      return res.status(400).json({
        success: false,
        message: 'Only "Not Interested" leads can be requested for re-open'
      });
    }

    if (leadRows[0].reopen_requested) {
      return res.status(400).json({
        success: false,
        message: 'Re-open request already pending for this lead'
      });
    }

    // Mark as reopen requested
    await pool.query(
      `UPDATE leads
       SET reopen_requested = TRUE,
           remark = CONCAT(COALESCE(remark, ''), ' | Re-open requested by ', ?, ': ', ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [requesterName, reason || 'No reason provided', leadId]
    );

    const [updatedRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    res.json({
      success: true,
      message: 'Re-open request submitted successfully. Admin will review.',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Request re-open error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting re-open',
      error: error.message
    });
  }
});

// POST approve re-open request (Admin only)
router.post('/:id/approve-reopen', async (req, res) => {
  try {
    const leadId = req.params.id;

    // Check if lead exists and has reopen request
    const [leadRows] = await pool.query(
      'SELECT id, reopen_requested FROM leads WHERE id = ?',
      [leadId]
    );

    if (leadRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (!leadRows[0].reopen_requested) {
      return res.status(400).json({
        success: false,
        message: 'No re-open request found for this lead'
      });
    }

    // Approve re-open: Reset to "New" status
    await pool.query(
      `UPDATE leads
       SET status = 'New',
           reopen_requested = FALSE,
           remark = CONCAT(COALESCE(remark, ''), ' | Re-open approved by admin'),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [leadId]
    );

    const [updatedRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    res.json({
      success: true,
      message: 'Lead re-opened successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Approve re-open error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving re-open',
      error: error.message
    });
  }
});

// PUT update lead
router.put('/:id', async (req, res) => {
  try {
    const leadId = req.params.id;

    // Check if lead exists
    const [rows] = await pool.query('SELECT id FROM leads WHERE id = ?', [leadId]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'father_name', 'phone', 'city', 'neet', 'course', 'destination', 'remark', 'source', 'status'];
    const updateFields = [];
    const updateValues = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(req.body[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateValues.push(leadId);

    await pool.query(
      `UPDATE leads SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      updateValues
    );

    const [updatedRows] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    // Create notification if status was changed
    if (req.body.status !== undefined) {
      const leadName = updatedRows[0].name;
      const statusMessage = req.body.status === 'Converted'
        ? `${leadName} has been marked as "Converted"`
        : `${leadName}'s enquiry status changed to "${req.body.status}"`;

      await createNotification({
        userId: null, // visible to all
        type: req.body.status === 'Converted' ? 'lead_converted' : 'status_change',
        title: req.body.status === 'Converted' ? 'Lead Converted' : 'Status Updated',
        message: statusMessage,
        leadId: leadId,
        leadName: leadName
      });
    }

    // Log audit trail
    await logAudit({
      userId: req.body.updatedBy || null,
      userName: req.body.updatedByName || 'System',
      action: 'UPDATE',
      entityType: 'Lead',
      entityId: leadId,
      details: { updatedFields: req.body },
      ipAddress: getIpAddress(req),
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: updatedRows[0]
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating lead',
      error: error.message
    });
  }
});

// DELETE single lead
router.delete('/:id', async (req, res) => {
  try {
    const leadId = req.params.id;

    const [rows] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await pool.query('DELETE FROM leads WHERE id = ?', [leadId]);

    // Log audit trail
    await logAudit({
      userId: req.body.deletedBy || req.query.deletedBy || null,
      userName: req.body.deletedByName || req.query.deletedByName || 'System',
      action: 'DELETE',
      entityType: 'Lead',
      entityId: leadId,
      details: { deletedLead: rows[0] },
      ipAddress: getIpAddress(req),
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully',
      data: rows[0]
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lead',
      error: error.message
    });
  }
});

// DELETE all leads
router.delete('/', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM leads');

    res.json({
      success: true,
      message: `${result.affectedRows} leads deleted successfully`,
      data: { deletedCount: result.affectedRows }
    });
  } catch (error) {
    console.error('Delete all leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leads',
      error: error.message
    });
  }
});

// POST /api/leads/webhook - Public endpoint for external form submissions
// No authentication required - for educatepulse.com integration
router.post('/webhook', async (req, res) => {
  try {
    const {
      // Personal Details
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      mobile,
      whatsapp,
      email,
      aadhar,
      gender,
      nationality,
      countryName,

      // Parent Information
      fatherTitle,
      fatherName,
      fatherMobile,
      fatherOccupation,
      motherTitle,
      motherName,
      motherMobile,
      motherOccupation,

      // Address
      address,
      city,
      pincode,
      state,
      country,

      // Passport
      passportStatus,
      passportNumber,
      fileNumber,
      passportIssuanceDate,
      passportExpiryDate,

      // Additional
      course,
      destination,
      source
    } = req.body;

    // Validate required fields
    if (!mobile && !email) {
      return res.status(400).json({
        success: false,
        message: 'Either mobile or email is required'
      });
    }

    // Check for duplicate lead (by phone or email)
    const [existingRows] = await pool.query(
      `SELECT id FROM leads
       WHERE (phone = ? OR email = ?)
       AND phone IS NOT NULL AND email IS NOT NULL
       LIMIT 1`,
      [mobile, email]
    );

    if (existingRows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Lead already exists',
        leadId: existingRows[0].id,
        duplicate: true
      });
    }

    // Construct full name
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');

    // Construct parent info for notes
    const parentInfo = [];
    if (fatherName) {
      const fatherFullTitle = fatherTitle ? `${fatherTitle} ${fatherName}` : fatherName;
      parentInfo.push(`Father: ${fatherFullTitle} (${fatherMobile || 'N/A'}), ${fatherOccupation || 'N/A'}`);
    }
    if (motherName) {
      const motherFullTitle = motherTitle ? `${motherTitle} ${motherName}` : motherName;
      parentInfo.push(`Mother: ${motherFullTitle} (${motherMobile || 'N/A'}), ${motherOccupation || 'N/A'}`);
    }

    // Construct passport info
    const passportInfo = [];
    if (passportStatus) passportInfo.push(`Passport Status: ${passportStatus}`);
    if (passportNumber) passportInfo.push(`Passport Number: ${passportNumber}`);
    if (fileNumber) passportInfo.push(`File Number: ${fileNumber}`);
    if (passportIssuanceDate) passportInfo.push(`Issuance Date: ${passportIssuanceDate}`);
    if (passportExpiryDate) passportInfo.push(`Expiry Date: ${passportExpiryDate}`);

    const notes = [
      `DOB: ${dateOfBirth || 'N/A'}`,
      `Gender: ${gender || 'N/A'}`,
      `Nationality: ${nationality || 'N/A'}`,
      countryName ? `Country: ${countryName}` : '',
      `Aadhar: ${aadhar || 'N/A'}`,
      passportInfo.length > 0 ? `\nPassport Details:\n${passportInfo.join('\n')}` : '',
      `\nAddress: ${address || 'N/A'}, ${city || 'N/A'}, ${state || 'N/A'}, ${country || 'N/A'}, ${pincode || 'N/A'}`,
      `\nFamily Details:`,
      ...parentInfo,
      `\nSource: ${source || 'EducatePulse Website'}`
    ].filter(Boolean).join('\n');

    // Insert lead into database
    const [insertResult] = await pool.query(
      `INSERT INTO leads (
        name,
        phone,
        email,
        city,
        destination,
        course,
        status,
        source,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        fullName || 'Unknown',
        mobile || null,
        email || null,
        city || null,
        destination || 'Not Specified',
        course || 'MBBS',
        'New',
        source || 'EducatePulse Website',
        notes
      ]
    );

    const newLeadId = insertResult.insertId;

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      leadId: newLeadId,
      data: {
        id: newLeadId,
        name: fullName,
        phone: mobile,
        email: email,
        status: 'New'
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing form submission',
      error: error.message
    });
  }
});

// POST /api/leads/bulk-upload - Bulk upload leads from CSV
router.post('/bulk-upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const results = [];
    const errors = [];
    let imported = 0;
    let duplicates = 0;

    // Parse CSV from buffer
    const stream = Readable.from(req.file.buffer.toString());

    // Parse CSV
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Validate and insert leads
    for (const row of results) {
      try {
        const { name, phone, city } = row;

        // Validation
        if (!name || !phone) {
          errors.push({ row, error: 'Name and phone are required' });
          continue;
        }

        // Check for duplicate phone number
        const [existing] = await pool.query(
          'SELECT id FROM leads WHERE phone = ?',
          [phone]
        );

        if (existing.length > 0) {
          duplicates++;
          continue;
        }

        // Insert lead with NULL values for course, neet, destination, remark, source
        const defaultSource = req.body.source || null;
        await pool.query(
          'INSERT INTO leads (name, phone, city, neet, course, destination, remark, source, status, created_at) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, ?, ?, NOW())',
          [name.trim(), phone.trim(), city?.trim() || null, defaultSource, 'New']
        );

        imported++;
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${imported} leads`,
      total: results.length,
      imported,
      duplicates,
      errors: errors.length
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading leads',
      error: error.message
    });
  }
});

module.exports = router;
