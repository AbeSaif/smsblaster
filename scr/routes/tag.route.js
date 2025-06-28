const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { tagValidation } = require("../validations");
const { tagController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(tagValidation.createTag),
    tagController.createTag
  )
  .get(tagController.getAllTag);

router
  .route("/:tagId")
  .get(
    requireSignin,
    validate(tagValidation.getTagById),
    tagController.getTagById
  )
  .patch(
    requireSignin,
    validate(tagValidation.updateTagById),
    tagController.updateTagById
  )
  .delete(
    requireSignin,
    validate(tagValidation.deleteTagById),
    tagController.deleteTagById
  );
module.exports = router;
