const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  'text/csv',
  'application/vnd.ms-excel',
  'application/csv',
  'text/plain'
]);

const csvFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (allowedMimeTypes.has(file.mimetype) || ext === '.csv') {
    cb(null, true);
    return;
  }
  cb(new Error('Only CSV files are allowed'), false);
};

const uploadCsv = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_CSV_FILE_SIZE, 10) || 2 * 1024 * 1024 // 2MB default
  },
  fileFilter: csvFileFilter
});

module.exports = uploadCsv;
