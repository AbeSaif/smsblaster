const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createPermission = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const updatePermissionById = {
  params: Joi.object().keys({
    permissionId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const getPermissionById = {
  params: Joi.object().keys({
    permissionId: Joi.required().custom(objectId),
  }),
};
const deletePermissionById = {
  params: Joi.object().keys({
    permissionId: Joi.required().custom(objectId),
  }),
};

module.exports = {
  createPermission,
  updatePermissionById,
  deletePermissionById,
  getPermissionById,
};
