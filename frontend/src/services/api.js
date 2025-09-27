// Dynamic API URL detection for mobile and ngrok compatibility
const getApiBaseUrl = () => {
  // If explicitly set in environment, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Check current hostname to determine API URL
  const hostname = window.location.hostname;
  const isNgrok = hostname.includes('ngrok.io') || hostname.includes('ngrok-free.app');
  const isHTTPS = window.location.protocol === 'https:';
  const isMobileHotspot = hostname === '192.168.137.157';
  const isLocalNetwork = hostname === '192.168.0.151';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  console.log('🔍 Hostname detection:', {
    hostname,
    isMobileHotspot,
    isLocalNetwork,
    isLocalhost,
    isNgrok,
    isHTTPS
  });
  
  if (isMobileHotspot) {
    // Accessing via mobile hotspot IP
    console.log('📱 Mobile hotspot detected, using mobile hotspot backend');
    return 'http://192.168.137.157:5000/api';
  }
  
  if (isLocalNetwork) {
    // Accessing via old local network IP
    console.log('🏠 Local network detected, using local network backend');
    return 'http://192.168.0.151:5000/api';
  }
  
  if (isNgrok) {
    // For ngrok HTTPS, try to use mobile hotspot backend
    if (isHTTPS) {
      console.warn('⚠️ ngrok HTTPS detected. Using mobile hotspot backend.');
      console.log('💡 Trying mobile hotspot backend: http://192.168.137.157:5000/api');
    }
    return 'http://192.168.137.157:5000/api';
  }
  
  // Default to localhost for local development
  console.log('🖥️ Localhost detected, using localhost backend');
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug: Log which API URL is being used
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌐 Current hostname:', window.location.hostname);

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      timeout: 10000, // 10 seconds timeout
      ...options,
    };

    console.log('🚀 Making API request to:', url);
    console.log('📝 Request config:', config);

    try {
      // Create a fetch request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout || 10000);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (!response.ok) {
        const errorMessage = data.message || `HTTP error! status: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = { data, status: response.status };
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ API Request failed:');
      console.error('🔗 URL:', url);
      console.error('⚙️ Config:', config);
      console.error('💥 Error:', error);
      
      // Handle different types of errors
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout. Server may be slow or unavailable.');
        timeoutError.name = 'TimeoutError';
        throw timeoutError;
      }
      
      // Check if it's a network/CORS error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('🚫 This looks like a CORS or network connectivity issue');
        console.error('💡 Possible solutions:');
        console.error('   1. Check if backend is running and accessible');
        console.error('   2. Verify CORS configuration allows your domain');
        console.error('   3. Check network connectivity to:', this.baseURL);
        
        const networkError = new Error('Failed to connect to server. Please check your network connection and ensure the server is running.');
        networkError.name = 'NetworkError';
        networkError.originalError = error;
        throw networkError;
      }
      
      throw error;
    }
  }

  // Authentication APIs
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(userData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // Session APIs (Faculty)
  async createSession(sessionData) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getFacultySessions() {
    return this.request('/sessions/faculty/my');
  }

  async getActiveSession() {
    return this.request('/sessions/active');
  }

  async getSessionById(sessionId) {
    return this.request(`/sessions/${sessionId}`);
  }

  async endSession(sessionId) {
    return this.request(`/sessions/${sessionId}/end`, {
      method: 'PUT',
    });
  }

  async extendSession(sessionId, newEndTime) {
    return this.request(`/sessions/${sessionId}/extend`, {
      method: 'PUT',
      body: JSON.stringify({ endTime: newEndTime }),
    });
  }

  // Session APIs (Student)
  async getStudentSessions() {
    return this.request('/sessions/student/my');
  }

  // Attendance APIs
  async markAttendance(attendanceData) {
    return this.request('/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  async getStudentAttendance(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/attendance/student${queryParams ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async getAttendanceStats(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/attendance/stats${queryParams ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async getSessionAttendance(sessionId) {
    return this.request(`/attendance/session/${sessionId}`);
  }

  async getFacultyReports(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/attendance/faculty/reports${queryParams ? `?${queryParams}` : ''}`;
    return this.request(endpoint);
  }

  async markManualAttendance(attendanceData) {
    return this.request('/attendance/manual', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    });
  }

  // Subject APIs (if needed)
  async getSubjects() {
    return this.request('/subjects');
  }

  async getSubjectById(subjectId) {
    return this.request(`/subjects/${subjectId}`);
  }

  // Utility methods for file downloads
  async downloadReport(reportType, filters = {}) {
    const queryParams = new URLSearchParams({ ...filters, format: 'excel' }).toString();
    const endpoint = `/attendance/faculty/reports?${queryParams}`;
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `attendance_report_${Date.now()}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Generic HTTP methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;