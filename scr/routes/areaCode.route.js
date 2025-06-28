const express = require("express");
const { requireSignin, adminMiddleware } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const areaCodeValidation = require("../validations/areaCode.validation");
const { areaCodeController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    adminMiddleware,
    validate(areaCodeValidation.createAreaCode),
    areaCodeController.createAreaCode
  )
  .get(areaCodeController.getAllAreaCode);

router
  .route("/:id")
  .patch(
    requireSignin,
    adminMiddleware,
    validate(areaCodeValidation.updateAreaCodeById),
    areaCodeController.updateAreaCodeById
  );

router
  .route("/:areaCodeid")
  .get(
    requireSignin,
    adminMiddleware,
    areaCodeController.getTimeZoneAccordingToAreaCode
  );
module.exports = router;
