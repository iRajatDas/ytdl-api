// services/youtubeService.js
const youtubedl = require("youtube-dl-exec");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const s3Service = require("./s3Service");

class YouTubeService {
  async downloadAndUploadVideo(videoUrl) {
    let tempDir;

    try {
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "youtube-dl-"));
      console.log(`Created temporary directory: ${tempDir}`);

      const output = await youtubedl(videoUrl, {
        format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4",
        output: path.join(tempDir, "%(title)s.%(ext)s"),
        mergeOutputFormat: "mp4",
        restrictFilenames: true,
      });

      console.log("youtube-dl output:", output);

      const files = await fs.readdir(tempDir);
      console.log(`Files in temporary directory: ${files.join(", ")}`);

      const videoFile = files.find((file) => file.endsWith(".mp4"));
      if (!videoFile) {
        throw new Error("No .mp4 file found in the output directory");
      }

      const fullPath = path.join(tempDir, videoFile);
      console.log(`Full path of video file: ${fullPath}`);

      if (!(await fs.pathExists(fullPath))) {
        throw new Error(`Video file does not exist at path: ${fullPath}`);
      }

      console.log(`Uploading file to S3 with key: ${videoFile}`);
      const signedUrl = await s3Service.uploadFile(fullPath, videoFile);
      console.log("Video uploaded to S3:", signedUrl);

      return { fileName: videoFile, url: signedUrl };
    } catch (error) {
      console.error("Download error:", error);
      throw error;
    } finally {
      if (tempDir) {
        try {
          await fs.remove(tempDir);
          console.log(`Removed temporary directory: ${tempDir}`);
        } catch (cleanupError) {
          console.error("Error cleaning up temporary directory:", cleanupError);
        }
      }
    }
  }
}

module.exports = new YouTubeService();
