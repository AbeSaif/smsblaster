const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createRole = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    permissions: Joi.array().items(Joi.string()).required(),
  }),
};

const updateRole = {
  params: Joi.object().keys({
    roleId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    permissions: Joi.array().items(Joi.string()),
    // permissions: Joi.string(),
  }),
};

const deleteRole = {
  params: Joi.object().keys({
    roleId: Joi.required().custom(objectId),
  }),
};

const getRoleByName = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const updatePermissionName = {
  params: Joi.object().keys({
    roleId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    oldName: Joi.string().required(),
    newName: Joi.string().required(),
  }),
};

const deletePermissionName = {
  params: Joi.object().keys({
    roleId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};
module.exports = {
  createRole,
  updateRole,
  deleteRole,
  getRoleByName,
  updatePermissionName,
  deletePermissionName,
};
