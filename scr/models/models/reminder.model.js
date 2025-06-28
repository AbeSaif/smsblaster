const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const reminderSchema = mongoose.Schema(
  {
    prospect: {
      type: String,
    },
    from: {
      type: String,
    },
    to: {
      type: String,
    },
    note: {
      type: String,
    },
    message: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now(),
    },
    inbox: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inbox",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

reminderSchema.index({ user: 1 });
reminderSchema.index({ inbox: 1 });
reminderSchema.index({ inbox: 1, user: 1 });

// add plugin that converts mongoose to json
reminderSchema.plugin(toJSON);
reminderSchema.plugin(paginate);

mongoDuplicateKeyError(reminderSchema);

/**
 * @typedef Reminder
 */
const Reminder = mongoose.model("Reminder", reminderSchema);

module.exports = Reminder;
