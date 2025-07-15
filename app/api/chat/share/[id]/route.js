
import { connectDB } from '@/lib/db'
import Chat from '@/models/Chat'
import mongoose from 'mongoose'

export async function GET(_req, { params }) {
  try {
    await connectDB()

    const chatId = params.id
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid ID' }), {
        status: 400
      })
    }

    const chat = await Chat.findById(chatId)

    if (!chat) {
      return new Response(JSON.stringify({ success: false, error: 'Chat not found' }), {
        status: 404
      })
    }


    return new Response(JSON.stringify({ success: true, chat }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('❌ Share Chat API error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500
    })
  }
}
