const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { batchValidation } = require("../validations");
const { mainBatchesController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(batchValidation.createBatch),
    mainBatchesController.createBatch
  )
  .get(requireSignin, mainBatchesController.getAllBatch);

router
  .route("/by/status/completed")
  .get(requireSignin, mainBatchesController.getBatchByStatusCompleted);
router
  .route("/get/combine")
  .get(requireSignin, mainBatchesController.getCombineBatches);
router
  .route("/:batchId")
  .get(
    requireSignin,
    validate(batchValidation.getBatchById),
    mainBatchesController.getBatchById
  )
  .patch(
    requireSignin,
    validate(batchValidation.updateBatchById),
    mainBatchesController.updateBatchById
  )
  .delete(
    requireSignin,
    validate(batchValidation.deleteBatchById),
    mainBatchesController.deleteBatchById
  );

router
  .route("/send/message")
  .post(
    requireSignin,
    validate(batchValidation.sendMessage),
    mainBatchesController.sendMessage
  );

router
  .route("/get/campagin")
  .get(requireSignin, mainBatchesController.getCampagin);

router
  .route("/get/sqsQue")
  .get(requireSignin, mainBatchesController.createSQSQUE);
  
router
  .route("/change/template/:batchId")
  .patch(
    requireSignin,
    validate(batchValidation.changeTemplate),
    mainBatchesController.changeTemplate
  );
module.exports = router;
