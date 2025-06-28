const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const dashStatsSchema = mongoose.Schema(
  {
    unRead: {
      type: Number,
    },
    unAnswered: {
      type: Number,
    },
    inboxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inbox",
    },
    userId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

dashStatsSchema.index({ inboxId: 1 });
dashStatsSchema.index({ userId: 1, createdAt: 1, unRead: 1, unAnswered: 1 });
dashStatsSchema.index({ createdAt: 1, unRead: 1, unAnswered: 1 });
dashStatsSchema.index({ createdAt: 1, unRead: 1 });
dashStatsSchema.index({ createdAt: 1, unAnswered: 1 });
// add plugin that converts mongoose to json
dashStatsSchema.plugin(toJSON);
dashStatsSchema.plugin(paginate);

/**
 * @typedef CampaignStats
 */
const DashStats = mongoose.model("DashStats", dashStatsSchema);

module.exports = DashStats;
