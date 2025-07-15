
import { currentUser } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import Chat from '@/models/Chat'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    await connectDB()

    const email = user.emailAddresses[0].emailAddress
    const chats = await Chat.find({ userEmail: email }).sort({ updatedAt: -1 }).select('_id title createdAt')

    return new Response(JSON.stringify({ success: true, chats }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Chat fetch error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    })
  }
}
