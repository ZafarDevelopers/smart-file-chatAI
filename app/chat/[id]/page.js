'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import { usePolly } from '@/lib/usePolly'

export default function ChatByIdPage() {
  const [chat, setChat] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState('You')
  const speak = usePolly()
  const { id } = useParams()

  useEffect(() => {
    axios.get(`/api/chat/${id}`).then(res => {
      if (res.data.success) setChat(res.data.chat)
    })

    const interval = setInterval(() => {
      const name = window.Clerk?.user?.firstName
      if (name) {
        setFirstName(name)
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [id])

  const handleSend = async () => {
    if (!prompt.trim()) return
    setLoading(true)

    setChat(prev => ({
      ...prev,
      messages: [...prev.messages, { role: 'user', content: prompt }]
    }))

    try {
      const { data } = await axios.post('/api/chat', {
        documentText: chat.documentText,
        question: prompt,
        chatId: chat._id,
      })

      setChat(prev => ({
        ...prev,
        messages: [...prev.messages, { role: 'assistant', content: data.response }]
      }))
    } catch (err) {
      alert('AI Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setPrompt('')
      setLoading(false)
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    alert(' Copied to clipboard!')
  }

  const handleSpeak = (text) => {
    speak(text).catch(err => alert('TTS error: ' + err.message))
  }

  const handleVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert('Speech recognition not supported.')

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onstart = () => setLoading(true)
    recognition.onend = () => setLoading(false)

    recognition.onresult = (event) => {
      setPrompt(event.results[0][0].transcript)
    }

    recognition.onerror = (e) => {
      alert('Speech error: ' + e.error)
    }

    recognition.start()
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">{chat?.title || 'Chat'}</h1>

      <div className="space-y-4">
        {chat?.messages.map((m, i) => (
          <div key={i} className="p-4 bg-gray-100 rounded shadow relative">
            {m.role === 'user' ? (
              <>
                <h5 className="font-semibold text-right">{firstName}:</h5>
                <p className="text-right">{m.content}</p>
                <button
                  onClick={() => handleCopy(m.content)}
                  className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Copy
                </button>
              </>
            ) : (
              <>
                <h6 className="font-semibold text-green-700">SmartFileChat AI:</h6>
                <p className="text-gray-800 whitespace-pre-line">{m.content}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleCopy(m.content)}
                    className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleSpeak(m.content)}
                    className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                  >
                    🔊 Listen
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="w-full border p-2 rounded shadow-sm"
          placeholder="Continue your chat..."
        />
        <div className="flex gap-2">
          <button
            onClick={handleVoiceInput}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            🎤 Speak Question
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </main>
  )
}
