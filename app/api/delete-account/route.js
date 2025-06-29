// app/api/delete-account/route.js
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs'
import { NextResponse } from 'next/server'

export async function DELETE(req) {
  try {
    // 1️⃣ Protect the route — returns 404 if not logged in
    await auth.protect()

    // 2️⃣ Get userId
    const { userId } = await auth()
    console.log('✅ delete-account called for userId:', userId)

    // 3️⃣ Delete via backend client
    const client = await clerkClient()
    await client.users.deleteUser(userId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('❌ delete-account error:', err)
    const status = err.cause?.status || 500
    return NextResponse.json({ error: err.message }, { status })
  }
}
