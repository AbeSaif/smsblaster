const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const statusSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
statusSchema.plugin(toJSON);
statusSchema.plugin(paginate);

mongoDuplicateKeyError(statusSchema);

/**
 * @typedef Status
 */
const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
