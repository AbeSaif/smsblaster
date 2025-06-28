const express = require("express");
const { requireSignin, adminMiddleware } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { permissionValidation } = require("../validations");
const { permissionController } = require("../controllers");
const router = express.Router();

router
  .route("/")
  .post(
    requireSignin,
    adminMiddleware,
    validate(permissionValidation.createPermission),
    permissionController.createPermission
  )
  .get(requireSignin, permissionController.getAllPermission);

router
  .route("/:permissionId")
  .get(
    requireSignin,
    adminMiddleware,
    validate(permissionValidation.getPermissionById),
    permissionController.getPermissionById
  )
  .patch(
    requireSignin,
    adminMiddleware,
    validate(permissionValidation.updatePermissionById),
    permissionController.updatePermissionById
  )
  .delete(
    requireSignin,
    adminMiddleware,
    validate(permissionValidation.deletePermissionById),
    permissionController.deletePermissionById
  );
module.exports = router;
