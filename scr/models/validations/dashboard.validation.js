const Joi = require("joi");

const reportDay = {
  query: Joi.object().keys({
    today: Joi.boolean().optional(),
    yesterday: Joi.boolean().optional(),
    week: Joi.boolean().optional(),
    month: Joi.boolean().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    date: Joi.date().optional(),
  }),
};

const reportDayOfMessages = {
  query: Joi.object().keys({
    week: Joi.boolean().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
  }),
};

const reportOfFlagStatusNumber = {
  params: Joi.object().keys({
    phone: Joi.string().required(),
  }),
};

module.exports = {
  reportDay,
  reportDayOfMessages,
  reportOfFlagStatusNumber,
};
