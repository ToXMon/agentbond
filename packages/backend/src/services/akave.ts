import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';

const AKAVE_ENDPOINT = process.env.AKAVE_ENDPOINT || '';
const AKAVE_ACCESS_KEY = process.env.AKAVE_ACCESS_KEY || '';
const AKAVE_SECRET_KEY = process.env.AKAVE_SECRET_KEY || '';
const AKAVE_BUCKET = process.env.AKAVE_BUCKET || 'agentbond-main';

export class AkaveService {
  private client: S3Client | null = null;
  private bucket: string;
  private available = false;

  constructor() {
    this.bucket = AKAVE_BUCKET;

    if (AKAVE_ENDPOINT && AKAVE_ACCESS_KEY && AKAVE_SECRET_KEY) {
      this.client = new S3Client({
        endpoint: AKAVE_ENDPOINT,
        region: 'us-east-1',
        credentials: {
          accessKeyId: AKAVE_ACCESS_KEY,
          secretAccessKey: AKAVE_SECRET_KEY,
        },
        forcePathStyle: true,
      });
    }
  }

  async init(): Promise<void> {
    if (!this.client) {
      console.log('⚠️  Akave not configured — using local file storage');
      return;
    }

    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.available = true;
      console.log(`✅ Akave connected — bucket: ${this.bucket}`);
    } catch (err: any) {
      if (err?.name === 'NoSuchBucket' || err?.$metadata?.httpStatusCode === 404) {
        try {
          await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
          this.available = true;
          console.log(`✅ Akave bucket created: ${this.bucket}`);
        } catch (createErr) {
          console.warn('⚠️  Akave bucket creation failed — using local file storage:', createErr);
        }
      } else {
        console.warn('⚠️  Akave connection failed — using local file storage:', err?.message ?? err);
      }
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async getObject(key: string): Promise<string | null> {
    if (!this.client || !this.available) return null;

    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key })
      );
      return await response.Body?.transformToString() ?? null;
    } catch (err: any) {
      if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async putObject(key: string, body: string, contentType = 'application/json'): Promise<void> {
    if (!this.client || !this.available) return;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
  }

  async deleteObject(key: string): Promise<void> {
    if (!this.client || !this.available) return;

    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }

  async listObjects(prefix: string): Promise<string[]> {
    if (!this.client || !this.available) return [];

    const response = await this.client.send(
      new ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix })
    );

    return (response.Contents ?? []).map((obj) => obj.Key).filter((key): key is string => key !== undefined && key !== null);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await this.getObject(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async putJSON(key: string, data: unknown): Promise<void> {
    await this.putObject(key, JSON.stringify(data, null, 2));
  }
}

export const akave = new AkaveService();
