const express = require("express");
const { requireSignin, adminMiddleware } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { roleValidation } = require("../validations");
const { roleController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    adminMiddleware,
    validate(roleValidation.createRole),
    roleController.createRole
  )
  .get(requireSignin, roleController.getAllRole);

router
  .route("/:roleId")
  .get(
    requireSignin,
    adminMiddleware,
    validate(roleValidation.getRole),
    roleController.getRoleById
  )
  .patch(
    requireSignin,
    adminMiddleware,
    validate(roleValidation.updateRole),
    roleController.updateRoleById
  )
  .delete(
    requireSignin,
    adminMiddleware,
    validate(roleValidation.deleteRole),
    roleController.deleteRoleById
  );

router
  .route("/name")
  .post(
    requireSignin,
    adminMiddleware,
    validate(roleValidation.getRoleByName),
    roleController.getRoleByName
  );

router
  .route("/permission/:roleId")
  .patch(
    requireSignin,
    adminMiddleware,
    validate(roleValidation.updatePermissionName),
    roleController.updatePermissionName
  )
  .delete(
    requireSignin,
    adminMiddleware,
    validate(roleValidation.deletePermissionName),
    roleController.deletePermissionName
  );
module.exports = router;
