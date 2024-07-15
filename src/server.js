// server.js
const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const s3Service = require("./services/s3Service");
const queueService = require("./services/queueService");
const cleanupService = require("./services/cleanupService");

const app = express();
const port = process.env.PORT || 3000;

const MAX_STORAGE_GB = 50;

app.use(express.json());

app.post("/download", async (req, res) => {
  const { videoUrl, quality } = req.body;

  if (!videoUrl) {
    return res.status(400).json({ error: "Video URL is required" });
  }

  if (!quality) {
    return res.status(400).json({ error: "Video quality is required" });
  }

  try {
    const currentUsage = await s3Service.getStorageUsage();
    const availableStorage = MAX_STORAGE_GB * 1024 * 1024 * 1024 - currentUsage;

    if (availableStorage < 1024 * 1024 * 1024) {
      return res.status(507).json({ error: "Insufficient storage space" });
    }

    const job = await queueService.addDownloadJob(videoUrl, quality);
    res.json({ message: "Download queued", jobId: job.id });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while queueing the download" });
  }
});

app.get("/download/:jobId", async (req, res) => {
  const { jobId } = req.params;
  const job = await queueService.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const state = await job.getState();
  const result = job.returnvalue;

  res.json({ jobId, state, result });
});

app.get("/videos", async (req, res) => {
  try {
    const videos = await s3Service.listFiles();
    res.json(videos);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred while listing videos" });
  }
});

app.delete("/videos/:key", async (req, res) => {
  const { key } = req.params;
  try {
    await s3Service.deleteFile(key);
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred while deleting the video" });
  }
});

setInterval(() => {
  cleanupService.cleanupStaleData();
}, 24 * 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
