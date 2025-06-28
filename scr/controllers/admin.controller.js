const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { adminService } = require("../services");
const pick = require("../utils/pick");
// const useragent = require("useragent");

const register = catchAsync(async (req, res) => {
  let body = req.body;
  body.fullName = body.firstName + " " + body.lastName;
  const user = await adminService.register(body);
  res.status(httpStatus.CREATED).send(user);
});

const login = catchAsync(async (req, res) => {
  let body = req.body;
  body.email = body.email.toLowerCase().replace(/\s/g, "");
  const user = await adminService.login(body);
  res.status(httpStatus.CREATED).send(user);
});

const getAllAdmin = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:desc";
  const user = await adminService.getAllAdmin(filter, options);
  res.status(httpStatus.CREATED).send(user);
});

const updateUserById = catchAsync(async (req, res) => {
  let body = req.body;
  if (req.file) {
    body.avatar = req.file.filename;
  }
  if (body.email) {
    res.status(httpStatus.CREATED).send("Email can't be updated");
  }
  if (body.password) {
    res.status(httpStatus.CREATED).send("Password can't be updated");
  }

  let id = req.params.userId;
  const user = await adminService.updateUserById(id, body);
  res.status(httpStatus.CREATED).send(user);
});

const getAdminById = catchAsync(async (req, res) => {
  let id = req.params.adminId;
  const user = await adminService.getAdminById(id);
  res.status(httpStatus.CREATED).send(user);
});

const deleteAdminById = catchAsync(async (req, res) => {
  let id = req.params.adminId;
  const user = await adminService.deleteAdminById(id);
  res.status(httpStatus.CREATED).send(user);
});

const listOfLoginAttempt = catchAsync(async (req, res) => {
  let filter;
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:desc";
  let userId = req.user._id;
  filter = {
    $or: [{ user: userId }, { admin: userId }],
  };
  const user = await adminService.listOfLoginAttempt(filter, options);
  res.status(httpStatus.CREATED).send(user);
});

const verifyPassword = catchAsync(async (req, res) => {
  let body = req.body;
  const user = await adminService.verifyPassword(body);
  res.status(httpStatus.CREATED).send(user);
});

module.exports = {
  register,
  login,
  getAllAdmin,
  getAdminById,
  deleteAdminById,
  listOfLoginAttempt,
  verifyPassword,
};
