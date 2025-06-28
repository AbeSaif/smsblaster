const express = require("express");
const { requireCronAuthentication } = require("../middlewares/auth");
const { batchCronController } = require("../controllers");
const router = express.Router();

router
  .route("/get/all/previous/day/batches")
  .get(requireCronAuthentication, batchCronController.getAllPreviousDayBatches);
router
  .route("/get/all/fourty/eight/hour/previous/batches")
  .get(
    requireCronAuthentication,
    batchCronController.getAllFourtyEightHourPreviousBatches
  );
router
  .route("/send/auto/reminder")
  .get(requireCronAuthentication, (req, res) => {
    batchCronController.sendAutoReminder(
      req,
      res,
      global.io,
      global.userSocketMap,
      global.redisPublisher
    );
  });
router
  .route("/reset/auto/template")
  .get(requireCronAuthentication, batchCronController.resetAutoTemplate);
router
  .route("/set/campaign/stats")
  .get(requireCronAuthentication, batchCronController.setCampaignStats);

router
  .route("/update/verified/unVerified/field")
  .get(
    requireCronAuthentication,
    batchCronController.updateVerifiedUnVerifidField
  );
router
  .route("/update/phones/count")
  .get(
    requireCronAuthentication,
    batchCronController.updateCountOfPhoneTwoAndPhoneThree
  );
router
  .route("/update/batch/status")
  .get(requireCronAuthentication, batchCronController.updateBatchStatus);
router
  .route("/update/batch/send/queue")
  .get(requireCronAuthentication, batchCronController.updateBatchSendQueue);
router
  .route("/reverse/back/batch/send/queue")
  .get(
    requireCronAuthentication,
    batchCronController.reverseBackBatchSendQueue
  );
module.exports = router;
