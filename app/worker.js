const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { Worker, Queue } = require("bullmq");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const S3Service = require("./s3");
const fs = require("fs-extra");

const QUEUE_NAME = "downloads";
const CONCURRENCY = 100;
const MAX_RETRIES = 3;

const downloadQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: MAX_RETRIES,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
  removeOnComplete: {
    age: 3600, // keep up to 1 hour
    count: 1000, // keep up to 1000 jobs
  },
  removeOnFail: {
    age: 24 * 3600, // keep up to 24 hours
  },
});

const PROGRESS_PHASES = {
  DOWNLOAD: { START: 0, END: 50 },
  MERGE: { START: 50, END: 75 },
  UPLOAD: { START: 75, END: 100 },
};

const FORMATS = {
  mp3: "mp3",
  m4a: "m4a",
  webm: "webm",
  aac: "aac",
  flac: "flac",
  opus: "opus",
  ogg: "ogg",
  vorbis: "vorbis",
  wav: "wav",
  360: "18", // '18' is for 360p video
  480: "135", // '135' is for 480p video
  720: "136", // '136' is for 720p video
  1080: "137", // '137' is for 1080p video
  1440: "271", // '271' is for 1440p video
};

const getOutputPath = (jobId, title, extension) =>
  path.join(__dirname, "downloads", `${title}-${jobId}.${extension}`);

const mergeAudioVideo = async (audioPath, videoPath, outputPath, job) => {
  return new Promise((resolve, reject) => {
    console.log("Merging audio and video...");
    ffmpeg()
      .addInput(videoPath)
      .addInput(audioPath)
      .outputOptions("-c:v copy") // Copy video codec (avoid re-encoding)
      .outputOptions("-c:a aac") // Ensure audio is encoded as AAC
      .outputOptions("-strict experimental") // Enable experimental features if needed
      .on("start", (cmdline) => {
        console.log("FFmpeg command:", cmdline); // For debugging
        job.updateData({
          ...job.data,
          state: "merging",
        });
      })
      .on("progress", (progress) => {
        const percent = progress.percent;
        job.updateProgress(
          PROGRESS_PHASES.MERGE.START +
            (percent / 100) *
              (PROGRESS_PHASES.MERGE.END - PROGRESS_PHASES.MERGE.START)
        ); // Update job progress (50-75%)
      })
      .on("error", (err) => {
        console.error("Error during processing:", err);
        reject(err);
      })
      .on("end", () => {
        console.log("Merging completed successfully");
        resolve();
      })
      .save(outputPath);
  });
};

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { format, url, title } = job.data;
    const extension = format in FORMATS ? "mp4" : format; // Use 'mp4' for video formats
    const jobId = job.id;
    const outputPath = getOutputPath(jobId, title, extension);
    const audioPath = getOutputPath(jobId, `${title}-audio`, "webm");
    const videoPath = getOutputPath(jobId, `${title}-video`, "mp4");

    try {
      await fs.ensureDir(path.dirname(outputPath));

      job.updateData({ ...job.data, state: "downloading" });

      if (["360", "480", "720", "1080", "1440"].includes(format)) {
        const audioStream = ytdl(url, { filter: "audioonly" });
        const videoStream = ytdl(url, { quality: FORMATS[format] });

        let audioDownloaded = 0;
        let videoDownloaded = 0;

        audioStream.on("progress", (_, downloaded, total) => {
          audioDownloaded =
            (downloaded / total) * (PROGRESS_PHASES.DOWNLOAD.END / 2);
          job.updateProgress(
            Math.min(
              PROGRESS_PHASES.DOWNLOAD.END,
              audioDownloaded + videoDownloaded
            )
          );
        });

        videoStream.on("progress", (_, downloaded, total) => {
          videoDownloaded =
            (downloaded / total) * (PROGRESS_PHASES.DOWNLOAD.END / 2);
          job.updateProgress(
            Math.min(
              PROGRESS_PHASES.DOWNLOAD.END,
              audioDownloaded + videoDownloaded
            )
          );
        });

        await Promise.all([
          new Promise((resolve, reject) => {
            ffmpeg(audioStream)
              .on("error", reject)
              .on("end", resolve)
              .save(audioPath);
          }),
          new Promise((resolve, reject) => {
            ffmpeg(videoStream)
              .on("error", reject)
              .on("end", resolve)
              .save(videoPath);
          }),
        ]);

        await mergeAudioVideo(audioPath, videoPath, outputPath, job);
        await fs.remove(audioPath);
        await fs.remove(videoPath);
      } else {
        const stream = ytdl(url, { quality: "highestaudio" });

        stream.on("progress", (_, downloaded, total) => {
          const percent = (downloaded / total) * PROGRESS_PHASES.DOWNLOAD.END;
          job.updateProgress(percent); // Update job progress (0-50%)
        });

        await new Promise((resolve, reject) => {
          ffmpeg(stream)
            .toFormat(format)
            .on("progress", (progress) => {
              const percent = progress.percent;
              job.updateProgress(
                PROGRESS_PHASES.MERGE.START +
                  (percent / 100) *
                    (PROGRESS_PHASES.MERGE.END - PROGRESS_PHASES.MERGE.START)
              ); // Update job progress (50-75%)
            })
            .on("error", reject)
            .on("end", resolve)
            .save(outputPath);
        });
      }

      // Upload the file
      job.updateData({ ...job.data, state: "uploading" });
      job.updateProgress(PROGRESS_PHASES.UPLOAD.START); // Mark the start of the upload phase
      const { signedUrl, key } = await S3Service.uploadFile(
        outputPath,
        `${title}-${jobId}.${extension}`
      );
      job.updateProgress(PROGRESS_PHASES.UPLOAD.END); // Mark the end of the upload phase
      await fs.remove(outputPath);
      job.updateData({ ...job.data, state: "ready" });

      return { signedUrl, key };
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      if (job.attemptsMade < MAX_RETRIES) {
        await job.moveToFailed({ message: error.message }, true); // Move job to failed state
        console.log(
          `Retrying job ${job.id}. Attempt ${job.attemptsMade + 1} of ${
            MAX_RETRIES + 1
          }`
        );
      } else {
        console.error(`Job ${job.id} failed after ${MAX_RETRIES + 1} attempts`);
        throw error;
      }
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    },
    concurrency: CONCURRENCY,
    limiter: {
      max: 1000,
      duration: 5000,
    },
  }
);

worker.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed. SignedUrl: ${result.signedUrl}`);
});

worker.on("failed", (job, error) => {
  console.error(`Job ${job.id} failed after all retries:`, error);
});

worker.on("stalled", async (jobId) => {
  console.log(`Job ${jobId} stalled. Retrying...`);
  const job = await downloadQueue.getJob(jobId);
  if (job) {
    await job.retry();
  } else {
    console.error(`Job ${jobId} not found for retrying.`);
  }
});

process.on("SIGTERM", async () => {
  await worker.close();
  await downloadQueue.close();
});
