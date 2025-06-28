const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const tagSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    color: {
      type: String,
      unique: true,
      required: true,
    },
    prospect: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tagSchema.plugin(toJSON);
tagSchema.plugin(paginate);

mongoDuplicateKeyError(tagSchema);

/**
 * @typedef Tag
 */
const Tag = mongoose.model("Tag", tagSchema);

module.exports = Tag;
