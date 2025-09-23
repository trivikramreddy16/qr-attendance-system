const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');
const Subject = require('../models/Subject');
require('dotenv').config();

const clearAttendanceRecords = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Show current attendance records before deletion
    console.log('📊 Current attendance records:');
    const currentAttendance = await Attendance.find()
      .populate('student', 'name rollNumber')
      .populate('subject', 'code name')
      .sort({ markedAt: -1 });
    
    console.log(`📋 Found ${currentAttendance.length} attendance records:`);
    currentAttendance.forEach((record, index) => {
      console.log(`  ${index + 1}. ${record.student?.name || 'Unknown'} - ${record.subject?.code || 'Unknown'} - ${record.status} - ${new Date(record.markedAt).toLocaleDateString()}`);
    });

    if (currentAttendance.length === 0) {
      console.log('ℹ️  No attendance records found to delete.');
      return;
    }

    // Delete all attendance records
    console.log('🗑️  Deleting all attendance records...');
    const deleteResult = await Attendance.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} attendance records`);

    // Reset attendance counts in all sessions
    console.log('🔄 Resetting session attendance counts...');
    const sessions = await Session.find({});
    let updatedSessions = 0;
    
    for (const session of sessions) {
      if (session.attendedStudents > 0) {
        session.attendedStudents = 0;
        session.attendancePercentage = 0;
        await session.save();
        updatedSessions++;
      }
    }
    
    console.log(`✅ Reset attendance counts for ${updatedSessions} sessions`);

    console.log('🎉 Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Attendance records deleted: ${deleteResult.deletedCount}`);
    console.log(`   - Sessions reset: ${updatedSessions}`);
    console.log('');
    console.log('✨ You can now test fresh attendance marking!');
    console.log('📱 Steps to test:');
    console.log('   1. Log in as faculty and create a new session');
    console.log('   2. Log in as student and scan the QR code');
    console.log('   3. Check if attendance appears in student dashboard');
    console.log('   4. Verify backend logs show successful attendance creation');

  } catch (error) {
    console.error('❌ Error clearing attendance records:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('🔚 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
};

console.log('🧹 Starting attendance records cleanup...');
console.log('⚠️  This will delete ALL attendance records and reset session counts');
console.log('');

clearAttendanceRecords();