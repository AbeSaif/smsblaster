const express = require("express");
const { requireSignin } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const dncValidation = require("../validations/dnc.validation");
const { dncController } = require("../controllers");
const { csvOrExcelUpload } = require("../utils/fileUpload");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    validate(dncValidation.createDNC),
    dncController.createDNC
  )
  .get(requireSignin, dncController.getAllDNC);

router
  .route("/:dncId")
  .patch(
    requireSignin,
    validate(dncValidation.updateDNC),
    dncController.updateDNC
  )
  .get(
    requireSignin,
    validate(dncValidation.getDNCById),
    dncController.getDNCById
  )
  .delete(
    requireSignin,
    validate(dncValidation.deleteDNC),
    dncController.deleteDNC
  );
router.route("/export/data").get(requireSignin, dncController.exportDnc);
router
  .route("/import/data")
  .post(
    requireSignin,
    [csvOrExcelUpload.single("file")],
    dncController.importDnc
  );
module.exports = router;
