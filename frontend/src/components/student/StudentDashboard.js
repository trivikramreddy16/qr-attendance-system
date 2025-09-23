import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import QRScanner from './QRScanner';
import MockQRScanner from './MockQRScanner';
import AttendanceView from './AttendanceView';
import CameraTest from '../common/CameraTest';
import NetworkTest from '../debug/NetworkTest';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import api from '../../services/api';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    overall: { present: 0, absent: 0, percentage: 0, total: 0 },
    subjects: [],
    recent: []
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showRefreshNotification, setShowRefreshNotification] = useState(false);

  useEffect(() => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    setActiveTab(path);
  }, [location]);

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchAttendanceData();
    }
  }, [user]);

  // Auto-refresh every 30 seconds when on dashboard
  useEffect(() => {
    if (activeTab === 'dashboard' && user && user.role === 'student') {
      const interval = setInterval(() => {
        fetchAttendanceData();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, user]);

  // Refresh when returning to dashboard from other tabs
  useEffect(() => {
    if (activeTab === 'dashboard' && user && user.role === 'student') {
      // Small delay to let any attendance updates process
      const timeout = setTimeout(() => {
        fetchAttendanceData();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [activeTab]);

  // Listen for attendance marked events from QR scanners
  useEffect(() => {
    const handleAttendanceMarked = (event) => {
      console.log('🔔 Received attendance marked event:', event.detail);
      
      // Show notification that data is being refreshed
      setShowRefreshNotification(true);
      
      // Refresh attendance data when attendance is marked
      setTimeout(() => {
        fetchAttendanceData();
        // Hide notification after refresh
        setTimeout(() => setShowRefreshNotification(false), 3000);
      }, 2000); // 2 second delay to ensure backend processing is complete
    };

    window.addEventListener('attendanceMarked', handleAttendanceMarked);
    
    return () => {
      window.removeEventListener('attendanceMarked', handleAttendanceMarked);
    };
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Refreshing attendance data...');
      const response = await api.get('/users/my-attendance');
      console.log('📡 Full API response:', response);
      console.log('📦 Response data structure:', response.data);
      
      console.log('🔍 Raw response:', response);
      console.log('🔍 Response keys:', Object.keys(response));
      console.log('🔍 Response.data:', response.data);
      console.log('🔍 Response.data type:', typeof response.data);
      
      // Backend returns attendance data directly in response.data
      const attendanceData = response.data;
      console.log('🔍 Using direct data structure from response.data');
      console.log('🔍 Attendance data keys:', attendanceData ? Object.keys(attendanceData) : 'null');
      
      console.log('🔍 Final attendance data:', attendanceData);
      console.log('🔍 Attendance data type:', typeof attendanceData);
      
      if (!attendanceData) {
        console.error('❌ No valid attendance data found in response');
        console.error('❌ Full response structure:', JSON.stringify(response, null, 2));
        return;
      }
      
      // Provide default values for missing fields
      const overall = attendanceData.overall || { present: 0, total: 0, percentage: 0 };
      const subjects = attendanceData.subjects || [];
      const recentRecords = attendanceData.recentRecords || [];
      
      console.log('🔍 Overall data:', overall);
      console.log('🔍 Subjects count:', subjects.length);
      console.log('🔍 Recent records count:', recentRecords.length);
      
      setAttendanceData({
        overall: {
          present: overall.present || 0,
          absent: (overall.total || 0) - (overall.present || 0),
          percentage: overall.percentage || 0,
          total: overall.total || 0
        },
        subjects: subjects,
        recent: recentRecords
      });
      setLastRefresh(new Date());
      console.log('✅ Attendance data updated successfully!', {
        overall: overall,
        subjectsCount: subjects.length,
        recentCount: recentRecords.length
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      // Keep default empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    fetchAttendanceData();
  };

  const navigation = [
    { name: 'Dashboard', href: '/student', key: 'dashboard', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
    { name: 'Scan QR', href: '/student/scanner', key: 'scanner', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
    { name: 'Mock Scanner', href: '/student/mock-scanner', key: 'mock-scanner', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Attendance', href: '/student/attendance', key: 'attendance', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Camera Test', href: '/student/camera-test', key: 'camera-test', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
    { name: 'Network Test', href: '/student/network-test', key: 'network-test', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4' }
  ];


  const pieData = [
    { name: 'Present', value: attendanceData.overall.present, color: '#10b981' },
    { name: 'Absent', value: attendanceData.overall.absent, color: '#ef4444' }
  ];

  const isLowAttendance = (percentage) => percentage < 75;

  const DashboardHome = () => (
    <div className="space-y-4 sm:space-y-6">
      {/* Refresh Notification */}
      {showRefreshNotification && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div>
              <h4 className="text-blue-800 font-semibold">Attendance Updated!</h4>
              <p className="text-blue-700 text-sm mt-1">Refreshing your attendance data...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Welcome Card */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
          <div className="flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name || user?.email.split('@')[0]}!
            </h2>
            <p className="text-sm sm:text-base text-gray-600">Track your attendance and stay on top of your classes</p>
          </div>
          <div className="text-center sm:text-right">
            <div className="flex items-center justify-end space-x-2 mb-2">
              <p className="text-xs sm:text-sm text-gray-500">Overall Attendance</p>
              <button 
                onClick={handleManualRefresh}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                title="Refresh attendance data"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${attendanceData.overall.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
              {loading ? '...' : `${attendanceData.overall.percentage}%`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {isLowAttendance(attendanceData.overall.percentage) && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h4 className="text-red-800 font-semibold">Attendance Alert!</h4>
            </div>
            <p className="text-red-700 mt-2">Your overall attendance is below 75%. Please attend classes regularly to maintain eligibility.</p>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Subjects</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {loading ? '...' : attendanceData.subjects.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-green-100 rounded-full">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Classes Attended</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {loading ? '...' : attendanceData.overall.present}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 sm:p-3 bg-red-100 rounded-full">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Classes Missed</p>
              <p className="text-lg sm:text-2xl font-semibold text-gray-900">
                {loading ? '...' : attendanceData.overall.absent}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Attendance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : attendanceData.subjects.filter(s => s.percentage < 75).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Overview Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Overview</h3>
          <div className="flex items-center justify-center h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Present ({attendanceData.overall.present}%)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Absent ({attendanceData.overall.absent}%)</span>
            </div>
          </div>
        </div>

        {/* Subject-wise Attendance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject-wise Attendance</h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading chart data...</div>
            </div>
          ) : attendanceData.subjects.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attendanceData.subjects.map(s => ({ subject: s.code, percentage: s.percentage }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="percentage" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">No attendance data available</div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    Loading recent attendance...
                  </td>
                </tr>
              ) : attendanceData.recent.length > 0 ? (
                attendanceData.recent.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'Present' 
                          ? 'text-green-800 bg-green-100' 
                          : 'text-red-800 bg-red-100'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No recent attendance records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/student/scanner"
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">Scan QR Code</p>
                <p className="text-sm text-gray-500">Mark your attendance</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/student/attendance"
            className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="font-medium text-gray-900">View Attendance</p>
                <p className="text-sm text-gray-500">Check detailed records</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="flex-shrink-0 ml-2 lg:ml-0">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Student Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-700">Welcome, {user?.name || user?.email.split('@')[0]}</p>
                <p className={`text-xs font-medium ${attendanceData.overall.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                  Attendance: {loading ? '...' : `${attendanceData.overall.percentage}%`}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex gap-4 lg:gap-8">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
          )}
          
          {/* Sidebar */}
          <aside className={`${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex-shrink-0 lg:shadow-none lg:bg-transparent`}>
            <div className="h-full overflow-y-auto pt-16 lg:pt-0">
              <nav className="space-y-2 px-4 lg:px-0">
                {navigation.map((item) => (
                  <Link
                    key={item.key}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === item.key
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`mr-3 h-5 w-5 ${
                        activeTab === item.key ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 lg:ml-0">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/scanner" element={<QRScanner />} />
              <Route path="/mock-scanner" element={<MockQRScanner />} />
              <Route path="/attendance" element={<AttendanceView />} />
              <Route path="/camera-test" element={<CameraTest />} />
              <Route path="/network-test" element={<NetworkTest />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;