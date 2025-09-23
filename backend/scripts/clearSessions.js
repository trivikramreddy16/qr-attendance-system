const mongoose = require('mongoose');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
require('dotenv').config();

const clearAllSessions = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Deleting all attendance records...');
    const deletedAttendance = await Attendance.deleteMany({});
    console.log(`✅ Deleted ${deletedAttendance.deletedCount} attendance records`);

    console.log('🗑️  Deleting all sessions...');
    const deletedSessions = await Session.deleteMany({});
    console.log(`✅ Deleted ${deletedSessions.deletedCount} sessions`);

    console.log('🎉 Database cleanup completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Sessions deleted: ${deletedSessions.deletedCount}`);
    console.log(`   - Attendance records deleted: ${deletedAttendance.deletedCount}`);
    console.log('');
    console.log('✨ You can now start fresh with new sessions!');

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    console.log('🔚 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
};

clearAllSessions();