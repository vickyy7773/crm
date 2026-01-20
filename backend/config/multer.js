const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = [
  'uploads/student-applications',
  'uploads/other-courses-applications'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine upload path based on route
    const uploadPath = req.baseUrl.includes('other-courses')
      ? 'uploads/other-courses-applications'
      : 'uploads/student-applications';
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, nameWithoutExt + '-' + uniqueSuffix + ext);
  }
});

// File filter - only accept images and PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed!'));
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

// Middleware for multiple file uploads (for application forms)
const uploadFields = upload.fields([
  { name: 'marksheet10', maxCount: 1 },
  { name: 'marksheet12', maxCount: 1 },
  { name: 'neetScorecard', maxCount: 1 },
  { name: 'aadharFront', maxCount: 1 },
  { name: 'aadharBack', maxCount: 1 },
  { name: 'photograph', maxCount: 1 },
  // Other courses specific fields
  { name: 'ugDegree', maxCount: 1 },
  { name: 'pgDegree', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 },
  { name: 'passportFront', maxCount: 1 },
  { name: 'passportBack', maxCount: 1 },
  { name: 'englishExamCert', maxCount: 1 },
  { name: 'entranceExamScorecard', maxCount: 1 },
  { name: 'workExpCertificate', maxCount: 1 }
]);

module.exports = { upload, uploadFields };
