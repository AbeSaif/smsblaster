const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { permissionService } = require("../services");
const pick = require("../utils/pick");

const createPermission = catchAsync(async (req, res) => {
  let body = req.body;
  const permission = await permissionService.createPermission(body);
  res.status(httpStatus.CREATED).send(permission);
});

const getAllPermission = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:asec";
  // options.populate = "assignedTo";
  const permission = await permissionService.getAllPermission(filter, options);
  res.status(httpStatus.CREATED).send(permission);
});

const getPermissionById = catchAsync(async (req, res) => {
  let id = req.params.permissionId;
  const permission = await permissionService.getPermissionById(id);
  res.status(httpStatus.CREATED).send(permission);
});
const updatePermissionById = catchAsync(async (req, res) => {
  let id = req.params.permissionId;
  let body = req.body;
  const permission = await permissionService.updatePermissionById(id, body);
  res.status(httpStatus.CREATED).send(permission);
});

const deletePermissionById = catchAsync(async (req, res) => {
  let id = req.params.permissionId;
  const permission = await permissionService.deletePermissionById(id);
  res.status(httpStatus.CREATED).send(permission);
});
module.exports = {
  createPermission,
  getAllPermission,
  getPermissionById,
  updatePermissionById,
  deletePermissionById,
};
