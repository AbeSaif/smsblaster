const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { followCompaignValidation } = require("../validations");
const { followCompaignController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(followCompaignValidation.createFollowCompaign),
    followCompaignController.createFollowCompaign
  )
  .get(requireSignin, followCompaignController.getAllFollowCompaign);

router
  .route("/:followCompaignId")
  .get(
    requireSignin,
    validate(followCompaignValidation.getFollowCompaignById),
    followCompaignController.getFollowCompaignById
  )
  .patch(
    requireSignin,
    validate(followCompaignValidation.updateFollowCompaignById),
    followCompaignController.updateFollowCompaignById
  )
  .delete(
    requireSignin,
    validate(followCompaignValidation.deleteFollowCompaignById),
    followCompaignController.deleteFollowCompaignById
  );

module.exports = router;
