const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const inboxDripAutomationSchema = mongoose.Schema(
  {
    dripName: {
      type: String,
      trim: true,
      index: true,
    },
    dripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DripAutomation",
      index: true,
    },
    inboxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inbox",
      index: true,
    },
    dripAutomationDate: {
      type: Date,
    },
    dripTimeZone: String,
    date: {
      type: Date,
      index: true,
    },
    content: {
      type: String,
      trim: true,
    },
    day: {
      type: Number,
      trim: true,
    },
    isMessageSend: {
      type: Boolean,
      default: false,
      index: true,
    },
    dripContentId: String,
  },
  {
    timestamps: true,
  }
);

inboxDripAutomationSchema.index({ inboxId: 1, dripScheduledDate: 1 });
inboxDripAutomationSchema.index({ isMessageSend: 1, dripScheduledDate: 1 });
inboxDripAutomationSchema.index({ inboxId: 1, dripId: 1, isMessageSend: 1 });
inboxDripAutomationSchema.index({ date: 1, isMessageSend: 1 });
inboxDripAutomationSchema.index({ inboxId: 1, dripId: 1 });
inboxDripAutomationSchema.index({ dripId: 1, inboxId: 1, dripName: 1 });
inboxDripAutomationSchema.index({ dripId: 1, inboxId: 1 });

// add plugin that converts mongoose to json
inboxDripAutomationSchema.plugin(toJSON);
inboxDripAutomationSchema.plugin(paginate);

/**
 * @typedef InboxDripAutomation
 */

const InboxDripAutomation = mongoose.model(
  "InboxDripAutomation",
  inboxDripAutomationSchema
);

module.exports = InboxDripAutomation;
