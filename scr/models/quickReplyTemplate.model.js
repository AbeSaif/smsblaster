const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const quickReplyTemplateSchema = mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuickReplyCategory",
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reply: {
      type: String,
      required: true,
      trim: true,
    },
    position: Number,
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
quickReplyTemplateSchema.plugin(toJSON);
quickReplyTemplateSchema.plugin(paginate);

quickReplyTemplateSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const doc = this;
      const count = await mongoose.model("QuickReplyTemplate").countDocuments();
      doc.position = count + 1;
    }
    next();
  } catch (error) {
    next(error);
  }
});

mongoDuplicateKeyError(quickReplyTemplateSchema);

/**
 * @typedef QuickReplyTemplate
 */
const QuickReplyTemplate = mongoose.model(
  "QuickReplyTemplate",
  quickReplyTemplateSchema
);

module.exports = QuickReplyTemplate;
