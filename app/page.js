import { auth} from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


export default function Home() {
//   const { userId } = auth()
// console.log(userId)

//   if ( !userId) {
//     redirect('/sign-up')
//   }


  return (
  <>
    <h1 className="text-right text-green-400 ">welcome to the app</h1>
        <p> SmartFile Chat is a modern AI-powered web application that enables users to interact with their documents
through a chat interface. Users can upload files such as PDF, Word, text, or image-based documents and
ask questions related to the content. The system responds with meaningful and intelligent answers using an
AI model.
This tool is designed to enhance document understanding and productivity, especially for students,
professionals, and researchers. It combines file processing, AI integration, and user-friendly chat to make
reading documents faster and smarter.</p>
  </>
  );
}
