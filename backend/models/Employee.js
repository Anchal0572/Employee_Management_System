const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    relation: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Corporate email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
        'Please provide a valid corporate email address'
      ]
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: {
        values: [
          'Engineering',
          'Human Resources',
          'Finance',
          'Product',
          'Legal',
          'Operations',
          'Marketing',
          'Sales'
        ],
        message: '{VALUE} is not a valid department'
      }
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now
    },
    employmentType: {
      type: String,
      enum: {
        values: ['full_time', 'part_time', 'contract', 'intern'],
        message: '{VALUE} is not a valid employment type'
      },
      default: 'full_time'
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative']
    },
    address: {
      type: String,
      trim: true
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({})
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'on_leave', 'probation', 'terminated'],
        message: '{VALUE} is not a valid employee status'
      },
      default: 'active'
    },
    skills: {
      type: [String],
      default: []
    },
    manager: {
      type: String,
      trim: true,
      default: 'Executive Leadership'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual field: Full Name
employeeSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
