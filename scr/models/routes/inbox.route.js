const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const { inboxController } = require("../controllers");
const validate = require("../middlewares/validate");
const { batchValidation } = require("../validations");
const router = express.Router();

router.route("/get/list").get(requireSignin, inboxController.getInboxList);
router.route("/get/detail").get(requireSignin, inboxController.getInboxDetail);
router
  .route("/export/prospects")
  .post(
    requireSignin,
    validate(batchValidation.exportProspects),
    inboxController.exportProspects
  );

router.route("/all/responses").get(inboxController.inboxResponses);
router
  .route("/integrate/crm")
  .post(
    requireSignin,
    validate(batchValidation.connectCrm),
    inboxController.connectCrm
  )
  .patch(
    requireSignin,
    validate(batchValidation.updateCrm),
    inboxController.updateCrm
  )
  .get(requireSignin, inboxController.getIntegratedCrm);
router
  .route("/verify/crm")
  .post(validate(batchValidation.verifyCrm), inboxController.verifyCrm);
router
  .route("/change/crm/status")
  .patch(
    requireSignin,
    validate(batchValidation.changeCrmStatus),
    inboxController.changeCrmStatus
  );
module.exports = router;
