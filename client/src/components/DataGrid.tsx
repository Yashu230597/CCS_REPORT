import React, { useMemo, useCallback } from 'react';
import { Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ExcelRow } from '../types';

const { Text } = Typography;

interface DataGridProps {
  data: ExcelRow[];
  loading?: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({ data, loading = false }) => {
  // Clean and validate data
  const cleanData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort by rowNumber to ensure proper order
    return [...data]
      .filter(row => row && row['S.No'] && row['Job Details'])
      .sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0));
  }, [data]);

  if (!cleanData || cleanData.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Typography.Text>No data to display</Typography.Text>
      </div>
    );
  }

  // Render status indicators
  const renderStatusCell = (value: any, record: ExcelRow, columnKey: string) => {
    const statusKey = `${columnKey}_status`;
    const colorKey = `${columnKey}_color`;
    const typeKey = `${columnKey}_type`;
    
    const status = record[statusKey] || '';
    const color = record[colorKey] || '#666666';
    const type = record[typeKey] || '';

    // For time values, show just the text
    if (type === 'time' || (value && value.toString().includes(':'))) {
      return (
        <span style={{ 
          fontSize: '10px',
          color: '#333',
          fontWeight: '600' /* Made bold */
        }}>
          {value || ''}
        </span>
      );
    }

    // For status values with colors
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: '4px',
        padding: '1px 0'
      }}>
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0
          }}
        />
        <span style={{ 
          fontSize: '10px',
          color: '#333',
          fontWeight: '600' /* Made bold */
        }}>
          {value || ''}
        </span>
      </div>
    );
  };

  // Generate columns dynamically
  const columns: ColumnsType<ExcelRow> = useMemo(() => {
    if (cleanData.length === 0) return [];

    // Get all unique column keys
    const allKeys = Object.keys(cleanData[0] || {}).filter(key => {
      // Exclude metadata and status keys
      if (['id', 'uploadDate', 'rowNumber'].includes(key)) return false;
      if (key.includes('_status') || key.includes('_color') || key.includes('_type')) return false;
      return true;
    });

    // Define column order
    const orderedKeys = [];
    if (allKeys.includes('S.No')) orderedKeys.push('S.No');
    if (allKeys.includes('Job Details')) orderedKeys.push('Job Details');
    
    // Add other columns in order
    allKeys.forEach(key => {
      if (!['S.No', 'Job Details', 'Comments'].includes(key)) {
        orderedKeys.push(key);
      }
    });
    
    // Add Comments at the end
    if (allKeys.includes('Comments')) orderedKeys.push('Comments');

    return orderedKeys.map((key, index) => {
      const isSerialNumber = key === 'S.No';
      const isJobDetails = key === 'Job Details';
      const isComments = key === 'Comments';

      return {
        title: (
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#ffffff',
            textAlign: 'center',
            padding: '4px 6px',
            lineHeight: '1.2'
          }}>
            {key}
          </div>
        ),
        dataIndex: key,
        key: `col-${index}-${key}`,
        width: isSerialNumber ? 50 : isJobDetails ? 200 : isComments ? 150 : 120,
        render: (text: any, record: ExcelRow, rowIndex: number) => {
          const cellStyle = {
            padding: '3px 6px',
            minHeight: '24px',
            fontSize: '11px',
            lineHeight: '1.2',
            color: '#202124',
            display: 'flex',
            alignItems: 'center',
            wordBreak: 'break-word' as const,
            whiteSpace: 'normal' as const,
          };

          if (isSerialNumber) {
            return (
              <div style={{ ...cellStyle, justifyContent: 'center', background: '#F1F3F4', fontWeight: 500 }}>
                <Text style={{ fontSize: '11px', color: '#5f6368' }}>
                  {text}
                </Text>
              </div>
            );
          }
          
          if (isJobDetails || isComments) {
            return (
              <div style={{ ...cellStyle, justifyContent: 'flex-start', paddingLeft: '6px' }}>
                <Text style={{ 
                  fontSize: '11px', 
                  fontWeight: 400, 
                  color: '#202124',
                  wordBreak: 'break-word',
                  whiteSpace: 'normal',
                  width: '100%'
                }}>
                  {text || (isComments ? '' : 'N/A')}
                </Text>
              </div>
            );
          }

          // Status column
          return (
            <div style={{ ...cellStyle, justifyContent: 'center' }}>
              {renderStatusCell(text, record, key)}
            </div>
          );
        },
        sorter: isSerialNumber ? (a: ExcelRow, b: ExcelRow) => {
          const aNum = Number(a[key]) || 0;
          const bNum = Number(b[key]) || 0;
          return aNum - bNum;
        } : undefined,
        ellipsis: false,
      };
    });
  }, [cleanData, renderStatusCell]);

  return (
    <div style={{ 
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div 
        className="table-scroll-container" 
        style={{ 
          overflow: 'auto', 
          maxHeight: '80vh',
          width: '100%',
          /* Remove minWidth to prevent horizontal scrollbars */
          backgroundColor: 'white',
          border: '1px solid #d0d7de'
        }}
      >
        <Table
          dataSource={cleanData}
          columns={columns}
          rowKey={(record) => `${record.id}-${record.rowNumber}-${record['S.No']}`}
          pagination={false}
          size="small"
          bordered={true}
          loading={loading}
          className="excel-table"
          tableLayout="auto" /* Changed to auto for responsive layout */
          scroll={{ x: 'max-content' }} /* Responsive horizontal scroll */
        />
      </div>
      
      <style>{`
        .excel-table {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          border-collapse: collapse;
          width: 100%;
        }
        
        .excel-table .ant-table-thead > tr > th {
          background: #4472C4 !important;
          color: #ffffff !important;
          font-weight: 600;
          text-align: center;
          padding: 4px 6px !important;
          height: 32px;
          font-size: 11px;
          line-height: 1.2;
          border: 1px solid #2F4F8F !important;
        }
        
        .excel-table .ant-table-tbody > tr > td {
          padding: 3px 6px !important;
          min-height: 24px;
          font-size: 11px;
          line-height: 1.2;
          background: #ffffff;
          border: 1px solid #d0d7de !important;
        }
        
        .excel-table .ant-table-tbody > tr:nth-child(even) > td {
          background: #F8F9FA !important;
        }
        
        .excel-table .ant-table-tbody > tr:hover > td {
          background: #e6f3ff !important;
        }
        
        .excel-table .ant-table-container {
          border: 1px solid #d0d7de !important;
        }
        
        .excel-table .ant-table-content {
          overflow: visible !important;
        }
        
        /* Ensure print/capture quality */
        @media print {
          .excel-table {
            break-inside: avoid;
          }
          
          .excel-table .ant-table-tbody > tr {
            break-inside: avoid;
          }
          
          .table-scroll-container {
            height: auto !important;
            overflow: visible !important;
          }
        }
        
        /* For image capture */
        .excel-table .ant-table-tbody > tr > td:first-child {
          background: #F1F3F4 !important;
          font-weight: 500;
          color: #5f6368 !important;
          text-align: center;
          width: 50px;
          min-width: 50px;
          max-width: 50px;
        }
        
        .excel-table .ant-table-thead > tr > th:first-child {
          background: #4472C4 !important;
          color: #ffffff !important;
          text-align: center;
          width: 50px;
          min-width: 50px;
          max-width: 50px;
        }
        
        /* For image capture - remove any height restrictions */
        .image-capture-mode .table-scroll-container {
          height: auto !important;
          overflow: visible !important;
          width: auto !important;
          min-width: 100% !important;
          max-width: none !important;
        }
        
        .image-capture-mode .ant-table-body {
          height: auto !important;
          overflow: visible !important;
          width: auto !important;
        }
        
        .image-capture-mode .ant-table-container {
          height: auto !important;
          overflow: visible !important;
          width: auto !important;
          min-width: 100% !important;
        }
        
        .image-capture-mode .ant-table {
          width: auto !important;
          min-width: 100% !important;
          table-layout: auto !important;
        }
        
        .image-capture-mode .ant-table-content {
          overflow: visible !important;
          width: auto !important;
        }
        
        .image-capture-mode .ant-table-thead,
        .image-capture-mode .ant-table-tbody {
          width: auto !important;
        }
        

        


        /* Main table styling - Excel-like compact appearance */
        .excel-table .ant-table {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11px;
          border-collapse: collapse;
          width: 100%;
          /* Remove min-width to prevent scrollbars on home screen */
        }
        
        /* Header styling - different colors for different column types */
        .excel-table .ant-table-thead > tr > th {
          font-weight: 700; /* Made bolder */
          font-size: 11px;
          padding: 4px 8px;
          text-align: center;
          border: 1px solid #ffffff;
          height: 25px;
          line-height: 1.2;
          white-space: normal;
          word-wrap: break-word;
          color: white !important;
        }
        
        /* Job Details header - Blue background */
        .excel-table .ant-table-thead > tr > th:nth-child(2) {
          background-color: #4F81BD !important;
          color: white !important;
        }
        
        /* Time-based column headers - Red/Orange background */
        .excel-table .ant-table-thead > tr > th:not(:first-child):not(:nth-child(2)):not(:last-child) {
          background-color: #C5504B !important;
          color: white !important;
        }
        
        /* S.No and Comments headers - Light blue */
        .excel-table .ant-table-thead > tr > th:first-child,
        .excel-table .ant-table-thead > tr > th:last-child {
          background-color: #4F81BD !important;
          color: white !important;
        }
        
        /* Cell styling - compact Excel appearance with bold text */
        .excel-table .ant-table-tbody > tr > td {
          padding: 2px 6px;
          font-size: 10px;
          font-weight: 600; /* Made bold */
          min-height: 20px;
          border: 1px solid #d0d7de;
          text-align: center;
          vertical-align: middle;
          line-height: 1.2;
          background-color: white;
        }
        
        /* Alternating row colors like Excel */
        .excel-table .ant-table-tbody > tr:nth-child(even) > td {
          background-color: #f8f9fa;
        }
        
        /* Row number column - compact */
        .excel-table .ant-table-tbody > tr > td:first-child {
          background-color: #f0f0f0;
          font-weight: 700; /* Extra bold for row numbers */
          color: #333;
          width: 40px;
          min-width: 40px;
          font-size: 10px;
        }
        
        /* Job Details column - wider for content */
        .excel-table .ant-table-thead > tr > th:nth-child(2),
        .excel-table .ant-table-tbody > tr > td:nth-child(2) {
          width: 300px;
          min-width: 300px;
          text-align: left;
          padding-left: 8px;
          font-size: 10px;
          font-weight: 600; /* Bold for better readability */
        }
        
        /* Comments column - wider */
        .excel-table .ant-table-thead > tr > th:last-child,
        .excel-table .ant-table-tbody > tr > td:last-child {
          width: 200px;
          min-width: 200px;
          text-align: left;
          padding-left: 8px;
          font-size: 10px;
          font-weight: 600; /* Bold for better readability */
        }
        
        /* Time-based status columns - compact */
        .excel-table .ant-table-thead > tr > th:not(:first-child):not(:nth-child(2)):not(:last-child),
        .excel-table .ant-table-tbody > tr > td:not(:first-child):not(:nth-child(2)):not(:last-child) {
          width: 90px;
          min-width: 90px;
          font-size: 10px;
        }

        /* Image capture mode - maintain compact Excel appearance */
        .image-capture-mode .excel-table .ant-table-thead > tr > th {
          font-size: 11px !important;
          font-weight: 700 !important; /* Bold headers */
          padding: 4px 8px !important;
          height: 25px !important;
          line-height: 1.2 !important;
        }
        
        .image-capture-mode .excel-table .ant-table-tbody > tr > td {
          font-size: 10px !important;
          font-weight: 600 !important; /* Bold text */
          padding: 2px 6px !important;
          min-height: 20px !important;
          line-height: 1.2 !important;
        }
        
        .image-capture-mode .excel-table .ant-table-tbody > tr > td:first-child {
          font-size: 10px !important;
          font-weight: 700 !important; /* Extra bold for row numbers */
          padding: 2px 6px !important;
        }
        
        /* Bold status indicators for image */
        .image-capture-mode .excel-table .ant-table-tbody > tr > td div {
          font-size: 10px !important;
          font-weight: 600 !important; /* Bold status text */
        }
        
        .image-capture-mode .excel-table .ant-table-tbody > tr > td div > div[style*="border-radius"] {
          width: 6px !important;
          height: 6px !important;
        }
        
        /* Compact column widths for image capture */
        .image-capture-mode .excel-table .ant-table-thead > tr > th:first-child,
        .image-capture-mode .excel-table .ant-table-tbody > tr > td:first-child {
          width: 40px !important;
          min-width: 40px !important;
        }
        
        .image-capture-mode .excel-table .ant-table-thead > tr > th:nth-child(2),
        .image-capture-mode .excel-table .ant-table-tbody > tr > td:nth-child(2) {
          width: 300px !important;
          min-width: 300px !important;
        }
        
        .image-capture-mode .excel-table .ant-table-thead > tr > th:last-child,
        .image-capture-mode .excel-table .ant-table-tbody > tr > td:last-child {
          width: 200px !important;
          min-width: 200px !important;
        }
        
        .image-capture-mode .excel-table .ant-table-thead > tr > th:not(:first-child):not(:nth-child(2)):not(:last-child),
        .image-capture-mode .excel-table .ant-table-tbody > tr > td:not(:first-child):not(:nth-child(2)):not(:last-child) {
          width: 90px !important;
          min-width: 90px !important;
        }
      `}</style>
    </div>
  );
};

export default DataGrid; 