
import multer from 'multer'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import Tesseract from 'tesseract.js'
import { v4 as uuidv4 } from 'uuid'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand
} from '@aws-sdk/client-textract'

export const config = { api: { bodyParser: false } }

const upload = multer({ storage: multer.memoryStorage() })

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const textract = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

function runMiddleware(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

async function waitForTextract(jobId) {
  let status = 'IN_PROGRESS'
  let result

  while (status === 'IN_PROGRESS') {
    await new Promise((r) => setTimeout(r, 3000))
    result = await textract.send(new GetDocumentTextDetectionCommand({ JobId: jobId }))
    status = result.JobStatus
  }

  if (status !== 'SUCCEEDED') throw new Error('Textract job failed')
  return result
}

async function extractWithTextract(bucket, key) {
  const { JobId } = await textract.send(new StartDocumentTextDetectionCommand({
    DocumentLocation: { S3Object: { Bucket: bucket, Name: key } }
  }))

  const first = await waitForTextract(JobId)
  let blocks = first.Blocks || []
  let nextToken = first.NextToken

  while (nextToken) {
    const next = await textract.send(new GetDocumentTextDetectionCommand({ JobId: JobId, NextToken: nextToken }))
    blocks.push(...(next.Blocks || []))
    nextToken = next.NextToken
  }

  return blocks.filter(b => b.BlockType === 'LINE' && b.Text).map(b => b.Text).join('\n')
}

async function deleteFromS3(bucket, key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    console.log(`🧹 Deleted S3 file: ${key}`)
  } catch (err) {
    console.warn(` Failed to delete ${key}: ${err.message}`)
  }
}

export default async function handler(req, res) {
  try {
    await runMiddleware(req, res)
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Multer error: ' + err.message })
  }

  const file = req.file
  if (!file) return res.status(400).json({ success: false, error: 'No file uploaded' })

  const { buffer, mimetype, originalname } = file
  const ext = originalname.split('.').pop()
  const key = `uploads/${uuidv4()}.${ext}`
  const bucket = process.env.S3_BUCKET
  let text = ''

  try {
    if (mimetype === 'application/pdf' && buffer.length < 4 * 1024 * 1024) {
      const parsed = await pdfParse(buffer)
      if (parsed.text.trim()) {
        text = parsed.text
      } else {
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }))
        text = await extractWithTextract(bucket, key)
        await deleteFromS3(bucket, key)
      }
    } else if (/\.(docx?|doc)$/i.test(originalname)) {
      text = (await mammoth.extractRawText({ buffer })).value
    } else if (mimetype === 'text/plain') {
      text = buffer.toString('utf-8')
    } else if (mimetype.startsWith('image/')) {
      const { data: { text: t } } = await Tesseract.recognize(buffer, 'eng')
      text = t
    } else if (mimetype === 'application/pdf') {
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }))
      text = await extractWithTextract(bucket, key)
      await deleteFromS3(bucket, key)
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type' })
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No text extracted' })
    }

    console.log(' Extracted length:', text.length)
    return res.status(200).json({ success: true, text })
  } catch (err) {
    console.error(' Upload error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
