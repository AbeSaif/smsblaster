const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createDripAutomation = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    messages: Joi.array()
      .items(
        Joi.object({
          content: Joi.string().required(),
          day: Joi.number().required(),
        })
      )
      .required(),
  }),
};

const updateDripAutomation = {
  params: Joi.object().keys({
    dripAutomationId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
    messages: Joi.array()
      .items(
        Joi.object({
          content: Joi.string().optional(),
          day: Joi.number().optional(),
          id: Joi.optional().custom(objectId),
        })
      )
      .required(),
  }),
};

const updateSingleMessage = {
  params: Joi.object().keys({
    messageId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    content: Joi.string().required(),
    dripAutomationId: Joi.required().custom(objectId),
  }),
};
const deleteDripAutomation = {
  params: Joi.object().keys({
    dripAutomationId: Joi.required().custom(objectId),
  }),
};

const assignDripAutomationToInbox = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    dripAutomationId: Joi.required().custom(objectId),
  }),
};

const unAssignDripAutomationToInbox = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
};

module.exports = {
  createDripAutomation,
  updateDripAutomation,
  deleteDripAutomation,
  assignDripAutomationToInbox,
  unAssignDripAutomationToInbox,
  updateSingleMessage,
};
