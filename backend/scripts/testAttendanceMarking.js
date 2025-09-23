const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const testAttendanceMarking = async () => {
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
    console.log('📚 Found student:', student.name, student.class, student.section);

    // Create a test session
    const faculty = await User.findOne({ role: 'faculty' });
    const subject = await Subject.findOne();
    
    if (!faculty || !subject) {
      console.log('❌ Need faculty and subject for test');
      return;
    }

    const now = new Date();
    const expiryTime = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes from now
    const endTime = new Date(now.getTime() + 50 * 60 * 1000);

    const session = await Session.create({
      faculty: faculty._id,
      subject: subject._id,
      class: student.class,
      section: student.section,
      period: '1',
      startTime: now,
      endTime,
      expiryTime,
      geofence: {
        latitude: 17.4065,
        longitude: 78.4772,
        radius: 50
      },
      totalStudents: 1,
      isActive: true
    });

    console.log('✅ Created test session:', session.sessionId);

    // Simulate the attendance marking (same logic as controller)
    console.log('🎯 Testing attendance marking...');

    // Check if attendance already exists
    const existingAttendance = await Attendance.findOne({
      student: student._id,
      session: session._id
    });

    if (existingAttendance) {
      console.log('⚠️ Attendance already exists for this session');
      console.log('Existing record:', existingAttendance);
    } else {
      console.log('✅ No existing attendance found, proceeding to mark');

      // Create attendance record (same as controller logic)
      const attendanceData = {
        student: student._id,
        session: session._id,
        subject: session.subject,
        faculty: session.faculty,
        status: 'present',
        markedAt: new Date(),
        location: {
          latitude: 17.4065,
          longitude: 78.4772,
          accuracy: 10
        },
        deviceInfo: {
          userAgent: 'Test Agent',
          ipAddress: '127.0.0.1',
          deviceType: 'unknown' // Valid enum value
        },
        class: session.class,
        section: session.section,
        attendanceDate: new Date().toDateString(),
        markedBy: 'qr_scan' // Valid enum value
      };

      console.log('📝 Creating attendance with data:', attendanceData);

      const attendance = await Attendance.create(attendanceData);
      
      console.log('✅ Attendance created successfully!');
      console.log('📋 Attendance ID:', attendance._id);
      console.log('👤 Student:', attendance.student);
      console.log('📚 Subject:', attendance.subject);
      console.log('📅 Status:', attendance.status);

      // Verify it was saved
      const savedAttendance = await Attendance.findById(attendance._id)
        .populate('student', 'name rollNumber')
        .populate('subject', 'code name')
        .populate('session');

      console.log('🔍 Verification - Retrieved attendance:');
      console.log('  - ID:', savedAttendance._id);
      console.log('  - Student:', savedAttendance.student?.name);
      console.log('  - Subject:', savedAttendance.subject?.code);
      console.log('  - Status:', savedAttendance.status);
      console.log('  - Session ID:', savedAttendance.session?.sessionId);
      console.log('  - Marked At:', savedAttendance.markedAt);

      // Update session count
      session.attendedStudents += 1;
      await session.save();
      
      console.log('✅ Updated session attended count:', session.attendedStudents);
    }

    // Test the getMyAttendance query
    console.log('🔍 Testing getMyAttendance query...');
    const attendanceRecords = await Attendance.find({
      student: student._id
    }).populate({
      path: 'session',
      populate: {
        path: 'subject',
        select: 'name code'
      }
    });

    console.log('📊 Found attendance records:', attendanceRecords.length);
    attendanceRecords.forEach((record, i) => {
      console.log(`  ${i + 1}. ${record.session?.subject?.code || 'N/A'} - ${record.status} - ${new Date(record.markedAt).toLocaleDateString()}`);
    });

    // Cleanup - remove test session
    await Session.findByIdAndDelete(session._id);
    console.log('🗑️ Cleaned up test session');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
};

testAttendanceMarking();