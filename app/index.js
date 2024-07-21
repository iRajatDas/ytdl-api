const express = require("express");
const ytdl = require("@distube/ytdl-core");
const bodyParser = require("body-parser");
const { Queue } = require("bullmq");
const { createBullBoard } = require("@bull-board/api");
const { BullMQAdapter } = require("@bull-board/api/bullMQAdapter");
const { ExpressAdapter } = require("@bull-board/express");
require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

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
    // (Optional) http-cookie-agent / undici agent options
    // Below are examples, NOT the recommended options
    const agentOptions = {
      headers: {
        referer: "https://www.youtube.com/",
      },
    };

    // agent should be created once if you don't want to change your cookie
    const agent = ytdl.createAgent(cookies, agentOptions);

    const videoInfo = await ytdl.getInfo(url, { agent });
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
