const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const { requireCronAuthentication } = require("../middlewares/auth");
const { directImportController } = require("../controllers");
const validate = require("../middlewares/validate");
const { compaignValidation } = require("../validations");
const router = express.Router();
const { csvOrExcelUpload, fileUploadIntoS3 } = require("../utils/fileUpload");

router
  .route("/")
  .post(
    requireSignin,
    // [csvOrExcelUpload.single("file")],
    csvOrExcelUpload.fields([
      { name: "file", maxCount: 1 },
      { name: "originalFile", maxCount: 1 },
    ]),
    // [fileUploadIntoS3.single("file")],
    directImportController.readAndWriteFile
  )
  .get(requireSignin, directImportController.getAllFileData);
router
  .route("/:fileId")
  .delete(requireSignin, directImportController.deleteFileById);
router
  .route("/download/csv/:id")
  .get(requireSignin, directImportController.downloadCSVFile);
// router.route("/update/csv/:id").patch(directImportController.updateCSVFile);
router.route("/update/csv/:id").patch((req, res) => {
  directImportController.updateCSVFile(req, res, global.redisPublisher);
});
router
  .route("/assign/campaign/:id")
  .patch(
    requireSignin,
    validate(compaignValidation.assginCampaign),
    directImportController.assignCampaignToDirectImport
  );

router
  .route("/delete/campaign/:id")
  .delete(directImportController.deleteCampaignToDirectImport);
router
  .route("/download/filter/prospect/:directImportId")
  .get(directImportController.downloadFilterProspect);

router
  .route("/cron/stats")
  .get(requireCronAuthentication, directImportController.directImportStatsCron);
router.route("/check/phone/type").get(directImportController.checkPhoneType);

router
  .route("/mobile/verification")
  .post(
    requireSignin,
    [csvOrExcelUpload.single("file")],
    directImportController.insertMobileVerificationData
  );

module.exports = router;
