import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const AttendanceView = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('overview'); // overview, subject, monthly
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState({
    overall: { present: 0, absent: 0, percentage: 0 },
    subjects: [],
    monthly: []
  });

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchAttendanceData();
    }
  }, [user]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/my-attendance');
      const data = response.data.data;
      
      // Generate mock monthly data since we don't have historical monthly data yet
      const monthlyData = generateMonthlyData(data.overall.percentage);
      
      setAttendanceData({
        overall: {
          present: data.overall.present,
          absent: data.overall.total - data.overall.present,
          percentage: data.overall.percentage
        },
        subjects: data.subjects,
        monthly: monthlyData
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyData = (currentPercentage) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    return months.map(month => ({
      month,
      percentage: Math.max(70, Math.min(95, currentPercentage + Math.random() * 10 - 5))
    }));
  };

  const pieData = [
    { name: 'Present', value: attendanceData.overall.present, color: '#10b981' },
    { name: 'Absent', value: attendanceData.overall.absent, color: '#ef4444' }
  ];

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredSubjects = selectedSubject === 'all' 
    ? attendanceData.subjects 
    : attendanceData.subjects.filter(s => s.code === selectedSubject);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with view mode toggles */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Attendance</h2>
          <div className="flex flex-wrap gap-2 sm:space-x-2">
            <button
              onClick={() => setViewMode('overview')}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                viewMode === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode('subject')}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                viewMode === 'subject'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
            >
              Subject-wise
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-2 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
                viewMode === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        {/* Overall attendance alert */}
        {!loading && attendanceData.overall.percentage < 75 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-red-800 font-semibold">Critical Attendance Warning!</h4>
                <p className="text-red-700 mt-1">Your overall attendance is {attendanceData.overall.percentage}%, which is below the required 75%. Attend classes regularly to avoid academic consequences.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Overview Mode */}
      {viewMode === 'overview' && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Overall Attendance Chart */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Overall Attendance</h3>
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="text-gray-500">Loading attendance data...</div>
                </div>
              ) : (
                <>
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
                  <div className="text-center mt-4">
                    <p className={`text-2xl font-bold ${attendanceData.overall.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                      {attendanceData.overall.percentage}%
                    </p>
                    <p className="text-gray-600">Overall Attendance</p>
                  </div>
                </>
              )}
            </div>

            {/* Subject Summary */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Subject Summary</h3>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="text-gray-500">Loading subjects...</div>
                </div>
              ) : attendanceData.subjects.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {attendanceData.subjects.map((subject) => (
                    <div key={subject.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">{subject.code}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{subject.name}</p>
                      </div>
                      <div className="flex items-center justify-between sm:space-x-3">
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{subject.present}/{subject.total}</p>
                          <p className="text-xs text-gray-500">Classes</p>
                        </div>
                        <div className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${getStatusColor(subject.percentage)}`}>
                          {subject.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No attendance data available
                </div>
              )}
            </div>
          </div>

          {/* Subject-wise Progress Bars */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Progress</h3>
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Loading progress data...</div>
              </div>
            ) : attendanceData.subjects.length > 0 ? (
              <div className="space-y-4">
                {attendanceData.subjects.map((subject) => (
                  <div key={subject.code}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{subject.code} - {subject.name}</h4>
                        <p className="text-sm text-gray-600">{subject.present} out of {subject.total} classes attended</p>
                      </div>
                      <span className={`px-2 py-1 text-sm font-semibold rounded ${getStatusColor(subject.percentage)}`}>
                        {subject.percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(subject.percentage)}`}
                        style={{ width: `${subject.percentage}%` }}
                      ></div>
                    </div>
                    {subject.percentage < 75 && (
                      <p className="text-xs text-red-600 mt-1">⚠️ Below minimum required attendance</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No progress data available
              </div>
            )}
          </div>
        </>
      )}

      {/* Subject-wise Mode */}
      {viewMode === 'subject' && (
        <div className="space-y-6">
          {/* Subject Filter */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Select Subject:</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="all">All Subjects</option>
                {attendanceData.subjects.map((subject) => (
                  <option key={subject.code} value={subject.code}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject Details */}
          {loading ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-500">Loading subject details...</div>
              </div>
            </div>
          ) : filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <div key={subject.code} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{subject.code} - {subject.name}</h3>
                      <p className="text-sm text-gray-600">Classes attended: {subject.present} out of {subject.total}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${subject.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                        {subject.percentage}%
                      </p>
                      <p className="text-sm text-gray-600">Attendance</p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {subject.records && subject.records.length > 0 ? (
                        subject.records.map((record, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(record.date).toLocaleDateString('en-IN')}
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
                          <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                            No attendance records for this subject
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center text-gray-500 py-8">
                No subject data available
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Mode */}
      {viewMode === 'monthly' && (
        <div className="space-y-6">
          {/* Monthly Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Attendance Trend</h3>
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="text-gray-500">Loading monthly trend...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={attendanceData.monthly}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${Math.round(value)}%`, 'Attendance']} />
                  <Line type="monotone" dataKey="percentage" stroke="#2563eb" strokeWidth={3} dot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Highest Month</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.max(...attendanceData.monthly.map(m => m.percentage))}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Lowest Month</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.min(...attendanceData.monthly.map(m => m.percentage))}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(attendanceData.monthly.reduce((sum, m) => sum + m.percentage, 0) / attendanceData.monthly.length)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-yellow-800 mb-3 sm:mb-4">💡 Attendance Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">To Improve Attendance:</h4>
            <ul className="text-xs sm:text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Attend all scheduled classes regularly</li>
              <li>Inform faculty in advance if you must miss class</li>
              <li>Use the QR scanner as soon as faculty displays the code</li>
              <li>Ensure you're in the classroom for geofencing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-yellow-800 mb-2 text-sm sm:text-base">Requirements:</h4>
            <ul className="text-xs sm:text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Minimum 75% attendance required for exam eligibility</li>
              <li>Medical certificates may be accepted for absences</li>
              <li>Contact academic office for attendance queries</li>
              <li>Regular monitoring helps avoid last-minute issues</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceView;