const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { areaCodeService } = require("../services");

const createAreaCode = catchAsync(async (req, res) => {
  let body = req.body;
  const areaCode = await areaCodeService.createAreaCode(body);
  res.status(httpStatus.CREATED).send(areaCode);
});

const getAllAreaCode = catchAsync(async (req, res) => {
  const areaCode = await areaCodeService.getAllAreaCode();
  res.status(httpStatus.CREATED).send(areaCode);
});

const getTimeZoneAccordingToAreaCode = catchAsync(async (req, res) => {
  let { areaCodeid } = req.params;
  const areaCode = await areaCodeService.getTimeZoneAccordingToAreaCode(
    areaCodeid
  );
  res.status(httpStatus.CREATED).send(areaCode);
});

const updateAreaCodeById = catchAsync(async (req, res) => {
  let { id } = req.params;
  let body = req.body;
  const areaCode = await areaCodeService.updateAreaCodeById(id, body);
  res.status(httpStatus.CREATED).send(areaCode);
});

module.exports = {
  createAreaCode,
  getAllAreaCode,
  getTimeZoneAccordingToAreaCode,
  updateAreaCodeById,
};
