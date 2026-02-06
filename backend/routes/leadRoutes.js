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
        ch.call_date as latest_call_date
      FROM leads
      LEFT JOIN (
        SELECT
          lead_id,
          call_remark,
          call_date,
          ROW_NUMBER() OVER (PARTITION BY lead_id ORDER BY call_date DESC) as rn
        FROM call_history
      ) ch ON ch.lead_id = leads.id AND ch.rn = 1
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (assigned_to) {
      query += ` AND assigned_to = $${paramCount}`;
      params.push(assigned_to);
      paramCount++;
    }

    if (city) {
      query += ` AND city = $${paramCount}`;
      params.push(city);
      paramCount++;
    }

    if (destination) {
      query += ` AND destination = $${paramCount}`;
      params.push(destination);
      paramCount++;
    }

    if (search) {
      query += ` AND (name LIKE $${paramCount} OR phone LIKE $${paramCount+1} OR city LIKE $${paramCount+2} OR source LIKE $${paramCount+3})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      paramCount += 4;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
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

    let query = 'SELECT * FROM leads WHERE assigned_to = $1';
    const params = [userId];
    let paramCount = 2;

    if (status && status !== 'all') {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (search) {
      query += ` AND (name LIKE $${paramCount} OR phone LIKE $${paramCount+1} OR city LIKE $${paramCount+2})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      paramCount += 3;
    }

    query += ' ORDER BY next_followup_date ASC, created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
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

    const result = await pool.query(
      `SELECT * FROM leads
       WHERE assigned_to = $1
         AND next_followup_date IS NOT NULL
         AND next_followup_date <= NOW() + INTERVAL '1 day'
         AND is_transferred = FALSE
       ORDER BY next_followup_date ASC`,
      [userId]
    );

    // Separate into today and overdue
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayLeads = [];
    const overdueLeads = [];

    result.rows.forEach(lead => {
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
        total: result.rows.length
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

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
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
      WHERE ch.lead_id = $1
      ORDER BY ch.call_date DESC
    `;

    const result = await pool.query(query, [id]);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
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
    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Get call history for this lead
    const callHistoryResult = await pool.query(
      'SELECT * FROM call_history WHERE lead_id = $1 ORDER BY call_date DESC',
      [req.params.id]
    );

    const leadData = {
      ...result.rows[0],
      callHistory: callHistoryResult.rows
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
      source
    } = req.body;

    // Validation
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and phone are required fields'
      });
    }

    // Ensure course is null for raw leads
    const courseValue = course ? course : null;

    const result = await pool.query(
      `INSERT INTO leads (
        name, phone, city, neet, course, destination, remark, source, status, assigned_to_name, imported_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'New', 'Unassigned', $9) RETURNING id`,
      [
        name,
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

    const newLeadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [result.rows[0].id]);

    // Create notification for new lead (visible to all users)
    await createNotification({
      userId: null, // null means all users can see this
      type: 'new_lead',
      title: 'New Lead Added',
      message: `${name} submitted inquiry for ${course || 'MBBS'} in ${destination || 'abroad'}`,
      leadId: result.rows[0].id,
      leadName: name
    });

    // Log audit trail
    await logAudit({
      userId: req.body.createdBy || null,
      userName: req.body.createdByName || 'System',
      action: 'CREATE',
      entityType: 'Lead',
      entityId: result.rows[0].id,
      details: { name, phone, city, course, destination, source },
      ipAddress: getIpAddress(req),
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: newLeadResult.rows[0]
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
        await importLeadsToDatabase(results, res);
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
async function importLeadsToDatabase(leadsData, res) {
  try {
    let imported = 0;
    let failed = 0;

    for (const row of leadsData) {
      try {
        await pool.query(
          `INSERT INTO leads (
            name, phone, city, neet, course, destination, remark, source, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'New')`,
          [
            row.name || '',
            row.phone || '',
            row.city || null,
            row.neet || null,
            row.course || null,
            row.destination || null,
            row.remark || null,
            row.source || null
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
    const result = await pool.query('SELECT id FROM leads WHERE id = $1', [leadId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Update lead assignment
    await pool.query(
      `UPDATE leads
       SET assigned_to = $1, assigned_to_name = $2, assigned_date = NOW(), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [assignedTo, assignedToName, leadId]
    );

    const updatedLeadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);

    // Create notification for assigned user
    await createNotification({
      userId: assignedTo,
      type: 'assignment',
      title: 'Lead Assigned',
      message: `You have been assigned to ${updatedLeadResult.rows[0].name}'s application`,
      leadId: leadId,
      leadName: updatedLeadResult.rows[0].name
    });

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: updatedLeadResult.rows[0]
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

    // Remark quality validation (min 20 characters) - Skip for Super Admin
    if (!isSuperAdmin && callRemark.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Call remark must be at least 20 characters long'
      });
    }

    // Block generic/low-quality remarks - Skip for Super Admin
    if (!isSuperAdmin) {
      const blockedWords = ['ok', 'done', 'talked', 'call done', 'called'];
      const remarkLower = callRemark.toLowerCase().trim();
      const hasBlockedWord = blockedWords.some(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'i');
        return regex.test(remarkLower);
      });

      if (hasBlockedWord) {
        return res.status(400).json({
          success: false,
          message: 'Please provide detailed and meaningful remarks about the call'
        });
      }
    }

    // Validate call reason for negative outcomes - Skip for Super Admin
    const negativeOutcomes = ['Not Interested', 'Wrong Number', 'Not Reachable', 'Switched Off'];
    if (!isSuperAdmin && negativeOutcomes.includes(callOutcome) && !callReason) {
      return res.status(400).json({
        success: false,
        message: 'Call reason is required for negative outcomes (Not Interested, Wrong Number, etc.)'
      });
    }

    // Check if lead exists and get current status
    const result = await pool.query('SELECT id, status, is_transferred FROM leads WHERE id = $1', [leadId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (result.rows[0].is_transferred) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add call log to transferred lead'
      });
    }

    // STATUS CHANGE GUARD - Validate status transitions (Skip for Super Admin)
    // Treat empty or null status as "New" (data integrity fix)
    const currentStatus = result.rows[0].status || 'New';
    const newStatus = callOutcome;

    if (!isSuperAdmin) {
      // Status transition validation temporarily disabled for flexibility
      // Only block Converted and Drop leads from being changed
      const finalStatuses = ['converted', 'drop'];
      if (finalStatuses.includes(currentStatus.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `"${currentStatus}" lead ka status change nahi ho sakta.`
        });
      }

      // Same-day call limit check (max 5 attempts per day per telecaller)
      const todayCallsResult = await pool.query(
        `SELECT COUNT(*) as count FROM call_history
         WHERE lead_id = $1
         AND caller_id = $2
         AND DATE(call_date) = CURRENT_DATE`,
        [leadId, callerId]
      );

      if (todayCallsResult.rows[0].count >= 5) {
        return res.status(400).json({
          success: false,
          message: 'You have already contacted this lead 5 times today. Please try again tomorrow.'
        });
      }
    }

    // Capture IP and User Agent for audit
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    // Insert call log with audit fields and call_reason
    await pool.query(
      `INSERT INTO call_history (
        lead_id, caller_id, caller_name, call_date, call_remark, call_outcome, call_reason,
        next_followup_date, duration, created_ip, user_agent
      ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9, $10)`,
      [leadId, callerId, callerName, callRemark, callOutcome, callReason || null, nextFollowUpDate || null, duration || null, clientIp, userAgent]
    );

    // Update lead
    await pool.query(
      `UPDATE leads
       SET status = $1, last_call_date = NOW(), next_followup_date = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [callOutcome, nextFollowUpDate || null, leadId]
    );

    // Get updated lead with call history
    const updatedLeadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);
    const callHistoryResult = await pool.query(
      'SELECT * FROM call_history WHERE lead_id = $1 ORDER BY call_date DESC',
      [leadId]
    );

    // Create notification for important call outcomes
    const importantOutcomes = ['Interested', 'Converted'];
    if (importantOutcomes.includes(callOutcome)) {
      await createNotification({
        userId: null, // Visible to all users
        type: 'call_log',
        title: `Lead ${callOutcome}`,
        message: `${updatedLeadResult.rows[0].name} marked as "${callOutcome}" by ${callerName}`,
        leadId: leadId,
        leadName: updatedLeadResult.rows[0].name
      });
    }

    res.json({
      success: true,
      message: 'Call log added successfully',
      data: {
        ...updatedLeadResult.rows[0],
        callHistory: callHistoryResult.rows
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
    const result = await pool.query('SELECT id, status, is_transferred FROM leads WHERE id = $1', [leadId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (result.rows[0].is_transferred) {
      return res.status(400).json({
        success: false,
        message: 'Lead has already been transferred'
      });
    }

    if (result.rows[0].status !== 'Interested') {
      return res.status(400).json({
        success: false,
        message: 'Only interested leads can be transferred'
      });
    }

    // Get counsellor name
    const counsellorResult = await pool.query(
      'SELECT id, name FROM users WHERE id = $1',
      [transferredTo]
    );

    if (counsellorResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Counsellor not found'
      });
    }

    const counsellorName = counsellorResult.rows[0].name;

    // Transfer lead
    await pool.query(
      `UPDATE leads
       SET is_transferred = TRUE,
           transferred_to = $1,
           transferred_to_name = $2,
           transferred_date = NOW(),
           status = 'Converted',
           remark = CONCAT(COALESCE(remark, ''), ' | Transfer Reason: ', $3),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [transferredTo, counsellorName, transferReason || 'No reason provided', leadId]
    );

    const updatedLeadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);

    res.json({
      success: true,
      message: 'Lead transferred successfully',
      data: updatedLeadResult.rows[0]
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
    const result = await pool.query(
      'SELECT id, status, reopen_requested FROM leads WHERE id = $1',
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (result.rows[0].status !== 'Not Interested') {
      return res.status(400).json({
        success: false,
        message: 'Only "Not Interested" leads can be requested for re-open'
      });
    }

    if (result.rows[0].reopen_requested) {
      return res.status(400).json({
        success: false,
        message: 'Re-open request already pending for this lead'
      });
    }

    // Mark as reopen requested
    await pool.query(
      `UPDATE leads
       SET reopen_requested = TRUE,
           remark = CONCAT(COALESCE(remark, ''), ' | Re-open requested by ', $1, ': ', $2),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [requesterName, reason || 'No reason provided', leadId]
    );

    const updatedLeadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);

    res.json({
      success: true,
      message: 'Re-open request submitted successfully. Admin will review.',
      data: updatedLeadResult.rows[0]
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
    const result = await pool.query(
      'SELECT id, reopen_requested FROM leads WHERE id = $1',
      [leadId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (!result.rows[0].reopen_requested) {
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
       WHERE id = $1`,
      [leadId]
    );

    const updatedLeadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);

    res.json({
      success: true,
      message: 'Lead re-opened successfully',
      data: updatedLeadResult.rows[0]
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
    const result = await pool.query('SELECT id FROM leads WHERE id = $1', [leadId]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'phone', 'city', 'neet', 'course', 'destination', 'remark', 'source', 'status'];
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        updateValues.push(req.body[field]);
        paramCount++;
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
      `UPDATE leads SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount}`,
      updateValues
    );

    const updatedLeadResult = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);

    // Create notification if status was changed
    if (req.body.status !== undefined) {
      const statusMessage = req.body.status === 'Converted'
        ? `Lead #${leadId} marked as "Converted"`
        : `Lead #${leadId} moved to "${req.body.status}"`;

      await createNotification({
        userId: updatedLeadResult.rows[0].assigned_to || null,
        type: req.body.status === 'Converted' ? 'lead_converted' : 'status_change',
        title: 'Status Updated',
        message: statusMessage,
        leadId: leadId,
        leadName: updatedLeadResult.rows[0].name
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
      data: updatedLeadResult.rows[0]
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

    const result = await pool.query('SELECT * FROM leads WHERE id = $1', [leadId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await pool.query('DELETE FROM leads WHERE id = $1', [leadId]);

    // Log audit trail
    await logAudit({
      userId: req.body.deletedBy || req.query.deletedBy || null,
      userName: req.body.deletedByName || req.query.deletedByName || 'System',
      action: 'DELETE',
      entityType: 'Lead',
      entityId: leadId,
      details: { deletedLead: result.rows[0] },
      ipAddress: getIpAddress(req),
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully',
      data: result.rows[0]
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
    const result = await pool.query('DELETE FROM leads');

    res.json({
      success: true,
      message: `${result.rowCount} leads deleted successfully`,
      data: { deletedCount: result.rowCount }
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
    const duplicateCheckQuery = `
      SELECT id FROM leads
      WHERE (phone = $1 OR email = $2)
      AND phone IS NOT NULL AND email IS NOT NULL
      LIMIT 1
    `;
    const existingLeadsResult = await pool.query(duplicateCheckQuery, [mobile, email]);

    if (existingLeadsResult.rows.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Lead already exists',
        leadId: existingLeadsResult.rows[0].id,
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
    const insertQuery = `
      INSERT INTO leads (
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()) RETURNING id
    `;

    const result = await pool.query(insertQuery, [
      fullName || 'Unknown',
      mobile || null,
      email || null,
      city || null,
      destination || 'Not Specified',
      course || 'MBBS',
      'New',
      source || 'EducatePulse Website',
      notes
    ]);

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      leadId: result.rows[0].id,
      data: {
        id: result.rows[0].id,
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
        const existing = await pool.query(
          'SELECT id FROM leads WHERE phone = $1',
          [phone]
        );

        if (existing.rows.length > 0) {
          duplicates++;
          continue;
        }

        // Insert lead with NULL values for course, neet, destination, remark, source
        // to ensure they don't get default values from database
        await pool.query(
          'INSERT INTO leads (name, phone, city, neet, course, destination, remark, source, status, created_at) VALUES ($1, $2, $3, NULL, NULL, NULL, NULL, NULL, $4, NOW())',
          [name.trim(), phone.trim(), city?.trim() || null, 'New']
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
