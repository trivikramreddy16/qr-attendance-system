require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Session = require('../models/Session');
const connectDB = require('../config/database');

// Helper function to generate sessions for past weeks and upcoming days
const generateSessionsForSubject = (subject, startDate, endDate, academicBreaks = []) => {
  const sessions = [];
  const totalStudents = 7; // We have 7 students in CSE-DS-A
  
  // Helper function to check if date falls during academic break
  const isAcademicBreak = (date) => {
    return academicBreaks.some(breakPeriod => {
      return date >= breakPeriod.start && date <= breakPeriod.end;
    });
  };
  
  // Iterate through each day from startDate to endDate
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (date.getDay() === 0 || date.getDay() === 6) {
      continue;
    }
    
    // Skip academic breaks (exams, vacation, etc.)
    if (isAcademicBreak(date)) {
      continue;
    }
    
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if this subject has classes on this day
    const todaysSchedule = subject.schedule.filter(schedule => schedule.day === dayName);
    
    todaysSchedule.forEach(schedule => {
      // Create session data
      const sessionStartTime = new Date(date);
      const [startHour, startMinute] = schedule.startTime.split(':');
      sessionStartTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);
      
      const sessionEndTime = new Date(date);
      const [endHour, endMinute] = schedule.endTime.split(':');
      sessionEndTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
      
      // Generate a unique session ID
      const sessionId = `${subject.code}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${schedule.startTime.replace(':', '')}`;
      
      // Random attendance percentage (70-95% for past sessions)
      const attendancePercentage = Math.floor(Math.random() * 26) + 70; // 70-95%
      const attendedStudents = Math.floor((attendancePercentage / 100) * totalStudents);
      
      // Determine if session is completed (past sessions are completed)
      const now = new Date('2025-09-22'); // Use current academic date
      const isCompleted = sessionEndTime < now;
      
      sessions.push({
        sessionId: sessionId,
        faculty: subject.faculty,
        subject: subject._id,
        class: 'III-I',
        section: 'CSE-DS-A',
        period: `${schedule.startTime} - ${schedule.endTime}`,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        expiryTime: new Date(sessionStartTime.getTime() + 5 * 60 * 1000), // 5 minutes after start
        totalStudents: totalStudents,
        attendedStudents: isCompleted ? attendedStudents : 0,
        attendancePercentage: isCompleted ? attendancePercentage : 0,
        isActive: false, // All sessions are inactive for now
        geofence: {
          latitude: 17.4065,
          longitude: 78.4772,
          radius: 50
        }
      });
    });
  }
  
  return sessions;
};

