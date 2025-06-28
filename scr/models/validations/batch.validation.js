const Joi = require("joi");
const { objectId } = require("./custom.validation");

const createBatch = {
  body: Joi.object().keys({
    campagin: Joi.required().custom(objectId),
    template: Joi.required().custom(objectId),
    batchSize: Joi.number().required(),
  }),
};

const updateBatchById = {
  params: Joi.object().keys({
    batchId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().optional(),
  }),
};

const getBatchById = {
  params: Joi.object().keys({
    batchId: Joi.required().custom(objectId),
  }),
};

const deleteBatchById = {
  params: Joi.object().keys({
    batchId: Joi.required().custom(objectId),
  }),
};

const sendMessage = {
  body: Joi.object().keys({
    phone: Joi.string().required(),
    phoneId: Joi.any().optional(),
    batchId: Joi.required().custom(objectId),
    userName: Joi.string().required(),
    companyName: Joi.string().optional(),
    aliasName: Joi.string().optional(),
    message: Joi.string().required(),
    senderPhoneNumber: Joi.string().required().messages({
      "any.required": "Selected Campaign market is currently Deactivated",
    }),
    completed: Joi.any().optional(),
    batchSendMessage: Joi.number().optional(),
    campaign: Joi.optional().custom(objectId),
  }),
};

const addTagToInbox = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    tagId: Joi.required().custom(objectId),
  }),
};

const addNoteToInbox = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    title: Joi.string().required(),
  }),
};

const getNoteOfInbox = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
};

const deleteNoteOfInbox = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    noteId: Joi.required().custom(objectId),
  }),
};

const changeStatusOfNumber = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    phone: Joi.string().optional(),
    phone2: Joi.string().optional(),
    phone3: Joi.string().optional(),
  }),
};

const setReminder = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    prospect: Joi.string().required(),
    note: Joi.string().required(),
    message: Joi.string().required(),
    date: Joi.date().required(),
    isVerified: Joi.boolean().required(),
  }),
};

const getReminder = {
  params: Joi.object().keys({
    reminderId: Joi.required().custom(objectId),
  }),
};

const markAsRead = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
};

const addStatusInInboxs = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    status: Joi.string().required(),
    phone: Joi.string().optional().messages({
      "string.empty": "Lead's response required to change status.",
    }),
    phone2: Joi.string().optional().messages({
      "string.empty": "Lead's response required to change status.",
    }),
    phone3: Joi.string().optional().messages({
      "string.empty": "Lead's response required to change status.",
    }),
  }),
};

const deleteStatusInInboxs = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    phone: Joi.string().optional(),
    phone2: Joi.string().optional(),
    phone3: Joi.string().optional(),
  }),
};

const updateReminder = {
  params: Joi.object().keys({
    reminderId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    prospect: Joi.string().optional(),
    note: Joi.string().optional(),
    message: Joi.string().optional(),
    date: Joi.date().optional(),
    isVerified: Joi.boolean().optional(),
  }),
};

const changeTemplate = {
  params: Joi.object().keys({
    batchId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    template: Joi.required().custom(objectId),
  }),
};
const pushDataIntoCrm = {
  body: Joi.object().keys({
    listName: Joi.string().optional(),
    uploadedAt: Joi.date().optional(),
    id: Joi.number().optional(),
    firstName: Joi.string().optional(),
    lastName: Joi.string().optional(),
    propertyAddress: Joi.string().optional(),
    propertyCity: Joi.string().optional(),
    propertyState: Joi.string().optional(),
    propertyZip: Joi.string().optional(),
    mailingAddress: Joi.string().optional(),
    mailingState: Joi.string().optional(),
    mailingCity: Joi.string().optional(),
    mailingZip: Joi.string().optional(),
    phone1: Joi.string().optional(),
    phone2: Joi.string().optional(),
    phone3: Joi.string().optional(),
    status: Joi.number().optional(),
    delivered: Joi.number().optional(),
    response: Joi.number().optional(),
    undelivered: Joi.number().optional(),
    created_at: Joi.date().optional(),
    updated_at: Joi.date().optional(),
    directImportId: Joi.optional().custom(objectId),
    inbox: Joi.required().custom(objectId),
    batchId: Joi.optional().custom(objectId),
    isverified: Joi.any().optional(),
    campaignId: Joi.any().optional(),
    campaignId1: Joi.any().optional(),
    campaignId2: Joi.any().optional(),
    campaignId3: Joi.any().optional(),
    status2: Joi.any().optional(),
    status3: Joi.any().optional(),
    delivered2: Joi.any().optional(),
    delivered3: Joi.any().optional(),
    response2: Joi.any().optional(),
    response3: Joi.any().optional(),
    msgDate: Joi.any().optional(),
    companyName: Joi.any().optional(),
    aliasName: Joi.any().optional(),
  }),
};

