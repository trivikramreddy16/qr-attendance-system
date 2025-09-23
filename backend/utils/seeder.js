require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Subject = require('../models/Subject');

const connectDB = require('../config/database');

// Sample users data
const users = [
  // Faculty users
  {
    name: 'Dr. K.B. Pullamma',
    email: 'kbpullamma@faculty.com',
    password: 'password123',
    role: 'faculty',
    employeeId: 'FAC001',
    department: 'CSE',
    phone: '9876543210',
  },
  {
    name: 'Ms. M. Prasanna Kumari',
    email: 'mprasanna@faculty.com',
    password: 'password123',
    role: 'faculty',
    employeeId: 'FAC002',
    department: 'CSE',
    phone: '9876543211',
  },
  {
    name: 'Mrs. N. Samatha',
    email: 'nsamatha@faculty.com',
    password: 'password123',
    role: 'faculty',
    employeeId: 'FAC003',
    department: 'CSE',
    phone: '9876543212',
  },
  {
    name: 'Ms. V. Bhavya',
    email: 'vbhavya@faculty.com',
    password: 'password123',
    role: 'faculty',
    employeeId: 'FAC004',
    department: 'CSE',
    phone: '9876543213',
  },
  // Demo faculty for testing
  {
    name: 'Demo Faculty',
    email: 'faculty@demo.com',
    password: 'password123',
    role: 'faculty',
    employeeId: 'DEMO001',
    department: 'CSE',
    phone: '9876543214',
  },
  // Student users
  {
    name: 'Vikram',
    email: 'vikram@demo.com',
    password: 'password123',
    role: 'student',
    rollNumber: '23911A6731',
    class: 'III-I',
    section: 'CSE-DS-A',
    department: 'CSE',
    phone: '9876543220',
  },
  {
    name: 'Sathvika',
    email: 'sathvika@demo.com',
    password: 'password123',
    role: 'student',
    rollNumber: '23911A6724',
    class: 'III-I',
    section: 'CSE-DS-A',
    department: 'CSE',
    phone: '9876543221',
  },
  {
    name: 'Retwwik',
    email: 'retwwik@demo.com',
    password: 'password123',
    role: 'student',
    rollNumber: '23911A6739',
    class: 'III-I',
    section: 'CSE-DS-A',
    department: 'CSE',
    phone: '9876543222',
  },
  {
    name: 'Tanush',
    email: 'tanush@demo.com',
    password: 'password123',
    role: 'student',
    rollNumber: '23911A6758',
    class: 'III-I',
    section: 'CSE-DS-A',
    department: 'CSE',
    phone: '9876543223',
  },
  {
    name: 'Nakshathra',
    email: 'nakshathra@demo.com',
    password: 'password123',
    role: 'student',
    rollNumber: '23911A6733',
    class: 'III-I',
    section: 'CSE-DS-A',
    department: 'CSE',
    phone: '9876543224',
  },
  {
    name: 'Sai Teja',
    email: 'saiteja@demo.com',
    password: 'password123',
    role: 'student',
    rollNumber: '23911A6755',
    class: 'III-I',
    section: 'CSE-DS-A',
    department: 'CSE',
    phone: '9876543225',
  },
  // Demo student for testing
  {
    name: 'Demo Student',
    email: 'student@demo.com',
    password: 'password123',
    role: 'student',
    rollNumber: 'DEMO001',
    class: 'III-I',
    section: 'CSE-DS-A',
    department: 'CSE',
    phone: '9876543226',
  },
];

