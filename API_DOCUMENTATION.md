# API Documentation

Complete API reference for the QR Attendance System.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### POST /auth/login
Login user and get JWT token.

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "student@example.com",
    "role": "student"
  }
}
```

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "password123",
  "role": "student",
  "studentId": "STU001"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### GET /auth/me
Get current user information.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "studentId": "STU001",
    "subjects": ["MATH101", "PHYS102"]
  }
}
```

---

## Session Endpoints (Faculty Only)

### POST /sessions
Create a new attendance session.

**Headers:** `Authorization: Bearer <faculty-token>`

**Request Body:**
```json
{
  "subject": "MATH101",
  "geofence": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "radius": 50
  }
}
```

**Response (201):**
```json
{
  "message": "Session created successfully",
  "session": {
    "id": "session-id",
    "facultyId": "faculty-id",
    "subject": "MATH101",
    "qrData": {
      "sessionId": "session-id",
      "facultyId": "faculty-id",
      "subject": "MATH101",
      "type": "attendance",
      "timestamp": "2024-01-20T10:00:00Z",
      "geofence": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "radius": 50
      }
    },
    "isActive": true,
    "startTime": "2024-01-20T10:00:00Z",
    "attendees": []
  }
}
```

### GET /sessions
Get all sessions for the authenticated faculty.

**Headers:** `Authorization: Bearer <faculty-token>`

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "session-id",
      "subject": "MATH101",
      "isActive": true,
      "startTime": "2024-01-20T10:00:00Z",
      "attendeeCount": 5,
      "totalStudents": 20
    }
  ]
}
```

### PUT /sessions/:id
Update a session (typically to end it).

**Headers:** `Authorization: Bearer <faculty-token>`

**Request Body:**
```json
{
  "isActive": false
}
```

**Response (200):**
```json
{
  "message": "Session updated successfully",
  "session": {
    "id": "session-id",
    "isActive": false,
    "endTime": "2024-01-20T11:00:00Z"
  }
}
```

### DELETE /sessions/:id
Delete a session.

**Headers:** `Authorization: Bearer <faculty-token>`

**Response (200):**
```json
{
  "message": "Session deleted successfully"
}
```

---

## Attendance Endpoints

### POST /attendance/mark
Mark attendance for a student.

**Headers:** `Authorization: Bearer <student-token>`

**Request Body:**
```json
{
  "qrData": {
    "sessionId": "session-id",
    "facultyId": "faculty-id",
    "subject": "MATH101",
    "type": "attendance",
    "timestamp": "2024-01-20T10:00:00Z",
    "geofence": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "radius": 50
    }
  },
  "location": {
    "latitude": 40.7125,
    "longitude": -74.0058
  },
  "deviceType": "mobile"
}
```

**Response (200):**
```json
{
  "message": "Attendance marked successfully",
  "attendance": {
    "id": "attendance-id",
    "studentId": "student-id",
    "sessionId": "session-id",
    "subject": "MATH101",
    "timestamp": "2024-01-20T10:15:00Z",
    "status": "Present"
  }
}
```

### GET /users/my-attendance
Get attendance data for the authenticated student.

**Headers:** `Authorization: Bearer <student-token>`

**Response (200):**
```json
{
  "overall": {
    "present": 15,
    "total": 20,
    "percentage": 75
  },
  "subjects": [
    {
      "code": "MATH101",
      "name": "Mathematics",
      "present": 8,
      "total": 10,
      "percentage": 80
    },
    {
      "code": "PHYS102", 
      "name": "Physics",
      "present": 7,
      "total": 10,
      "percentage": 70
    }
  ],
  "recentRecords": [
    {
      "subject": "MATH101",
      "date": "2024-01-20T10:15:00Z",
      "time": "10:15 AM",
      "status": "Present"
    }
  ]
}
```

### GET /attendance/reports
Get attendance reports (Faculty only).

**Headers:** `Authorization: Bearer <faculty-token>`

**Query Parameters:**
- `subject`: Filter by subject (optional)
- `startDate`: Start date for report (optional)
- `endDate`: End date for report (optional)

**Response (200):**
```json
{
  "summary": {
    "totalSessions": 10,
    "averageAttendance": 75.5,
    "totalStudents": 25
  },
  "sessions": [
    {
      "date": "2024-01-20",
      "subject": "MATH101",
      "attendees": 18,
      "total": 25,
      "percentage": 72
    }
  ],
  "students": [
    {
      "name": "John Doe",
      "studentId": "STU001",
      "present": 8,
      "total": 10,
      "percentage": 80
    }
  ]
}
```

---

## User Management Endpoints

### GET /users
Get all users (Admin functionality).

**Headers:** `Authorization: Bearer <admin-token>`

**Response (200):**
```json
{
  "users": [
    {
      "id": "user-id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### POST /users
Create a new user (Admin functionality).

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "faculty",
  "subjects": ["CHEM201", "CHEM202"]
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "user-id",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "faculty"
  }
}
```

---

## Utility Endpoints

### GET /health
Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00Z",
  "uptime": 3600,
  "database": "connected"
}
```

### GET /sessions/active
Get all currently active sessions.

**Response (200):**
```json
{
  "activeSessions": [
    {
      "id": "session-id",
      "subject": "MATH101",
      "facultyName": "Dr. Smith",
      "startTime": "2024-01-20T10:00:00Z"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Invalid request data",
  "details": ["Email is required", "Password must be at least 6 characters"]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden", 
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Session not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong on the server"
}
```

---

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- **Authentication endpoints**: 5 requests per minute
- **General endpoints**: 100 requests per minute
- **Attendance marking**: 10 requests per minute

When rate limit is exceeded:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 60
}
```

---

## WebSocket Events (Future Enhancement)

### Connection
```javascript
const socket = io('http://localhost:5000');
socket.emit('authenticate', { token: 'your-jwt-token' });
```

### Events
- `attendanceMarked`: Real-time attendance updates
- `sessionStarted`: New session notifications  
- `sessionEnded`: Session end notifications

### Example Usage
```javascript
socket.on('attendanceMarked', (data) => {
  console.log('New attendance marked:', data);
  // Update UI accordingly
});
```