const changeProspectName = {
  params: Joi.object().keys({
    inboxId: Joi.required().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const customDateRangeValidator = (value, helpers) => {
  const startOfMonth = new Date(value.from);
  const lastOfMonth = new Date(value.to);

  // Calculate the difference in months
  const monthDifference =
    (lastOfMonth.getFullYear() - startOfMonth.getFullYear()) * 12 +
    (lastOfMonth.getMonth() - startOfMonth.getMonth());
  // Check if the difference is greater than 6 months
  if (monthDifference > 6) {
    return helpers.error("custom.invalidDateRange", {
      customDateRange: "The date range must not be greater than 6 months.",
    });
  }

  return value;
};

const customMessages = {
  "any.required": "{{#label}} is required.",
  "array.includesOne": "{{#label}} is required",
};
const exportProspects = {
  body: Joi.object()
    .keys({
      campagin: Joi.array()
        .items(Joi.required().custom(objectId).messages(customMessages))
        .required()
        .messages({
          "array.includesOne": "campaign is required",
        }),
      status: Joi.any().optional(),
      tags: Joi.array().items(Joi.optional().custom(objectId)).optional(),
      monthDates: Joi.object()
        .keys({
          from: Joi.date().required(),
          to: Joi.date().required(),
        })
        .custom(customDateRangeValidator, "custom date range validation")
        .optional(),
      isEmail: Joi.boolean().optional(),
      email: Joi.string().email().optional(),
      isLeadVerified: Joi.boolean().optional(),
    })
    .messages({
      "custom.invalidDateRange":
        "The date range must not be greater than 6 months.",
    }),
};

const connectCrm = {
  body: Joi.object().keys({
    link: Joi.string().uri().required(),
    isZapier: Joi.boolean().required(),
    leftMainCri: Joi.boolean().required(),
    beastModePodio: Joi.boolean().required(),
    foreFrontCrm: Joi.boolean().required(),
    reiSift: Joi.boolean().required(),
  }),
};

const updateCrm = {
  body: Joi.object().keys({
    link: Joi.string().uri().required(),
    integratedObjectId: Joi.required().custom(objectId),
  }),
};

const verifyCrm = {
  body: Joi.object().keys({
    link: Joi.string().uri().required(),
  }),
};

const changeCrmStatus = {
  body: Joi.object().keys({
    isCrmActive: Joi.boolean().required(),
    integratedObjectId: Joi.required().custom(objectId),
  }),
};

module.exports = {
  createBatch,
  updateBatchById,
  deleteBatchById,
  getBatchById,
  sendMessage,
  addTagToInbox,
  addNoteToInbox,
  getNoteOfInbox,
  deleteNoteOfInbox,
  changeStatusOfNumber,
  setReminder,
  getReminder,
  markAsRead,
  updateReminder,
  addStatusInInboxs,
  changeTemplate,
  deleteStatusInInboxs,
  pushDataIntoCrm,
  changeProspectName,
  exportProspects,
  connectCrm,
  updateCrm,
  verifyCrm,
  changeCrmStatus,
};
