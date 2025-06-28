const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const integrationSchema = mongoose.Schema(
  {
    link: {
      type: String,
      unique: true,
      trim: true,
    },
    isZapier: {
      type: Boolean,
      default: false,
    },
    leftMainCri: {
      type: Boolean,
      default: false,
    },
    beastModePodio: {
      type: Boolean,
      default: false,
    },
    foreFrontCrm: {
      type: Boolean,
      default: false,
    },
    reiSift: {
      type: Boolean,
      default: false,
    },
    isCrmActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
integrationSchema.plugin(toJSON);
integrationSchema.plugin(paginate);

integrationSchema.index({ link: 1 }, { unique: true });

mongoDuplicateKeyError(integrationSchema);

const Integration = mongoose.model("Integration", integrationSchema);

module.exports = Integration;
