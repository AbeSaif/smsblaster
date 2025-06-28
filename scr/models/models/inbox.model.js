const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const messageSchema = mongoose.Schema({
  content: { type: String, trim: true },
  isViewed: { type: Boolean, default: false },
  creationDate: { type: Date, default: Date.now() },
  isIncoming: { type: Boolean, default: false },
  isOutgoing: { type: Boolean, default: false },
  phone: String,
  bandWidthId: { type: String, default: "" },
  isDripIncomingMessage: { type: Boolean, default: false },
  isDripOutgoingMessage: { type: Boolean, default: false },
  type: {
    type: String,
    enum: ["initial", "follow", "inbox", "drip", "reminder", "other"],
  },
});

const inboxSchema = mongoose.Schema(
  {
    campagin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Compaign",
    },
    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    from: {
      type: String,
    },
    to: {
      type: String,
    },
    messages: [messageSchema],
    phone2: {
      type: String,
      default: "",
    },
    messagesPhone2: [messageSchema],
    phone3: {
      type: String,
      default: "",
    },
    messagesPhone3: [messageSchema],
    sentMessage: {
      type: String,
    },
    receiveMessage: {
      type: String,
    },
    userName: {
      type: String,
    },
    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag",
      },
    ],
    notes: [
      {
        title: String,
        created: { type: Date, default: Date.now },
      },
    ],
    isVerifiedNumber: {
      type: Boolean,
      default: false,
    },
    isVerifiedNumberPhone2: {
      type: Boolean,
      default: false,
    },
    isVerifiedNumberPhone3: {
      type: Boolean,
      default: false,
    },
    isWrongNumber: {
      type: Boolean,
      default: false,
    },
    isWrongNumberPhone2: {
      type: Boolean,
      default: false,
    },
    isWrongNumberPhone3: {
      type: Boolean,
      default: false,
    },
    isAddedToDNC: {
      type: Boolean,
      default: false,
    },
    isAddedToDNCPermanent: {
      type: Boolean,
      default: false,
    },
    isAddedToDNCPhone2: {
      type: Boolean,
      default: false,
    },
    isAddedToDNCPhone2Permanent: {
      type: Boolean,
      default: false,
    },
    isAddedToDNCPhone3: {
      type: Boolean,
      default: false,
    },
    isAddedToDNCPhone3Permanent: {
      type: Boolean,
      default: false,
    },
    isUnAnswered: {
      type: Boolean,
      default: false,
    },
    isUnRead: {
      type: Boolean,
      default: false,
    },
    isIncoming: {
      type: Boolean,
      default: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isReadPhone2: {
      type: Boolean,
      default: false,
    },
    isReadPhone3: {
      type: Boolean,
      default: false,
    },
    isReminderSet: {
      type: Boolean,
      default: false,
    },
    isReminderSetPhone2: {
      type: Boolean,
      default: false,
    },
    isReminderSetPhone3: {
      type: Boolean,
      default: false,
    },
    isPushedToCrm: {
      type: Boolean,
      default: false,
    },
    pushedToCrmDate: {
      type: Date,
    },
    responsePhone: {
      phone1: String,
      phone2: String,
      phone3: String,
    },
    reminder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
    },
    status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      default: new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8"),
    },
    statusDate: {
      type: Date,
      default: Date.now,
    },
    tagDate: {
      type: Date,
      default: Date.now,
    },
    tagDateArray: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        tag: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Tag",
        },
      },
    ],
    companyName: {
      type: String,
      default: "",
    },
    aliasName: {
      type: String,
      default: "",
    },
    propertyAddress: {
      type: String,
      default: "",
    },
    propertyCity: {
      type: String,
      default: "",
    },
    propertyState: {
      type: String,
      default: "",
    },
    propertyZip: {
      type: String,
      default: "",
    },
    dripAutomation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DripAutomation",
    },
    dripAutomationDate: Date,
    dripTimeZone: String,
    dripAutomationSchedule: [
      {
        content: String,
        date: Date,
        day: Number,
        isMessageSend: { type: Boolean, default: false },
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "DripAutomation",
        },
      },
    ],
    lastMessageSendDate: Date,
  },
  {
    timestamps: true,
  }
);

