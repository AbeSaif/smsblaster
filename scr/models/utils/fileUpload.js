const multer = require("multer");
const path = require("path");
const AWS = require("aws-sdk");

const awsConfiguration = {
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: 'eu-north-1', // Correct region format
  signatureVersion: 'v4', // Explicitly set signature version
  endpoint: "http://launch.server.s3.amazonaws.com/",
};

const S3 = new AWS.S3(awsConfiguration);

const uploadToS3 = (fileData, fileName) => {
  return new Promise((resolve, reject) => {
    let contentType = "";
    if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
      contentType = "image/jpeg";
    } else if (fileName.endsWith(".png")) {
      contentType = "image/png";
    } else if (fileName.endsWith(".gif")) {
      contentType = "image/gif";
    } else if (fileName.endsWith(".csv")) {
      contentType = "text/csv";
    }
    const params = {
      Bucket: process.env.imageBucketName,
      Key: fileName,
      Body: fileData,
      ContentType: contentType,
    };
    S3.upload(params, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
};

const fileUploadIntoS3 = multer({});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/");
  },

  // By default, multer removes file extensions so let's add them back
  filename: (req, file, cb) => {
    // eslint-disable-next-line prefer-template
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const imageFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/PNG" ||
    file.mimetype === "image/JPG" ||
    file.mimetype === "image/JPEG"
  ) {
    cb(null, true);
  } else {
    return cb(new Error("Only image allowed"), false);
  }
};

const csvorExcelFilter = function (req, file, cb) {
  // Accept video files only
  if (!file.originalname.match(/\.(csv|xls|xlsx)$/)) {
    req.fileValidationError = "Only csv, xls, and xlsx files are allowed!";
    return cb(new Error("Only csv, xls, and xlsx files are allowed!"), false);
}
  cb(null, true);
};
const fileUpload = multer({ storage, fileFilter: imageFilter });
const csvOrExcelUpload = multer({ storage, fileFilter: csvorExcelFilter });

module.exports = {
  fileUpload,
  csvOrExcelUpload,
  fileUploadIntoS3,
  uploadToS3,
};
