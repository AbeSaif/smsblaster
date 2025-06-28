const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { roleService } = require("../services");
const pick = require("../utils/pick");

const createRole = catchAsync(async (req, res) => {
  let body = req.body;
  const role = await roleService.createRole(body);
  res.status(httpStatus.CREATED).send(role);
});

const getAllRole = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:desc";
  const role = await roleService.getAllRole(filter, options);
  res.status(httpStatus.CREATED).send(role);
});

const getRoleById = catchAsync(async (req, res) => {
  let id = req.params.roleId;
  const role = await roleService.getRoleById(id);
  res.status(httpStatus.CREATED).send(role);
});
const updateRoleById = catchAsync(async (req, res) => {
  let id = req.params.roleId;
  let body = req.body;
  const role = await roleService.updateRoleById(id, body);
  res.status(httpStatus.CREATED).send(role);
});

const deleteRoleById = catchAsync(async (req, res) => {
  let id = req.params.roleId;
  const role = await roleService.deleteRoleById(id);
  res.status(httpStatus.CREATED).send(role);
});
const getRoleByName = catchAsync(async (req, res) => {
  let body = req.body;
  const role = await roleService.getRoleByName(body);
  res.status(httpStatus.CREATED).send(role);
});

const updatePermissionName = catchAsync(async (req, res) => {
  let body = req.body;
  let { roleId } = req.params;
  const role = await roleService.updatePermissionName(roleId, body);
  res.status(httpStatus.CREATED).send(role);
});

const deletePermissionName = catchAsync(async (req, res) => {
  let body = req.body;
  let { roleId } = req.params;
  const role = await roleService.deletePermissionName(roleId, body);
  res.status(httpStatus.CREATED).send(role);
});

module.exports = {
  createRole,
  getAllRole,
  getRoleById,
  updateRoleById,
  deleteRoleById,
  getRoleByName,
  updatePermissionName,
  deletePermissionName,
};
