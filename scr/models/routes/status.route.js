const express = require("express");
const { requireSignin, adminMiddleware } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { statusValidation } = require("../validations");
const { statusController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    // requireSignin,
    validate(statusValidation.createStatus),
    statusController.createStatus
  )
  .get(statusController.getAllStatus);

module.exports = router;
