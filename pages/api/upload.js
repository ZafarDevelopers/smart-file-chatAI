// pages/api/upload.js
import multer from 'multer'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import Tesseract from 'tesseract.js'

export const config = { api: { bodyParser: false } }

const upload = multer({ storage: multer.memoryStorage() })

function runMiddleware(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

export default async function handler(req, res) {
  console.log('➡️ Upload endpoint hit')

  try {
    await runMiddleware(req, res)
  } catch (err) {
    console.error('🔴 Multer error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }

  const file = req.file
  if (!file) {
    console.log('❌ No file uploaded')
    return res.status(400).json({ success: false, error: 'No file uploaded' })
  }

  console.log('📦 File:', file.originalname, file.mimetype, file.size)

  const { buffer, mimetype, originalname } = file
  let text = ''

  try {
    if (mimetype === 'application/pdf') {
      text = (await pdfParse(buffer)).text
    } else if (/\.(docx?|doc)$/i.test(originalname)) {
      text = (await mammoth.extractRawText({ buffer })).value
    } else if (mimetype === 'text/plain') {
      text = buffer.toString('utf-8')
    } else if (mimetype.startsWith('image/')) {
      const { data: { text: t } } = await Tesseract.recognize(buffer, 'eng')
      text = t
    } else {
      console.log('⚠️ Unsupported file type', mimetype)
      return res.status(400).json({ success: false, error: 'Unsupported file type' })
    }

    console.log('✅ Extracted text length:', text.length)
    return res.status(200).json({ success: true, text })
  } catch (e) {
    console.error('❌ Extraction error:', e)
    return res.status(500).json({ success: false, error: e.message })
  }
}
