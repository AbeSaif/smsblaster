const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { quickReplyTemplateValidation } = require("../validations");
const { quickReplyTemplateController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(quickReplyTemplateValidation.createQuickReplyTemplate),
    quickReplyTemplateController.createQuickReplyTemplate
  )
  .get(quickReplyTemplateController.getAllQuickReplyTemplate);
router
  .route("/category")
  .post(
    requireSignin,
    validate(quickReplyTemplateValidation.createQuickReplyTemplateCategory),
    quickReplyTemplateController.createQuickReplyTemplateCategory
  )
  .get(
    requireSignin,
    quickReplyTemplateController.getAllQuickReplyTemplateCategory
  );
router
  .route("/:quickReplyTemplateId")
  .get(
    requireSignin,
    validate(quickReplyTemplateValidation.getQuickReplyTemplateById),
    quickReplyTemplateController.getQuickReplyTemplateById
  )
  .patch(
    requireSignin,
    validate(quickReplyTemplateValidation.updateQuickReplyTemplateById),
    quickReplyTemplateController.updateQuickReplyTemplateById
  )
  .delete(
    requireSignin,
    validate(quickReplyTemplateValidation.deleteQuickReplyTemplateById),
    quickReplyTemplateController.deleteQuickReplyTemplateById
  );

router
  .route("/update/template/position")
  .patch(quickReplyTemplateController.updateTemplatePosition);
module.exports = router;
