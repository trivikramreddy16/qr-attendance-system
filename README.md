# QR Attendance System

A modern, full-stack attendance management system using QR codes for seamless attendance tracking. Built with React.js frontend and Node.js/Express backend with MongoDB database.

## 🌟 Features

### 👨‍🏫 Faculty Features
- **Dashboard Overview**: Real-time statistics and session management
- **QR Code Generation**: Create QR codes for attendance sessions with geofencing
- **Session Management**: Start, stop, and manage attendance sessions
- **Student Management**: View and manage enrolled students
- **Attendance Reports**: Comprehensive attendance analytics and reports
- **Geofencing**: Location-based attendance validation
- **Export Data**: Export attendance records to CSV/Excel

### 👨‍🎓 Student Features  
- **Dashboard**: Personal attendance overview with statistics
- **QR Scanner**: Camera-based QR code scanning for attendance
- **Mock Scanner**: Test QR scanning without camera access
- **Attendance History**: View detailed attendance records
- **Subject-wise Analytics**: Track attendance per subject
- **Real-time Updates**: Live dashboard updates after marking attendance
- **Low Attendance Alerts**: Automatic warnings for attendance below 75%

### 🛠️ System Features
- **Real-time Updates**: Live data synchronization
- **Mobile Responsive**: Works on all device sizes
- **Network Diagnostics**: Built-in network testing tools
- **Camera Testing**: Camera functionality verification
- **Secure Authentication**: JWT-based user authentication
- **Role-based Access**: Separate interfaces for faculty and students
- **API Documentation**: Comprehensive API endpoints

## 🏗️ Architecture

```
QR-Attendance-System/
├── frontend/                 # React.js application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── common/      # Shared components
│   │   │   ├── faculty/     # Faculty-specific components
│   │   │   └── student/     # Student-specific components
│   │   ├── context/         # React Context (Auth, etc.)
│   │   ├── services/        # API services
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json         # Dependencies
└── backend/                 # Node.js/Express API
    ├── controllers/         # Route controllers
    ├── middleware/          # Custom middleware
    ├── models/              # MongoDB schemas
    ├── routes/              # API routes
    ├── utils/               # Helper functions
    └── server.js            # Main server file
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher)
- **MongoDB** (local or cloud instance)
- **Git**
- **Modern web browser** with camera support

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd QR-Attendance-System
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   echo "MONGODB_URI=mongodb://localhost:27017/qr-attendance
   JWT_SECRET=your-super-secret-jwt-key
   PORT=5000" > .env
   
   # Start backend server
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   
   # Create .env file for API URL
   echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
   
   # Start frontend development server
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

## 🔧 Configuration

### Backend Environment Variables (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/qr-attendance

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=5000
NODE_ENV=development

# CORS (optional - for specific frontend URLs)
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment Variables (.env)
```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api

# For mobile/network access, use your network IP:
# REACT_APP_API_URL=http://192.168.1.100:5000/api
```

### Network Configuration

For **mobile access** or **different network setups**:

1. **Find your network IP**:
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```

2. **Update frontend .env**:
   ```env
   REACT_APP_API_URL=http://YOUR_NETWORK_IP:5000/api
   ```

3. **Backend automatically binds to all interfaces** (`0.0.0.0:5000`)

## 👥 User Management

### Default Users
The system automatically creates default users for testing:

**Faculty Account:**
- Email: `faculty@example.com`
- Password: `password123`
- Role: `faculty`

**Student Account:**
- Email: `student@example.com`  
- Password: `password123`
- Role: `student`

### Creating New Users
Use the registration endpoint or create them directly in MongoDB:

```javascript
// Example user creation
{
  name: "John Doe",
  email: "john@example.com",
  password: "hashedPassword",
  role: "student", // or "faculty"
  studentId: "STU001", // for students
  subjects: ["MATH101", "PHYS102"] // enrolled subjects
}
```

## 📱 Usage Guide

### For Faculty

1. **Login** with faculty credentials
2. **Create a Session**:
   - Navigate to "Create Session"
   - Select subject and set geofence location
   - Generate QR code
3. **Share QR Code** with students (display on screen/projector)
4. **Monitor Attendance** in real-time
5. **End Session** when attendance period is over
6. **View Reports** in the dashboard

