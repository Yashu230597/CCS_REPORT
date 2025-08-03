const multiparty = require('multiparty');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

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

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = new multiparty.Form();
    
    const parsePromise = new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const { fields, files } = await parsePromise;
    
    if (!files.excel || !files.excel[0]) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = files.excel[0];
    const filePath = file.path;
    
    // Validate file type
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    if (!allowedMimes.includes(file.headers['content-type'])) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Invalid file type. Only Excel and CSV files are allowed.' });
    }

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
    
    // Process each data row
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
      }
    }
    
    // Sort by S.No to ensure proper order
    jsonData.sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0));
    
    // Clean up the uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      data: jsonData,
      totalRows: jsonData.length,
      fileName: file.originalFilename,
      uploadDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing Excel file:', error);
    
    res.status(500).json({ 
      error: 'Failed to process Excel file',
      details: error.message 
    });
  }
} 