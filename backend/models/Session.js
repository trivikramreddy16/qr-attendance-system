const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  class: {
    type: String,
    enum: ['I-I', 'II-I', 'III-I', 'IV-I'],
    required: true
  },
  section: {
    type: String,
    enum: ['CSE-DS-A'],
    default: 'CSE-DS-A',
    required: true
  },
  period: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  expiryTime: {
    type: Date,
    required: true
  },
  geofence: {
    latitude: {
      type: Number,
      required: true,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: true,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    radius: {
      type: Number,
      required: true,
      min: [1, 'Radius must be at least 1 meter'],
      max: [1000, 'Radius cannot exceed 1000 meters'],
      default: 50
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  attendedStudents: {
    type: Number,
    default: 0
  },
  attendancePercentage: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
sessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Automatically deactivate expired sessions
sessionSchema.pre('save', function(next) {
  if (new Date() > this.expiryTime) {
    this.isActive = false;
  }
  next();
});

// Index for efficient queries
sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ faculty: 1, createdAt: -1 });
sessionSchema.index({ class: 1, section: 1, createdAt: -1 });
sessionSchema.index({ expiryTime: 1 });

// Method to check if session is expired
sessionSchema.methods.isExpired = function() {
  return new Date() > this.expiryTime;
};

// Method to calculate attendance percentage
sessionSchema.methods.calculateAttendancePercentage = function() {
  if (this.totalStudents === 0) return 0;
  return Math.round((this.attendedStudents / this.totalStudents) * 100);
};

module.exports = mongoose.model('Session', sessionSchema);