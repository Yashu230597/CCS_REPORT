import { useState, useRef } from 'react';
import { Layout, Typography, Space, Row, Col, Upload, Button, Spin, Alert } from 'antd';
import { InboxOutlined, PictureOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { uploadExcelFile } from './services/api';
import DataGrid from './components/DataGrid';
import { ExcelRow, UploadInfo } from './types';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;

function App() {
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  const uploadMutation = useMutation({
    mutationFn: uploadExcelFile,
    onError: (error) => {
      console.error('Upload error:', error);
    }
  });

  const handleFileUpload = (file: File) => {
    uploadMutation.mutate(file, {
      onSuccess: (response) => {
        console.log('Upload successful:', response);
        setExcelData(response.data || response); // Handle both old and new response formats
        setUploadInfo({
          fileName: response.fileName || file.name,
          uploadDate: response.uploadDate || new Date().toISOString(),
          totalRows: response.totalRows || (response.data || response).length
        });
      },
      onError: (error) => {
        console.error('Upload failed:', error);
      }
    });
    return false; // Prevent default upload behavior
  };

  const downloadAsImage = async () => {
    if (!tableRef.current) return;

    setIsGeneratingImage(true);
    try {
      // Get the table scroll container (the actual table without header info)
      const scrollContainer = tableRef.current.querySelector('.table-scroll-container') as HTMLElement;
      const tableElement = tableRef.current.querySelector('.ant-table-container') as HTMLElement;
      const tableBody = tableRef.current.querySelector('.ant-table-body') as HTMLElement;
      const antTable = tableRef.current.querySelector('.ant-table') as HTMLElement;
      
      if (!scrollContainer || !tableElement) {
        alert('Table not found. Please try again.');
        return;
      }

      // Store original styles
      const originalScrollStyle = scrollContainer.style.cssText;
      const originalTableStyle = tableElement.style.cssText;
      const originalBodyStyle = tableBody?.style.cssText || '';
      const originalAntTableStyle = antTable?.style.cssText || '';

      // Temporarily modify styles to show all content
      scrollContainer.style.height = 'auto';
      scrollContainer.style.maxHeight = 'none';
      scrollContainer.style.overflow = 'visible';
      scrollContainer.style.width = 'auto';
      scrollContainer.style.minWidth = '1400px'; /* Set minimum width for image capture */
      scrollContainer.classList.add('image-capture-mode');
      
      tableElement.style.height = 'auto';
      tableElement.style.maxHeight = 'none';
      tableElement.style.overflow = 'visible';
      tableElement.style.width = 'auto';
      tableElement.style.minWidth = '1400px'; /* Ensure table is wide enough for capture */
      
      if (tableBody) {
        tableBody.style.height = 'auto';
        tableBody.style.maxHeight = 'none';
        tableBody.style.overflow = 'visible';
        tableBody.style.width = 'auto';
      }

      if (antTable) {
        antTable.style.width = 'auto';
        antTable.style.minWidth = '100%';
      }

      // Wait longer for the layout to fully update
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get the actual dimensions after layout update
      const rect = scrollContainer.getBoundingClientRect();
      const captureWidth = Math.max(rect.width, scrollContainer.scrollWidth, 1400); // Match compact layout
      
      // Calculate minimum height based on row count (header + data rows)
      const minHeightForRows = 25 + (excelData.length * 20); // 25px header + 20px per data row
      const captureHeight = Math.max(rect.height, scrollContainer.scrollHeight, minHeightForRows);

      // Debug logging
      console.log('Capture dimensions:', {
        rectWidth: rect.width,
        rectHeight: rect.height,
        scrollWidth: scrollContainer.scrollWidth,
        scrollHeight: scrollContainer.scrollHeight,
        captureWidth,
        captureHeight,
        dataRows: excelData.length,
        minHeightForRows
      });

      // Capture only the table container with expanded dimensions
      const canvas = await html2canvas(scrollContainer, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        height: captureHeight,
        width: captureWidth,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        logging: false,
        windowWidth: captureWidth,
        windowHeight: captureHeight,
        x: 0,
        y: 0
      });

      // Restore original styles
      scrollContainer.style.cssText = originalScrollStyle;
      scrollContainer.classList.remove('image-capture-mode');
      tableElement.style.cssText = originalTableStyle;
      if (tableBody) {
        tableBody.style.cssText = originalBodyStyle;
      }
      if (antTable) {
        antTable.style.cssText = originalAntTableStyle;
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${uploadInfo?.fileName || 'excel-data'}-${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const hasData = excelData && excelData.length > 0;

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        background: '#2C3E50', 
        padding: '0 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Row justify="space-between" align="middle" style={{ height: '100%' }}>
          <Col>
            <Title level={3} style={{ color: 'white', margin: 0, fontSize: '20px' }}>
              📊 Excel Data Viewer
            </Title>
          </Col>
          {uploadInfo && (
            <Col>
              <Space>
                <Text style={{ color: 'white', fontSize: '14px' }}>
                  {uploadInfo.fileName} • {uploadInfo.totalRows} rows
                </Text>
                {hasData && (
                  <Button
                    type="primary"
                    icon={<PictureOutlined />}
                    onClick={downloadAsImage}
                    loading={isGeneratingImage}
                    disabled={isGeneratingImage}
                    style={{
                      background: '#ffffff',
                      borderColor: '#ffffff',
                      color: '#2C3E50'
                    }}
                    size="middle"
                  >
                    {isGeneratingImage ? 'Generating...' : 'Download as Image'}
                  </Button>
                )}
              </Space>
            </Col>
          )}
        </Row>
      </Header>

      <Content style={{ padding: '20px', maxWidth: '100%', width: '100%' }}>
        <div style={{ 
          background: '#fff', 
          padding: '24px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '100%', /* Ensure it doesn't exceed viewport */
          /* Remove minWidth to prevent horizontal scrollbars */
          overflowX: 'auto' /* Allow horizontal scrolling if needed */
        }}>
          {!hasData ? (
            <Row justify="center" align="middle" style={{ flex: 1, minHeight: '400px' }}>
              <Col span={12}>
                <div style={{
                  background: 'white',
                  padding: '48px',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  textAlign: 'center'
                }}>
                  <Title level={2} style={{ color: '#2C3E50', marginBottom: '24px' }}>
                    Welcome to Excel Data Viewer
                  </Title>
                  <Text style={{ fontSize: '16px', color: '#666', display: 'block', marginBottom: '32px' }}>
                    Upload your Excel file to view and analyze your data in a beautiful, interactive table format.
                  </Text>
                  
                  <Dragger
                    name="excel"
                    beforeUpload={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    style={{
                      padding: '20px',
                      border: '2px dashed #2C3E50',
                      borderRadius: '8px',
                      background: '#f8f9ff'
                    }}
                  >
                    <div style={{ padding: '20px' }}>
                      <InboxOutlined style={{ fontSize: '48px', color: '#2C3E50', marginBottom: '16px' }} />
                      <Title level={4} style={{ color: '#2C3E50', marginBottom: '8px' }}>
                        Drop your Excel file here or click to browse
                      </Title>
                      <Text style={{ color: '#666' }}>
                        Supports .xlsx, .xls, and .csv files
                      </Text>
                    </div>
                  </Dragger>

                  {uploadMutation.isPending && (
                    <div style={{ marginTop: '24px' }}>
                      <Spin size="large" />
                      <Text style={{ display: 'block', marginTop: '12px', color: '#666' }}>
                        Processing your Excel file...
                      </Text>
                    </div>
                  )}

                  {uploadMutation.isError && (
                    <Alert
                      message="Upload Failed"
                      description="Please check your file format and try again."
                      type="error"
                      style={{ marginTop: '24px' }}
                      showIcon
                    />
                  )}
                </div>
              </Col>
            </Row>
          ) : (
            <div 
              ref={tableRef}
              style={{ 
                background: 'white', 
                borderRadius: '8px', 
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}
            >
              <div style={{ marginBottom: '16px', borderBottom: '2px solid #2C3E50', paddingBottom: '16px' }}>
                <Title level={4} style={{ margin: 0, color: '#2C3E50' }}>
                  📈 {uploadInfo?.fileName}
                </Title>
                <Text style={{ color: '#666' }}>
                  {uploadInfo?.totalRows} rows • Uploaded on {new Date(uploadInfo?.uploadDate || '').toLocaleDateString()}
                </Text>
              </div>
              
              <DataGrid data={excelData} loading={uploadMutation.isPending} />
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default App; 