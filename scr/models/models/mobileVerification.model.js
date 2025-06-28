const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const mobileVerificationSchema = mongoose.Schema(
  {
    npxx: {
      type: Number,
      trim: true,
    },
    npa: {
      type: Number,
      trim: true,
    },
    companyType: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
 
mobileVerificationSchema.index({
  "npa": 1,
  "npxx": 1,
});


// add plugin that converts mongoose to json
mobileVerificationSchema.plugin(toJSON);
mobileVerificationSchema.plugin(paginate);

/**
 * @typedef MobileVerification
 */
const MobileVerification = mongoose.model(
  "MobileVerification",
  mobileVerificationSchema
);

module.exports = MobileVerification;
