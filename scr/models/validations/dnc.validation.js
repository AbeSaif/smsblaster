const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createDNC = {
  body: Joi.object().keys({
    number: Joi.string().required(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
  }),
};

const updateDNC = {
  params: Joi.object().keys({
    dncId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    number: Joi.string().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
  }),
};

const deleteDNC = {
  params: Joi.object().keys({
    dncId: Joi.required().custom(objectId),
  }),
};

const getDNCById = {
  params: Joi.object().keys({
    dncId: Joi.required().custom(objectId),
  }),
};
module.exports = {
  createDNC,
  updateDNC,
  deleteDNC,
  getDNCById,
};
