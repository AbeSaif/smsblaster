const Joi = require("joi");
const { objectId } = require("./custom.validation");

const register = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(32).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    aliasName: Joi.string().required(),
    companyName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    timeZone: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(32).required(),
    ip: Joi.string().optional().allow(""),
    browser: Joi.string().optional().allow(""),
  }),
};

const adminById = {
  params: Joi.object().keys({
    adminId: Joi.required().custom(objectId),
  }),
};

const verifyPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(32).required(),
  }),
};

module.exports = {
  login,
  register,
  adminById,
  verifyPassword,
};
