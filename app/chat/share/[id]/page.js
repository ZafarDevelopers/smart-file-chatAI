
'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import jsPDF from 'jspdf'

export default function SharedChatPage() {
  const { id } = useParams()
  const [chat, setChat] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/chat/share/${id}`)
        const data = await res.json()
        if (data.success) {
          setChat(data.chat)
        }
      } catch (err) {
        console.error(' Failed to fetch shared chat:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchChat()
  }, [id])

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    alert(' Copied to clipboard!')
  }

  const handleExportToPDF = () => {
    if (!chat) return

    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text(`Chat Title: ${chat.title}`, 10, 20)
    doc.setFontSize(12)

    let y = 30
    chat.messages.forEach((msg) => {
      const label = msg.role === 'user' ? ' You: ' : ' Smart File Chat AI: '
      const lines = doc.splitTextToSize(label + msg.content, 180)
      if (y + lines.length * 7 > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(lines, 10, y)
      y += lines.length * 7 + 5
    })

    doc.save(`${chat.title.replace(/\s+/g, '_')}.pdf`)
  }

  const handleNativeShare = async () => {
    const shareUrl = `${window.location.origin}/chat/share/${chat._id}`
    const shareData = {
      title: chat.title,
      text: `Here's a shared chat from SmartFileChat.`,
      url: shareUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        alert('Sharing failed: ' + err.message)
      }
    } else {
      alert('Sharing not supported on this device.')
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center text-blue-700">
        📤 Shared Chat
      </h1>

      {loading ? (
        <div className="text-center text-gray-500">Loading shared chat...</div>
      ) : !chat ? (
        <div className="text-center text-red-600">❌ Chat not found</div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-center text-gray-800">{chat.title}</h2>

          <div className="space-y-4 mt-4">
            {chat.messages.map((msg, i) => (
              <div key={i} className="p-4 bg-gray-100 rounded shadow relative">
                <h6 className={`font-semibold ${msg.role === 'user' ? 'text-blue-600 text-right' : 'text-green-700'}`}>
                  {msg.role === 'user' ? 'User:' : 'SmartFileChat AI:'}
                </h6>
                <p className={`mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>{msg.content}</p>
                <button
                  onClick={() => handleCopy(msg.content)}
                  className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={handleExportToPDF}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              📄 Export to PDF
            </button>
            <button
              onClick={handleNativeShare}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              🔗 Share Chat
            </button>
          </div>
        </>
      )}
    </main>
  )
}
