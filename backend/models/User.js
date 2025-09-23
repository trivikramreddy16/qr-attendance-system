const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student',
    required: true
  },
  rollNumber: {
    type: String,
    sparse: true, // Only required for students
    unique: true,
    validate: {
      validator: function(v) {
        // Only validate rollNumber for students
        if (this.role === 'student') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Roll number is required for students'
    }
  },
  employeeId: {
    type: String,
    sparse: true, // Only for faculty
    unique: true,
    validate: {
      validator: function(v) {
        // Only validate employeeId for faculty
        if (this.role === 'faculty') {
          return v && v.length > 0;
        }
        return true;
      },
      message: 'Employee ID is required for faculty'
    }
  },
  class: {
    type: String,
    enum: ['I-I', 'II-I', 'III-I', 'IV-I'],
    required: function() { return this.role === 'student'; }
  },
  section: {
    type: String,
    enum: ['CSE-DS-A'],
    default: 'CSE-DS-A',
    required: function() { return this.role === 'student'; }
  },
  department: {
    type: String,
    enum: ['CSE'],
    default: 'CSE'
  },
  phone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  profilePicture: {
    type: String,
    default: null
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
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name method
userSchema.methods.getFullName = function() {
  return this.name;
};

// Check if user is student
userSchema.methods.isStudent = function() {
  return this.role === 'student';
};

// Check if user is faculty
userSchema.methods.isFaculty = function() {
  return this.role === 'faculty';
};

module.exports = mongoose.model('User', userSchema);