const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: [true, 'Session is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present'
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  location: {
    latitude: {
      type: Number,
      required: function() {
        return this.status === 'present';
      }
    },
    longitude: {
      type: Number,
      required: function() {
        return this.status === 'present';
      }
    },
    accuracy: {
      type: Number,
      default: 0
    }
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown'
    }
  },
  isValidated: {
    type: Boolean,
    default: true
  },
  validationNotes: {
    type: String
  },
  markedBy: {
    type: String,
    enum: ['qr_scan', 'manual', 'system'],
    default: 'qr_scan'
  },
  class: {
    type: String,
    enum: ['I-I', 'II-I', 'III-I', 'IV-I'],
    required: true
  },
  section: {
    type: String,
    enum: ['CSE-DS-A', 'CSE-A', 'CSE-B', 'IT-A', 'IT-B'],
    required: true
  },
  attendanceDate: {
    type: Date,
    default: function() {
      return new Date().toDateString();
    }
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
attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index to prevent duplicate attendance
attendanceSchema.index({ student: 1, session: 1 }, { unique: true });

// Additional indexes for efficient queries
attendanceSchema.index({ student: 1, subject: 1, attendanceDate: -1 });
attendanceSchema.index({ session: 1, status: 1 });
attendanceSchema.index({ faculty: 1, attendanceDate: -1 });
attendanceSchema.index({ class: 1, section: 1, attendanceDate: -1 });
attendanceSchema.index({ attendanceDate: -1 });

// Method to check if attendance was marked late
attendanceSchema.methods.isLate = function() {
  // Compare markedAt with session start time
  // This would need to be populated or calculated
  return this.status === 'late';
};

// Static method to calculate attendance percentage for a student
attendanceSchema.statics.calculateStudentAttendance = async function(studentId, subjectId, startDate, endDate) {
  const pipeline = [
    {
      $match: {
        student: mongoose.Types.ObjectId(studentId),
        ...(subjectId && { subject: mongoose.Types.ObjectId(subjectId) }),
        ...(startDate && endDate && {
          attendanceDate: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        })
      }
    },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'present'] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalClasses: 1,
        presentClasses: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$presentClasses', '$totalClasses'] },
                100
              ]
            },
            2
          ]
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || { totalClasses: 0, presentClasses: 0, percentage: 0 };
};

module.exports = mongoose.model('Attendance', attendanceSchema);