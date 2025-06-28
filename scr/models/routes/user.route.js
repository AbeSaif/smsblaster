const express = require("express");
const { requireSignin, adminMiddleware, requireCronAuthentication } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const userValidation = require("../validations/user.validation");
const { userController } = require("../controllers");
const { fileUploadIntoS3 } = require("../utils/fileUpload");
const router = express.Router();

router
  .route("/register")
  .post(
    requireSignin,
    adminMiddleware,
    [fileUploadIntoS3.single("avatar")],
    validate(userValidation.register),
    userController.register
  );

router
  .route("/login")
  .post(validate(userValidation.login), userController.login);
router
  .route("/login/with/email")
  .post(validate(userValidation.loginWithEmail), userController.loginWithEmail);
router
  .route("/")
  .get(requireSignin, adminMiddleware, userController.getAllUser);
router
  .route("/:userId")
  .get(
    requireSignin,
    validate(userValidation.getUserById),
    userController.getUserById
  )
  .patch(
    requireSignin,
    validate(userValidation.updateUser),
    fileUploadIntoS3.single("avatar"),
    userController.updateUserById
  )
  .delete(
    requireSignin,
    adminMiddleware,
    validate(userValidation.deleteUser),
    userController.deleteUserById
  );

router
  .route("/password/:userId")
  .patch(
    validate(userValidation.createPassword),
    userController.createPassword
  );

router.route("/refresh/token").post(userController.refreshToken);
router
  .route("/reset/password/:userId")
  .patch(validate(userValidation.resetPassword), userController.resetPassword);

router
  .route("/forget/password")
  .post(validate(userValidation.forgotPassword), userController.forgotPassword);
router
  .route("/change/password")
  .post(
    validate(userValidation.changePasswordForAllUser),
    userController.changePasswordForAllUser
  );

router
  .route("/transfer/leads")
  .post(
    requireSignin,
    adminMiddleware,
    validate(userValidation.transferLeads),
    userController.transferLeads
  );
router
  .route("/flush/redis/data")
  .get(requireCronAuthentication, userController.flushRedisData);
module.exports = router;
