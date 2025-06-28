const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("../utils/mongoDuplicateKeyError");
 
const dncSchema = mongoose.Schema(
  {
    number: {
      type: String,
      trim: true,
      unique: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    permanent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

dncSchema.index({ number: 1 });

// add plugin that converts mongoose to json
dncSchema.plugin(toJSON);
dncSchema.plugin(paginate);

mongoDuplicateKeyError(dncSchema);

/**
 * @typedef DNC
 */
const DNC = mongoose.model("DNC", dncSchema);

module.exports = DNC;
