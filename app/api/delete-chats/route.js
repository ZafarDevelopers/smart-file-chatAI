import { currentUser } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import Chat from '@/models/Chat'
import mongoose from 'mongoose'

export async function POST(req) {
  try {
    const user = await currentUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const email = user.emailAddresses[0].emailAddress
    const { ids } = await req.json()

    if (!Array.isArray(ids)) return new Response('Invalid', { status: 400 })

    await connectDB()
    const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id))

    await Chat.deleteMany({ _id: { $in: objectIds }, userEmail: email })

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error('Delete chats error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 })
  }
}
