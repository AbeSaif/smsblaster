const httpStatus = require("http-status");
const { Status } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Create a user
 * @param {Object} statusBody
 * @returns {Promise<User>}
 */
const createStatus = async (statusBody) => {
  try {
    return await Status.create(statusBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllStatus = async (filter, options) => {
  try {
    return await Status.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  createStatus,
  getAllStatus,
};
