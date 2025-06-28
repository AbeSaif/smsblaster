const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("../utils/mongoDuplicateKeyError");

const marketSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    areaCode: {
      type: Number,
      required: true,
      trim: true,
    },
    phone: [{ type: String, required: true, trim: true }],
    phoneNumber: [
      {
        number: {
          type: String,
          required: true,
          trim: true,
        },
        active: { type: Boolean, default: true },
        date: { type: Date },
        sendDailyMessageCount: { type: Number, default: 0 },
        sendMessageCount: { type: Number, default: 0 },
        sendMonthlyMessageCount: { type: Number, default: 0 },
        isBatchCreated: { type: Boolean, default: false },
        phone2QueryCount: { type: Number, default: 0 },
        phone3QueryCount: { type: Number, default: 0 },
      },
    ],
    callForwardingNumber: {
      type: String,
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

marketSchema.index({ phone: 1 });
marketSchema.index({ phoneNumber: 1 });

// add plugin that converts mongoose to json
marketSchema.plugin(toJSON);
marketSchema.plugin(paginate);

mongoDuplicateKeyError(marketSchema);

/**
 * @typedef Market
 */
const Market = mongoose.model("Market", marketSchema);

module.exports = Market;
