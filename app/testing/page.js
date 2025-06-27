'use client'
import { useState } from 'react'

export default function TestingPage() {
  const [result, setResult] = useState({
    txt: '',
    pdf: '',
    docx: '',
    image: '',
  })

  const handleTest = async (type) => {
    const res = await fetch(`/api/testing?type=${type}`)
    const data = await res.json()
    if (data.success) {
      setResult((prev) => ({ ...prev, [type]: data.text }))
    } else {
      alert(`Error testing ${type}: ${data.error}`)
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">📦 Package Test Utility</h1>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleTest('txt')}
          className="bg-blue-500 text-white py-2 px-4 rounded"
        >
          Test TXT File
        </button>
        <p>{result.txt}</p>

        <button
          onClick={() => handleTest('pdf')}
          className="bg-red-500 text-white py-2 px-4 rounded"
        >
          Test PDF File
        </button>
        <p>{result.pdf}</p>

        <button
          onClick={() => handleTest('docx')}
          className="bg-green-600 text-white py-2 px-4 rounded"
        >
          Test DOCX File
        </button>
        <p>{result.docx}</p>

        <button
          onClick={() => handleTest('image')}
          className="bg-yellow-600 text-white py-2 px-4 rounded"
        >
          Test Image File
        </button>
        <p>{result.image}</p>
      </div>
    </main>
  )
}
