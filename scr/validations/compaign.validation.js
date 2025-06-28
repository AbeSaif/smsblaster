const Joi = require("joi");
const { objectId } = require("./custom.validation");

const customPhoneMessages = {
  "number.base": '"phone" must be a number',
  "number.integer": '"phone" must be an integer',
  "number.min": '"phone" must be between 8 and 32 digits long',
  "number.max": '"phone" must be between 8 and 32 digits long',
  "any.required": '"phone" is required',
};

const stringSchema = Joi.string().min(8).max(32);
const createCompaign = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    market: Joi.required().custom(objectId),
    phone: Joi.array().items(stringSchema).required(),
    callNumber: Joi.any().optional(),
  }),
};

const updateCompaignById = {
  params: Joi.object().keys({
    compaignId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
    market: Joi.optional().custom(objectId),
    phone: Joi.array().items(stringSchema).required(),
    callNumber: Joi.any().optional(),
  }),
};

const getCompaignById = {
  params: Joi.object().keys({
    compaignId: Joi.required().custom(objectId),
  }),
};

const deleteCompaignById = {
  params: Joi.object().keys({
    compaignId: Joi.required().custom(objectId),
  }),
};

const assginCampaign = {
  body: Joi.object().keys({
    campaign: Joi.optional().custom(objectId),
    followCampaign: Joi.optional().custom(objectId),
  }),
};

const updateCampaign = {
  body: Joi.object().keys({
    oldCampaign: Joi.required().custom(objectId),
    oldCampaign: Joi.required().custom(objectId),
  }),
};
module.exports = {
  createCompaign,
  updateCompaignById,
  deleteCompaignById,
  getCompaignById,
  assginCampaign,
  updateCampaign,
};
