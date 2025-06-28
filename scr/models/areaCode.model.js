const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const areaCodeSchema = mongoose.Schema(
  {
    areaCode: {
      type: Number,
      unique: true,
      trim: true,
    },
    timeZone: {
      type: String,
      trim: true,
    },
    abbrevation: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
areaCodeSchema.plugin(toJSON);
areaCodeSchema.plugin(paginate);

mongoDuplicateKeyError(areaCodeSchema);

/**
 * @typedef AreaCode
 */
const AreaCode = mongoose.model("AreaCode", areaCodeSchema);

module.exports = AreaCode;
