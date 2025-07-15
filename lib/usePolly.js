
'use client'
import { useState } from 'react'
import axios from 'axios'

export function usePolly() {
  const [cache] = useState(new Map())

  async function speak(text) {
    if (cache.has(text)) {
      play(cache.get(text))
      return
    }

    try {
      const res = await axios.post('/api/polly', { text })
      if (res.data.success) {
        cache.set(text, res.data.audio)
        play(res.data.audio)
      } else {
        throw new Error(res.data.error || 'TTS failed')
      }
    } catch (err) {
      throw err
    }
  }

  function play(base64) {
    const audio = new Audio(base64)
    audio.play().catch(console.error)
  }

  return speak
}
