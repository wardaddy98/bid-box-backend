import constants from '@/constants';
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import 'multer';
import { nanoid } from 'nanoid';
import createS3Client from './creates3Client';

const s3 = createS3Client();

export const uploadFile = async (objectKey: string, file: Express.Multer.File) => {
  return s3.send(
    new PutObjectCommand({
      Bucket: constants.AWS_S3_BUCKET_NAME,
      Key: objectKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );
};

export const generateSignedUrl = async (objectKey: string) => {
  const command = new GetObjectCommand({
    Bucket: constants.AWS_S3_BUCKET_NAME,
    Key: objectKey,
  });

  const signedUrl = await getSignedUrl(s3, command, {
    //15 mins
    expiresIn: 60 * 15,
  });

  return signedUrl;
};

export const handleMultipleUpload = async (
  files: Express.Multer.File[],
  type: 'products' | 'profile',
): Promise<string[]> => {
  const objectKeys: string[] = [];

  await Promise.all(
    files.map(file => {
      const objectKey = `${type}/${Date.now()}-${nanoid()}`;
      objectKeys.push(objectKey);

      return uploadFile(objectKey, file);
    }),
  );

  return objectKeys;
};

export const handleMultipleDelete = async (objectKeys: string[]) => {
  return s3.send(
    new DeleteObjectsCommand({
      Bucket: constants.AWS_S3_BUCKET_NAME,
      Delete: {
        Objects: objectKeys.map(Key => ({ Key })),
      },
    }),
  );
};

export const deleteFile = async (objectKey: string) => {
  return s3.send(
    new DeleteObjectCommand({
      Bucket: constants.AWS_S3_BUCKET_NAME,
      Key: objectKey,
    }),
  );
};

export const uploadGooglePictureToS3Bucket = async (pictureUrl: string): Promise<string> => {
  try {
    //download image
    const response = await fetch(pictureUrl);

    if (!response.ok) {
      return '';
    }

    //convert to buffer
    const imageBuffer = Buffer.from(await response.arrayBuffer());

    const objectKey = `profile/${Date.now()}-${nanoid()}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: constants.AWS_S3_BUCKET_NAME,
        Key: objectKey,
        Body: imageBuffer,
        ContentType: response.headers.get('content-type') ?? 'image/jpeg',
      }),
    );

    return objectKey;
  } catch (err) {
    return '';
  }
};
