const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { upload, uploadFields } = require('../config/multer');

// Submit a new other courses application with file uploads
router.post('/', uploadFields, async (req, res) => {
  try {
    const {
      // Personal Details
      firstMiddleName, lastName, dateOfBirth, gender, nationality, aadhar, passportStatus,

      // Passport Details (New)
      passportNumber, fileNumber, passportIssueDate, passportExpiryDate,

      // Family Details
      fatherTitle, fatherName, fatherOccupation,
      motherTitle, motherName, motherOccupation,

      // Academic Details - 10th
      school10Name, board10, percentage10, year10,

      // Academic Details - 11th (Optional)
      school11Name, board11, percentage11, year11,

      // Academic Details - 12th
      school12Status, school12Name, board12, percentage12, year12,

      // UG Details (New)
      ugStatus, ugDegree, ugCollege, ugPercentage, ugYear,

      // PG Details (New)
      pgStatus, pgDegree, pgCollege, pgPercentage, pgYear,

      // Other Academic Details
      anyOtherCourse, otherCourseName, otherCourseCollege, otherCoursePercentage, otherCourseYear,
      gapBetweenEducation, totalGapYears, gapReason,
      englishExam, englishExamYear, englishExamType,
      entranceExam, entranceExams,

      // Course Preferences
      degreeName, branchStream, preferredCountries, maxBudget,
      workExperience, workDuration,
      visaAppliedPrior, visaCountryName, visaHowManyTimes,
      previousVisaRefusal, refusalReason, refusalCountryName,
      comments,

      // Contact Details
      mobile, whatsapp, email, fatherMobile, motherMobile,

      // Address Details
      address, city, pincode, state, country,

      // Document Upload
      uploadDocuments,

      // Metadata
      course, source
    } = req.body;

    // Extract uploaded file paths
    const files = req.files || {};
    const documentPaths = {
      marksheet10: files.marksheet10 ? files.marksheet10[0].path : null,
      marksheet12: files.marksheet12 ? files.marksheet12[0].path : null,
      ugDegree: files.ugDegree ? files.ugDegree[0].path : null,
      pgDegree: files.pgDegree ? files.pgDegree[0].path : null,
      aadharCard: files.aadharCard ? files.aadharCard[0].path : null,
      passportFront: files.passportFront ? files.passportFront[0].path : null,
      passportBack: files.passportBack ? files.passportBack[0].path : null,
      photograph: files.photograph ? files.photograph[0].path : null,
      englishExamCert: files.englishExamCert ? files.englishExamCert[0].path : null,
      entranceExamScorecard: files.entranceExamScorecard ? files.entranceExamScorecard[0].path : null,
      workExpCertificate: files.workExpCertificate ? files.workExpCertificate[0].path : null
    };

    // Validate required fields
    if (!firstMiddleName || !lastName || !dateOfBirth || !gender || !nationality || !aadhar) {
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

    if (!fatherName || !fatherOccupation || !motherName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required family details'
      });
    }

    if (!school10Name || !board10 || !percentage10 || !year10) {
      return res.status(400).json({
        success: false,
        message: 'Missing required 10th class details'
      });
    }

    if (!school12Status) {
      return res.status(400).json({
        success: false,
        message: '12th school status is required'
      });
    }

    if (!mobile || !email || !fatherMobile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required contact details'
      });
    }

    if (!address || !city || !pincode || !state || !country) {
      return res.status(400).json({
        success: false,
        message: 'Missing required address details'
      });
    }

    // Convert entrance exams array to JSON string if present
    const entranceExamsJson = entranceExams ? JSON.stringify(entranceExams) : null;

    // Insert into database
    const query = `
      INSERT INTO other_courses_applications (
        first_middle_name, last_name, date_of_birth, gender, nationality, aadhar, passport_status,
        passport_number, file_number, passport_issue_date, passport_expiry_date,
        father_title, father_name, father_occupation,
        mother_title, mother_name, mother_occupation,
        school_10_name, board_10, percentage_10, year_10,
        school_11_name, board_11, percentage_11, year_11,
        school_12_status, school_12_name, board_12, percentage_12, year_12,
        ug_status, ug_degree, ug_college, ug_percentage, ug_year,
        pg_status, pg_degree, pg_college, pg_percentage, pg_year,
        any_other_course, other_course_name, other_course_college, other_course_percentage, other_course_year,
        gap_between_education, total_gap_years, gap_reason,
        english_exam, english_exam_year, english_exam_type,
        entrance_exam, entrance_exams,
        degree_name, branch_stream, preferred_countries, max_budget,
        work_experience, work_duration,
        visa_applied_prior, visa_country_name, visa_how_many_times,
        previous_visa_refusal, refusal_reason, refusal_country_name,
        comments,
        mobile, whatsapp, email, father_mobile, mother_mobile,
        address, city, pincode, state, country,
        upload_documents,
        document_marksheet_10, document_marksheet_12, document_ug_degree, document_pg_degree,
        document_aadhar_card, document_passport_front, document_passport_back, document_photograph,
        document_english_exam_cert, document_entrance_exam_scorecard, document_work_exp_certificate,
        course, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      // Personal Details
      firstMiddleName, lastName, dateOfBirth, gender, nationality, aadhar, passportStatus,

      // Passport Details
      passportNumber || null, fileNumber || null, passportIssueDate || null, passportExpiryDate || null,

      // Family Details
      fatherTitle || 'Mr.', fatherName, fatherOccupation,
      motherTitle || 'Mrs.', motherName, motherOccupation || null,

      // Academic Details - 10th
      school10Name, board10, percentage10, year10,

      // Academic Details - 11th
      school11Name || null, board11 || null, percentage11 || null, year11 || null,

      // Academic Details - 12th
      school12Status, school12Name || null, board12 || null, percentage12 || null, year12 || null,

      // UG Details
      ugStatus || null, ugDegree || null, ugCollege || null, ugPercentage || null, ugYear || null,

      // PG Details
      pgStatus || null, pgDegree || null, pgCollege || null, pgPercentage || null, pgYear || null,

      // Other Course Details
      anyOtherCourse || 'No', otherCourseName || null, otherCourseCollege || null,
      otherCoursePercentage || null, otherCourseYear || null,

      // Gap Year Details
      gapBetweenEducation || 'No', totalGapYears || null, gapReason || null,

      // English Exam Details
      englishExam || 'No', englishExamYear || null, englishExamType || null,

      // Entrance Exam Details
      entranceExam || 'No', entranceExamsJson,

      // Course Preferences
      degreeName || null, branchStream || null, preferredCountries || null, maxBudget || null,

      // Work Experience
      workExperience || 'No', workDuration || null,

      // Visa Details
      visaAppliedPrior || 'No', visaCountryName || null, visaHowManyTimes || null,
      previousVisaRefusal || 'No', refusalReason || null, refusalCountryName || null,

      // Comments
      comments || null,

      // Contact Details
      mobile, whatsapp || null, email, fatherMobile, motherMobile || null,

      // Address Details
      address, city, pincode, state, country,

      // Document Upload
      uploadDocuments || 'No, Already share on WhatsApp or Email',

      // Document Paths
      documentPaths.marksheet10,
      documentPaths.marksheet12,
      documentPaths.ugDegree,
      documentPaths.pgDegree,
      documentPaths.aadharCard,
      documentPaths.passportFront,
      documentPaths.passportBack,
      documentPaths.photograph,
      documentPaths.englishExamCert,
      documentPaths.entranceExamScorecard,
      documentPaths.workExpCertificate,

      // Metadata
      course || 'Other Courses', source || 'Other Courses Application Form'
    ];

    const [result] = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: result.insertId
      }
    });
  } catch (error) {
    console.error('Error submitting other courses application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
});

// Get all other courses applications
router.get('/', async (req, res) => {
  try {
    const [applications] = await pool.query(`
      SELECT * FROM other_courses_applications
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching other courses applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
});

