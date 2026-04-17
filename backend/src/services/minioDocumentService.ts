import { PDFParse } from 'pdf-parse';
import { minioClient } from './minio';

const streamToBuffer = async (stream: NodeJS.ReadableStream): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream as any) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

export const getMinioObjectBuffer = async (bucketName: string, objectName: string): Promise<Buffer> => {
  const objectStream = await minioClient.getObject(bucketName, objectName);
  return streamToBuffer(objectStream);
};

export const extractPdfTextFromMinio = async (bucketName: string, objectName: string): Promise<string> => {
  const pdfBuffer = await getMinioObjectBuffer(bucketName, objectName);
  const parser = new PDFParse({ data: pdfBuffer });
  try {
    const result = await parser.getText();
    return (result?.text || '').trim();
  } finally {
    await parser.destroy();
  }
};
