const httpStatus = require("http-status");
const { AreaCode } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * AreaCode
 * @param {Object} areaCodeBody
 * @returns {Promise<User>}
 */

const createAreaCode = async (body) => {
  try {
    return await AreaCode.create(body);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllAreaCode = async () => {
  try {
    return await AreaCode.find().select("areaCode").lean();
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getTimeZoneAccordingToAreaCode = async (id) => {
  try {
    return await AreaCode.findById(id)
      .select("timeZone abbrevation -_id")
      .lean();
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateAreaCodeById = async (id, body) => {
  try {
    if (Object.keys(body).length <= 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "At least one element required for updation"
      );
    }
    let updateAreaCode = await AreaCode.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true }
    );
    if (!updateAreaCode) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No area code found");
    }
    return updateAreaCode;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  createAreaCode,
  getAllAreaCode,
  getTimeZoneAccordingToAreaCode,
  updateAreaCodeById,
};
