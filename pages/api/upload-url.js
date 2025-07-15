
import axios from 'axios'
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'
import Tesseract from 'tesseract.js'
import { v4 as uuidv4 } from 'uuid'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from '@aws-sdk/client-textract'

export const config = { api: { bodyParser: true } }

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

async function waitForTextract(jobId) {
  let status = 'IN_PROGRESS'
  let result

  while (status === 'IN_PROGRESS') {
    await new Promise(res => setTimeout(res, 3000))
    result = await textract.send(new GetDocumentTextDetectionCommand({ JobId: jobId }))
    status = result.JobStatus
  }

  if (status !== 'SUCCEEDED') throw new Error('Textract failed')
  return result
}

async function extractWithTextract(buffer, ext) {
  const bucket = process.env.S3_BUCKET
  const key = `uploads/url-${uuidv4()}.${ext}`

  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }))

  const { JobId } = await textract.send(new StartDocumentTextDetectionCommand({
    DocumentLocation: { S3Object: { Bucket: bucket, Name: key } }
  }))

  const result = await waitForTextract(JobId)
  let blocks = result.Blocks || []
  let nextToken = result.NextToken

  while (nextToken) {
    const next = await textract.send(new GetDocumentTextDetectionCommand({ JobId, NextToken: nextToken }))
    blocks.push(...(next.Blocks || []))
    nextToken = next.NextToken
  }

  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
  return blocks.filter(b => b.BlockType === 'LINE' && b.Text).map(b => b.Text).join('\n')
}

export default async function handler(req, res) {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ success: false, error: 'No URL provided' })

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*'
      }
    })

    const buffer = Buffer.from(response.data)
    const contentType = response.headers['content-type'] || ''
    const filename = url.split('/').pop() || `file-${uuidv4()}`
    const ext = filename.split('.').pop().toLowerCase()

    let text = ''

    if (contentType.includes('pdf') && buffer.length < 4 * 1024 * 1024) {
      const parsed = await pdfParse(buffer)
      if (parsed.text.trim()) {
        text = parsed.text
      } else {
        text = await extractWithTextract(buffer, ext)
      }
    } else if (/\.(docx?|doc)$/i.test(filename)) {
      text = (await mammoth.extractRawText({ buffer })).value
    } else if (contentType.includes('text/plain')) {
      text = buffer.toString('utf-8')
    } else if (contentType.startsWith('image/')) {
      const { data: { text: t } } = await Tesseract.recognize(buffer, 'eng')
      text = t
    } else if (contentType.includes('pdf')) {
      text = await extractWithTextract(buffer, ext)
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file type' })
    }

    if (!text.trim()) {
      return res.status(400).json({ success: false, error: 'No text extracted' })
    }

    return res.status(200).json({ success: true, text })
  } catch (err) {
    console.error('Upload URL error:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
