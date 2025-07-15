
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly'
import { NextResponse } from 'next/server'
import { fromEnv } from '@aws-sdk/credential-provider-env'

const polly = new PollyClient({
  region: process.env.AWS_REGION,
  credentials: fromEnv(),
})

export async function POST(req) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string' || text.length < 5) {
      return NextResponse.json({ success: false, error: 'Invalid text' }, { status: 400 })
    }

    const command = new SynthesizeSpeechCommand({
      OutputFormat: 'mp3',
      Text: text,
      VoiceId: 'Ruth', 
      Engine: 'neural',  
      TextType: 'text'
    })

    const response = await polly.send(command)

    const audioBuffer = await streamToBuffer(response.AudioStream)

    return NextResponse.json({
      success: true,
      audio: `data:audio/mp3;base64,${audioBuffer.toString('base64')}`
    })

  } catch (err) {
    console.error(' Polly error:', err)
    return NextResponse.json({ success: false, error: 'Polly failed' }, { status: 500 })
  }
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}
