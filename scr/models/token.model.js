const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const tokenSchema = mongoose.Schema(
  {
    refreshToken: {
      type: String,
      unique: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
tokenSchema.plugin(toJSON);
tokenSchema.plugin(paginate);

/**
 * @typedef Token
 */
const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;
