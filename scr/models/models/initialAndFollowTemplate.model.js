const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const messageSchema = mongoose.Schema(
  {
    message1: {
      type: String,
      required: true,
      trim: true,
    },
    message2: {
      type: String,
      required: true,
      trim: true,
    },
    message3: {
      type: String,
      required: true,
      trim: true,
    },
    message4: {
      type: String,
      required: true,
      trim: true,
    },
    altMessage: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const initialAndFollowSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    messages: [messageSchema],
    type: {
      type: String,
      enum: [
        "Residential",
        "Commercial",
        "Land",
        "Multi Family",
        "Pre-Foreclosure / Liens / Auction",
        "Probate / Bankruptcy",
        "Vacant / Absentee",
      ],
      required: true,
      trim: true,
    },
    delivery: {
      type: Number,
    },
    response: {
      type: Number,
    },
    mode: {
      type: String,
      enum: ["initial", "follow"],
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    deliveredPercentage: {
      type: Number,
      default: 0,
    },
    responsePercentage: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound indexes to ensure uniqueness within each mode
initialAndFollowSchema.index(
  { "messages.message1": 1, mode: 1 },
  { unique: true }
);
initialAndFollowSchema.index(
  { "messages.message2": 1, mode: 1 },
  { unique: true }
);
initialAndFollowSchema.index(
  { "messages.message3": 1, mode: 1 },
  { unique: true }
);
initialAndFollowSchema.index(
  { "messages.message4": 1, mode: 1 },
  { unique: true }
);

// Add plugin that converts mongoose to JSON
initialAndFollowSchema.plugin(toJSON);
initialAndFollowSchema.plugin(paginate);

mongoDuplicateKeyError(initialAndFollowSchema);

// Pre-save hook to check for follow templates when creating initial templates
initialAndFollowSchema.pre("save", async function (next) {
  const template = this;
  if (template.isNew && template.mode === "initial") {
    const followTemplateExists =
      await mongoose.models.InitialAndFollowTemplate.exists({
        mode: "follow",
        $or: [
          { "messages.message1": template.messages[0].message1 },
          { "messages.message2": template.messages[0].message2 },
          { "messages.message3": template.messages[0].message3 },
          { "messages.message4": template.messages[0].message4 },
        ],
      });

    if (followTemplateExists) {
      const error = new Error(
        "This template already exists in the Follow-up Templates section."
      );
      error.status = 400;
      return next(error);
    }
  }
  next();
});

/**
 * @typedef InitialAndFollowTemplate
 */
const InitialAndFollowTemplate = mongoose.model(
  "InitialAndFollowTemplate",
  initialAndFollowSchema
);

module.exports = InitialAndFollowTemplate;
