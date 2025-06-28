const validateMedia = (type) => {
  var result = "";
  switch (type) {
    case "image/apng":
    case "image/avif":
    case "image/gif":
    case "image/jpeg":
    case "image/png":
    case "image/svg+xml":
    case "image/webp":
      result = "image";
      break;
    case "video/x-flv":
    case "video/mp4":
    case "application/x-mpegURL":
    case "video/MP2T":
    case "video/3gpp":
    case "video/quicktime":
    case "video/x-msvideo":
    case "video/x-ms-wmv":
      result = "video";
      break;
    default:
      result = "invalid";
      break;
  }
  return result;
};
module.exports = {
  validateMedia,
};
