const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("../utils/mongoDuplicateKeyError");

const dripAutomationSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
    },
    messages: [
      {
        content: String,
        day: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
dripAutomationSchema.plugin(toJSON);
dripAutomationSchema.plugin(paginate);

mongoDuplicateKeyError(dripAutomationSchema);
/**
 * @typedef DripAutomation
 */
const DripAutomation = mongoose.model("DripAutomation", dripAutomationSchema);

module.exports = DripAutomation;
