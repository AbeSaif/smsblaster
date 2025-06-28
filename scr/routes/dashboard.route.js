const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const { dashboardController } = require("../controllers");
const validate = require("../middlewares/validate");
const { dashboardValidation } = require("../validations");
const router = express.Router();

router
  .route("/lead/breakdown")
  .get(
    requireSignin,
    validate(dashboardValidation.reportDay),
    dashboardController.getTotalLeadsBreakDown
  );
router
  .route("/top/three/campagins")
  .get(
    requireSignin,
    validate(dashboardValidation.reportDay),
    dashboardController.getTopThreeCampaigns
  );

router
  .route("/count/of/messages")
  .get(
    requireSignin,
    validate(dashboardValidation.reportDay),
    dashboardController.getCountOfMessages
  );
router
  .route("/count/of/messages/in/thirty/minutes")
  .get(
    requireSignin,
    dashboardController.getCountOfMessagesInLastThirtyMinutes
  );
router
  .route("/count/of/tags")
  .get(
    requireSignin,
    validate(dashboardValidation.reportDay),
    dashboardController.getCountOfTags
  );
router
  .route("/average/reply/time")
  .get(
    requireSignin,
    validate(dashboardValidation.reportDay),
    dashboardController.getAverageReplyTime
  );
router
  .route("/report/of/sent/que/messages")
  .get(requireSignin, dashboardController.reportOfSendAndQueMessages);
router
  .route("/report/of/basic/stats")
  .get(requireSignin, dashboardController.reportOfBasicStats);
router
  .route("/report/of/prospect/leads")
  .get(requireSignin, dashboardController.reportOfProspectLeads);
router
  .route("/report/of/flag/status")
  .get(requireSignin, dashboardController.reportOfFlagStatus);
router
  .route("/report/of/flag/status/by/number/:phone")
  .get(
    requireSignin,
    validate(dashboardValidation.reportOfFlagStatusNumber),
    dashboardController.reportOfFlagStatusByNumber
  );
router
  .route("/list/of/number/by/flag/status/:phone")
  .get(
    requireSignin,
    validate(dashboardValidation.reportOfFlagStatusNumber),
    dashboardController.listOfNumberByFlagStatus
  );
router
  .route("/report/of/drip/schedule")
  .get(requireSignin, dashboardController.reportOfDripSchedule);
router
  .route("/report/of/top/drip")
  .get(requireSignin, dashboardController.reportOfTopDrip);

router
  .route("/report/of/no/status")
  .get(requireSignin, dashboardController.reportOfNoStatus);
router
  .route("/report/of/reminder")
  .get(requireSignin, dashboardController.reportOfReminder);
router
  .route("/report/of/un/read")
  .get(requireSignin, dashboardController.reportOfUnRead);
router
  .route("/report/of/un/answered")
  .get(requireSignin, dashboardController.reportOfUnAnswered);
router
  .route("/report/of/unRead/unAnswered")
  .get(requireSignin, dashboardController.reoprtOfUnReadUnAnswered);
module.exports = router;
