// services/s3Service.js
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require("fs-extra");
const progressEmitter = require("../utils/progressEmitter");

class S3Service {
  constructor() {
    this.S3_BUCKET = "digitalocean";
    this.S3 = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(file, key) {
    console.log(`Uploading file: ${file} with key: ${key}`);
    progressEmitter.emit("progress", {
      stage: "upload-start",
      message: `Uploading file: ${file} with key: ${key}`,
    });
    const params = {
      Bucket: this.S3_BUCKET,
      Key: key,
      Body: fs.createReadStream(file),
    };
    await this.S3.send(new PutObjectCommand(params));
    console.log(`File uploaded successfully to ${this.S3_BUCKET}/${key}`);
    progressEmitter.emit("progress", {
      stage: "upload-complete",
      message: `File uploaded successfully to ${this.S3_BUCKET}/${key}`,
    });

    const signedUrl = await getSignedUrl(
      this.S3,
      new GetObjectCommand({
        Bucket: this.S3_BUCKET,
        Key: key,
      }),
      {
        expiresIn: 3600,
      }
    );

    console.log(`Generated signed URL: ${signedUrl}`);
    progressEmitter.emit("progress", {
      stage: "signed-url",
      message: `Generated signed URL`,
      url: signedUrl,
    });

    return { signedUrl, key };
  }

  async getStorageUsage() {
    const command = new ListObjectsCommand({ Bucket: this.S3_BUCKET });
    const response = await this.S3.send(command);
    return response.Contents.reduce((total, obj) => total + obj.Size, 0);
  }

  async getFileUrl(key) {
    // check if file exists
    const command = new ListObjectsCommand({ Bucket: this.S3_BUCKET });
    const response = await this.S3.send(command);
    const fileExists = response.Contents.some((obj) => obj.Key === key);

    if (!fileExists) {
      // console log all keys in the bucket
      console.log("Files in bucket:");
      response.Contents.forEach((obj) => console.log(obj.Key));

      throw new Error(`File ${key} not found in bucket ${this.S3_BUCKET}`);
    }

    const signedUrl = await getSignedUrl(
      this.S3,
      new GetObjectCommand({
        Bucket: this.S3_BUCKET,
        Key: key,
      }),
      {
        expiresIn: 3600,
      }
    );
    return signedUrl;
  }

  async deleteFile(key) {
    const params = {
      Bucket: this.S3_BUCKET,
      Key: key,
    };
    await this.S3.send(new DeleteObjectCommand(params));
  }

  async listFiles() {
    const command = new ListObjectsCommand({ Bucket: this.S3_BUCKET });
    const response = await this.S3.send(command);
    return response.Contents.map((obj) => ({
      name: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
    }));
  }
}

module.exports = new S3Service();
