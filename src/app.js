require("dotenv").config();
const s3Service = require("./services/s3Service");
const fs = require("fs-extra");

// self-invoking async function
(async () => {
    
    // upload txt file to s3
    // const fileName = "hello.txt";
    // const fileContent = "Hello, world!";
    // const filePath = `./${fileName}`;
    // await fs.writeFile(filePath, fileContent);
    // const signedUrl = await s3Service.uploadFile(filePath, fileName);
    // console.log("File uploaded to S3:", signedUrl);

    const key = "Online_Eye_Exam.mp4";
    const signedUrl = await s3Service.getFileUrl(key);
    console.log("File URL:", signedUrl);

})();
