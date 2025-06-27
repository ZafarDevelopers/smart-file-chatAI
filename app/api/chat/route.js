import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export async function POST(req) {
  try {
    const { documentText, question } = await req.json()

    if (!documentText || !question) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing inputs' }),
        { status: 400 }
      )
    }

    const prompt = `You are a document expert AI. Based on this content:\n\n"""${documentText.substring(
      0,
      4000
    )}"""\n\nAnswer this user question: "${question}"\n\nAnswer:`

    const response = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    })

    const answer = response.choices?.[0]?.message?.content || 'No response.'

    return new Response(JSON.stringify({ success: true, response: answer }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Chat error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    })
  }
}
