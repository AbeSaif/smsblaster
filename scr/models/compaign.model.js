const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const compaignSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      trim: true,
    },
    phone: [
      {
        type: String,
        trim: true,
      },
    ],
    title: {
      type: String,
      trim: true,
    },
    compaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Compaign",
      trim: true,
    },
    followMarket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
      trim: true,
    },
    permission: {
      type: String,
      enum: [
        "compaign",
        "followCompaign",
        "followCompaign2",
        "followCompaign3",
      ],
      default: "compaign",
    },
    sentALL: {
      type: Number,
      default: 0,
    },
    sent: {
      type: Number,
      default: 0,
    },
    remaning: {
      type: Number,
      default: 0,
    },
    delivered: {
      type: String,
      default: 0,
    },
    response: {
      type: Number,
      default: 0,
    },
    totalDelivered: {
      type: Number,
      default: 0,
    },
    totalResponse: {
      type: Number,
      default: 0,
    },
    totalProspects: {
      type: Number,
      default: 0,
    },
    totalProspectsRemaining: {
      type: Number,
      default: 0,
    },
    totalProspectsprevious: {
      type: Number,
      default: 0,
    },
    hot: {
      type: Number,
      default: 0,
    },
    drip: {
      type: Number,
      default: 0,
    },
    warm: {
      type: Number,
      default: 0,
    },
    nurture: {
      type: Number,
      default: 0,
    },
    totalLead: {
      type: Number,
      default: 0,
    },
    directImport: [],
  },
  {
    timestamps: true,
  }
);

compaignSchema.index({ directImportId: 1 });
compaignSchema.index({ totalProspects: 1 });
// add plugin that converts mongoose to json
compaignSchema.plugin(toJSON);
compaignSchema.plugin(paginate);

mongoDuplicateKeyError(compaignSchema);

/**
 * @typedef Compaign
 */
const Compaign = mongoose.model("Compaign", compaignSchema);

module.exports = Compaign;