inboxSchema.index({ isIncoming: 1, status: 1, user: 1 });
inboxSchema.index({
  isIncoming: 1,
  campaign: 1,
  status: 1,
  user: 1,
  updatedAt: -1,
});
inboxSchema.index({
  isIncoming: 1,
  tags: 1,
  status: 1,
  user: 1,
  updatedAt: -1,
});
inboxSchema.index({ isIncoming: 1, status: 1, user: 1, updatedAt: -1 });
inboxSchema.index({ isUnAnswered: 1, status: 1, user: 1 });
inboxSchema.index({ isUnRead: 1, status: 1, user: 1 });
inboxSchema.index({ isUnRead: 1, updatedAt: 1, status: 1, user: 1 });
inboxSchema.index({ isUnAnswered: 1, updatedAt: 1, status: 1, user: 1 });
inboxSchema.index({ "messages.content": 1 });
inboxSchema.index({
  propertyAddress: "text",
  propertyCity: "text",
  propertyState: "text",
  propertyZip: "text",
  userName: "text",
  to: "text",
  from: "text",
  phone2: "text",
  phone3: "text",
  "messages.content": "text",
  "messagesPhone2.content": "text",
  "messagesPhone3.content": "text",
});
inboxSchema.index({ "messagesPhone2.content": 1 });
inboxSchema.index({ "messagesPhone3.content": 1 });
inboxSchema.index({ "messages.creationDate": 1 });
inboxSchema.index({ "messagesPhone2.creationDate": 1 });
inboxSchema.index({ "messagesPhone3.creationDate": 1 });
inboxSchema.index({ "messages.creationDate": 1, "messages.isIncoming": 1 });
inboxSchema.index({ "messages.creationDate": 1, from: 1 });
inboxSchema.index({ from: 1 });
inboxSchema.index({ phone1: 1 });
// inboxSchema.index({ "messagesPhone2.isIncoming": 1, updatedAt: -1, status: 1 });
// inboxSchema.index({ "messagesPhone3.isIncoming": 1, updatedAt: -1, status: 1 });
// inboxSchema.index({ "messages.isIncoming": 1, updatedAt: -1, status: 1 });

inboxSchema.index({ updatedAt: -1 });
inboxSchema.index({
  "messagesPhone2.creationDate": 1,
  "messagesPhone2.isIncoming": 1,
});
inboxSchema.index({
  "messagesPhone3.creationDate": 1,
  "messagesPhone3.isIncoming": 1,
});
inboxSchema.index({ "allMessages.isIncoming": 1 });
inboxSchema.index({ "allMessages.creationDate": 1 });
// inboxSchema.index({
//   dripAutomation: 1,
//   "dripAutomationSchedule.isMessageSend": 1,
//   "dripAutomationSchedule.date": 1,
// });
// inboxSchema.index({
//   "dripAutomationSchedule.isMessageSend": 1,
//   "dripAutomationSchedule.date": 1,
// });
// inboxSchema.index({
//   "dripAutomationSchedule.isMessageSend": 1,
// });
// inboxSchema.index({
//   "dripAutomationSchedule.date": 1,
// });
// inboxSchema.index({
//   "dripAutomationSchedule.content": 1,
// });
// inboxSchema.index({
//   "dripAutomationSchedule.day": 1,
// });

inboxSchema.index({ "messages.isIncoming": 1 });
inboxSchema.index({ statusDate: 1 });
inboxSchema.index({ "messagesPhone2.isIncoming": 1 });
inboxSchema.index({ "messagesPhone3.isIncoming": 1 });
inboxSchema.index({ "allMessages.isIncoming": 1 });
inboxSchema.index({ "messages.isViewed": 1 });
inboxSchema.index({ "messagesPhone2.isViewed": 1 });
inboxSchema.index({ "messagesPhone3.isViewed": 1 });
inboxSchema.index({ "messages.isOutgoing": 1 });
inboxSchema.index({ "messagesPhone2.isOutgoing": 1 });
inboxSchema.index({ "messagesPhone3.isOutgoing": 1 });
inboxSchema.index({ dripAutomation: 1 });
inboxSchema.index({ startOfWeekPST: 1, endOfWeekPST: 1 });
inboxSchema.index({ "messages.isOutgoing": 1, "messages.isIncoming": 1 });
inboxSchema.index({ "messages.creationDate": 1, "messages.type": 1 });
inboxSchema.index({
  "messagesPhone2.creationDate": 1,
  "messagesPhone2.type": 1,
});
inboxSchema.index({
  "messagesPhone3.creationDate": 1,
  "messagesPhone3.type": 1,
});
inboxSchema.index({
  "messagesPhone2.isOutgoing": 1,
  "messagesPhone2.isIncoming": 1,
});
inboxSchema.index({
  "messagesPhone3.isOutgoing": 1,
  "messagesPhone3.isIncoming": 1,
});
inboxSchema.index({
  from: 1,
  createdAt: 1,
});
inboxSchema.index({
  campagin: 1,
  status: 1,
  tags: 1,
  createdAt: 1,
});
inboxSchema.index({ status: 1 });
inboxSchema.index({ campagin: 1 });
inboxSchema.index({ batch: 1 });
inboxSchema.index({ tags: 1 });
inboxSchema.index({
  to: 1,
  isAddedToDNC: 1,
  isWrongNumber: 1,
  "messages.bandWidthId": 1,
});
inboxSchema.index({
  phone2: 1,
  isAddedToDNCPhone2: 1,
  isWrongNumberPhone2: 1,
  "messagesPhone2.bandWidthId": 1,
});
inboxSchema.index({
  phone3: 1,
  isAddedToDNCPhone3: 1,
  isWrongNumberPhone3: 1,
  "messagesPhone3.bandWidthId": 1,
});
inboxSchema.index({ from: 1, to: 1, updatedAt: -1 });
inboxSchema.index({ from: 1, to: 1 });
inboxSchema.index({
  isVerifiedNumberPhone2: 1,
  "messages.isIncoming": 1,
  updatedAt: 1,
});

