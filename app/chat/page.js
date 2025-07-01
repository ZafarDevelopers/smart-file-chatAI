'use client'
import { useState, useEffect } from 'react'

export default function ChatPage() {
  const [file, setFile] = useState(null)
  const [fileText, setFileText] = useState('')
  const [prompt, setPrompt] = useState('')
  const [chat, setChat] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voices, setVoices] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const allVoices = window.speechSynthesis.getVoices()
      if (allVoices.length) {
        setVoices(allVoices)
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoices(window.speechSynthesis.getVoices())
        }
      }
    }
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) return alert('Select a file')
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: fd,
    })

    const data = await res.json()
    setUploading(false)

    if (data.success) {
      setFileText(data.text)
      setChat([
        { role: 'system', content: '✅ Document uploaded successfully! You may now ask anything about it.' }
      ])
    } else {
      alert('Upload error: ' + data.error)
    }
  }

  const handleSend = async () => {
    if (!prompt.trim() || !fileText) return
    setLoading(true)
    setChat((prev) => [...prev, { role: 'user', content: prompt }])
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentText: fileText, question: prompt }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.success) {
      setChat((prev) => [...prev, { role: 'assistant', content: data.response }])
    } else {
      alert('AI Error: ' + data.error)
    }

    setPrompt('')
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    alert('📋 Response Copied to clipboard')
  }

  const handleSpeakAnswer = (text) => {
    const utterance = new SpeechSynthesisUtterance(text)
    const preferred = voices.find(v => v.name.toLowerCase().includes('female')) || voices[0]
    utterance.voice = preferred
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  }

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return alert('Speech recognition is not supported in this browser.')

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setPrompt(transcript)
    }

    recognition.onerror = (e) => {
      setListening(false)
      alert('Speech error: ' + e.error)
    }

    recognition.start()
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center text-blue-600">
        SmartFileChat – Chat with your document
      </h1>

      {/* File Upload */}
      {!fileText && (
        <div className="space-y-2">
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx,image/*"
            onChange={handleFileChange}
            className="block border rounded p-2"
          />
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload & Extract'}
          </button>
        </div>
      )}

      {/* Chat Area */}
      {fileText && (
        <>
          <div className="space-y-4">
            {chat.map((msg, i) => (
              <div key={i} className="p-4 bg-gray-100 rounded shadow relative">
                {msg.role === 'user' ? (
                  <>
                    <h5 className="font-semibold text-right">You:</h5>
                    <p className="text-right">{msg.content}</p>
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Copy
                    </button>
                  </>
                ) : msg.role === 'assistant' ? (
                  <>
                    <h6 className="font-semibold text-green-700">SmartFileChat AI:</h6>
                    <button
                        onClick={() => handleSpeakAnswer(msg.content)}
                        className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                      >
                        🔊 Listen</button>
                      
                    <p className="text-gray-800">{msg.content}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Copy
                      </button>
                      
                    </div>
                  </>
                ) : (
                  <p className="text-sm italic text-center">{msg.content}</p>
                )}
              </div>
            ))}
          </div>

          {/* Prompt Input */}
          <div className="mt-4 flex flex-col gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full border p-2 rounded shadow-sm"
              placeholder="Ask something about your file..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleVoiceInput}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                🎤 {listening ? 'Listening...' : 'Speak Question'}
              </button>
              <button
                onClick={handleSend}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Thinking...' : 'Send Question'}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
