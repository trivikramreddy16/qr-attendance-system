const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  startTime: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
});

const subjectSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Subject code cannot exceed 10 characters']
  },
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  credits: {
    type: Number,
    required: true,
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot exceed 10']
  },
  department: {
    type: String,
    enum: ['CSE'],
    default: 'CSE',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: [1, 'Semester must be between 1 and 8'],
    max: [8, 'Semester must be between 1 and 8']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
  },
  classes: [{
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
    }
  }],
  schedule: [scheduleSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  totalClasses: {
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
subjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
subjectSchema.index({ code: 1, faculty: 1 });
subjectSchema.index({ 'classes.class': 1, 'classes.section': 1 });

module.exports = mongoose.model('Subject', subjectSchema);