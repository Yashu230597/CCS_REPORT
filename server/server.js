const express = require('express');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Helper function to convert Excel serial date to time format
const convertExcelTime = (serial) => {
  if (typeof serial !== 'number') return serial;
  
  // Excel stores time as fraction of day
  const totalMinutes = Math.round(serial * 24 * 60);
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Helper function to get formatted cell value
const getFormattedCellValue = (worksheet, cellAddress) => {
  const cell = worksheet[cellAddress];
  if (!cell) return '';
  
  // If cell has a formatted text, use it
  if (cell.w) return cell.w;
  
  // If cell has a raw value
  if (cell.v !== undefined) {
    // Check if it's a time value (between 0 and 1)
    if (typeof cell.v === 'number' && cell.v >= 0 && cell.v < 1) {
      return convertExcelTime(cell.v);
    }
    return cell.v;
  }
  
  return '';
};

// Helper function to determine status and color based on cell value
const getStatusInfo = (value) => {
  if (!value || value === null || value === undefined || value === '') {
    return { status: 'NA', color: '#d9d9d9', type: 'default' };
  }
  
  const strValue = String(value).toUpperCase().trim();
  
  // Green status indicators (ACTIVE, PASS, ENABLED, UNSUSPENDED)
  if (['ACTIVE', 'PASS', 'ENABLED', 'UNSUSPENDED'].includes(strValue)) {
    return { status: strValue, color: '#00B050', type: 'success' };
  }
  
  // Red status indicators (OFF, FAILED, INACTIVE, SUSPENDED)  
  if (['OFF', 'FAILED', 'INACTIVE', 'SUSPENDED'].includes(strValue)) {
    return { status: strValue, color: '#FF0000', type: 'error' };
  }
  
  // Orange status indicators (PENDING)
  if (['PENDING'].includes(strValue)) {
    return { status: strValue, color: '#FFC000', type: 'warning' };
  }
  
  // Time values (HH:MM format) - Blue indicators
  if (/^\d{1,2}:\d{2}$/.test(strValue)) {
    if (strValue === '00:00') {
      return { status: strValue, color: '#d9d9d9', type: 'default' };
    }
    return { status: strValue, color: '#0070C0', type: 'processing' };
  }
  
  // Date values (DD-MMM format) - Purple indicators  
  if (/^\d{1,2}-[A-Za-z]{3}$/.test(strValue)) {
    return { status: strValue, color: '#7030A0', type: 'purple' };
  }
  
  // NA values
  if (strValue === 'NA') {
    return { status: 'NA', color: '#d9d9d9', type: 'default' };
  }
  
  // Default for any other values
  return { status: strValue, color: '#0070C0', type: 'info' };
};

// Upload and process Excel file
app.post('/api/upload-excel', upload.single('excel'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    // Extract headers from first row
    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      const cellValue = getFormattedCellValue(worksheet, cellAddress);
      headers.push(cellValue || `Column${col + 1}`);
    }
    
    console.log('Headers found:', headers);
    
    // Process each data row - completely rewritten for clean processing
    const jsonData = [];
    
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const rowData = {};
      let hasValidData = false;
      
      // Process each column for this row
      for (let col = range.s.c; col <= range.e.c; col++) {
        const header = headers[col - range.s.c];
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cellValue = getFormattedCellValue(worksheet, cellAddress);
        
        // Skip processing column headers and empty columns
        if (!header || header.startsWith('Column')) continue;
        
        // Map the header to a clean name
        let cleanHeader = header;
        if (header.toLowerCase().includes('s.no') || header.toLowerCase().includes('s no') || header.toLowerCase() === 's.no') {
          cleanHeader = 'S.No';
        } else if (header.toLowerCase().includes('job') && header.toLowerCase().includes('detail')) {
          cleanHeader = 'Job Details';
        } else if (header.toLowerCase().includes('comment')) {
          cleanHeader = 'Comments';
        }
        
        // Store the raw value
        rowData[cleanHeader] = cellValue || '';
        
        // Add status info for non-text columns
        if (!['S.No', 'Job Details', 'Comments'].includes(cleanHeader)) {
          const statusInfo = getStatusInfo(cellValue);
          rowData[`${cleanHeader}_status`] = statusInfo.status;
          rowData[`${cleanHeader}_color`] = statusInfo.color;
          rowData[`${cleanHeader}_type`] = statusInfo.type;
        }
        
        if (cellValue && cellValue.toString().trim() !== '') {
          hasValidData = true;
        }
      }
      
      // Only include rows with valid S.No and Job Details
      const sNo = rowData['S.No'];
      const jobDetails = rowData['Job Details'];
      
      if (sNo && jobDetails && !isNaN(Number(sNo)) && jobDetails.toString().trim() !== '') {
        // Add metadata
        rowData.id = `row-${sNo}`;
        rowData.rowNumber = Number(sNo);
        rowData.uploadDate = new Date().toISOString();
        
        jsonData.push(rowData);
        console.log(`✓ Row ${sNo}: "${jobDetails}"`);
      } else {
        console.log(`✗ Skipped row ${row}: Invalid S.No="${sNo}" or Job="${jobDetails}"`);
      }
    }
    
    // Sort by S.No to ensure proper order
    jsonData.sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0));
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    console.log(`Successfully processed ${jsonData.length} valid rows`);
    console.log('Sample data:', jsonData[0]);
    
    res.json({
      success: true,
      data: jsonData,
      totalRows: jsonData.length,
      fileName: req.file.originalname,
      uploadDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to process Excel file',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Excel Upload API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Excel Upload API ready at http://localhost:${PORT}/api/upload-excel`);
});