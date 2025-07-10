'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import jsPDF from 'jspdf'

export default function HistoryPage() {
  const [chats, setChats] = useState([])
  const [selected, setSelected] = useState(new Set())

  useEffect(() => {
    const fetchChats = async () => {
      const res = await fetch('/api/chats')
      const data = await res.json()
      if (data.success) setChats(data.chats)
    }
    fetchChats()
  }, [])

  const toggleSelect = (id) => {
    const copy = new Set(selected)
    copy.has(id) ? copy.delete(id) : copy.add(id)
    setSelected(copy)
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return alert('No chats selected')
    const confirmDelete = window.confirm('Are you sure you want to delete the selected chat(s)?')
    if (!confirmDelete) return

    const res = await fetch('/api/delete-chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected] }),
    })

    const data = await res.json()
    if (data.success) {
      setChats((prev) => prev.filter((chat) => !selected.has(chat._id)))
      setSelected(new Set())
      alert('✅ Chat(s) deleted.')
    } else {
      alert('❌ Failed to delete chat(s).')
    }
  }

  const nativeShare = async () => {
    if (selected.size === 0) return alert('No chats selected to share.')

    const selectedChats = chats.filter((chat) => selected.has(chat._id))

    for (const chat of selectedChats) {
      const url = `${window.location.origin}/chat/${chat._id}`
      const shareData = {
        title: chat.title,
        text: `Check out this chat "${chat.title}" at smart file chat AI`,
        url,
      }

      if (navigator.share) {
        try {
          await navigator.share(shareData)
        } catch (err) {
          console.error('Share failed:', err)
        }
      } else {
        alert('Native sharing is not supported in this browser.')
      }
    }
  }

  const exportSelectedToPDF = async () => {
    if (selected.size === 0) return alert('Select chats to export.')

    const selectedChats = chats.filter((chat) => selected.has(chat._id))

    for (const chat of selectedChats) {
      // 1. Fetch full chat with messages
      const res = await fetch(`/api/chat/${chat._id}`)
      const data = await res.json()
      if (!data.success || !data.chat) {
        alert(`❌ Could not load chat: ${chat.title}`)
        continue
      }

      const doc = new jsPDF()
      doc.setFontSize(14)
      doc.text(`Chat Title: ${data.chat.title}`, 10, 20)
      doc.setFontSize(12)

      let y = 30
      data.chat.messages.forEach((msg, index) => {
        const label = msg.role === 'user' ? '🧑‍💬 You: ' : '🤖 smart file chat AI: '
        const lines = doc.splitTextToSize(label + msg.content, 180)
        if (y + lines.length * 7 > 280) {
          doc.addPage()
          y = 20
        }
        doc.text(lines, 10, y)
        y += lines.length * 7 + 5
      })

      doc.save(`${data.chat.title.replace(/\s+/g, '_')}.pdf`)
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-blue-600">📜 Your Chat History</h1>

      {selected.size > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-100 border rounded">
          <p className="text-gray-700">✅ Selected: {selected.size}</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={nativeShare}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              🔗 Share Selected
            </button>
            <button
              onClick={exportSelectedToPDF}
              className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
            >
              📄 Export to PDF
            </button>
            <button
              onClick={deleteSelected}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >
              🗑 Delete Selected
            </button>
          </div>
        </div>
      )}

      {chats.length === 0 ? (
        <p className="text-gray-600">No past chats found.</p>
      ) : (
        <ul className="space-y-3">
          {chats.map((chat) => (
            <li
              key={chat._id}
              className="border p-3 rounded shadow-sm hover:bg-gray-50 relative"
            >
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(chat._id)}
                    onChange={() => toggleSelect(chat._id)}
                  />
                  <Link
                    href={`/chat/${chat._id}`}
                    className="text-blue-700 font-medium hover:underline"
                  >
                    {chat.title}
                  </Link>
                </label>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(chat.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
