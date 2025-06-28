const Joi = require("joi");

const createStatus = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

module.exports = {
  createStatus,
};