const seedSessions = async () => {
  try {
    console.log('📅 Starting session seeding...');

    // Connect to database
    await connectDB();

    // Get all subjects and their schedules
    const subjects = await Subject.find({}).populate('faculty');
    console.log(`📚 Found ${subjects.length} subjects`);

    if (subjects.length === 0) {
      console.error('❌ No subjects found! Run the main seeder first.');
      process.exit(1);
    }

    // Clear existing sessions
    console.log('🗑️  Clearing existing sessions...');
    await Session.deleteMany({});

    // Generate sessions for academic year - First Semester 2025
    // Based on actual academic calendar provided
    const now = new Date('2025-09-22'); // Current date (during II Spell of Instructions)
    const startDate = new Date('2025-06-30'); // Commencement of Class Work
    const endDate = new Date('2025-11-12'); // End of II Spell of Instructions
    
    // Set times to avoid timezone issues
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    console.log(`📊 Current reference date: ${now.toDateString()}`);
    console.log(`📊 First Semester 2025: ${startDate.toDateString()} to ${endDate.toDateString()}`);
    console.log(`📊 Academic Structure:`);
    console.log(`   I Spell: June 30 - Aug 30 (9 weeks)`);
    console.log(`   I Mid Exams: Sep 1-6 (1 week)`);
    console.log(`   II Spell: Sep 8 - Nov 12 (9 weeks + Dussehra vacation)`);
    console.log(`   Current Status: In II Spell of Instructions`);
    
    // Define academic breaks to skip session generation
    const academicBreaks = [
      { start: new Date('2025-08-31'), end: new Date('2025-09-07') }, // I Mid Examinations
      { start: new Date('2025-11-13'), end: new Date('2025-11-19') }, // II Mid Examinations
      { start: new Date('2025-11-20'), end: new Date('2025-11-26') }, // Practical & Preparation
      { start: new Date('2025-11-27'), end: new Date('2025-12-12') }  // End Semester Examinations
    ];

    console.log(`📊 Generating sessions from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    let allSessions = [];

    // Generate sessions for each subject
    for (const subject of subjects) {
      console.log(`⏰ Creating sessions for ${subject.code} - ${subject.name}`);
      const subjectSessions = generateSessionsForSubject(subject, startDate, endDate, academicBreaks);
      allSessions = allSessions.concat(subjectSessions);
      console.log(`  ✅ Generated ${subjectSessions.length} sessions`);
    }

    console.log(`📝 Creating ${allSessions.length} total sessions in database...`);
    
    // Insert sessions in batches to avoid timeout
    const batchSize = 50;
    let createdCount = 0;
    
    for (let i = 0; i < allSessions.length; i += batchSize) {
      const batch = allSessions.slice(i, i + batchSize);
      await Session.insertMany(batch);
      createdCount += batch.length;
      console.log(`  📊 Created ${createdCount}/${allSessions.length} sessions...`);
    }

    // Generate statistics
    const totalSessions = await Session.countDocuments();
    const currentTime = new Date('2025-09-22'); // Updated to 2025
    const pastSessions = await Session.countDocuments({ endTime: { $lt: currentTime } });
    const futureSessions = await Session.countDocuments({ startTime: { $gt: currentTime } });
    
    // Calculate average attendance for past sessions
    const pastSessionsWithAttendance = await Session.find({ 
      endTime: { $lt: currentTime }, 
      attendancePercentage: { $gt: 0 } 
    });
    const avgAttendance = pastSessionsWithAttendance.length > 0 
      ? Math.round(pastSessionsWithAttendance.reduce((sum, session) => sum + session.attendancePercentage, 0) / pastSessionsWithAttendance.length)
      : 0;

    console.log('\n🎉 Session seeding completed successfully!');
    console.log('\n📋 Session Summary:');
    console.log(`📊 Total Sessions: ${totalSessions}`);
    console.log(`✅ Past Sessions: ${pastSessions}`);
    console.log(`📅 Future Sessions: ${futureSessions}`);
    console.log(`📈 Average Attendance: ${avgAttendance}%`);

    // Show breakdown by subject
    console.log('\n📚 Subject-wise Session Count:');
    for (const subject of subjects) {
      const subjectSessionCount = await Session.countDocuments({ subject: subject._id });
      const subjectPastCount = await Session.countDocuments({ 
        subject: subject._id, 
        endTime: { $lt: currentTime } 
      });
      console.log(`  ${subject.code}: ${subjectSessionCount} total (${subjectPastCount} past)`);
    }

    // Show recent sessions
    const recentSessions = await Session.find({ endTime: { $lt: currentTime } })
      .populate('subject', 'code name')
      .populate('faculty', 'name')
      .sort({ startTime: -1 })
      .limit(5);

    console.log('\n🕒 Recent Sessions:');
    recentSessions.forEach(session => {
      console.log(`  ${session.startTime.toDateString()} - ${session.subject.code} - ${session.attendancePercentage}% attendance`);
    });

    // Show upcoming sessions
    const upcomingSessions = await Session.find({ startTime: { $gt: currentTime } })
      .populate('subject', 'code name')
      .sort({ startTime: 1 })
      .limit(5);

    console.log('\n📅 Upcoming Sessions:');
    upcomingSessions.forEach(session => {
      console.log(`  ${session.startTime.toDateString()} ${session.period} - ${session.subject.code}`);
    });

    await mongoose.disconnect();
    console.log('\n🔐 Database connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding sessions:', error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedSessions();
}

module.exports = { seedSessions };