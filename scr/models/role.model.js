const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const roleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    permissions: [
      {
        type: String,
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
roleSchema.plugin(toJSON);
roleSchema.plugin(paginate);

mongoDuplicateKeyError(roleSchema);

/**
 * @typedef Role
 */
const Role = mongoose.model("Role", roleSchema);

module.exports = Role;
