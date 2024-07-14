// services/queueService.js
const { Queue, Worker } = require("bullmq");

class QueueService {
  constructor() {
    this.redisOptions = {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
    };
    this.queue = new Queue("download-queue", { connection: this.redisOptions });
    this.worker = new Worker(
      "download-queue",
      async (job) => {
        const { videoUrl } = job.data;
        // Delegate the job processing to the YouTube service
        const youtubeService = require("./youtubeService");
        return youtubeService.downloadAndUploadVideo(videoUrl);
      },
      { connection: this.redisOptions }
    );

    this.worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`Job ${job.id} failed with error ${err.message}`);
    });
  }

  async addDownloadJob(videoUrl) {
    return this.queue.add("download", { videoUrl });
  }

  async getJob(jobId) {
    return this.queue.getJob(jobId);
  }
}

module.exports = new QueueService();