### For Students

1. **Login** with student credentials
2. **View Dashboard** to check attendance statistics
3. **Mark Attendance**:
   - Go to "Scan QR" tab
   - Point camera at faculty's QR code
   - Confirm attendance submission
4. **Check Attendance History** in "Attendance" tab
5. **Monitor Progress** via dashboard analytics

## 🎯 QR Code System

### QR Data Structure
```json
{
  "sessionId": "unique-session-id",
  "facultyId": "faculty-user-id", 
  "subject": "MATH101",
  "type": "attendance",
  "timestamp": "2024-01-20T10:00:00Z",
  "geofence": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 50
  }
}
```

### Geofencing
- **Radius**: Configurable (default: 50 meters)
- **Validation**: Students must be within geofence to mark attendance
- **Location**: Uses browser geolocation API

## 🔌 API Documentation

### Authentication Endpoints
```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
GET  /api/auth/me             # Get current user
POST /api/auth/logout         # User logout
```

### Faculty Endpoints
```
POST /api/sessions            # Create attendance session
GET  /api/sessions            # Get faculty sessions
PUT  /api/sessions/:id        # Update session
DELETE /api/sessions/:id      # Delete session
GET  /api/attendance/reports  # Get attendance reports
```

### Student Endpoints
```
POST /api/attendance/mark     # Mark attendance
GET  /api/users/my-attendance # Get student's attendance
GET  /api/sessions/active     # Get active sessions
```

### General Endpoints
```
GET  /api/health             # Health check
GET  /api/users              # Get users (admin)
POST /api/users              # Create user (admin)
```

## 🧪 Testing Features

### Network Test
- Tests API connectivity
- Validates response times
- Checks CORS configuration

### Camera Test  
- Verifies camera permissions
- Tests video stream functionality
- Camera compatibility check

### Mock Scanner
- Test QR scanning without camera
- Input QR data manually
- Debug QR code formats

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: 'student', 'faculty'),
  studentId: String,
  subjects: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Session Model
```javascript
{
  facultyId: ObjectId,
  subject: String,
  qrData: Object,
  geofence: {
    latitude: Number,
    longitude: Number,
    radius: Number
  },
  isActive: Boolean,
  startTime: Date,
  endTime: Date,
  attendees: [ObjectId]
}
```

### Attendance Model
```javascript
{
  studentId: ObjectId,
  sessionId: ObjectId,
  subject: String,
  timestamp: Date,
  location: {
    latitude: Number,
    longitude: Number
  },
  markedBy: String,
  deviceType: String
}
```

## 🚨 Troubleshooting

### Common Issues

1. **Camera Not Working**
   - Check browser permissions
   - Use HTTPS for camera access
   - Try the Camera Test feature

2. **API Connection Failed**
   - Verify backend is running
   - Check network configuration
   - Use Network Test tool

3. **QR Code Not Scanning**
   - Ensure proper lighting
   - Check QR code format
   - Use Mock Scanner for testing

4. **Attendance Not Updating**
   - Check network connectivity
   - Verify session is active
   - Check browser console for errors

5. **Geofencing Issues**
   - Enable location permissions
   - Check GPS accuracy
   - Verify geofence radius

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt for password security  
- **CORS Protection**: Configured for specific origins
- **Input Validation**: Comprehensive request validation
- **Role-based Access**: Endpoint protection by user role
- **Rate Limiting**: API rate limiting (configurable)

## 📈 Performance

- **Real-time Updates**: WebSocket support for live data
- **Optimized Queries**: MongoDB aggregation pipelines
- **Caching**: Response caching for frequent requests
- **Mobile Optimized**: Responsive design and touch-friendly
- **Lazy Loading**: Component-based code splitting

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=super-secure-secret-key
   ```

2. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy Backend**
   - Use PM2 for process management
   - Configure reverse proxy (nginx)
   - Set up SSL certificates

### Docker Deployment (Optional)
```dockerfile
# Dockerfile example
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`) 
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review API documentation

## 🎉 Acknowledgments

- React.js community for excellent documentation
- MongoDB for flexible database solutions
- QR code libraries for seamless integration
- Open source community for inspiration and tools

---

**Made with ❤️ for efficient attendance management**