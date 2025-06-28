const Joi = require("joi");
const { objectId } = require("./custom.validation");

const objectSchema = Joi.object({
  message1: Joi.string().required(),
  message2: Joi.string().required(),
  message3: Joi.string().required(),
  message4: Joi.string().required(),
  altMessage: Joi.string().required(),
});

const createInitialAndFollowTemplate = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    messages: Joi.array().items(objectSchema).required(),
    type: Joi.string()
      .required()
        .valid(
        "Residential",
        "Commercial",
        "Land",
        "Multi Family",
        "Pre-Foreclosure / Liens / Auction",
        "Probate / Bankruptcy",
        "Vacant / Absentee"
      ),
    delivery: Joi.number().optional(),
    response: Joi.number().optional(),
    mode: Joi.string().required().valid("initial", "follow"),
  }),
};

const updateObjectSchema = Joi.object({
  message1: Joi.string().optional(),
  message2: Joi.string().optional(),
  message3: Joi.string().optional(),
  message4: Joi.string().optional(),
  altMessage: Joi.string().optional(),
});

const updateInitialAndFollowTemplateById = {
  params: Joi.object().keys({
    initialAndFollowTemplateId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
    messages: Joi.array().items(updateObjectSchema).optional(),
    type: Joi.string()
      .optional()
      .valid(
        "Residential",
        "Commercial",
        "Land",
        "Multi Family",
        "Pre-Foreclosure / Liens / Auction",
        "Probate / Bankruptcy",
        "Vacant / Absentee"
      ),
    delivery: Joi.number().optional(),
    response: Joi.number().optional(),
  }),
};

const deleteInitialAndFollowTemplateById = {
  params: Joi.object().keys({
    initialAndFollowTemplateId: Joi.required().custom(objectId),
  }),
};
module.exports = {
  createInitialAndFollowTemplate,
  updateInitialAndFollowTemplateById,
  deleteInitialAndFollowTemplateById,
};
