'use client'
import { useState } from 'react'

export default function ChatPage() {
  const [file, setFile] = useState(null)
  const [fileText, setFileText] = useState('')
  const [prompt, setPrompt] = useState('')
  const [chat, setChat] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
    }
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
        {
          role: 'system',
          content: 'Document uploaded successfully! Ask anything from it.',
        },
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

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center text-blue-600">
        SmartFileChat - Ask Anything from Your File
      </h1>

      {/* File Upload */}
      <div className="space-y-2">
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {uploading ? 'Uploading...' : 'Upload & Extract'}
        </button>
      </div>

      {/* Chat */}
      {fileText && (
        <>
          <div className="space-y-4">
            {chat.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded shadow ${
                  msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100 text-left'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full border p-2 rounded"
              placeholder="Ask something from your file..."
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              {loading ? 'Thinking...' : 'Send Question'}
            </button>
          </div>
        </>
      )}
    </main>
  )
}
