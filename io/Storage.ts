import {FileStorage} from '@flystorage/file-storage';
import {AwsS3StorageAdapter} from '@flystorage/aws-s3';
import {S3Client} from '@aws-sdk/client-s3';

const client = new S3Client({
    endpoint: process.env.AWS_ENDPOINT,
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
});

const adapter = new AwsS3StorageAdapter(client, {
    bucket: process.env.S3_BUCKET!,
    prefix: process.env.S3_PREFIX,
    publicUrlOptions: {
        baseUrl: process.env.AWS_URL
    }
});

export const storage = new FileStorage(adapter);