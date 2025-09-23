import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../../services/api';

const AttendanceReports = () => {
  const [reportFilters, setReportFilters] = useState({
    class: 'III-I',
    section: 'CSE-DS-A',
    subject: '', // Empty for 'All Subjects'
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    reportType: 'detailed'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [studentData, setStudentData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageAttendance: 0,
    belowThreshold: 0,
    totalClasses: 0
  });

  useEffect(() => {
    fetchData();
  }, [reportFilters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('📈 Fetching faculty reports data...');
      console.log('🔍 Report filters:', reportFilters);
      
      // Build query parameters for the faculty reports API
      const queryParams = new URLSearchParams();
      if (reportFilters.class) queryParams.append('class', reportFilters.class);
      if (reportFilters.section) queryParams.append('section', reportFilters.section);
      if (reportFilters.subject && reportFilters.subject !== '') {
        // Find subject ObjectId from code
        const selectedSubject = subjects.find(s => s.code === reportFilters.subject);
        if (selectedSubject) {
          queryParams.append('subject', selectedSubject._id);
        }
      }
      if (reportFilters.startDate) queryParams.append('startDate', reportFilters.startDate);
      if (reportFilters.endDate) queryParams.append('endDate', reportFilters.endDate);
      
      console.log('🔍 Query params:', queryParams.toString());
      
      // Fetch real attendance data from the faculty reports API
      const reportsResponse = await api.get(`/attendance/faculty/reports?${queryParams.toString()}`);
      console.log('📁 Faculty reports API response:', reportsResponse);
      
      const reportsData = reportsResponse.data || reportsResponse;
      console.log('📁 Reports data:', reportsData);
      
      if (!reportsData.success) {
        throw new Error(reportsData.message || 'Failed to fetch reports');
      }
      
      const records = reportsData.data?.records || [];
      const summary = reportsData.data?.summary || [];
      
      console.log('📁 Attendance records:', records.length);
      console.log('📁 Subject summary:', summary.length);
      
      // Also get subjects for the dropdown
      const subjectsRes = await api.get('/subjects');
      setSubjects(subjectsRes.data || subjectsRes);
      
      // Process attendance data for charts
      const processedAttendanceData = processAttendanceForChart(records);
      const processedStudentData = processStudentAttendanceFromRecords(records);
      
      setAttendanceData(processedAttendanceData);
      setStudentData(processedStudentData);
      
      // Calculate stats from real data
      const uniqueStudents = [...new Set(records.map(r => r.student?._id))];
      const totalStudents = uniqueStudents.length;
      const totalClasses = records.length;
      
      let totalAttendancePercentage = 0;
      let belowThreshold = 0;
      
      if (summary.length > 0) {
        totalAttendancePercentage = summary.reduce((sum, s) => sum + s.percentage, 0) / summary.length;
        belowThreshold = summary.filter(s => s.percentage < 75).length;
      }
      
      setStats({
        totalStudents,
        averageAttendance: Math.round(totalAttendancePercentage) || 0,
        belowThreshold,
        totalClasses
      });
      
      console.log('✅ Faculty reports data processed successfully:', {
        records: records.length,
        students: totalStudents,
        avgAttendance: Math.round(totalAttendancePercentage) || 0
      });
      
    } catch (error) {
      console.error('❌ Error fetching faculty reports data:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Set empty data on error
      setAttendanceData([]);
      setStudentData([]);
      setStats({
        totalStudents: 0,
        averageAttendance: 0,
        belowThreshold: 0,
        totalClasses: 0
      });
    } finally {
      setLoading(false);
    }
  };
  
  const processAttendanceForChart = (records) => {
    // Group attendance records by date for daily trend
    const recordsByDate = {};
    
    records.forEach(record => {
      if (record.attendanceDate || record.markedAt) {
        const date = new Date(record.attendanceDate || record.markedAt).toISOString().split('T')[0];
        if (!recordsByDate[date]) {
          recordsByDate[date] = {
            date,
            present: 0,
            absent: 0,
            total: 0
          };
        }
        recordsByDate[date].total++;
        if (record.status === 'present' || record.status === 'late') {
          recordsByDate[date].present++;
        } else {
          recordsByDate[date].absent++;
        }
      }
    });
    
    return Object.values(recordsByDate)
      .map(item => ({
        ...item,
        percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Last 7 days
  };
  
  const processStudentAttendanceFromRecords = (records) => {
    // Group records by student
    const studentAttendance = {};
    
    records.forEach(record => {
      const studentId = record.student?._id;
      const studentName = record.student?.name;
      const studentRoll = record.student?.rollNumber;
      
      if (studentId && studentName) {
        if (!studentAttendance[studentId]) {
          studentAttendance[studentId] = {
            id: studentId,
            name: studentName,
            rollNo: studentRoll || 'N/A',
            total: 0,
            present: 0,
            percentage: 0,
            status: 'No Data'
          };
        }
        
        studentAttendance[studentId].total++;
        if (record.status === 'present' || record.status === 'late') {
          studentAttendance[studentId].present++;
        }
      }
    });
    
    // Calculate percentages and status
    return Object.values(studentAttendance).map(student => {
      student.percentage = student.total > 0 ? Math.round((student.present / student.total) * 100) : 0;
      student.status = getStatusText(student.percentage);
      return student;
    }).sort((a, b) => a.name.localeCompare(b.name));
  };

  const handleFilterChange = (e) => {
    setReportFilters({
      ...reportFilters,
      [e.target.name]: e.target.value
    });
  };

  const generateReport = async (format) => {
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      // Create CSV content
      let csvContent = '';
      
      if (reportFilters.reportType === 'detailed') {
        csvContent = 'Student ID,Name,Roll No,Total Classes,Present,Percentage,Status\n';
        studentData.forEach(student => {
          csvContent += `${student.id},${student.name},${student.rollNo},${student.total},${student.present},${student.percentage}%,${student.status}\n`;
        });
      } else {
        csvContent = 'Date,Present,Absent,Percentage\n';
        attendanceData.forEach(data => {
          csvContent += `${data.date},${data.present},${data.absent},${data.percentage}%\n`;
        });
      }
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-report-${reportFilters.class}-${reportFilters.section}-${Date.now()}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setIsGenerating(false);
    }, 2000);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusText = (percentage) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 85) return 'Good';
    if (percentage >= 75) return 'Average';
    return 'Warning';
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Reports</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              name="class"
              value={reportFilters.class}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="III-I">III-I</option>
              <option value="II-I">II-I</option>
              <option value="I-I">I-I</option>
              <option value="IV-I">IV-I</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              name="section"
              value={reportFilters.section}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="CSE-DS-A">CSE-DS-A</option>
              <option value="CSE-A">CSE-A</option>
              <option value="CSE-B">CSE-B</option>
              <option value="IT-A">IT-A</option>
              <option value="IT-B">IT-B</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              name="subject"
              value={reportFilters.subject}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject.code}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={reportFilters.startDate}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={reportFilters.endDate}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              name="reportType"
              value={reportFilters.reportType}
              onChange={handleFilterChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="detailed">Student-wise</option>
              <option value="summary">Date-wise</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => generateReport('csv')}
            disabled={isGenerating}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Download CSV'}
          </button>
          <button
            onClick={() => generateReport('xlsx')}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            {isGenerating ? 'Generating...' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Attendance Trend</h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading chart data...</div>
            </div>
          ) : attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">No attendance data available</div>
            </div>
          )}
        </div>

        {/* Present/Absent Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Present vs Absent</h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">Loading chart data...</div>
            </div>
          ) : attendanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#10b981" />
                <Bar dataKey="absent" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-500">No attendance data available</div>
            </div>
          )}
        </div>
      </div>

      {/* Student-wise Table */}
      {reportFilters.reportType === 'detailed' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Student-wise Attendance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classes Attended
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      Loading student data...
                    </td>
                  </tr>
                ) : studentData.length > 0 ? (
                  studentData.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">ID: {student.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.rollNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.present} / {student.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">{student.percentage}%</div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${student.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${student.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(student.percentage)}`}>
                        {getStatusText(student.percentage)}
                      </span>
                      {student.percentage < 75 && (
                        <span className="ml-2 text-xs text-red-600">⚠️ Below 75%</span>
                      )}
                    </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No student data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats.totalStudents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Attendance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : `${stats.averageAttendance}%`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Below 75%</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats.belowThreshold}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? '...' : stats.totalClasses}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;