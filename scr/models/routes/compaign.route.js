const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const { requireCronAuthentication } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { compaignValidation } = require("../validations");
const { compaignController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(compaignValidation.createCompaign),
    compaignController.createCompaign
  )
  .get(requireSignin, compaignController.getAllCompaign);
router
  .route("/get/for/followup")
  .get(compaignController.getCampaignForFollowUp);
router
  .route("/:compaignId")
  .get(
    requireSignin,
    validate(compaignValidation.getCompaignById),
    compaignController.getCompaignById
  )
  .patch(
    requireSignin,
    validate(compaignValidation.updateCompaignById),
    compaignController.updateCompaignById
  )
  .delete(
    requireSignin,
    validate(compaignValidation.deleteCompaignById),
    compaignController.deleteCompaignById
  );

router
  .route("/concat/data")
  .get(requireSignin, compaignController.getAllFollowAndSimpleCampaignData);
router
  .route("/for/inbox")
  .get(requireSignin, compaignController.getAllCompaignForInbox);

router
  .route("/campaignCron/statsData")
  .get(requireCronAuthentication, compaignController.CampaignsCronStatsUpdate);

router.route("/send/message").post(compaignController.sendMessage);
router.route("/get/message").get(compaignController.getMessage);
router
  .route("/check/working/hour")
  .post(compaignController.checkCompaignWorkingHour);
module.exports = router;
