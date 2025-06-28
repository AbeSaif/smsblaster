const httpStatus = require("http-status");
const { Role, User, Permission } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Create a user
 * @param {Object} roleBody
 * @returns {Promise<User>}
 */
const createRole = async (roleBody) => {
  try {
    const role = await Role.create(roleBody);
    for (let i = 0; i < role.permissions.length; i++) {
      await Permission.findOneAndUpdate(
        { name: role.permissions[i] },
        { $addToSet: { assignedTo: role.name } }
      );
    }
    return role;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllRole = async (filter, options) => {
  try {
    return await Role.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getRoleById = async (id) => {
  try {
    const role = await Role.findById(id);
    if (role === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No role found");
    }
    return role;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateRoleById = async (id, updateBody) => {
  try {
    const role = await Role.findById(id);
    if (role === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No role found");
    }
    Object.assign(role, updateBody);
    await role.save();
    for (let i = 0; i < role.permissions.length; i++) {
      await Permission.findOneAndUpdate(
        { name: role.permissions[i] },
        { $addToSet: { assignedTo: role.name } }
      );
    }
    return role;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteRoleById = async (id) => {
  try {
    const role = await Role.findByIdAndRemove(id);
    if (role === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No role found");
    }
    for (let i = 0; i < role.permissions.length; i++) {
      await Permission.findOneAndUpdate(
        { name: role.permissions[i] },
        { $pull: { assignedTo: role.name } }
      );
    }
    return "Delete successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getRoleByName = async (body) => {
  try {
    const role = await Role.findOne(body);
    if (!role) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No role associate with this name"
      );
    }
    return role;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updatePermissionName = async (id, body) => {
  try {
    const role = await Role.findOne({ _id: id });
    if (!role) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No role found");
    }
    let index = role.permissions.findIndex((e) => e === body.oldName);
    if (index != -1) {
      role.permissions[index] = body.newName;
      await role.save();
      return role;
    }
    throw new ApiError(httpStatus.BAD_REQUEST, "No permission found");
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deletePermissionName = async (id, body) => {
  try {
    const role = await Role.findOne({ _id: id });
    if (role === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No role found");
    }
    let index = role.permissions.findIndex((e) => e === body.name);
    if (index != -1) {
      role.permissions.splice(index, 1);
      await role.save();
      return role;
    }
    throw new ApiError(httpStatus.BAD_REQUEST, "No permission found");
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
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
