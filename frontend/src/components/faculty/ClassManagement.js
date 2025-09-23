import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const ClassManagement = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  const [selectedClass, setSelectedClass] = useState(null);
  const [showStudents, setShowStudents] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [studentsRes, subjectsRes] = await Promise.all([
        api.get('/users/students'),
        api.get('/subjects')
      ]);
      
      const studentsData = studentsRes.data.data || studentsRes.data;
      const subjects = subjectsRes.data.data || subjectsRes.data;
      
      setStudents(studentsData);
      const studentCount = studentsData.length;
      setTotalStudents(studentCount);
      
      // Filter subjects assigned to current faculty
      const facultySubjects = subjects.filter(subject => 
        subject.faculty && subject.faculty._id === user._id
      );
      
      const formattedClasses = facultySubjects.map(subject => ({
        id: subject._id,
        subject: subject.code,
        subjectName: subject.name,
        class: 'III-I',
        section: 'CSE-DS-A',
        students: studentCount,
        schedule: []
      }));
      
      setClasses(formattedClasses);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudents = (classData) => {
    setSelectedClass(classData);
    setShowStudents(true);
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const isCurrentlyActive = (schedule) => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    return schedule.some(slot => 
      slot.day === currentDay && 
      // Simple time comparison - in real app, you'd want better time parsing
      currentTime >= slot.time.split(' - ')[0] && 
      currentTime <= slot.time.split(' - ')[1]
    );
  };

  if (showStudents && selectedClass) {
    return (
      <div className="space-y-6">
        {/* Back button */}
        <button
          onClick={() => setShowStudents(false)}
          className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Classes
        </button>

        {/* Class header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedClass.subject} - {selectedClass.subjectName}
              </h2>
              <p className="text-gray-600 mt-1">
                Class: {selectedClass.class} | Section: {selectedClass.section}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{selectedClass.students}</p>
            </div>
          </div>
        </div>

        {/* Students list */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Enrolled Students</h3>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
              Export List
            </button>
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {student.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.rollNo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                      <button className="text-indigo-600 hover:text-indigo-900">Message</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
            <p className="text-gray-600 mt-1">Manage your assigned classes and students</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Current Time</p>
            <p className="text-lg font-semibold text-gray-900">{getCurrentTime()}</p>
          </div>
        </div>

        {/* Class Cards */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading classes...</div>
          </div>
        ) : classes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">No classes assigned to you</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {classes.map((classData) => (
            <div
              key={classData.id}
              className={`border-2 rounded-lg p-6 transition-colors ${
                isCurrentlyActive(classData.schedule)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {classData.subject}
                    </h3>
                    {isCurrentlyActive(classData.schedule) && (
                      <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full animate-pulse">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-1">{classData.subjectName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Students</p>
                  <p className="text-lg font-semibold text-gray-900">{classData.students}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Class: {classData.class} - {classData.section}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Schedule:</p>
                <div className="space-y-1">
                  {classData.schedule.map((slot, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {slot.day}: {slot.time}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => handleViewStudents(classData)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  View Students
                </button>
                <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                  Attendance
                </button>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Schedule</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Time</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Monday</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Tuesday</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Wednesday</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Thursday</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-gray-700">Friday</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 px-3 text-sm font-medium text-gray-600">09:20 - 10:10</td>
                <td className="py-2 px-3 text-sm">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    ACD (N-307)
                  </div>
                </td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-sm font-medium text-gray-600">10:10 - 11:00</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">
                  <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    ACD
                  </div>
                </td>
                <td className="py-2 px-3 text-sm">
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    IDS (N-308)
                  </div>
                </td>
                <td className="py-2 px-3 text-sm">-</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-sm font-medium text-gray-600">11:00 - 11:50</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    IDS
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-sm font-medium text-gray-600">01:30 - 02:20</td>
                <td className="py-2 px-3 text-sm">
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    CN (N-307)
                  </div>
                </td>
                <td className="py-2 px-3 text-sm">
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    CN
                  </div>
                </td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
              </tr>
              <tr>
                <td className="py-2 px-3 text-sm font-medium text-gray-600">02:20 - 03:10</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">-</td>
                <td className="py-2 px-3 text-sm">
                  <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                    CN
                  </div>
                </td>
                <td className="py-2 px-3 text-sm">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassManagement;