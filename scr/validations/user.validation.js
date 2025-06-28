const Joi = require("joi");
const { objectId } = require("./custom.validation");

const register = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    fullName: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    aliasName: Joi.string().required(),
    companyName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    role: Joi.required().custom(objectId),
    url: Joi.string().required(),
    changePasswordOnLogin: Joi.boolean().optional(),
    verifyEmail: Joi.boolean().optional(),
    active: Joi.boolean().optional(),
    password: Joi.string().min(8).max(32).optional(),
    timeZone: Joi.string().required(),
  }),
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().required(),
    password: Joi.string().min(8).max(32).required(),
  }),
};
const loginWithEmail = {
  body: Joi.object().keys({
    email: Joi.string().required(),
  }),
};
const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    avatar: Joi.string().optional(),
    password: Joi.string().min(8).max(32).optional(),
    fullName: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    aliasName: Joi.string().optional(),
    companyName: Joi.string().optional(),
    phoneNumber: Joi.string().optional(),
    role: Joi.optional().custom(objectId),
    changePasswordOnLogin: Joi.boolean().optional(),
    verifyEmail: Joi.boolean().optional(),
    active: Joi.boolean().optional(),
    timeZone: Joi.string().optional(),
  }),
};

const getUserById = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
};
const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
};

const createPassword = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    password: Joi.string().min(8).max(32).required(),
  }),
};

const resetPassword = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    password: Joi.string().min(8).max(32).required(),
    newPassword: Joi.string().min(8).max(32).required(),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().email().required(),
    url: Joi.string().required(),
  }),
};

const changePasswordForAllUser = {
  body: Joi.object().keys({
    id: Joi.required().custom(objectId),
    newPassword: Joi.string().min(8).max(32).required(),
  }),
};

const transferLeads = {
  body: Joi.object().keys({
    oldUserId: Joi.required().custom(objectId),
    newUserId: Joi.required().custom(objectId),
    permission: Joi.string().required().valid("admin", "user"),
  }),
};

module.exports = {
  login,
  register,
  updateUser,
  deleteUser,
  getUserById,
  createPassword,
  resetPassword,
  forgotPassword,
  changePasswordForAllUser,
  loginWithEmail,
  transferLeads,
};
