const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const batchSchema = mongoose.Schema(
  {
    campagin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Compaign",
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InitialAndFollowTemplate",
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Market",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    messageSent: {
      type: String,
    },
    batchSize: {
      type: Number,
    },
    lastSent: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["paused", "completed", "pending", "cancelled", "failed"],
      default: "paused",
    },
    batchDate: {
      type: Date,
    },
    batchNumber: {
      type: Number,
    },
    sentMessage: {
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
    totalProspects: {
      type: Number,
      default: 0,
    },

    batchTotalProspects: {
      type: Number,
      default: 0,
    },
    batchSendMessage: {
      type: Number,
      default: 0,
    },
    batchActive: {
      type: Boolean,
      default: true,
    },
    batchSenderNumber: {
      type: String,
    },
    totalMessagesInQueue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// batchSchema.index({ user: 1 });
// batchSchema.index({ admin: 1 });
batchSchema.index({ createdAt: -1 });
batchSchema.index({ user: 1, admin: 1 });

// add plugin that converts mongoose to json
batchSchema.plugin(toJSON);
batchSchema.plugin(paginate);

batchSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const highestBatch = await this.model("Batch")
        .findOne({}, { batchNumber: 1 }, { sort: { batchNumber: -1 } })
        .exec();

      if (highestBatch && highestBatch.batchNumber) {
        this.batchNumber = highestBatch.batchNumber + 1;
      } else {
        this.batchNumber = 1;
      }
      if (!this.batchDate) {
        this.batchDate = new Date();
      }

      if (!this.lastSent) {
        this.lastSent = new Date();
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

const Batch = mongoose.model("Batch", batchSchema);

module.exports = Batch;
