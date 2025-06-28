const Joi = require("joi");
const { objectId } = require("./custom.validation");

const customMessages = {
  "number.base": '"areaCode" must be a number',
  "number.integer": '"areaCode" must be an integer',
  "number.min": '"areaCode" must be at least 3',
  "number.max": '"areaCode" must be at most 4',
  "any.required": '"areaCode" is required',
};

const stringSchema = Joi.string().min(8).max(32);
const createMarket = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    areaCode: Joi.number()
      .integer()
      .min(100)
      .max(9999)
      .required()
      .messages(customMessages),
    callForwardingNumber: Joi.string().required(),
    timeZone: Joi.string().required(),
    abbrevation: Joi.string().required(),
  }),
};

const updateMarketById = {
  params: Joi.object().keys({
    marketId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
    areaCode: Joi.number()
      .integer()
      .min(100)
      .max(9999)
      .optional()
      .messages(customMessages),
    phone: Joi.array().items(stringSchema).optional(),
    newPhoneNumber: Joi.string().min(8).max(32).optional(),
    oldPhoneNumber: Joi.string().min(8).max(32).optional(),
    timeZone: Joi.string().optional(),
    abbrevation: Joi.string().optional(),
  }),
};

const increaseMarketLimitById = {
  params: Joi.object().keys({
    marketId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    phone: Joi.array().items(stringSchema).required(),
    phoneNumber: Joi.array()
      .items({ number: stringSchema, date: Joi.date().optional() })
      .required(),
  }),
};

const getMarketById = {
  params: Joi.object().keys({
    marketId: Joi.required().custom(objectId),
  }),
};

const deleteMarketById = {
  params: Joi.object().keys({
    marketId: Joi.required().custom(objectId),
  }),
};

const updateMarketStatus = {
  query: Joi.object().keys({
    phone: Joi.string().min(8).max(32).required(),
  }),
  body: Joi.object().keys({
    active: Joi.boolean().required(),
  }),
};

const updateCallForwardNumber = {
  params: Joi.object().keys({
    marketId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    callForwardingNumber: Joi.string().required(),
  }),
};

const removeOutBoundNumberAndRelatedOutBoundData = {
  params: Joi.object().keys({
    number: Joi.number().required(),
  }),
};

module.exports = {
  createMarket,
  updateMarketById,
  deleteMarketById,
  getMarketById,
  increaseMarketLimitById,
  updateMarketStatus,
  updateCallForwardNumber,
  removeOutBoundNumberAndRelatedOutBoundData,
};
