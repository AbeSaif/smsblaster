const express = require("express");
const { requireSignin, adminMiddleware } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { marketValidation } = require("../validations");
const { marketController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(marketValidation.createMarket),
    marketController.createMarket
  )
  .get(requireSignin, marketController.getAllMarket);

router
  .route("/:marketId")
  .get(
    requireSignin,
    validate(marketValidation.getMarketById),
    marketController.getMarketById
  )
  .patch(
    requireSignin,
    validate(marketValidation.updateMarketById),
    marketController.updateMarketById
  )
  .delete(
    requireSignin,
    validate(marketValidation.deleteMarketById),
    marketController.deleteMarketById
  );
router
  .route("/update/Status")
  .patch(
    requireSignin,
    validate(marketValidation.updateMarketStatus),
    marketController.updateMarketStatus
  );
router
  .route("/increase/limit/:marketId")
  .patch(
    requireSignin,
    validate(marketValidation.increaseMarketLimitById),
    marketController.increaseMarketLimitById
  );
router
  .route("/excisting/enhance/with/new/number")
  .patch(marketController.excistingMarketEnhanceWithNewNumber);
router
  .route("/update/call/forward/number/:marketId")
  .patch(
    requireSignin,
    validate(marketValidation.updateCallForwardNumber),
    marketController.updateCallForwardNumber
  );
router
  .route("/remove/outbound/number/and/related/outbound/data/:number")
  .delete(
    requireSignin,
    adminMiddleware,
    validate(marketValidation.removeOutBoundNumberAndRelatedOutBoundData),
    marketController.removeOutBoundNumberAndRelatedOutBoundData
  );
module.exports = router;
