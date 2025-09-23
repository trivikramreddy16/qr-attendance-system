const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing attendance endpoint...');

// Test the attendance endpoint logic manually
const testAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('../models/User');
    const Session = require('../models/Session');
    const Attendance = require('../models/Attendance');
    const Subject = require('../models/Subject');
    
    // Get a student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('❌ No student found');
      return;
    }
    console.log('📚 Found student:', student.name, 'Class:', student.class, 'Section:', student.section);
    
    // Get subjects
    const subjects = await Subject.find().select('name code');
    console.log('📖 Found subjects:', subjects.length);
    
    // Get sessions for student class/section
    const sessions = await Session.find({
      class: student.class,
      section: student.section
    }).populate('subject', 'name code');
    console.log('🏫 Found sessions:', sessions.length);
    
    // Get attendance records
    const attendanceRecords = await Attendance.find({
      student: student._id
    }).populate({
      path: 'session',
      populate: {
        path: 'subject',
        select: 'name code'
      }
    });
    console.log('📋 Found attendance records:', attendanceRecords.length);
    
    // Show some detailed records
    console.log('🔍 Sample attendance records:');
    attendanceRecords.slice(0, 3).forEach((record, i) => {
      console.log(`  ${i + 1}. Status: ${record.status}, Session: ${record.session?._id}, Subject: ${record.session?.subject?.code || 'N/A'}`);
    });
    
    // Process the data (same logic as backend)
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
    });
    
    const overallPercentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
    
    console.log('📊 Results:');
    console.log('  - Total sessions:', totalSessions);
    console.log('  - Total present:', totalPresent);
    console.log('  - Overall percentage:', overallPercentage + '%');
    console.log('  - Subjects with data:', Object.values(subjectWiseData).filter(s => s.total > 0).length);
    
    Object.values(subjectWiseData).filter(s => s.total > 0).forEach(subject => {
      console.log(`  - ${subject.code}: ${subject.present}/${subject.total} (${subject.percentage}%)`);
    });
    
    // Test recent records
    const recentRecords = attendanceRecords
      .filter(r => r.session && r.session.subject)
      .map(r => ({
        date: r.session.startTime, // Using startTime as date
        subject: r.session.subject.code,
        status: r.status === 'present' ? 'Present' : 'Absent',
        time: r.session.startTime ? new Date(r.session.startTime).toLocaleTimeString() : 'N/A'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
      
    console.log('📋 Recent records:', recentRecords.length);
    recentRecords.forEach((record, i) => {
      console.log(`  ${i + 1}. ${record.subject} - ${record.status} - ${new Date(record.date).toLocaleDateString()}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

testAttendance();