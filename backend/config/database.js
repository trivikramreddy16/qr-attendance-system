const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Set connection options with better defaults
    const options = {
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // How long to wait for server selection
      socketTimeoutMS: 45000, // How long to wait for socket timeout
      family: 4 // Use IPv4, skip trying IPv6
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    console.log(`🔌 Connection State: ${conn.connection.readyState}`);

    // Add connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ Mongoose disconnected from MongoDB');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 Mongoose reconnected to MongoDB');
    });

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    console.error('❌ Full error:', error);
    
    // Don't exit immediately, let the application handle the error
    throw error;
  }
};

// Function to check database connection health
const checkDBHealth = () => {
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: states[state] || 'unknown',
    isConnected: state === 1
  };
};

module.exports = { connectDB, checkDBHealth };
