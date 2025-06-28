const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const quickReplyCategorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["soft", "hard"],
      default: "soft",
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
quickReplyCategorySchema.plugin(toJSON);
quickReplyCategorySchema.plugin(paginate);

mongoDuplicateKeyError(quickReplyCategorySchema);

/**
 * @typedef QuickReplyCategory
 */
const QuickReplyCategory = mongoose.model(
  "QuickReplyCategory",
  quickReplyCategorySchema
);

module.exports = QuickReplyCategory;
