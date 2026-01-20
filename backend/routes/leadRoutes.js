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

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (assigned_to) {
      query += ' AND assigned_to = ?';
      params.push(assigned_to);
    }

    if (city) {
      query += ' AND city = ?';
      params.push(city);
    }

    if (destination) {
      query += ' AND destination = ?';
      params.push(destination);
    }

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR city LIKE ? OR source LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY created_at DESC';

    const [leads] = await pool.query(query, params);

    res.json({
      success: true,
      count: leads.length,
      data: leads
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

    let query = 'SELECT * FROM leads WHERE assigned_to = ?';
    const params = [userId];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (search) {
      query += ' AND (name LIKE ? OR phone LIKE ? OR city LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ' ORDER BY next_followup_date ASC, created_at DESC';

    const [leads] = await pool.query(query, params);

    res.json({
      success: true,
      count: leads.length,
      data: leads
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

    const [leads] = await pool.query(
      `SELECT * FROM leads
       WHERE assigned_to = ?
         AND next_followup_date IS NOT NULL
         AND next_followup_date <= DATE_ADD(NOW(), INTERVAL 1 DAY)
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

    leads.forEach(lead => {
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
        total: leads.length
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

    const [leads] = await pool.query(query);

    res.json({
      success: true,
      data: leads,
      count: leads.length
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

    const [callHistory] = await pool.query(query, [id]);

    res.json({
      success: true,
      data: callHistory,
      count: callHistory.length
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
    const [leads] = await pool.query('SELECT * FROM leads WHERE id = ?', [req.params.id]);

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Get call history for this lead
    const [callHistory] = await pool.query(
      'SELECT * FROM call_history WHERE lead_id = ? ORDER BY call_date DESC',
      [req.params.id]
    );

    const leadData = {
      ...leads[0],
      callHistory
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

    const [result] = await pool.query(
      `INSERT INTO leads (
        name, phone, city, neet, course, destination, remark, source, status, assigned_to_name, imported_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New', 'Unassigned', ?)`,
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

    const [newLead] = await pool.query('SELECT * FROM leads WHERE id = ?', [result.insertId]);

    // Create notification for new lead (visible to all users)
    await createNotification({
      userId: null, // null means all users can see this
      type: 'new_lead',
      title: 'New Lead Added',
      message: `${name} submitted inquiry for ${course || 'MBBS'} in ${destination || 'abroad'}`,
      leadId: result.insertId,
      leadName: name
    });

    // Log audit trail
    await logAudit({
      userId: req.body.createdBy || null,
      userName: req.body.createdByName || 'System',
      action: 'CREATE',
      entityType: 'Lead',
      entityId: result.insertId,
      details: { name, phone, city, course, destination, source },
      ipAddress: getIpAddress(req),
      userAgent: req.get('user-agent')
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: newLead[0]
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
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'New')`,
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
    const [leads] = await pool.query('SELECT id FROM leads WHERE id = ?', [leadId]);
    if (leads.length === 0) {
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

    const [updatedLead] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    // Create notification for assigned user
    await createNotification({
      userId: assignedTo,
      type: 'assignment',
      title: 'Lead Assigned',
      message: `You have been assigned to ${updatedLead[0].name}'s application`,
      leadId: leadId,
      leadName: updatedLead[0].name
    });

    res.json({
      success: true,
      message: 'Lead assigned successfully',
      data: updatedLead[0]
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
      duration
    } = req.body;

    // Validation
    if (!callerId || !callerName || !callRemark || !callOutcome) {
      return res.status(400).json({
        success: false,
        message: 'Caller ID, name, remark, and outcome are required'
      });
    }

    // Remark quality validation (min 20 characters)
    if (callRemark.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Call remark must be at least 20 characters long'
      });
    }

    // Block generic/low-quality remarks
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

    // Validate call reason for negative outcomes
    const negativeOutcomes = ['Not Interested', 'Wrong Number', 'Not Reachable', 'Switched Off'];
    if (negativeOutcomes.includes(callOutcome) && !callReason) {
      return res.status(400).json({
        success: false,
        message: 'Call reason is required for negative outcomes (Not Interested, Wrong Number, etc.)'
      });
    }

    // Check if lead exists and get current status
    const [leads] = await pool.query('SELECT id, status, is_transferred FROM leads WHERE id = ?', [leadId]);
    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (leads[0].is_transferred) {
      return res.status(403).json({
        success: false,
        message: 'Cannot add call log to transferred lead'
      });
    }

    // STATUS CHANGE GUARD - Validate status transitions
    // Treat empty or null status as "New" (data integrity fix)
    const currentStatus = leads[0].status || 'New';
    const newStatus = callOutcome;

    // Define allowed transitions
    const ALLOWED_TRANSITIONS = {
      'New': ['Contacted'],
      'Contacted': ['Interested', 'Not Interested', 'Call Back', 'Wrong Number', 'Not Reachable', 'Switched Off', 'Busy', 'No Answer'],
      'Interested': ['Converted', 'Call Back', 'Contacted'],
      'Call Back': ['Contacted', 'Interested', 'Not Interested']
    };

    // Check if transition is allowed
    const allowedNextStates = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStates.includes(newStatus) && currentStatus !== newStatus) {
      // Special case: If trying to mark as negative from "New", show specific error
      if (currentStatus === 'New' && negativeOutcomes.includes(newStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Please contact the lead before closing it. You cannot mark a new lead as "' + newStatus + '" without contacting first.'
        });
      }

      return res.status(400).json({
        success: false,
        message: `Invalid status transition from "${currentStatus}" to "${newStatus}". Please follow the correct flow.`
      });
    }

    // Same-day call limit check (max 5 attempts per day per telecaller)
    const [todayCalls] = await pool.query(
      `SELECT COUNT(*) as count FROM call_history
       WHERE lead_id = ?
       AND caller_id = ?
       AND DATE(call_date) = CURDATE()`,
      [leadId, callerId]
    );

    if (todayCalls[0].count >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You have already contacted this lead 5 times today. Please try again tomorrow.'
      });
    }

    // Capture IP and User Agent for audit
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || null;

    // Insert call log with audit fields and call_reason
    await pool.query(
      `INSERT INTO call_history (
        lead_id, caller_id, caller_name, call_date, call_remark, call_outcome, call_reason,
        next_followup_date, duration, created_ip, user_agent
      ) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
      [leadId, callerId, callerName, callRemark, callOutcome, callReason || null, nextFollowUpDate || null, duration || null, clientIp, userAgent]
    );

    // Update lead
    await pool.query(
      `UPDATE leads
       SET status = ?, last_call_date = NOW(), next_followup_date = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [callOutcome, nextFollowUpDate || null, leadId]
    );

    // Get updated lead with call history
    const [updatedLead] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);
    const [callHistory] = await pool.query(
      'SELECT * FROM call_history WHERE lead_id = ? ORDER BY call_date DESC',
      [leadId]
    );

    // Create notification for important call outcomes
    const importantOutcomes = ['Interested', 'Converted'];
    if (importantOutcomes.includes(callOutcome)) {
      await createNotification({
        userId: null, // Visible to all users
        type: 'call_log',
        title: `Lead ${callOutcome}`,
        message: `${updatedLead[0].name} marked as "${callOutcome}" by ${callerName}`,
        leadId: leadId,
        leadName: updatedLead[0].name
      });
    }

    res.json({
      success: true,
      message: 'Call log added successfully',
      data: {
        ...updatedLead[0],
        callHistory
      }
    });
  } catch (error) {
    console.error('Add call log error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding call log',
      error: error.message
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
    const [leads] = await pool.query('SELECT id, status, is_transferred FROM leads WHERE id = ?', [leadId]);

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (leads[0].is_transferred) {
      return res.status(400).json({
        success: false,
        message: 'Lead has already been transferred'
      });
    }

    if (leads[0].status !== 'Interested') {
      return res.status(400).json({
        success: false,
        message: 'Only interested leads can be transferred'
      });
    }

    // Get counsellor name
    const [counsellors] = await pool.query(
      'SELECT id, name FROM users WHERE id = ?',
      [transferredTo]
    );

    if (counsellors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Counsellor not found'
      });
    }

    const counsellorName = counsellors[0].name;

    // Transfer lead
    await pool.query(
      `UPDATE leads
       SET is_transferred = TRUE,
           transferred_to = ?,
           transferred_to_name = ?,
           transferred_date = NOW(),
           status = 'Converted',
           remark = CONCAT(IFNULL(remark, ''), ' | Transfer Reason: ', ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [transferredTo, counsellorName, transferReason || 'No reason provided', leadId]
    );

    const [updatedLead] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    res.json({
      success: true,
      message: 'Lead transferred successfully',
      data: updatedLead[0]
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
    const [leads] = await pool.query(
      'SELECT id, status, reopen_requested FROM leads WHERE id = ?',
      [leadId]
    );

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (leads[0].status !== 'Not Interested') {
      return res.status(400).json({
        success: false,
        message: 'Only "Not Interested" leads can be requested for re-open'
      });
    }

    if (leads[0].reopen_requested) {
      return res.status(400).json({
        success: false,
        message: 'Re-open request already pending for this lead'
      });
    }

    // Mark as reopen requested
    await pool.query(
      `UPDATE leads
       SET reopen_requested = TRUE,
           remark = CONCAT(IFNULL(remark, ''), ' | Re-open requested by ', ?, ': ', ?),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [requesterName, reason || 'No reason provided', leadId]
    );

    const [updatedLead] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    res.json({
      success: true,
      message: 'Re-open request submitted successfully. Admin will review.',
      data: updatedLead[0]
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
    const [leads] = await pool.query(
      'SELECT id, reopen_requested FROM leads WHERE id = ?',
      [leadId]
    );

    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (!leads[0].reopen_requested) {
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
           remark = CONCAT(IFNULL(remark, ''), ' | Re-open approved by admin'),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [leadId]
    );

    const [updatedLead] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    res.json({
      success: true,
      message: 'Lead re-opened successfully',
      data: updatedLead[0]
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
    const [leads] = await pool.query('SELECT id FROM leads WHERE id = ?', [leadId]);
    if (leads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Build dynamic update query
    const allowedFields = ['name', 'phone', 'city', 'neet', 'course', 'destination', 'remark', 'source', 'status'];
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

    const [updatedLead] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    // Create notification if status was changed
    if (req.body.status !== undefined) {
      const statusMessage = req.body.status === 'Converted'
        ? `Lead #${leadId} marked as "Converted"`
        : `Lead #${leadId} moved to "${req.body.status}"`;

      await createNotification({
        userId: updatedLead[0].assigned_to || null,
        type: req.body.status === 'Converted' ? 'lead_converted' : 'status_change',
        title: 'Status Updated',
        message: statusMessage,
        leadId: leadId,
        leadName: updatedLead[0].name
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
      data: updatedLead[0]
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

    const [leads] = await pool.query('SELECT * FROM leads WHERE id = ?', [leadId]);

    if (leads.length === 0) {
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
      details: { deletedLead: leads[0] },
      ipAddress: getIpAddress(req),
      userAgent: req.get('user-agent')
    });

    res.json({
      success: true,
      message: 'Lead deleted successfully',
      data: leads[0]
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
    const duplicateCheckQuery = `
      SELECT id FROM leads
      WHERE (phone = ? OR email = ?)
      AND phone IS NOT NULL AND email IS NOT NULL
      LIMIT 1
    `;
    const [existingLeads] = await pool.query(duplicateCheckQuery, [mobile, email]);

    if (existingLeads.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Lead already exists',
        leadId: existingLeads[0].id,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.query(insertQuery, [
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
      leadId: result.insertId,
      data: {
        id: result.insertId,
        name: fullName,
        phone: mobile,
        email: email,
        status: 'New'
      }
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
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
        const [existing] = await pool.execute(
          'SELECT id FROM leads WHERE phone = ?',
          [phone]
        );

        if (existing.length > 0) {
          duplicates++;
          continue;
        }

        // Insert lead with NULL values for course, neet, destination, remark, source
        // to ensure they don't get default values from database
        await pool.execute(
          'INSERT INTO leads (name, phone, city, neet, course, destination, remark, source, status, created_at) VALUES (?, ?, ?, NULL, NULL, NULL, NULL, NULL, ?, NOW())',
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
    console.error('❌ Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading leads',
      error: error.message
    });
  }
});

module.exports = router;
