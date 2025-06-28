const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { initialAndFollowTemplateValidation } = require("../validations");
const { initialAndFollowTemplateController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(initialAndFollowTemplateValidation.createInitialAndFollowTemplate),
    initialAndFollowTemplateController.createInitialAndFollowTemplate
  )
  .get(
    requireSignin,
    initialAndFollowTemplateController.getAllInitialAndFollowTemplate
  );

router
  .route("/:initialAndFollowTemplateId")
  .get(
    requireSignin,
    validate(
      initialAndFollowTemplateValidation.updateInitialAndFollowTemplateById
    ),
    initialAndFollowTemplateController.getInitialAndFollowTemplateById
  )
  .patch(
    requireSignin,
    validate(
      initialAndFollowTemplateValidation.updateInitialAndFollowTemplateById
    ),
    initialAndFollowTemplateController.updateInitialAndFollowTemplateById
  )
  .delete(
    requireSignin,
    validate(
      initialAndFollowTemplateValidation.deleteInitialAndFollowTemplateById
    ),
    initialAndFollowTemplateController.deleteInitialAndFollowTemplateById
  );
router
  .route("/template/with/count/:mode")
  .get(requireSignin, initialAndFollowTemplateController.getTemplateWithCount);
router
  .route("/for/drop/down")
  .get(
    initialAndFollowTemplateController.getAllInitialAndFollowTemplateForDropDown
  );
module.exports = router;
