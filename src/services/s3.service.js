const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const env = require('../config/env');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const s3Service = {
  async uploadFile(file) {
    const ext = path.extname(file.originalname);
    const key = `uploads/${Date.now()}-${uuidv4()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: env.aws.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(command);

    const url = `https://${env.aws.bucketName}.s3.${env.aws.region}.amazonaws.com/${key}`;
    return { key, url };
  },

  async deleteFile(key) {
    const command = new DeleteObjectCommand({
      Bucket: env.aws.bucketName,
      Key: key,
    });
    await s3Client.send(command);
  },
};

module.exports = s3Service;
