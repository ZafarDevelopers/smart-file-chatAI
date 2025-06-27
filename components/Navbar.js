'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/nextjs'
import { Menu, X } from 'lucide-react' // install lucide-react if needed

export default function Navbar() {
  const { user } = useUser()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="w-full bg-white border-b shadow-sm px-6 py-4">
      <div className="flex justify-between items-center">
        {/* Logo / Brand */}
        <Link href="/" className="text-xl font-bold text-blue-600">
          SmartFileChat
        </Link>

        {/* Toggle Button (Hamburger) */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden focus:outline-none"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Nav Links for Desktop */}
        <div className="hidden md:flex items-center gap-6 font-medium text-gray-700">
          <Link href="/about">About Us</Link>
          <Link href="/contact">Contact Us</Link>
          <Link href="/chat">New Chat</Link>
          <Link href="/history">History</Link>
          <Link href="/profile">Profile</Link>

          <SignedOut>
            <SignInButton>
              <button className="bg-blue-600 text-white px-4 py-1 rounded">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {user && <span className="text-sm text-gray-600">Hi, {user.firstName}</span>}
            <UserButton afterSignOutUrl="/sign-in" />
          </SignedIn>
        </div>
      </div>

      {/* Toggle Menu for Mobile */}
      {isOpen && (
        <div className="flex flex-col md:hidden mt-4 gap-4 font-medium text-gray-700">
          <Link href="/about" onClick={() => setIsOpen(false)}>About Us</Link>
          <Link href="/contact" onClick={() => setIsOpen(false)}>Contact Us</Link>
          <Link href="/chat" onClick={() => setIsOpen(false)}>New Chat</Link>
          <Link href="/history" onClick={() => setIsOpen(false)}>History</Link>
          <Link href="/profile" onClick={() => setIsOpen(false)}>Profile</Link>

          <SignedOut>
            <SignInButton>
              <button className="bg-blue-600 text-white px-4 py-1 rounded w-full text-left">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            {user && <span className="text-sm text-gray-600">Hi, {user.firstName}</span>}
            <UserButton afterSignOutUrl="/sign-in" />
          </SignedIn>
        </div>
      )}
    </nav>
  )
}
