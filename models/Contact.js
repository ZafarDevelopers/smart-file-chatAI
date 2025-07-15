
import mongoose from 'mongoose'

const ContactSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Invalid email format'],
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    minlength: 11,
    maxlength: 20,
  },
  reason: {
    type: String,
    required: true,
    enum: ['bug', 'feedback', 'support', 'inquiry'],
  },
  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 1000,
  },
}, {
  timestamps: true, 
})

export default mongoose.models.Contact || mongoose.model('Contact', ContactSchema)
