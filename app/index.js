const express = require("express");
const ytdl = require("@distube/ytdl-core");
const bodyParser = require("body-parser");
const { Queue } = require("bullmq");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const app = express();
app.use(bodyParser.json());

const QUEUE_NAME = "downloads";
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

const downloadQueue = new Queue(QUEUE_NAME, {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(downloadQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.get("/download", async (req, res) => {
  const { format, url, api } = req.query;

  if (!format || !url || !api) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required parameters" });
  }

  if (
    ![
      "mp3",
      "m4a",
      "webm",
      "aac",
      "flac",
      "opus",
      "ogg",
      "vorbis",
      "wav",
      "360",
      "480",
      "720",
      "1080",
      "1440",
    ].includes(format)
  ) {
    return res.status(400).json({ success: false, message: "Invalid format" });
  }

  try {
    const videoInfo = await ytdl.getInfo(url);
    const title = videoInfo.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_"); // sanitize title

    const job = await downloadQueue.add("download", {
      format,
      url,
      title,
      api,
    });

    res.json({ success: true, id: job.id, title });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/progress", async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required parameters" });
  }

  try {
    const job = await downloadQueue.getJob(id);

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const state = await job.getState();
    const text = job.data.state || state;
    const progress = job.progress || 0;
    const isCompleted = state === "completed";
    const result = isCompleted ? await job.returnvalue : null;

    res.json({
      success: true,
      progress,
      download_url: result,
      state,
      text,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
  console.log("Bull Board is running on http://localhost:3000/admin/queues");
});
