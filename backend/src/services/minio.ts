import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

export const initializeMinio = async () => {
  const bucketName = process.env.MINIO_BUCKET || 'cloudcampus-bucket';
  
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket ${bucketName} created successfully in default region.`);
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }
  } catch (err) {
    console.error('Error initializing MinIO:', err);
    process.exit(1);
  }
};

export const buildObjectUrl = (bucketName: string, objectName: string): string => {
  const cdnBase = process.env.MINIO_CDN_BASE_URL;
  const publicBase = process.env.MINIO_PUBLIC_BASE_URL;

  if (cdnBase && cdnBase.trim()) {
    const base = cdnBase.replace(/\/$/, '');
    return `${base}/${encodeURI(objectName)}`;
  }

  if (publicBase && publicBase.trim()) {
    const base = publicBase.replace(/\/$/, '');
    return `${base}/${bucketName}/${encodeURI(objectName)}`;
  }

  const endpoint = process.env.MINIO_ENDPOINT || '127.0.0.1';
  const port = process.env.MINIO_PORT || '9000';
  return `http://${endpoint}:${port}/${bucketName}/${encodeURI(objectName)}`;
};
