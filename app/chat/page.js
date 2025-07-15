'use client'
import { useState, useEffect } from 'react'
import axios from 'axios'
import { usePolly } from '@/lib/usePolly'
import { toast } from 'react-toastify'

export default function ChatPage() {
  const [file, setFile] = useState(null)
  const [fileText, setFileText] = useState('')
  const [prompt, setPrompt] = useState('')
  const [chat, setChat] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [listening, setListening] = useState(false)
  const [useUrlUpload, setUseUrlUpload] = useState(false)
  const [fileUrl, setFileUrl] = useState('')
  const [firstName, setFirstName] = useState('You')
  const [srProgressText, setSrProgressText] = useState('')
  const speak = usePolly()

  useEffect(() => {
    const interval = setInterval(() => {
      const name = window.Clerk?.user?.firstName
      if (name) {
        setFirstName(name)
        clearInterval(interval)
      }
    }, 200)

    return () => clearInterval(interval)
  }, [])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) setFile(selected)
  }

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file to upload.')
    setUploading(true)
    setUploadProgress(0)
    const fd = new FormData()
    fd.append('file', file)

    try {
      const { data } = await axios.post('/api/upload', fd, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
          setSrProgressText(`Upload progress: ${percent} percent`)
        }
      })

      setFileText(data.text)
      setChat([
        { role: 'system', content: ' Document uploaded successfully! You may now ask anything about it. happy using SMART FILE CHAT AI !' }
      ])
      toast.success('Document uploaded successfully!')
    } catch (e) {
      toast.error('Upload error: ' + (e.response?.data?.error || e.message))
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setSrProgressText('')
    }
  }

  const handleUrlUpload = async () => {
    if (!fileUrl.trim()) return toast.error('Please enter a valid file URL.')
    setUploading(true)
    try {
      const { data } = await axios.post('/api/upload-url', { url: fileUrl })
      setFileText(data.text)
      setChat([
        { role: 'system', content: ' File from URL uploaded successfully! You may now ask anything about it. happy using SMART FILE CHAT AI!' }
      ])
      toast.success('File from URL uploaded successfully!')
    } catch (e) {
      toast.error('Upload from URL failed: ' + (e.response?.data?.error || e.message))
    } finally {
      setUploading(false)
    }
  }

  const handleSend = async () => {
    if (!prompt.trim() || !fileText) return
    setLoading(true)
    setChat(prev => [...prev, { role: 'user', content: prompt }])

    try {
      const { data } = await axios.post('/api/chat', {
        documentText: fileText,
        question: prompt,
      })
      setChat(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (err) {
      toast.error('AI Error: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
      setPrompt('')
    }
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    toast.success(' Copied to clipboard!')
  }

  const handleSpeak = (text) => {
    speak(text).catch(err => toast.error('TTS error: ' + err.message))
  }

  const handleVoiceInput = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return toast.error('Speech recognition not supported.')

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)

    recognition.onresult = (event) => {
      setPrompt(event.results[0][0].transcript)
    }

    recognition.onerror = (e) => {
      setListening(false)
      toast.error('Speech error: ' + e.error)
    }

    recognition.start()
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-center text-blue-600">SmartFileChat</h1>

      {!fileText && (
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={useUrlUpload}
              onChange={() => setUseUrlUpload(!useUrlUpload)}
            />
            Upload from URL
          </label>

          {useUrlUpload ? (
            <>
              <input
                type="url"
                placeholder="Enter file URL (PDF, DOC, Image, etc.)"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                className="border border-gray-300 rounded p-2 w-full"
              />
              <button
                onClick={handleUrlUpload}
                disabled={uploading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full"
              >
                {uploading ? 'Uploading from URL...' : 'Upload from URL'}
              </button>
            </>
          ) : (
            <>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx,image/*"
                onChange={handleFileChange}
                className="block border border-gray-300 rounded p-2 w-full"
              />
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full"
              >
                {uploading ? `Uploading... ${uploadProgress}%` : 'Upload & Extract'}
              </button>

              {uploading && (
                <>
                  <div
                    className="w-full bg-gray-200 rounded h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={uploadProgress}
                    aria-label="File upload progress"
                  >
                    <div
                      className="bg-blue-500 h-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>

                  {/* For NVDA and screen reader live updates */}
                  <div className="sr-only" aria-live="polite">
                    {srProgressText}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {fileText && (
        <>
          <div className="space-y-4">
            {chat.map((msg, i) => (
              <div key={i} className="p-4 bg-gray-100 rounded shadow relative">
                {msg.role === 'user' && (
                  <>
                    <h5 className="font-semibold text-right">{firstName}:</h5>
                    <p className="text-right">{msg.content}</p>
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="absolute top-2 right-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Copy
                    </button>
                  </>
                )}
                {msg.role === 'assistant' && (
                  <>
                    <h6 className="font-semibold text-green-700">SmartFileChat AI:</h6>
                    <p className="text-gray-800 whitespace-pre-line">{msg.content}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleCopy(msg.content)}
                        className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleSpeak(msg.content)}
                        className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
                      >
                        🔊 Listen
                      </button>
                    </div>
                  </>
                )}
                {msg.role === 'system' && (
                  <p className="text-sm italic text-center text-gray-600">{msg.content}</p>
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
                {loading ? 'Thinking...' : 'Send'}
              </button>
            </div>
          </div>
        </>
      )}
    </main>
  )
}
