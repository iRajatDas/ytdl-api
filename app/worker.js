const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { Worker, Queue } = require("bullmq");
const ytdl = require("@distube/ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const S3Service = require("./s3");
const fs = require("fs-extra");
const cookies = [
  {
    domain: ".youtube.com",
    expirationDate: 1734699047.425723,
    hostOnly: false,
    httpOnly: true,
    name: "VISITOR_PRIVACY_METADATA",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: null,
    value: "CgJJThIEGgAgFQ%3D%3D",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.988344,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-3PSID",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: null,
    value:
      "g.a000lAiRYLcUFLl1n_vbSYs-s5uA379kVmZJxHYwq2PM-p07Goh3ktmeBHzicFxLrrY1jCdjlwACgYKARcSARYSFQHGX2MiNb2Mx4Pr-cG_Ivo65bMH5hoVAUF8yKp3jkY9Jv3ItdkQSld95BFt0076",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753099072.203414,
    hostOnly: false,
    httpOnly: false,
    name: "SIDCC",
    path: "/",
    sameSite: null,
    secure: false,
    session: false,
    storeId: null,
    value:
      "AKEyXzVeovZmi0iygdiNNgCZBGpCOtZ9R-fUcmrVSRPMrQU2WxrHSqKVxaWJFOVDStW-oPFsuPM",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.988103,
    hostOnly: false,
    httpOnly: false,
    name: "SID",
    path: "/",
    sameSite: null,
    secure: false,
    session: false,
    storeId: null,
    value:
      "g.a000lAiRYLcUFLl1n_vbSYs-s5uA379kVmZJxHYwq2PM-p07Goh3y8nsdlb_JaqkHthkxMnbwAACgYKAQISARYSFQHGX2Mi2vUgMvRqJypXXNzjnbJ_uhoVAUF8yKqAbwAcc_-I0WocMh6heEHt0076",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753098906.306531,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-1PSIDTS",
    path: "/",
    sameSite: null,
    secure: true,
    session: false,
    storeId: null,
    value:
      "sidts-CjEB4E2dkcYM_plcHBj5Odp2bAiEbylHSnLtdOLcc6vgQOh1jAq9OSyOH6L_GLkJyW2TEAA",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.987618,
    hostOnly: false,
    httpOnly: false,
    name: "SAPISID",
    path: "/",
    sameSite: null,
    secure: true,
    session: false,
    storeId: null,
    value: "M1Lxb6wlz_oBu8mO/Ao5xpgrvY1S8-KIsT",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753099072.203546,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-1PSIDCC",
    path: "/",
    sameSite: null,
    secure: true,
    session: false,
    storeId: null,
    value:
      "AKEyXzW0R3j84NqXUjz2h4f3X0UP4loVzBj3k_QBunt4U7TvPIqXw46303UA9MO4zDxporquGsM",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.98744,
    hostOnly: false,
    httpOnly: true,
    name: "SSID",
    path: "/",
    sameSite: null,
    secure: true,
    session: false,
    storeId: null,
    value: "A84rc3yLtVTFVbKSW",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753119987,
    hostOnly: false,
    httpOnly: false,
    name: "wide",
    path: "/",
    sameSite: null,
    secure: false,
    session: false,
    storeId: null,
    value: "1",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.987718,
    hostOnly: false,
    httpOnly: false,
    name: "__Secure-1PAPISID",
    path: "/",
    sameSite: null,
    secure: true,
    session: false,
    storeId: null,
    value: "M1Lxb6wlz_oBu8mO/Ao5xpgrvY1S8-KIsT",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.988277,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-1PSID",
    path: "/",
    sameSite: null,
    secure: true,
    session: false,
    storeId: null,
    value:
      "g.a000lAiRYLcUFLl1n_vbSYs-s5uA379kVmZJxHYwq2PM-p07Goh3o_9JmjGGrq8lBBZf5b-c-gACgYKAb0SARYSFQHGX2MiF1ROLmavW09Vr6BkJXlqoRoVAUF8yKqpSu2LueIn6aQb-EdLT4qe0076",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.987783,
    hostOnly: false,
    httpOnly: false,
    name: "__Secure-3PAPISID",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: null,
    value: "M1Lxb6wlz_oBu8mO/Ao5xpgrvY1S8-KIsT",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753099072.203611,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-3PSIDCC",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: null,
    value:
      "AKEyXzWHJRs7uh7lphIjlAP2rOlN6M829zbFctsMnvFRJZ19lqSGzcrV4_HWNFyK0WmHwHvdIc0",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753098906.306734,
    hostOnly: false,
    httpOnly: true,
    name: "__Secure-3PSIDTS",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: null,
    value:
      "sidts-CjEB4E2dkcYM_plcHBj5Odp2bAiEbylHSnLtdOLcc6vgQOh1jAq9OSyOH6L_GLkJyW2TEAA",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1732181052.322853,
    hostOnly: false,
    httpOnly: false,
    name: "_ga",
    path: "/",
    sameSite: null,
    secure: false,
    session: false,
    storeId: null,
    value: "GA1.1.1790027701.1697620831",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1732181052.342756,
    hostOnly: false,
    httpOnly: false,
    name: "_ga_VCGEPY40VB",
    path: "/",
    sameSite: null,
    secure: false,
    session: false,
    storeId: null,
    value: "GS1.1.1697620831.1.1.1697621052.0.0.0",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.9875,
    hostOnly: false,
    httpOnly: false,
    name: "APISID",
    path: "/",
    sameSite: null,
    secure: false,
    session: false,
    storeId: null,
    value: "iiwZ67wEWBtL2law/A4ujmP22CU4hRC_KQ",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1753843246.987296,
    hostOnly: false,
    httpOnly: true,
    name: "HSID",
    path: "/",
    sameSite: null,
    secure: false,
    session: false,
    storeId: null,
    value: "AMg8iawsbtS2k1mSN",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1747373578.653288,
    hostOnly: false,
    httpOnly: true,
    name: "LOGIN_INFO",
    path: "/",
    sameSite: "no_restriction",
    secure: true,
    session: false,
    storeId: null,
    value:
      "AFmmF2swRQIhAN3FryU-BMwWaJTqVWkdvvR9vj8wi2-vzQapNCAPk5mWAiA0DuK68j5YHyrk179E7R2iNQo8mLKOevd2ziHZvybvYQ:QUQ3MjNmd1dkMW95TWpzek5Ga1pHMkJhREN3OVJsQlZjY2xRdEhHcE5jT1owQWF0UWU2OTQ5OHMzZGt4ZGc3dU1vcDUtcm5Rblducm85ZWlremtVSjF1b0RUSUtxbE5vUmdURVB3cG9oLXJack44MkZBQW5pSWNxRUNyaEh0dW5DNTNkenZuM3g1cjNzbk5MRkZuVVlOemVuSmhGeWJSVDh3",
  },
  {
    domain: ".youtube.com",
    expirationDate: 1756123075.024899,
    hostOnly: false,
    httpOnly: false,
    name: "PREF",
    path: "/",
    sameSite: null,
    secure: true,
    session: false,
    storeId: null,
    value:
      "f6=40000400&f7=4150&tz=Asia.Calcutta&f4=4000000&repeat=NONE&volume=27&autoplay=true",
  },
];

// (Optional) http-cookie-agent / undici agent options
// Below are examples, NOT the recommended options
const agentOptions = {
  headers: {
    referer: "https://www.youtube.com/",
  },
};

// agent should be created once if you don't want to change your cookie
const agent = ytdl.createAgent(cookies, agentOptions);

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
        const audioStream = ytdl(url, { filter: "audioonly", agent });
        const videoStream = ytdl(url, { quality: FORMATS[format], agent });

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
