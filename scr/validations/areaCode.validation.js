const Joi = require("joi");

const createAreaCode = {
  body: Joi.object().keys({
    areaCode: Joi.number().required(),
    timeZone: Joi.string().required(),
    abbrevation: Joi.string().required(),
  }),
};

const updateAreaCodeById = {
  body: Joi.object().keys({
    areaCode: Joi.number().optional(),
    timeZone: Joi.string().optional(),
    abbrevation: Joi.string().optional(),
  }),
};

module.exports = {
  createAreaCode,
  updateAreaCodeById,
};
