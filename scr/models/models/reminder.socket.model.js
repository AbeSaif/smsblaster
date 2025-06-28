const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const reminderSocketSchema = mongoose.Schema(
  {
    socketId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
reminderSocketSchema.plugin(toJSON);
reminderSocketSchema.plugin(paginate);

mongoDuplicateKeyError(reminderSocketSchema);

/**
 * @typedef ReminderSocket
 */
const ReminderSocket = mongoose.model("ReminderSocket", reminderSocketSchema);

module.exports = ReminderSocket;
