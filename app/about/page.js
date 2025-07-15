export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold text-blue-700 mb-4">
        📄 About Us – SmartFileChat AI
      </h1>

      <p className="text-lg text-gray-700 leading-relaxed bg-white shadow-md rounded p-5 border border-gray-200">
        <strong>SmartFileChat AI</strong> is built to transform the way people understand and communicate with documents.
        <br /><br />
        With the power of advanced AI and natural language processing, we empower users to:
        <ul className="list-disc list-inside mt-2 ml-4">
          <li>🗂 Upload documents in PDF, Word, Text, or even image formats</li>
          <li>💬 Ask meaningful questions about the content</li>
          <li>🧠 Receive intelligent, context-aware responses</li>
        </ul>
        <br />
        Designed for accessibility, learning, and productivity — SmartFileChat is your personal AI document assistant.
        <br /><br />
        👨‍🎓 Whether you are doing academic research, reviewing a business report, or analyzing legal documents — we have got you covered!
      </p>
    </main>
  )
}
