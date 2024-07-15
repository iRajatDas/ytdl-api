const youtubedl = require("youtube-dl-exec");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const s3Service = require("./s3Service");
const progressEmitter = require("../utils/progressEmitter");

class YouTubeService {
  async downloadAndUploadVideo(videoUrl, quality = "best") {
    let tempDir;

    try {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "youtube-dl-"));
      this._emitProgress("init", `Created temporary directory: ${tempDir}`);

      const format = this.getFormatForQuality(quality);

      console.log(
        `Downloading video with URL: ${videoUrl} at quality: ${quality}`
      );
      const output = await youtubedl(videoUrl, {
        format: `${format}[ext=mp4]+bestaudio[ext=m4a]/mp4`,
        output: path.join(tempDir, `%(title)s_${quality}.%(ext)s`), // Adjusted output filename
        mergeOutputFormat: "mp4",
        restrictFilenames: true,
      });

      console.log("youtube-dl output:", output);
      this._emitProgress("download", "Download completed");

      const files = await fs.readdir(tempDir);
      this._emitProgress(
        "merge",
        `Files in temporary directory: ${files.join(", ")}`
      );

      const videoFile = files.find((file) => file.endsWith(".mp4"));
      if (!videoFile) {
        throw new Error("No .mp4 file found in the output directory");
      }

      const fullPath = path.join(tempDir, videoFile);
      this._emitProgress("file-check", `Full path of video file: ${fullPath}`);

      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`Video file does not exist at path: ${fullPath}`);
      }

      console.log(`Uploading file to S3 with key: ${videoFile}`);
      this._emitProgress(
        "upload",
        `Uploading file to S3 with key: ${videoFile}`
      );
      const { signedUrl, key } = await s3Service.uploadFile(
        fullPath,
        videoFile
      );
      this._emitProgress("upload", "Upload completed", { url: signedUrl });

      console.log("Verifying file in S3...");
      const s3Files = await s3Service.listFiles();
      const uploadedFile = s3Files.find((file) => file.name === key);
      if (!uploadedFile) {
        throw new Error("File not found in S3 after upload");
      }
      console.log("File verified in S3:", uploadedFile);
      this._emitProgress("verify", "File verified in S3");

      return { fileName: videoFile, url: signedUrl };
    } catch (error) {
      console.error("Download error:", error);
      this._emitProgress("error", error.message);
      throw error;
    } finally {
      if (tempDir) {
        try {
          await fs.remove(tempDir);
          console.log(`Removed temporary directory: ${tempDir}`);
          this._emitProgress(
            "cleanup",
            `Removed temporary directory: ${tempDir}`
          );
        } catch (cleanupError) {
          console.error("Error cleaning up temporary directory:", cleanupError);
          this._emitProgress("cleanup-error", cleanupError.message);
        }
      }
    }
  }

  getFormatForQuality(quality) {
    const qualityFormats = {
      "144p": "worst[height<=144]",
      "240p": "worst[height<=240]",
      "360p": "worst[height<=360]",
      "480p": "worst[height<=480]",
      "720p": "best[height<=720]",
      "1080p": "best[height<=1080]",
      "1440p": "best[height<=1440]",
      "2160p": "best[height<=2160]",
      best: "bestvideo",
    };

    return qualityFormats[quality] || "bestvideo";
  }

  _emitProgress(stage, message, data = {}) {
    console.log(message);
    progressEmitter.emit("progress", { stage, message, ...data });
  }
}

module.exports = new YouTubeService();
