import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { message } from 'antd';

interface ExcelUploadProps {
  onFileSelect: (file: File) => void;
  loading?: boolean;
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onFileSelect, loading = false }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        
        // Validate file type
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          message.error('Please upload only Excel (.xlsx, .xls) or CSV files');
          return;
        }
        
        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
          message.error('File size must be less than 10MB');
          return;
        }
        
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false,
    disabled: loading,
    noClick: false, // Allow clicking
    noKeyboard: true, // Disable keyboard interaction
    preventDropOnDocument: true // Prevent drops on document
  });

  return (
    <div {...getRootProps()} style={{ display: 'inline-block' }}>
      <input {...getInputProps()} />
      {/* This component is now just a wrapper - the actual upload UI is in App.tsx */}
    </div>
  );
};

export default ExcelUpload; 