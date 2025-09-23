import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import QRCodeGenerator from './QRCodeGenerator';
import AttendanceReports from './AttendanceReports';
import ClassManagement from './ClassManagement';
import api from '../../services/api';

const FacultyDashboard = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    activeClasses: 0,
    weekSessions: 0,
    loading: true
  });

  useEffect(() => {
    const path = location.pathname.split('/')[2] || 'dashboard';
    setActiveTab(path);
  }, [location]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, subjectsRes, sessionsRes] = await Promise.all([
        api.get('/users/students'),
        api.getSubjects(),
        api.getFacultySessions()
      ]);

      const totalStudents = studentsRes.success && studentsRes.data ? studentsRes.data.length : 0;
      const activeClasses = subjectsRes.success && subjectsRes.data ? subjectsRes.data.length : 0;
      const allSessions = sessionsRes.success && sessionsRes.data ? sessionsRes.data : [];
      
      // Calculate today's attendance
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = allSessions.filter(session => 
        session.createdAt && new Date(session.createdAt).toISOString().split('T')[0] === today
      );
      
      let todayAttendance = 0;
      if (todaySessions.length > 0) {
        // Calculate based on active sessions
        const completedSessions = todaySessions.filter(s => !s.isActive);
        todayAttendance = Math.round((completedSessions.length / todaySessions.length) * 100);
      }
      
      // Calculate this week's sessions
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const weekSessions = allSessions.filter(session => 
        session.createdAt && new Date(session.createdAt) >= oneWeekAgo
      ).length;

      setDashboardData({
        totalStudents,
        todayAttendance,
        activeClasses,
        weekSessions,
        loading: false
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/faculty', key: 'dashboard', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
    { name: 'Generate QR', href: '/faculty/qr-generator', key: 'qr-generator', icon: 'M3 4a1 1 0 000 2v9a2 2 0 002 2h1a1 1 0 100-2H5V6a1 1 0 01-1-1zM3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
    { name: 'Reports', href: '/faculty/reports', key: 'reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'Classes', href: '/faculty/classes', key: 'classes', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }
  ];

  const DashboardHome = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow p-3 sm:p-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">
          Welcome back, Prof. {user?.name || user?.email}!
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Manage your classes and track student attendance</p>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-blue-600">Total Students</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900">
                  {dashboardData.loading ? '...' : dashboardData.totalStudents}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-green-600">Today's Attendance</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900">
                  {dashboardData.loading ? '...' : `${dashboardData.todayAttendance}%`}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-yellow-600">Active Classes</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900">
                  {dashboardData.loading ? '...' : dashboardData.activeClasses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-xs sm:text-sm font-medium text-purple-600">This Week</p>
                <p className="text-sm sm:text-lg font-semibold text-gray-900">
                  {dashboardData.loading ? '...' : `${dashboardData.weekSessions} Sessions`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link 
            to="/faculty/qr-generator"
            className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 active:bg-blue-100 transition-colors touch-manipulation"
          >
            <div className="flex items-center">
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="ml-2 sm:ml-3">
                <p className="text-sm sm:text-base font-medium text-gray-900">Generate QR Code</p>
                <p className="text-xs sm:text-sm text-gray-500">Create attendance QR for class</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/faculty/reports"
            className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">Download Reports</p>
                <p className="text-sm text-gray-500">Export attendance data</p>
              </div>
            </div>
          </Link>

          <Link 
            to="/faculty/classes"
            className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">Manage Classes</p>
                <p className="text-sm text-gray-500">View and edit class details</p>
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
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 sm:h-8 sm:w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="h-3 w-3 sm:h-5 sm:w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-2 sm:ml-4">
                <h1 className="text-sm sm:text-xl font-semibold text-gray-900">Faculty Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:inline text-sm text-gray-700">Welcome, {user?.name || user?.email}</span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <div className="bg-white rounded-lg shadow p-3 mb-4">
              <div className="grid grid-cols-4 gap-2">
                {navigation.map((item) => (
                  <Link
                    key={item.key}
                    to={item.href}
                    className={`flex flex-col items-center p-2 text-xs font-medium rounded-md transition-colors touch-manipulation ${
                      activeTab === item.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <svg
                      className={`h-5 w-5 mb-1 ${
                        activeTab === item.key ? 'text-blue-500' : 'text-gray-400'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="text-center leading-tight">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.key}
                  to={item.href}
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
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/qr-generator" element={<QRCodeGenerator />} />
              <Route path="/reports" element={<AttendanceReports />} />
              <Route path="/classes" element={<ClassManagement />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;