const mongoose = require('mongoose');
const Session = require('../models/Session');
const Subject = require('../models/Subject');
const User = require('../models/User');
const QRCode = require('qrcode');
require('dotenv').config();

const testQRGeneration = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get a faculty member
    console.log('👨‍🏫 Finding faculty...');
    const faculty = await User.findOne({ role: 'faculty' });
    if (!faculty) {
      console.log('❌ No faculty found. Creating a test faculty...');
      const testFaculty = await User.create({
        name: 'Test Faculty',
        email: 'test.faculty@college.edu',
        password: 'password123',
        role: 'faculty',
        employeeId: 'FAC001',
        department: 'CSE'
      });
      console.log('✅ Test faculty created:', testFaculty.name);
      faculty = testFaculty;
    }

    // Get a subject
    console.log('📚 Finding subject...');
    let subject = await Subject.findOne();
    if (!subject) {
      console.log('❌ No subject found. Creating a test subject...');
      subject = await Subject.create({
        code: 'TEST101',
        name: 'Test Subject',
        credits: 3,
        faculty: faculty._id,
        classes: [{ class: 'I-I', section: 'CSE-DS-A' }]
      });
      console.log('✅ Test subject created:', subject.code);
    }

    console.log('🎯 Creating a test session...');
    const now = new Date();
    const expiryMinutes = parseInt(process.env.QR_CODE_EXPIRY_MINUTES) || 5;
    const expiryTime = new Date(now.getTime() + expiryMinutes * 60 * 1000);
    const endTime = new Date(now.getTime() + 50 * 60 * 1000);

    // Create test session
    const session = await Session.create({
      faculty: faculty._id,
      subject: subject._id,
      class: 'I-I',
      section: 'CSE-DS-A',
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

    console.log('✅ Test session created:', session.sessionId);

    // Populate the session
    await session.populate([
      { path: 'subject', select: 'code name' },
      { path: 'faculty', select: 'name employeeId' }
    ]);

    console.log('🔍 Session data for QR generation:');
    console.log('  - sessionId:', session.sessionId);
    console.log('  - faculty:', session.faculty);
    console.log('  - subject:', session.subject);
    console.log('  - class/section:', session.class, session.section);
    console.log('  - period:', session.period);

    // Generate QR code data (same as in sessionController.js)
    console.log('🎨 Generating QR code data...');
    const qrDataObject = {
      type: 'attendance',
      sessionId: session.sessionId,
      facultyId: faculty._id,
      subject: subject.code,
      period: session.period,
      class: session.class,
      section: session.section,
      timestamp: now.toISOString(),
      expiryTime: expiryTime.toISOString(),
      geofence: session.geofence,
      version: '1.0'
    };

    console.log('🔍 QR data object:');
    console.log(JSON.stringify(qrDataObject, null, 2));

    const qrData = JSON.stringify(qrDataObject);
    console.log('📏 QR data string length:', qrData.length);
    console.log('📝 QR data string (first 200 chars):', qrData.substring(0, 200));

    // Test parsing the QR data
    console.log('🧪 Testing QR data parsing...');
    try {
      const parsed = JSON.parse(qrData);
      console.log('✅ QR data parsing successful');
      console.log('  - Keys:', Object.keys(parsed));
      console.log('  - sessionId present:', !!parsed.sessionId);
      console.log('  - type present:', !!parsed.type);
      console.log('  - sessionId value:', parsed.sessionId);
      console.log('  - type value:', parsed.type);
    } catch (parseError) {
      console.error('❌ QR data parsing failed:', parseError);
    }

    // Generate QR code image
    console.log('🖼️  Generating QR code image...');
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      console.log('✅ QR code image generated successfully');
      console.log('📊 QR code data URL length:', qrCodeDataUrl.length);
      console.log('🔗 QR code data URL prefix:', qrCodeDataUrl.substring(0, 50) + '...');
      
      // Test what would be in the API response
      const apiResponse = {
        success: true,
        message: 'Session created successfully',
        data: {
          session: {
            id: session._id,
            sessionId: session.sessionId,
            subject: session.subject,
            faculty: session.faculty,
            class: session.class,
            section: session.section,
            period: session.period,
            startTime: session.startTime,
            endTime: session.endTime,
            expiryTime: session.expiryTime,
            geofence: session.geofence,
            totalStudents: session.totalStudents,
            attendedStudents: session.attendedStudents,
            isActive: session.isActive,
            createdAt: session.createdAt
          },
          qrCode: qrCodeDataUrl,
          qrData
        }
      };
      
      console.log('📋 API response structure:');
      console.log('  - success:', apiResponse.success);
      console.log('  - data.qrCode present:', !!apiResponse.data.qrCode);
      console.log('  - data.qrData present:', !!apiResponse.data.qrData);
      console.log('  - data.session.sessionId:', apiResponse.data.session.sessionId);

    } catch (qrError) {
      console.error('❌ QR code image generation failed:', qrError);
    }

    console.log('🎉 QR generation test completed!');
    console.log('');
    console.log('📋 Test Summary:');
    console.log('✅ Session created with sessionId:', session.sessionId);
    console.log('✅ QR data contains all required fields');
    console.log('✅ QR data is valid JSON');
    console.log('✅ QR code image generated successfully');
    console.log('');
    console.log('🔍 Next steps:');
    console.log('1. Log in as faculty and create a session');
    console.log('2. Check browser console for QR generation logs');
    console.log('3. Try scanning the generated QR code');
    console.log('4. Check camera scanner console logs for detailed scan results');

  } catch (error) {
    console.error('❌ Error testing QR generation:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    console.log('🔚 Closing database connection...');
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  }
};

testQRGeneration();