// Get statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        COUNT(*) as total_applications,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today_applications,
        SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as this_week_applications,
        SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as this_month_applications
      FROM other_courses_applications
    `);

    res.json({
      success: true,
      data: stats[0]
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

    // Map frontend field names to database column names
    const fieldMapping = {
      'document_marksheet_10': 'document_marksheet_10',
      'document_marksheet_12': 'document_marksheet_12',
      'document_ug_degree': 'document_ug_degree',
      'document_pg_degree': 'document_pg_degree',
      'document_aadhar_card': 'document_aadhar_card',
      'document_passport_front': 'document_passport_front',
      'document_passport_back': 'document_passport_back',
      'document_photograph': 'document_photograph',
      'document_english_exam_cert': 'document_english_exam_cert',
      'document_entrance_exam_scorecard': 'document_entrance_exam_scorecard',
      'document_work_exp_certificate': 'document_work_exp_certificate'
    };

    const dbColumn = fieldMapping[documentType];
    if (!dbColumn) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document type'
      });
    }

    // Update the document path in database
    const query = `UPDATE other_courses_applications SET ${dbColumn} = ? WHERE id = ?`;
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
    if (updateData.entrance_exams && typeof updateData.entrance_exams === 'object') {
      updateData.entrance_exams = JSON.stringify(updateData.entrance_exams);
    }

    // Build dynamic UPDATE query
    const fields = Object.keys(updateData);
    const values = Object.values(updateData);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const query = `UPDATE other_courses_applications SET ${setClause} WHERE id = ?`;

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

    const query = 'DELETE FROM other_courses_applications WHERE id = ?';
    await pool.query(query, [id]);

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
