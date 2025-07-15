export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-extrabold text-right text-green-600 drop-shadow-sm">
        👋 Welcome to <span className="text-blue-600">SmartFileChat AI</span>
      </h1>

      <p className="text-lg text-gray-700 leading-relaxed bg-white shadow rounded p-4 border border-gray-200">
        <strong>SmartFileChat</strong> is a modern AI-powered web application that enables users to interact with their documents through a chat interface. 📁
        <br /><br />
        Users can upload files such as <span className="font-medium">PDF, Word, Text, or Image-based documents</span> and ask intelligent questions related to the content.
        <br /><br />
        Our AI model responds with accurate and helpful answers to help you better understand your files.
        <br /><br />
        🧠 Whether you are a <strong>student</strong>, <strong>professional</strong>, or <strong>researcher</strong>, SmartFileChat boosts your productivity by making document reading and comprehension faster, smarter, and more accessible.
      </p>
    </main>
  )
}
