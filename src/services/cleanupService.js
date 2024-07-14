// services/cleanupService.js
const s3Service = require("./s3Service");

class CleanupService {
  constructor() {
    this.STALE_THRESHOLD_DAYS = 30;
  }

  async cleanupStaleData() {
    try {
      const files = await s3Service.listFiles();
      const now = new Date();

      for (const file of files) {
        const ageInDays =
          (now - new Date(file.lastModified)) / (1000 * 60 * 60 * 24);
        if (ageInDays > this.STALE_THRESHOLD_DAYS) {
          await s3Service.deleteFile(file.name);
          console.log(`Deleted stale file: ${file.name}`);
        }
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }
}

module.exports = new CleanupService();
