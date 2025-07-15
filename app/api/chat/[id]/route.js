
import { currentUser } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import Chat from '@/models/Chat'
import mongoose from 'mongoose'

export async function GET(req, context) {
  try {
    const user = await currentUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    await connectDB()


    const email = user.emailAddresses?.[0]?.emailAddress


    const { id: chatId } = await context.params

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return new Response('Invalid ID', { status: 400 })
    }


    const chat = await Chat.findOne({ _id: chatId, userEmail: email })
    if (!chat) return new Response('Not found', { status: 404 })

    return new Response(JSON.stringify({ success: true, chat }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Single chat fetch error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    })
  }
}
