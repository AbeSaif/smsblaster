const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const flagSchema = mongoose.Schema(
  {
    time: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
    to: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    message: {
      id: {
        type: String,
        trim: true,
      },
      owner: {
        type: String,
        trim: true,
      },
      applicationId: {
        type: String,
        trim: true,
      },
      time: {
        type: String,
        trim: true,
      },
      segmentCount: {
        type: String,
        trim: true,
      },
      direction: {
        type: String,
        trim: true,
      },
      to: {
        type: [String],
        trim: true,
      },
      from: {
        type: String,
        trim: true,
      },
      text: {
        type: String,
        trim: true,
      },
      tag: {
        type: String,
        trim: true,
      },
    },
    errorCode: {
      type: Number,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

flagSchema.index({ createdAt: 1, errorCode: 1 });
flagSchema.index({ errorCode: 1 });
flagSchema.index({ "message.from": 1 });
flagSchema.index({ to: 1 });
// add plugin that converts mongoose to json
flagSchema.plugin(toJSON);
flagSchema.plugin(paginate);

/**
 * @typedef Flag
 */
const Flag = mongoose.model("Flag", flagSchema);

module.exports = Flag;
