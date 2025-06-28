const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createQuickReplyTemplateCategory = {
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const createQuickReplyTemplate = {
  body: Joi.object().keys({
    category: Joi.required().custom(objectId),
    title: Joi.string().required(),
    reply: Joi.string().required(),
  }),
};
const updateQuickReplyTemplateById = {
  params: Joi.object().keys({
    quickReplyTemplateId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    category: Joi.optional().custom(objectId),
    title: Joi.string().optional(),
    reply: Joi.string().optional(),
  }),
};

const getQuickReplyTemplateById = {
  params: Joi.object().keys({
    quickReplyTemplateId: Joi.required().custom(objectId),
  }),
};
const deleteQuickReplyTemplateById = {
  params: Joi.object().keys({
    quickReplyTemplateId: Joi.required().custom(objectId),
  }),
};

const updateTemplatePosition = {
  params: Joi.object().keys({
    quickReplyTemplateId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    position: Joi.number().required(),
  }),
};

module.exports = {
  createQuickReplyTemplateCategory,
  createQuickReplyTemplate,
  updateQuickReplyTemplateById,
  deleteQuickReplyTemplateById,
  getQuickReplyTemplateById,
  updateTemplatePosition,
};
