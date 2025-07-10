// app/api/contact/route.js
import { currentUser } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import Contact from '@/models/Contact'

export async function POST(req) {
  try {
    const user = await currentUser()
    const body = await req.json()

    const required = ['firstName', 'lastName', 'email', 'phone', 'reason', 'message']
    for (let field of required) {
      if (!body[field]) {
        return Response.json({ success: false, error: `Missing ${field}` }, { status: 400 })
      }
    }

    await connectDB()

    await Contact.create({
      ...body,
      submittedAt: new Date(),
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('Contact error:', err)
    return Response.json({ success: false, error: err.message }, { status: 500 })
  }
}
