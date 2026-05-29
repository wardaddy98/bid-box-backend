import constants from '@/constants';
import { S3Client } from '@aws-sdk/client-s3';

const { AWS_ACCESS_KEY_ID, AWS_ACCESS_KEY_SECRET, AWS_S3_BUCKET_REGION } = constants;

const createS3Client = () => {
  return new S3Client({
    region: AWS_S3_BUCKET_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_ACCESS_KEY_SECRET,
    },
  });
};

export default createS3Client;
