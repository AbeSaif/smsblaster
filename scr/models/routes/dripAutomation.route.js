const express = require("express");
const {
  requireSignin,
  requireCronAuthentication,
} = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const dripAutomationValidation = require("../validations/dripAutomation.validation");
const { dripAutomationController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(dripAutomationValidation.createDripAutomation),
    dripAutomationController.createDripAutomation
  )
  .get(requireSignin, dripAutomationController.getAllDripAutomation);

router
  .route("/:dripAutomationId")
  .patch(
    requireSignin,
    validate(dripAutomationValidation.updateDripAutomation),
    dripAutomationController.updateDripAutomation
  )
  .get(requireSignin, dripAutomationController.getSingleDripAutomation)
  .delete(
    requireSignin,
    validate(dripAutomationValidation.deleteDripAutomation),
    dripAutomationController.deleteDripAutomation
  );

router
  .route("/assign/to/inbox/:inboxId")
  .patch(
    requireSignin,
    validate(dripAutomationValidation.assignDripAutomationToInbox),
    dripAutomationController.assignDripAutomationToInbox
  );

router
  .route("/un/assign/to/inbox/:inboxId")
  .delete(
    requireSignin,
    validate(dripAutomationValidation.unAssignDripAutomationToInbox),
    dripAutomationController.unAssignDripAutomationToInbox
  );

router.route("/send/auto/drip").get(requireCronAuthentication, (req, res) => {
  dripAutomationController.sendAutoDrip(
    req,
    res,
    global.io,
    global.userSocketMap,
    global.redisPublisher
  );
});

router.route("/remove/auto/drip").get(requireCronAuthentication, (req, res) => {
  dripAutomationController.removeAutoDrip(
    req,
    res,
    global.io,
    global.userSocketMap,
    global.redisPublisher
  );
});

router
  .route("/update/single/message/:messageId")
  .patch(
    requireSignin,
    validate(dripAutomationValidation.updateSingleMessage),
    dripAutomationController.updateSingleMessage
  );
router
  .route("/drip/filter/for/specific/inbox/:inboxId")
  .get(requireSignin, dripAutomationController.dripFilterForSpecificInbox);
module.exports = router;
