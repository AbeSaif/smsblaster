const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const activitySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    inbox: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Compaign",
    },
    type: String,
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ inbox: 1 });
activitySchema.index({ createdAt: 1 });

// add plugin that converts mongoose to json
activitySchema.plugin(toJSON);
activitySchema.plugin(paginate);
/**
 * @typedef Activity
 */
const Activity = mongoose.model("Activity", activitySchema);

module.exports = Activity;
