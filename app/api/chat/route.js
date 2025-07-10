// app/api/chat/route.js
import Groq from 'groq-sdk'
import { connectDB } from '@/lib/db'
import Chat from '@/models/Chat'
import { currentUser } from '@clerk/nextjs/server'
import crypto from 'crypto'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req) {
  try {
    const user = await currentUser()
    if (!user) return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 })

    await connectDB()
    const email = user.emailAddresses[0].emailAddress
    const { documentText, question } = await req.json()

    if (!documentText || !question) {
      return new Response(JSON.stringify({ success: false, error: 'Missing documentText or question' }), {
        status: 400,
      })
    }

    // 🔑 Use documentText hash as a unique ID to group chats by file
    const docHash = crypto.createHash('sha256').update(documentText).digest('hex')

    // 🧠 Try to find existing chat by user + document hash
    let chat = await Chat.findOne({ userEmail: email, documentHash: docHash })

    const prompt = `You are a document expert AI. Based on this content:\n\n"""${documentText.slice(
      0,
      4000
    )}"""\n\nAnswer this user question: "${question}"\n\nAnswer:`

    const groqRes = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const answer = groqRes.choices?.[0]?.message?.content || 'No response.'

    if (chat) {
      // 💬 Append messages to existing chat
      chat.messages.push({ role: 'user', content: question })
      chat.messages.push({ role: 'assistant', content: answer })
      await chat.save()
    } else {
      // ✨ Generate short clean title
      const titlePrompt = `Give me ONLY a 3 to 4 word short title for this document and message. No quotes or explanation.

Document: ${documentText.slice(0, 1000)}
Message: ${question}`

      const titleRes = await groq.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: [{ role: 'user', content: titlePrompt }],
        temperature: 0.5,
      })

      let rawTitle = titleRes.choices?.[0]?.message?.content?.trim() || 'Untitled Chat'
      rawTitle = rawTitle.replace(/^["“”']+|["“”']+$/g, '') // remove quotes
      rawTitle = rawTitle.replace(/^(.*?)[:\-–]\s*/, '')   // remove prefixes

      // 🆕 Create new chat with first messages
      chat = await Chat.create({
        userEmail: email,
        title: rawTitle,
        documentText,
        documentHash: docHash,
        messages: [
          { role: 'user', content: question },
          { role: 'assistant', content: answer },
        ],
      })
    }

    return new Response(JSON.stringify({ success: true, response: answer }), {
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Chat error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
