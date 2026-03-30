const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { upload, uploadFields } = require('../config/multer');

// Submit a new student application with file uploads
router.post('/', uploadFields, async (req, res) => {
  try {
    const {
      // Personal Details
      firstName, lastName, dateOfBirth, mobile, whatsapp, email, gender, nationality, aadhar,

      // Passport Information
      passportStatus, passportNumber, passportIssuanceDate, passportExpiryDate, fileNumber,

      // Family Details
      fatherTitle, fatherName, fatherMobile, fatherOccupation,
      motherTitle, motherName, motherMobile, motherOccupation,

      // Address Details
      address, city, pincode, state, country,

      // Academic Details
      school10Name, board10, percentage10, year10,
      school12Name, board12, percentage12, year12,

      // NEET Scores
      neetScores,

      // Other Exam
      otherExamName, otherExamDetails,

      // Preferences
      preferredCountry, preferredUniversity, uploadDocuments,

      // Documents (future file upload implementation)
      documents,

      // Metadata
      course, source
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !dateOfBirth || !mobile || !email || !gender || !nationality || !aadhar) {
      return res.status(400).json({
        success: false,
        message: 'Missing required personal details'
      });
    }

    if (!passportStatus) {
      return res.status(400).json({
        success: false,
        message: 'Passport status is required'
      });
    }

    if (!fatherName || !fatherMobile || !fatherOccupation || !motherName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required family details'
      });
    }

    if (!address || !city || !pincode || !state || !country) {
      return res.status(400).json({
        success: false,
        message: 'Missing required address details'
      });
    }

    if (!school10Name || !board10 || !percentage10 || !year10) {
      return res.status(400).json({
        success: false,
        message: 'Missing required 10th class details'
      });
    }

    if (!school12Name || !board12 || !percentage12 || !year12) {
      return res.status(400).json({
        success: false,
        message: 'Missing required 12th class details'
      });
    }

    if (!preferredCountry || !preferredUniversity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required preference details'
      });
    }

    // Extract file paths from uploaded files
    const files = req.files || {};
    const documentPaths = {
      marksheet10: files.marksheet10 ? files.marksheet10[0].path : null,
      marksheet12: files.marksheet12 ? files.marksheet12[0].path : null,
      neetScorecard: files.neetScorecard ? files.neetScorecard[0].path : null,
      aadharFront: files.aadharFront ? files.aadharFront[0].path : null,
      aadharBack: files.aadharBack ? files.aadharBack[0].path : null,
      photograph: files.photograph ? files.photograph[0].path : null
    };

    // Insert into database
    const query = `
      INSERT INTO student_applications (
        first_name, last_name, date_of_birth, mobile, whatsapp, email, gender, nationality, aadhar,
        passport_status, passport_number, passport_issuance_date, passport_expiry_date, file_number,
        father_title, father_name, father_mobile, father_occupation,
        mother_title, mother_name, mother_mobile, mother_occupation,
        address, city, pincode, state, country,
        school_10_name, board_10, percentage_10, year_10,
        school_12_name, board_12, percentage_12, year_12,
        neet_scores, other_exam_name, other_exam_details,
        preferred_country, preferred_university, upload_documents,
        document_marksheet_10, document_marksheet_12, document_neet_scorecard,
        document_aadhar_front, document_aadhar_back, document_photograph,
        course, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      firstName, lastName, dateOfBirth, mobile, whatsapp || null, email, gender, nationality, aadhar,
      passportStatus, passportNumber || null, passportIssuanceDate || null, passportExpiryDate || null, fileNumber || null,
      fatherTitle || 'Mr.', fatherName, fatherMobile, fatherOccupation,
      motherTitle || 'Mrs.', motherName, motherMobile || null, motherOccupation || null,
      address, city, pincode, state, country,
      school10Name, board10, percentage10, year10,
      school12Name, board12, percentage12, year12,
      JSON.stringify(neetScores || []), otherExamName || null, otherExamDetails || null,
      preferredCountry, preferredUniversity, uploadDocuments || 'No',
      documentPaths.marksheet10, documentPaths.marksheet12, documentPaths.neetScorecard,
      documentPaths.aadharFront, documentPaths.aadharBack, documentPaths.photograph,
      course || 'MBBS', source || 'MBBS Application Form'
    ];

    const [insertResult] = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: insertResult.insertId
      }
    });
  } catch (error) {
    console.error('Error submitting student application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// Get all student applications with filters
router.get('/', async (req, res) => {
  try {
    const { status, course, search, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM student_applications WHERE 1=1';
    const params = [];

    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (course) {
      query += ` AND course = ?`;
      params.push(course);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      query += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR mobile LIKE ?)`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [applications] = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM student_applications WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ` AND status = ?`;
      countParams.push(status);
    }

    if (course) {
      countQuery += ` AND course = ?`;
      countParams.push(course);
    }

    if (search) {
      const searchPattern = `%${search}%`;
      countQuery += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR mobile LIKE ?)`;
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const [countRows] = await pool.query(countQuery, countParams);
    const total = parseInt(countRows[0].total);

    res.json({
      success: true,
      data: applications,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// Get single application by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      'SELECT * FROM student_applications WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Parse JSON fields
    const application = rows[0];
    if (application.neet_scores) {
      try {
        application.neet_scores = JSON.parse(application.neet_scores);
      } catch (e) {
        // already parsed or invalid, leave as-is
      }
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching student application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
});

// Update application status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Under Review', 'Approved', 'Rejected', 'Documents Required'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    await pool.query(
      'UPDATE student_applications SET status = ? WHERE id = ?',
      [status, id]
    );

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
});

// Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) as total_applications,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN created_at >= CURRENT_DATE - INTERVAL 7 DAY THEN 1 ELSE 0 END) as this_week_applications,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'Documents Required' THEN 1 ELSE 0 END) as documents_required,
        SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 ELSE 0 END) as today_applications,
        SUM(CASE WHEN course = 'MBBS' THEN 1 ELSE 0 END) as mbbs_applications
      FROM student_applications
    `);

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Upload document for existing application
router.patch('/:id/upload-document', upload.single('document'), async (req, res) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: 'Document type is required'
      });
    }

    const fieldMapping = {
      'document_marksheet_10': 'document_marksheet_10',
      'document_marksheet_12': 'document_marksheet_12',
      'document_neet_scorecard': 'document_neet_scorecard',
      'document_aadhar_front': 'document_aadhar_front',
      'document_aadhar_back': 'document_aadhar_back',
      'document_photograph': 'document_photograph',
      'document_passport_front': 'document_passport_front',
      'document_passport_back': 'document_passport_back'
    };

    const dbColumn = fieldMapping[documentType];
    if (!dbColumn) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    const query = `UPDATE student_applications SET ${dbColumn} = ? WHERE id = ?`;
    await pool.query(query, [req.file.path, id]);

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      filePath: req.file.path
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
});

// Update application
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData._appType;

    // Convert JSON fields to strings if they're objects
    if (updateData.neet_scores && typeof updateData.neet_scores === 'object') {
      updateData.neet_scores = JSON.stringify(updateData.neet_scores);
    }

    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE student_applications SET ${setClause} WHERE id = ?`;

    await pool.query(query, [...values, id]);

    res.json({
      success: true,
      message: 'Application updated successfully'
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
});

// Delete application
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM student_applications WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
});

module.exports = router;
