'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function ContactPage() {
  const { user, isSignedIn } = useUser()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    reason: '',
    message: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Auto-fill user data once available
  useEffect(() => {
    if (isSignedIn && user) {
      setForm((prev) => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses?.[0]?.emailAddress || '',
      }))
    }
  }, [user, isSignedIn])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    setLoading(false)
    if (data.success) setSubmitted(true)
    else alert('❌ Something went wrong. Please try again later.')
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-blue-700 text-center">📬 Contact Us</h1>

      {submitted ? (
        <div className="text-center text-green-700 text-lg font-medium">
          ✅ Thank you for reaching out{form.firstName ? `, ${form.firstName}` : ''}! We'll get back to you shortly.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded shadow">
          <div className="flex gap-4">
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="First Name"
              required
              className="w-1/2 border p-2 rounded"
            />
            <input
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Last Name"
              required
              className="w-1/2 border p-2 rounded"
            />
          </div>

          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email Address"
            required
            className="w-full border p-2 rounded"
          />

          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Contact Number"
            required
            className="w-full border p-2 rounded"
          />

          <select
            name="reason"
            value={form.reason}
            onChange={handleChange}
            required
            className="w-full border p-2 rounded"
          >
            <option value="">Reason for Contact</option>
            <option value="bug">Report a Bug</option>
            <option value="feedback">Give Feedback</option>
            <option value="support">Need Help</option>
            <option value="inquiry">General Inquiry</option>
          </select>

          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Write your message here..."
            rows={5}
            required
            className="w-full border p-2 rounded"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Submit'}
          </button>
        </form>
      )}
    </main>
  )
}
