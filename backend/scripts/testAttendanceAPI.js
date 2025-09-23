const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const testAttendanceAPI = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('❌ No student found');
      return;
    }
    
    console.log('👤 Testing with student:', student.name, student.class, student.section);

    // Simulate the exact logic from getMyAttendance endpoint
    const studentId = student._id;

    // Get all subjects
    const subjects = await Subject.find().select('name code');
    console.log('📚 Found subjects:', subjects.length);
    
    // Get all sessions for the student's class and section
    const sessions = await Session.find({
      class: student.class,
      section: student.section
    }).populate('subject', 'name code');
    console.log('🏫 Found sessions:', sessions.length);

    // Get student's attendance records
    const attendanceRecords = await Attendance.find({
      student: studentId
    }).populate({
      path: 'session',
      populate: {
        path: 'subject',
        select: 'name code'
      }
    });
    console.log('📋 Found attendance records:', attendanceRecords.length);

    // Process data for response (exact same logic as backend)
    const subjectWiseData = {};
    let totalPresent = 0;
    let totalSessions = sessions.length;

    // Initialize subject data
    subjects.forEach(subject => {
      subjectWiseData[subject._id] = {
        code: subject.code,
        name: subject.name,
        present: 0,
        total: 0,
        percentage: 0,
        records: []
      };
    });

    // Count total sessions per subject
    sessions.forEach(session => {
      if (session.subject && subjectWiseData[session.subject._id]) {
        subjectWiseData[session.subject._id].total++;
      }
    });

    // Count attendance per subject
    attendanceRecords.forEach(record => {
      if (record.session && record.session.subject && subjectWiseData[record.session.subject._id]) {
        if (record.status === 'present') {
          subjectWiseData[record.session.subject._id].present++;
          totalPresent++;
        }
        
        subjectWiseData[record.session.subject._id].records.push({
          date: record.session.date,
          time: record.session.startTime,
          status: record.status === 'present' ? 'Present' : 'Absent'
        });
      }
    });

    // Calculate percentages
    Object.keys(subjectWiseData).forEach(subjectId => {
      const subject = subjectWiseData[subjectId];
      subject.percentage = subject.total > 0 ? Math.round((subject.present / subject.total) * 100) : 0;
      subject.records.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    const overallPercentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    // Create the EXACT same response structure as the backend
    const responseData = {
      success: true,
      data: {
        overall: {
          present: totalPresent,
          total: totalSessions,
          percentage: overallPercentage
        },
        subjects: Object.values(subjectWiseData).filter(s => s.total > 0),
        recentRecords: attendanceRecords
          .filter(r => r.session && r.session.subject)
          .map(r => ({
            date: r.session.startTime, // Note: using startTime as date since session.date might not exist
            subject: r.session.subject.code,
            status: r.status === 'present' ? 'Present' : 'Absent',
            time: r.session.startTime ? new Date(r.session.startTime).toLocaleTimeString() : 'N/A'
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
      }
    };

    console.log('📊 SIMULATED API RESPONSE:');
    console.log('==========================');
    console.log('Response structure:', Object.keys(responseData));
    console.log('Success:', responseData.success);
    console.log('Data keys:', Object.keys(responseData.data));
    console.log('');
    console.log('📈 Overall data:');
    console.log('  Present:', responseData.data.overall.present);
    console.log('  Total:', responseData.data.overall.total);
    console.log('  Percentage:', responseData.data.overall.percentage);
    console.log('');
    console.log('📚 Subjects:', responseData.data.subjects.length);
    responseData.data.subjects.forEach(subject => {
      console.log(`  - ${subject.code}: ${subject.present}/${subject.total} (${subject.percentage}%)`);
    });
    console.log('');
    console.log('📋 Recent records:', responseData.data.recentRecords.length);
    responseData.data.recentRecords.forEach((record, i) => {
      console.log(`  ${i + 1}. ${record.subject} - ${record.status} - ${new Date(record.date).toLocaleDateString()}`);
    });

    console.log('');
    console.log('🔍 FRONTEND ACCESS PATHS:');
    console.log('response.data =', {success: responseData.success, data: 'Object'});
    console.log('response.data.data =', typeof responseData.data);
    console.log('response.data.data.overall =', typeof responseData.data.overall);
    console.log('');
    console.log('✅ This is exactly what the API should return!');

  } catch (error) {
    console.error('❌ Error testing attendance API:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
};

testAttendanceAPI();