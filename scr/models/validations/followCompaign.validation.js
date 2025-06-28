const Joi = require("joi");
const { objectId } = require("./custom.validation");

const stringSchema = Joi.string().min(8).max(32);

const createFollowCompaign = {
  body: Joi.object().keys({
    compaign: Joi.required().custom(objectId),
    followMarket: Joi.required().custom(objectId),
    title: Joi.string().required(),
    callNumber: Joi.any().optional(),
    months: Joi.array().items().required(),
    permission: Joi.string().required(),
  }),
};

const updateFollowCompaignById = {
  params: Joi.object().keys({
    followCompaignId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    compaign: Joi.optional().custom(objectId),
    followMarket: Joi.optional().custom(objectId),
    title: Joi.string().optional(),
    callNumber: Joi.any().optional(),
  }),
};

const getFollowCompaignById = {
  params: Joi.object().keys({
    followCompaignId: Joi.required().custom(objectId),
  }),
};

const deleteFollowCompaignById = {
  params: Joi.object().keys({
    followCompaignId: Joi.required().custom(objectId),
  }),
};

module.exports = {
  createFollowCompaign,
  updateFollowCompaignById,
  deleteFollowCompaignById,
  getFollowCompaignById,
};
