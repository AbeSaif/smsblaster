const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createTag = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    color: Joi.string().required(),
  }),
};

const updateTagById = {
  params: Joi.object().keys({
    tagId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
    color: Joi.string().optional(),
  }),
};

const getTagById = {
  params: Joi.object().keys({
    tagId: Joi.required().custom(objectId),
  }),
};
const deleteTagById = {
  params: Joi.object().keys({
    tagId: Joi.required().custom(objectId),
  }),
};

module.exports = {
  createTag,
  updateTagById,
  deleteTagById,
  getTagById,
};
