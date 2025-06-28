const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const loginAttemptSchema = mongoose.Schema(
  {
    ip: String,
    browser: String,
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

// add plugin that converts mongoose to json
loginAttemptSchema.plugin(toJSON);
loginAttemptSchema.plugin(paginate);

const LoginAttempt = mongoose.model("LoginAttempt", loginAttemptSchema);

module.exports = LoginAttempt;
