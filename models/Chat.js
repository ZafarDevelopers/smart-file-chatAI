// models/Chat.js
import mongoose from 'mongoose'

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['system', 'user', 'assistant'], required: true },
  content: { type: String, required: true },
}, { _id: false })

const ChatSchema = new mongoose.Schema({
  userEmail: { type: String, required: true, index: true },
  title: { type: String, required: true },
  documentText: { type: String, required: true },
  documentHash: { type: String, required: true, index: true },
  messages: { type: [MessageSchema], default: [] },
}, { timestamps: true })

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema)
