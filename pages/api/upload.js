// pages/api/upload.js
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import {
  TextractClient,
  StartDocumentTextDetectionCommand,
  GetDocumentTextDetectionCommand,
} from '@aws-sdk/client-textract';

export const config = { api: { bodyParser: false } };

const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const textract = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function runMiddleware(req, res) {
  return new Promise((resolve, reject) => {
    upload.single('file')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function waitForTextractJob(jobId) {
  console.log(`🔄 Waiting for Textract job: ${jobId}`);
  let status = 'IN_PROGRESS';

  while (status === 'IN_PROGRESS') {
    await new Promise((r) => setTimeout(r, 3000));

    const result = await textract.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId })
    );

    status = result.JobStatus;
    if (status === 'SUCCEEDED') return result;
    if (status === 'FAILED') throw new Error('Textract job failed');
  }
}

async function extractWithTextract(bucket, key) {
  const start = await textract.send(
    new StartDocumentTextDetectionCommand({
      DocumentLocation: { S3Object: { Bucket: bucket, Name: key } },
    })
  );

  const jobId = start.JobId;
  const firstResult = await waitForTextractJob(jobId);

  let blocks = firstResult.Blocks;
  let nextToken = firstResult.NextToken;

  while (nextToken) {
    const page = await textract.send(
      new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken })
    );
    blocks.push(...page.Blocks);
    nextToken = page.NextToken;
  }

  const text = blocks
    .filter((b) => b.BlockType === 'LINE' && b.Text)
    .map((b) => b.Text)
    .join('\n');

  return text;
}

async function deleteFromS3(bucket, key) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log(`🧹 Deleted from S3: ${key}`);
  } catch (err) {
    console.warn(`⚠️ Failed to delete ${key}:`, err.message);
  }
}

export default async function handler(req, res) {
  try {
    await runMiddleware(req, res);
  } catch (err) {
    console.error('❌ Multer error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }

  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const { buffer, mimetype, originalname } = file;
  const ext = originalname.split('.').pop();
  const key = `uploads/${uuidv4()}.${ext}`;
  const bucket = process.env.S3_BUCKET;
  let text = '';

  try {
    // ✅ TEXT-BASED PDF
    if (mimetype === 'application/pdf' && buffer.length < 4 * 1024 * 1024) {
      const parsed = await pdfParse(buffer);
      if (parsed.text.trim().length > 0) {
        text = parsed.text;
      } else {
        // Fallback to Textract
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }));
        text = await extractWithTextract(bucket, key);
        await deleteFromS3(bucket, key);
      }
    }

    // ✅ WORD DOC
    else if (/\.(docx?|doc)$/i.test(originalname)) {
      text = (await mammoth.extractRawText({ buffer })).value;
    }

    // ✅ PLAIN TEXT
    else if (mimetype === 'text/plain') {
      text = buffer.toString('utf-8');
    }

    // ✅ IMAGE
    else if (mimetype.startsWith('image/')) {
      const {
        data: { text: imgText },
      } = await Tesseract.recognize(buffer, 'eng');
      text = imgText;
    }

    // ✅ LARGE OR SCANNED PDF
    else if (mimetype === 'application/pdf') {
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }));
      text = await extractWithTextract(bucket, key);
      await deleteFromS3(bucket, key);
    }

    else {
      return res.status(400).json({ success: false, error: 'Unsupported file type' });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'No text extracted' });
    }

    console.log('✅ Extracted text length:', text.length);
    return res.status(200).json({ success: true, text });
  } catch (e) {
    console.error('❌ Extraction error:', e);
    return res.status(500).json({ success: false, error: e.message || 'Extraction failed' });
  }
}