// Seed database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Subject.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    console.log(`Attempting to create ${users.length} users`);
    
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    
    // Verify users were actually saved
    const userCount = await User.countDocuments();
    console.log(`📊 User count in DB: ${userCount}`);
    
    if (userCount === 0) {
      console.error('❌ Users were not persisted to database!');
      process.exit(1);
    }
    
    // Find faculty members for subject assignment
    const facultyMembers = createdUsers.filter(user => user.role === 'faculty');
    console.log(`👨‍🏫 Found ${facultyMembers.length} faculty members`);
    
    if (facultyMembers.length === 0) {
      console.error('❌ No faculty members found!');
      process.exit(1);
    }

    // Create subjects
    const subjects = [
      {
        code: 'ACD',
        name: 'Automata and Compiler Design',
        description: 'Theory of computation, automata theory, and compiler design',
        credits: 4,
        department: 'CSE',
        semester: 5,
        faculty: facultyMembers[0]._id, // Dr. K.B. Pullamma
        classes: [
          { class: 'III-I', section: 'CSE-DS-A' }
        ],
        schedule: [
          { day: 'Monday', startTime: '09:20', endTime: '10:10' },
          { day: 'Wednesday', startTime: '10:10', endTime: '11:00' }
        ],
        isActive: true,
      },
      {
        code: 'IDS',
        name: 'Introduction to Data Science',
        description: 'Fundamentals of data science, analytics, and machine learning',
        credits: 4,
        department: 'CSE',
        semester: 5,
        faculty: facultyMembers[1]._id, // Ms. M. Prasanna Kumari
        classes: [
          { class: 'III-I', section: 'CSE-DS-A' }
        ],
        schedule: [
          { day: 'Thursday', startTime: '10:10', endTime: '11:00' },
          { day: 'Friday', startTime: '11:00', endTime: '11:50' }
        ],
        isActive: true,
      },
      {
        code: 'CN',
        name: 'Computer Networks',
        description: 'Network protocols, architecture, and communication systems',
        credits: 4,
        department: 'CSE',
        semester: 5,
        faculty: facultyMembers[2]._id, // Mrs. N. Samatha
        classes: [
          { class: 'III-I', section: 'CSE-DS-A' }
        ],
        schedule: [
          { day: 'Monday', startTime: '13:30', endTime: '14:20' },
          { day: 'Tuesday', startTime: '13:30', endTime: '14:20' },
          { day: 'Thursday', startTime: '14:20', endTime: '15:10' }
        ],
        isActive: true,
      },
      {
        code: 'DEVOPS',
        name: 'Dev Ops',
        description: 'DevOps practices, CI/CD, containerization, and deployment',
        credits: 3,
        department: 'CSE',
        semester: 5,
        faculty: facultyMembers[3]._id, // Ms. V. Bhavya
        classes: [
          { class: 'III-I', section: 'CSE-DS-A' }
        ],
        schedule: [
          { day: 'Friday', startTime: '11:00', endTime: '11:50' }
        ],
        isActive: true,
      },
      {
        code: 'OS',
        name: 'Operating System',
        description: 'Operating system concepts, process management, and memory management',
        credits: 4,
        department: 'CSE',
        semester: 5,
        faculty: facultyMembers[4]._id, // Demo Faculty
        classes: [
          { class: 'III-I', section: 'CSE-DS-A' }
        ],
        schedule: [
          { day: 'Monday', startTime: '15:10', endTime: '16:00' }
        ],
        isActive: true,
      },
    ];

    console.log('📚 Creating subjects...');
    const createdSubjects = await Subject.create(subjects);
    console.log(`✅ Created ${createdSubjects.length} subjects`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`👥 Users: ${createdUsers.length} (${facultyMembers.length} faculty, ${createdUsers.length - facultyMembers.length} students)`);
    console.log(`📚 Subjects: ${createdSubjects.length}`);
    
    console.log('\n🔑 Demo Credentials:');
    console.log('Faculty: faculty@demo.com / password123');
    console.log('Student: student@demo.com / password123');
    
    console.log('\n💡 Additional Test Accounts:');
    console.log('Faculty: kbpullamma@faculty.com / password123');
    console.log('Students: vikram@demo.com, sathvika@demo.com, etc. / password123');

    // Wait for operations to complete before exiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Final verification
    const finalUserCount = await User.countDocuments();
    const finalSubjectCount = await Subject.countDocuments();
    console.log('\n🔍 Final verification:');
    console.log(`Users in DB: ${finalUserCount}`);
    console.log(`Subjects in DB: ${finalSubjectCount}`);
    
    await mongoose.disconnect();
    console.log('Database connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
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
  seedDatabase();
}

module.exports = { seedDatabase };
module.exports = { seedDatabase };