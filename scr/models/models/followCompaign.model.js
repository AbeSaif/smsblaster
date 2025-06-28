const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const followCompaignSchema = mongoose.Schema(
  {
    title: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    compaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Compaign",
      required: true,
      trim: true,
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
followCompaignSchema.plugin(toJSON);
followCompaignSchema.plugin(paginate);

mongoDuplicateKeyError(followCompaignSchema);

/**
 * @typedef FollowCompaign
 */
const FollowCompaign = mongoose.model("FollowCompaign", followCompaignSchema);

module.exports = FollowCompaign;
