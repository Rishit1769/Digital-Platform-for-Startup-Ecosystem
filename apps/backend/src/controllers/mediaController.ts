import { Request, Response, NextFunction } from 'express';
import { DEFAULT_MINIO_BUCKET, minioClient } from '../services/minio';

const DEFAULT_PROXY_SOURCE_HOSTS = ['127.0.0.1', 'localhost', 'minio'];

function parseCsv(value?: string): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function getAllowedProxySourceHosts(): Set<string> {
  return new Set([
    ...DEFAULT_PROXY_SOURCE_HOSTS,
    (process.env.MINIO_ENDPOINT || '').trim().toLowerCase(),
    ...parseCsv(process.env.MEDIA_PROXY_SOURCE_HOSTS),
  ].filter(Boolean));
}

function parseStorageSource(sourceUrl: string): { bucket: string; objectName: string } | null {
  let parsed: URL;

  try {
    parsed = new URL(sourceUrl);
  } catch {
    return null;
  }

  if (!getAllowedProxySourceHosts().has(parsed.hostname.toLowerCase())) {
    return null;
  }

  const pathParts = parsed.pathname.split('/').filter(Boolean);
  if (pathParts.length < 2) {
    return null;
  }

  const [bucket, ...objectParts] = pathParts;
  return {
    bucket,
    objectName: decodeURIComponent(objectParts.join('/')),
  };
}

export const getMediaObject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requestedBucket = typeof req.query.bucket === 'string' ? req.query.bucket.trim() : '';
    const requestedObject = typeof req.query.object === 'string' ? req.query.object.trim() : '';
    const sourceUrl = typeof req.query.src === 'string' ? req.query.src.trim() : '';

    let bucket = requestedBucket;
    let objectName = requestedObject;

    if ((!bucket || !objectName) && sourceUrl) {
      const parsed = parseStorageSource(sourceUrl);

      if (!parsed) {
        res.status(400).json({ success: false, error: 'Unsupported media source URL.' });
        return;
      }

      bucket = parsed.bucket;
      objectName = parsed.objectName;
    }

    if (!bucket) {
      bucket = process.env.MINIO_BUCKET || DEFAULT_MINIO_BUCKET;
    }

    if (!objectName) {
      res.status(400).json({ success: false, error: 'Missing object name.' });
      return;
    }

    const stat = await minioClient.statObject(bucket, objectName);
    const objectStream = await minioClient.getObject(bucket, objectName);

    if (stat.metaData['content-type']) {
      res.setHeader('Content-Type', stat.metaData['content-type']);
    }
    if (stat.metaData['cache-control']) {
      res.setHeader('Cache-Control', stat.metaData['cache-control']);
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    if (typeof stat.size === 'number') {
      res.setHeader('Content-Length', String(stat.size));
    }
    if (stat.etag) {
      res.setHeader('ETag', stat.etag);
    }
    if (stat.lastModified) {
      res.setHeader('Last-Modified', stat.lastModified.toUTCString());
    }

    objectStream.on('error', next);
    objectStream.pipe(res);
  } catch (error: any) {
    if (error?.code === 'NoSuchKey' || error?.code === 'NotFound') {
      res.status(404).json({ success: false, error: 'Media file not found.' });
      return;
    }

    next(error);
  }
};
