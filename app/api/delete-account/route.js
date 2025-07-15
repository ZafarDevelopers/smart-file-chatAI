
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function DELETE(req) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = user.id
    const client = await clerkClient() 
    await client.users.deleteUser(userId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(' Account deletion failed:', err)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
