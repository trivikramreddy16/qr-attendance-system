#!/usr/bin/env node

/**
 * Server Diagnostic Script
 * This script helps diagnose server startup and database connectivity issues
 */

require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔧 QR Attendance System - Server Diagnostic');
console.log('=' .repeat(50));

async function runDiagnostics() {
  console.log('\n1. Environment Check');
  console.log('-'.repeat(20));
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`PORT: ${process.env.PORT || 'not set (will use 5000)'}`);
  console.log(`MONGODB_URI: ${process.env.MONGODB_URI ? 'configured' : 'not set'}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? 'configured' : 'not set'}`);

  console.log('\n2. Database Connection Test');
  console.log('-'.repeat(28));
  
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    console.log(`🔌 Connection State: ${conn.connection.readyState}`);
    
    // Test a simple query
    console.log('🔄 Testing database query...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Database accessible, found ${collections.length} collections`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      console.log('💡 Possible solutions:');
      console.log('   - Check if MongoDB is running');
      console.log('   - Verify MONGODB_URI is correct');
      console.log('   - Check network connectivity');
    }
  }

  console.log('\n3. Port Availability Check');
  console.log('-'.repeat(26));
  
  const net = require('net');
  const port = process.env.PORT || 5000;
  
  try {
    await new Promise((resolve, reject) => {
      const server = net.createServer();
      
      server.listen(port, '0.0.0.0', () => {
        console.log(`✅ Port ${port} is available`);
        server.close(resolve);
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${port} is already in use`);
          console.log('💡 Try stopping any existing server or use a different port');
        } else {
          console.log(`❌ Port error: ${err.message}`);
        }
        reject(err);
      });
    });
  } catch (error) {
    // Port test failed, but this is non-critical for diagnosis
  }

  console.log('\n4. Network Interface Check');
  console.log('-'.repeat(25));
  
  const os = require('os');
  const interfaces = os.networkInterfaces();
  
  console.log('Available network interfaces:');
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`  📡 ${name}: ${iface.address}`);
      }
    });
  });

  console.log('\n5. Starting Test Server');
  console.log('-'.repeat(22));
  
  try {
    const express = require('express');
    const app = express();
    
    app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Test server is running',
        timestamp: new Date().toISOString()
      });
    });
    
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`✅ Test server started successfully on port ${port}`);
      console.log(`🌐 Access URLs:`);
      console.log(`   - Local: http://localhost:${port}/health`);
      
      // Show network access URLs
      Object.keys(interfaces).forEach(name => {
        interfaces[name].forEach(iface => {
          if (iface.family === 'IPv4' && !iface.internal) {
            console.log(`   - Network: http://${iface.address}:${port}/health`);
          }
        });
      });
      
      console.log('\n⏰ Test server will run for 30 seconds...');
      
      setTimeout(() => {
        server.close(() => {
          console.log('✅ Test server stopped');
          console.log('\n🎉 Diagnostics completed!');
          console.log('\n💡 If all tests passed, your main server should work correctly.');
          console.log('💡 If tests failed, check the error messages above for solutions.');
          process.exit(0);
        });
      }, 30000);
    });

    server.on('error', (error) => {
      console.error('❌ Test server failed to start:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.log('💡 Port is in use. Try stopping any existing servers.');
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start test server:', error.message);
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Diagnostic interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Diagnostic terminated');
  process.exit(0);
});

runDiagnostics().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});