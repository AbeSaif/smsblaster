const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const directImportSchema = mongoose.Schema(
  {
    csvData: {
      type: String,
    },
    elastickSearchId: {
      type: String,
    },
    excistingMatches: {
      type: Number,
      trim: true,
      default: 0,
    },
    dnc: {
      type: Number,
      default: 0,
    },
    isCampaignAssigned: {
      type: Boolean,
      default: false,
    },
    assignedCompaignCount: {
      type: Number,
      default: 0,
    },
    totalRows: {
      type: Number,
      default: 0,
    },
    totalPropspects: {
      type: Number,
      default: 0,
    },
    mobile: {
      type: Number,
      default: 0,
    },
    landlines: {
      type: Number,
      default: 0,
    },
    litigators: {
      type: Number,
      default: 0,
    },
    listName: {
      type: String,
    },
    assignCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Compaign",
    },
    assignCamapingCompleted: {
      type: Boolean,
      default: false,
    },
    assignFollowUpCampaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FollowCompaign",
    },
    isFollowCampaignAssigned: {
      type: Boolean,
      default: false,
    },
    assignedFollowCompaignCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "complete"],
      default: "pending",
    },
    csvDownloadFile: {
      type: String,
    },
    orgFile: {
      type: String,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    delivered: {
      type: Number,
      default: 0,
    },
    response: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
directImportSchema.plugin(toJSON);
directImportSchema.plugin(paginate);

const DirectImport = mongoose.model("DirectImport", directImportSchema);

module.exports = DirectImport;
