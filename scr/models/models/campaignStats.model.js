const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const campaignStatsSchema = mongoose.Schema(
  {
    campagin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Compaign",
    },
    sent: {
      type: String,
      trim: true,
    },
    delivered: {
      type: String,
      trim: true,
    },
    totalDelivered: {
      type: String,
      trim: true,
    },
    response: {
      type: String,
      trim: true,
    },
    totalResponse: {
      type: String,
      trim: true,
    },
    remaning: {
      type: String,
      trim: true,
    },
    totalLead: {
      type: String,
      trim: true,
    },
    totalHotLeads: {
      type: String,
      trim: true,
    },
    totalDripLeads:{
      type: String,
      trim: true,
    },
    sentphone1: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);



// add plugin that converts mongoose to json
campaignStatsSchema.plugin(toJSON);
campaignStatsSchema.plugin(paginate);

/**
 * @typedef CampaignStats
 */
const CampaignStats = mongoose.model("CampaignStats", campaignStatsSchema);

module.exports = CampaignStats;
