const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { statusService } = require("../services");
const pick = require("../utils/pick");

const createStatus = catchAsync(async (req, res) => {
  let body = req.body;
  const status = await statusService.createStatus(body);
  res.status(httpStatus.CREATED).send(status);
});

const getAllStatus = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:asec";
  const status = await statusService.getAllStatus(filter, options);
  res.status(httpStatus.CREATED).send(status);
});

module.exports = {
  createStatus,
  getAllStatus,
};
