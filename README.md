# Excel Data Viewer

A modern React application with a Node.js backend for uploading and viewing Excel files in a beautiful data grid interface.

## 🚀 Features

- **📤 Excel File Upload**: Drag & drop or click to upload Excel (.xlsx, .xls) and CSV files
- **📊 Beautiful Data Grid**: Interactive table with sorting, filtering, and pagination
- **🎯 Status Indicators**: Visual status indicators with color-coded badges and icons
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **⚡ Real-time Processing**: Fast Excel parsing and data display
- **🎨 Modern UI**: Built with Ant Design for a professional look
- **🔄 Loading States**: Smooth loading animations and progress indicators
- **📈 Data Statistics**: Quick overview of your data with summary statistics

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **Multer** for file uploads
- **xlsx** for Excel file parsing
- **CORS** for cross-origin requests
- **Helmet** for security

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Ant Design** for UI components
- **React Query** for API state management
- **React Dropzone** for file upload
- **Day.js** for date formatting

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### 1. Install Backend Dependencies
```bash
cd server
npm install
```

### 2. Install Frontend Dependencies
```bash
cd client
npm install
```

## 🚀 Running the Application

### 1. Start the Backend Server
```bash
cd server
npm run dev
```
The backend will run on http://localhost:5000

### 2. Start the Frontend Development Server
```bash
cd client
npm run dev
```
The frontend will run on http://localhost:3000

## 📖 Usage

1. **Upload Excel File**: 
   - Click the upload area or drag & drop your Excel/CSV file
   - Supported formats: `.xlsx`, `.xls`, `.csv`
   - Maximum file size: 10MB

2. **View Data**: 
   - Data is automatically displayed in a responsive table
   - Use sorting, filtering, and pagination controls
   - Status indicators show color-coded status information

3. **Data Features**:
   - **Sorting**: Click column headers to sort data
   - **Filtering**: Use status filter dropdown to filter by status
   - **Pagination**: Navigate through large datasets
   - **Row Numbers**: Each row has a number for easy reference
   - **Status Badges**: Visual indicators with icons and colors

## 🎯 API Endpoints

### POST `/api/upload-excel`
Upload and process Excel file

**Request**: 
- Method: POST
- Content-Type: multipart/form-data
- Body: File with key 'excel'

**Response**:
```json
{
  "success": true,
  "data": [...], // Array of processed rows
  "totalRows": 100,
  "fileName": "example.xlsx",
  "uploadDate": "2024-01-01T00:00:00.000Z"
}
```

### GET `/api/health`
Health check endpoint

**Response**:
```json
{
  "status": "OK",
  "message": "Excel Upload API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🎨 Status Types

The application supports the following status types with corresponding colors:

- **ACTIVE** 🟢 - Green (Success)
- **INACTIVE** 🔴 - Red (Error) 
- **PENDING** 🟡 - Yellow (Warning)
- **PROCESSING** 🟣 - Purple (Processing)
- **COMPLETED** 🔵 - Blue (Info)
- **FAILED** 🔴 - Red (Danger)

## 📁 Project Structure

```
final/
├── server/                 # Backend API
│   ├── server.js          # Main server file
│   ├── package.json       # Backend dependencies
│   └── uploads/           # Temporary file storage
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   ├── App.tsx        # Main app component
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── tsconfig.json      # TypeScript configuration
└── README.md
```

## 🔧 Development

### Backend Development
```bash
cd server
npm run dev  # Runs with nodemon for auto-restart
```

### Frontend Development
```bash
cd client
npm run dev  # Runs with Vite hot reload
```

### Building for Production

#### Frontend Build
```bash
cd client
npm run build
```

#### Frontend Preview
```bash
cd client
npm run preview
```

## 🚨 Error Handling

The application includes comprehensive error handling:

- **File Type Validation**: Only Excel and CSV files are accepted
- **File Size Limits**: Maximum 10MB file size
- **Network Error Handling**: Graceful handling of API failures
- **Upload Progress**: Real-time upload progress tracking
- **User Feedback**: Clear error messages and success notifications

## 🎯 Key Features in Detail

### Data Grid Features
- **Dynamic Columns**: Automatically adapts to your Excel structure
- **Fixed Columns**: Row numbers and status always visible
- **Responsive**: Horizontal scrolling for large datasets
- **Sorting**: Multi-column sorting capability
- **Filtering**: Status-based filtering
- **Pagination**: Configurable page sizes (10, 25, 50, 100)
- **Search**: Quick search through data
- **Export**: Easy data export capabilities

### Upload Features
- **Drag & Drop**: Modern file upload experience
- **Progress Tracking**: Real-time upload progress
- **Validation**: File type and size validation
- **Error Recovery**: Retry mechanism for failed uploads
- **Preview**: Immediate data preview after upload

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the console for error messages
2. Ensure both backend and frontend servers are running
3. Verify your Excel file format is supported
4. Check network connectivity between frontend and backend

---

**Happy Excel Viewing! 📊✨** 