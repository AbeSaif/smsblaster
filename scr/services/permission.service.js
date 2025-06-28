const httpStatus = require("http-status");
const { Permission } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Create a permission
 * @param {Object} permissionBody
 * @returns {Promise<Permission>}
 */
const createPermission = async (permissionBody) => {
  try {
    return await Permission.create(permissionBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllPermission = async (filter, options) => {
  try {
    return await Permission.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getPermissionById = async (id) => {
  try {
    const permission = await Permission.findById(id);
    if (!permission) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No permission found");
    }
    return permission;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updatePermissionById = async (id, updateBody) => {
  try {
    const permission = await Permission.findById(id);
    if (!permission) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No permission found");
    }
    Object.assign(permission, updateBody);
    await permission.save();
    return permission;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deletePermissionById = async (id) => {
  try {
    const permission = await Permission.findByIdAndRemove(id);
    if (!permission) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No permission found");
    }
    return "Delete successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
module.exports = {
  createPermission,
  getAllPermission,
  getPermissionById,
  updatePermissionById,
  deletePermissionById,
};