inboxSchema.index({
  isVerifiedNumber: 1,
  "messages.isIncoming": 1,
  updatedAt: 1,
});

inboxSchema.index({
  isVerifiedNumberPhone2: 1,
  "messagesPhone3.isIncoming": 1,
  updatedAt: 1,
});
inboxSchema.index({
  isVerifiedNumberPhone2: 1,
  "messagesPhone2.isIncoming": 1,
  updatedAt: 1,
});
inboxSchema.index({
  isVerifiedNumber: 1,
  "messagesPhone3.isIncoming": 1,
  updatedAt: 1,
});

// Pre-save hook to ensure `statusDate` and `tagDate` are set to `createdAt` when a document is created
inboxSchema.pre("save", function (next) {
  if (this.isNew) {
    // Set statusDate and tagDate to createdAt if they aren't manually set
    this.statusDate = this.createdAt;
    this.tagDate = this.createdAt;
  }
  next();
});

inboxSchema.statics.paginate = async function (filter, options) {
  const sort = buildSort(options.sortBy); // Helper function to build sort for aggregation

  const limit =
    options.limit && parseInt(options.limit) > 0
      ? parseInt(options.limit)
      : 5000;
  const page =
    options.page && parseInt(options.page) > 0 ? parseInt(options.page) : 1;
  const skip = (page - 1) * limit;

  const countPromise = this.countDocuments(filter).exec();

  const aggregationPipeline = [
    { $match: filter },
    { $sort: sort },
    { $skip: skip },
    { $limit: limit },
  ];

  if (options.populate) {
    options.populate.split(",").forEach((populateOption) => {
      const path = populateOption.split(".");
      aggregationPipeline.push({
        $lookup: {
          from: path[0], // Assuming the path corresponds to a collection
          localField: path[1], // Assuming the second part is the local field
          foreignField: "_id", // Assuming the foreign field is the _id field
          as: path.join("_"), // Create a new array with joined path
        },
      });
    });
  }

  const docsPromise = this.aggregate(aggregationPipeline).exec();

  return Promise.all([countPromise, docsPromise]).then((values) => {
    const [totalResults, results] = values;
    const totalPages = Math.ceil(totalResults / limit);
    const result = {
      results,
      page,
      limit,
      totalPages,
      totalResults,
    };
    return Promise.resolve(result);
  });
};

function buildSort(sortBy) {
  if (!sortBy) return null;

  const sort = {};
  sortBy.split(",").forEach((sortOption) => {
    const [key, order] = sortOption.split(":");
    const mappedKey = mapSortKey(key);
    sort[mappedKey] = order === "desc" ? -1 : 1;
  });

  return sort;
}

function mapSortKey(key) {
  const map = {
    "messages.creationDate": "messages.creationDate",
    "messagesPhone2.creationDate": "messagesPhone2.creationDate",
    "messagesPhone3.creationDate": "messagesPhone3.creationDate",
  };

  if (!map[key]) {
    const nestedKey = Object.keys(map).find((k) => key.startsWith(k));
    if (nestedKey) {
      return key.replace(nestedKey, map[nestedKey]);
    }
  }

  return map[key] || key;
}

// add plugin that converts mongoose to json
inboxSchema.plugin(toJSON);
inboxSchema.plugin(paginate);

const Inbox = mongoose.model("Inbox", inboxSchema);

module.exports = Inbox;
