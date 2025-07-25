'use client'

import { useState } from 'react'
import {
  useUser,
  SignInButton,
  SignUpButton,
  UserProfile,
} from '@clerk/nextjs'

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    const confirmDelete = confirm(
      'Are you sure you want to delete your account? This action is permanent!'
    )
    if (!confirmDelete) return

    try {
      setDeleting(true)
      const res = await fetch('/api/delete-account', {
        method: 'DELETE',
      })
      const data = await res.json()
      setDeleting(false)

      if (res.ok && data.success) {
        alert('Your account was deleted, to use Smart File Chat AI again, feel free to create an account in the future..')
        window.location.href = '/'
      } else {
        alert(' Error: ' + data.error)
      }
    } catch (err) {
      setDeleting(false)
      alert('Unexpected error: ' + err.message)
    }
  }

  if (!isLoaded) return <p className="p-6 text-gray-600">Loading profile...</p>

  if (!isSignedIn) {
    return (
      <main className="p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">You’re not logged in</h1>
        <p className="text-gray-600">Please sign in or create an account to continue.</p>
        <div className="flex justify-center gap-4">
          <SignInButton mode="modal">
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Sign Up</button>
          </SignUpButton>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center text-blue-600">My Profile</h1>

      <div className="flex items-center gap-4 bg-gray-100 p-4 rounded shadow">
        <img
          src={user.imageUrl}
          alt="Profile"
          className="w-20 h-20 rounded-full border"
        />
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{user.fullName}</h2>
          <p className="text-sm text-gray-600">{user.emailAddresses[0]?.emailAddress}</p>
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => setShowProfileModal(true)}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
        >
          Edit Profile
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-60"
        >
          {deleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>

      {/* Clerk modal profile UI */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 max-w-lg w-full shadow-lg">
            <UserProfile />
            <button
              onClick={() => setShowProfileModal(false)}
              className="mt-4 text-sm text-red-500 hover:text-red-700"
            >
              ✖ Close
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
