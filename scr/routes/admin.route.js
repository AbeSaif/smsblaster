const express = require("express");
const { requireSignin, adminMiddleware } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const adminValidation = require("../validations/admin.validation");
const { adminController } = require("../controllers");
const router = express.Router();

router
  .route("/register")
  .post(
    requireSignin,
    adminMiddleware,
    validate(adminValidation.register),
    adminController.register
  );

router
  .route("/login")
  .post(validate(adminValidation.login), adminController.login);
router
  .route("/")
  .get(requireSignin, adminMiddleware, adminController.getAllAdmin);

router
  .route("/:adminId")
  .get(
    requireSignin,
    adminMiddleware,
    validate(adminValidation.adminById),
    adminController.getAdminById
  )
  .delete(
    requireSignin,
    adminMiddleware,
    validate(adminValidation.adminById),
    adminController.deleteAdminById
  );

router
  .route("/login/attempt")
  .get(requireSignin, adminController.listOfLoginAttempt);
router
  .route("/verify/password")
  .post(
    requireSignin,
    adminMiddleware,
    validate(adminValidation.verifyPassword),
    adminController.verifyPassword
  );
module.exports = router;
