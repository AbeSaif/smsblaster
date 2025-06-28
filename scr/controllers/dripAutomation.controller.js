const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");
const { dripAutomationService } = require("../services");
const pick = require("../utils/pick");
const {
  Inbox,
  CsvData,
  Activity,
  Tag,
  Market,
  InboxDripAutomation,
} = require("../models");
const { Client, ApiController } = require("@bandwidth/messaging");
const moment = require("moment-timezone");
const BW_USERNAME = "ZeitBlast_API";
const BW_PASSWORD = "AnjumAPI2024!";
const BW_ACCOUNT_ID = "5009813";
const BW_MESSAGING_APPLICATION_ID = process.env.dev_bw_id;
const client = new Client({
  basicAuthUserName: BW_USERNAME,
  basicAuthPassword: BW_PASSWORD,
});
const controller = new ApiController(client);
const accountId = BW_ACCOUNT_ID;

const createDripAutomation = catchAsync(async (req, res) => {
  let body = req.body;
  body.messages = body.messages.sort((a, b) => a.day - b.day);
  body.messages.forEach((item) => {
    if (item.day === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Day must be greater than zero."
      );
    }
  });
  const dripAutomation = await dripAutomationService.createDripAutomation(body);
  res.status(httpStatus.CREATED).send(dripAutomation);
});

const getAllDripAutomation = catchAsync(async (req, res) => {
  let filter = {};
  let options = {};
  if (!req.query.search) {
    options = pick(req.query, ["limit", "page"]);
  }
  options.sortBy = "createdAt:desc";
  if (req.query.search) {
    filter = {
      name: {
        $regex: req.query.search,
        $options: "i",
      },
    };
  }
  const dripAutomation = await dripAutomationService.getAllDripAutomation(
    filter,
    options
  );
  res.status(httpStatus.CREATED).send(dripAutomation);
});

const updateDripAutomation = catchAsync(async (req, res) => {
  let { dripAutomationId } = req.params;
  let body = req.body;
  body.messages = body.messages.sort((a, b) => a.day - b.day);
  body.messages.forEach((item) => {
    if (item.day === 0) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Day must be greater than zero."
      );
    }
  });
  const dripAutomation = await dripAutomationService.updateDripAutomation(
    dripAutomationId,
    body
  );
  res.status(httpStatus.CREATED).send(dripAutomation);
});

const deleteDripAutomation = catchAsync(async (req, res) => {
  let { dripAutomationId } = req.params;
  const dripAutomation = await dripAutomationService.deleteDripAutomation(
    dripAutomationId
  );
  res.status(httpStatus.CREATED).send(dripAutomation);
});

const assignDripAutomationToInbox = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  const inbox = await dripAutomationService.assignDripAutomationToInbox(
    inboxId,
    body
  );
  res.status(httpStatus.CREATED).send(inbox);
});

const unAssignDripAutomationToInbox = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  const inbox = await dripAutomationService.unAssignDripAutomationToInbox(
    inboxId
  );
  res.status(httpStatus.CREATED).send(inbox);
});

function replacePlaceholders(messageTemplate, data) {
  const matches = messageTemplate.match(/\[([^\]]+)\]/g);
  if (matches) {
    matches.forEach((match) => {
      const options = match.substring(1, match.length - 1).split("/");
      const randomValue = options[Math.floor(Math.random() * options.length)];
      messageTemplate = messageTemplate.replace(match, randomValue);
    });
  }
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      const placeholder = `{${key}}`;
      messageTemplate = messageTemplate.replace(
        new RegExp(placeholder, "g"),
        data[key]
      );
    }
  }
  return messageTemplate;
}

const sendAutoDrip = async (req, res, io, userSocketMap, redisPublisher) => {
  let userId = "";
  try {
    let marketData = await Market.find({}).lean();
    if (marketData.length <= 0) {
      return res.status(201).send({ message: "No market found" });
    }

    for (const market of marketData) {
      const timeZone = market.timeZone;
      const now = moment().tz(timeZone).toDate();

      // Fetch due drip automations in parallel
      const dueDripAutomations = await InboxDripAutomation.find({
        $and: [{ date: { $lte: now } }, { isMessageSend: false }],
      });

      if (dueDripAutomations.length > 0) {
        // Process due drip automations concurrently
        await Promise.all(
          dueDripAutomations.map(async (dripAutomation) => {
            const inboxOfDrip = await Inbox.findById(dripAutomation?.inboxId);

            if (market.phone.includes(inboxOfDrip?.from.toString())) {
              const detailInbox = await CsvData.findOne({
                phone1: String(inboxOfDrip?.to),
              });
              if (inboxOfDrip && detailInbox) {
                // Prepare data for message content
                const {
                  firstName,
                  lastName,
                  mailingAddress,
                  mailingCity,
                  mailingState,
                  mailingZip,
                  propertyAddress,
                  propertyCity,
                  propertyState,
                  propertyZip,
                  apn,
                  propertyCounty,
                  acreage,
                } = detailInbox;
                const data = {
                  FirstName: firstName,
                  LastName: lastName,
                  MailingAddress: mailingAddress,
                  MailingCity: mailingCity,
                  MailingState: mailingState,
                  MailingZip: mailingZip,
                  PropertyAddress: propertyAddress,
                  "No#Address": propertyAddress
                    ? propertyAddress.replace(/\d+/g, "")
                    : "",
                  PropertyCity: propertyCity,
                  PropertyCountry: propertyState,
                  PropertyState: propertyState,
                  PropertyZIP: propertyZip,
                  CompanyName: inboxOfDrip?.companyName,
                  AliasRepName: inboxOfDrip?.aliasName,
                  APN: apn,
                  PROPERTYCOUNTY: propertyCounty,
                  ACREAGE: acreage,
                };

                // Update content with placeholders
                dripAutomation.content = replacePlaceholders(
                  dripAutomation?.content,
                  data
                );

                // Determine the verified number
                const verifiedNumber = inboxOfDrip.isVerifiedNumber
                  ? inboxOfDrip.to
                  : inboxOfDrip.isVerifiedNumberPhone2
                  ? inboxOfDrip.phone2
                  : inboxOfDrip.isVerifiedNumberPhone3
                  ? inboxOfDrip.phone3
                  : "";

                if (verifiedNumber) {
                  // Send message and update the message state in parallel
                  await Promise.all([
                    controller.createMessage(accountId, {
                      applicationId: BW_MESSAGING_APPLICATION_ID,
                      to: [verifiedNumber],
                      from: inboxOfDrip?.from,
                      text: dripAutomation?.content,
                    }),
                    InboxDripAutomation.findByIdAndUpdate(
                      dripAutomation._id,
                      { $set: { isMessageSend: true } },
                      { new: true, timestamps: false }
                    ),
                  ]);

                  // Prepare message body
                  const messageBody = {
                    content: dripAutomation?.content,
                    phone: verifiedNumber,
                    creationDate: new Date(),
                    isIncoming: false,
                    isOutgoing: true,
                    isViewed: false,
                    isDripOutgoingMessage: true,
                    type: "drip",
                  };

                  // Find the old inbox and update it
                  const filter = {
                    $or: [
                      { to: verifiedNumber },
                      { phone2: verifiedNumber },
                      { phone3: verifiedNumber },
                    ],
                  };
                  const oldInbox = await Inbox.findOne(filter);

                  if (oldInbox) {
                    // Push message to the correct inbox field
                    const messageField =
                      oldInbox.to === verifiedNumber
                        ? "messages"
                        : oldInbox.phone2 === verifiedNumber
                        ? "messagesPhone2"
                        : "messagesPhone3";

                    let lastMessages = oldInbox[messageField].filter(
                      (item) => item.isDripOutgoingMessage === true
                    );
                    if (
                      lastMessages.length === 0 ||
                      lastMessages[lastMessages.length - 1].content !==
                        dripAutomation.content
                    ) {
                      oldInbox[messageField].push(messageBody);
                    }

                    oldInbox.lastMessageSendDate = new Date();

                    // Update the old inbox and notify via Redis
                    const updatedInbox = await Inbox.findOneAndUpdate(
                      filter,
                      oldInbox,
                      { new: true, timestamps: false }
                    );
                    if (updatedInbox) {
                      const message = {
                        userId: null,
                        data: {
                          content: dripAutomation?.content,
                          phone: verifiedNumber,
                          creationDate: new Date(),
                          isIncoming: false,
                          isOutgoing: true,
                          inboxId: updatedInbox._id,
                          dripAutomationSchedule:
                            await InboxDripAutomation.find({
                              inboxId: dripAutomation?.inboxId,
                            }).sort({ date: 1 }),
                          isViewed: false,
                        },
                      };
                      const messageString = JSON.stringify(message);
                      await redisPublisher.publish(
                        "socket-channel",
                        messageString
                      );
                    }
                  }
                }
              }
            }
          })
        );
      }
    }

    return res.status(httpStatus.CREATED).send({ message: "Drip processed" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", err });
  }
};

const removeAutoDrip = async (req, res, io, userSocketMap, redisPublisher) => {
  try {
    let dueDripAutomations = await InboxDripAutomation.aggregate([
      {
        $group: {
          _id: { inboxId: "$inboxId", dripId: "$dripId" },
          total: { $sum: 1 },
          sentMessages: {
            $sum: { $cond: [{ $eq: ["$isMessageSend", true] }, 1, 0] },
          },
        },
      },
      {
        $match: {
          $expr: { $eq: ["$total", "$sentMessages"] },
        },
      },
    ]).allowDiskUse(true);

    // let dueDripAutomations = await InboxDripAutomation.aggregate([
    //   {
    //     $match: {
    //       isMessageSend: true,
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: { inboxId: "$inboxId", dripId: "$dripId" },
    //       totalSentMessages: { $sum: 1 },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "inboxdripautomations",
    //       let: { inboxId: "$_id.inboxId", dripId: "$_id.dripId" },
    //       pipeline: [
    //         {
    //           $match: {
    //             $expr: {
    //               $and: [
    //                 { $eq: ["$inboxId", "$$inboxId"] },
    //                 { $eq: ["$dripId", "$$dripId"] },
    //               ],
    //             },
    //           },
    //         },
    //         { $count: "total" },
    //       ],
    //       as: "totalMessages",
    //     },
    //   },
    //   {
    //     $unwind: "$totalMessages",
    //   },
    //   {
    //     $match: {
    //       $expr: { $eq: ["$totalSentMessages", "$totalMessages.total"] },
    //     },
    //   },
    // ]).allowDiskUse(true);

    if (dueDripAutomations.length === 0) {
      return res.status(201).send({ message: "No drip found" });
    }

    const tagAvailable = await Tag.findOne({ name: "Expired" });

    const inboxDripQueries = [];
    const activityLogs = [];

    for (const drip of dueDripAutomations) {
      const updateData = {
        $set: { status: "651ebe828042b1b3f4674ea8" },
        $unset: { dripAutomation: 1, dripAutomationSchedule: 1 },
      };

      if (tagAvailable) {
        updateData.$set.tags = [tagAvailable._id];
        updateData.$set.tagDateArray = [
          { date: new Date(), tag: tagAvailable._id },
        ];
      }

      inboxDripQueries.push(
        Inbox.findByIdAndUpdate(drip?._id?.inboxId, updateData, {
          new: true,
          timestamps: false,
        }),
        InboxDripAutomation.deleteMany({
          inboxId: drip?._id?.inboxId,
          dripId: drip?._id?.dripId,
        })
      );

      const activity = "Status was changed to No Status";
      activityLogs.push({
        name: activity,
        inbox: drip?._id?.inboxId,
        type: `addStatusNo Status`,
      });
    }

    await Promise.all(inboxDripQueries);

    if (activityLogs.length > 0) {
      await Activity.insertMany(activityLogs);
    }

    return res.status(httpStatus.CREATED).send({ message: "Drip processed" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error", err });
  }
};

const getSingleDripAutomation = catchAsync(async (req, res) => {
  let { dripAutomationId } = req.params;
  const dripAutomation = await dripAutomationService.getSingleDripAutomation(
    dripAutomationId
  );
  res.status(httpStatus.CREATED).send(dripAutomation);
});

const updateSingleMessage = catchAsync(async (req, res) => {
  let { messageId } = req.params;
  let body = req.body;
  const dripAutomation = await dripAutomationService.updateSingleMessage(
    messageId,
    body
  );
  res.status(httpStatus.CREATED).send(dripAutomation);
});

const dripFilterForSpecificInbox = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  const dripAutomation = await dripAutomationService.dripFilterForSpecificInbox(
    inboxId
  );
  res.status(httpStatus.CREATED).send(dripAutomation);
});

module.exports = {
  createDripAutomation,
  getAllDripAutomation,
  updateDripAutomation,
  deleteDripAutomation,
  assignDripAutomationToInbox,
  unAssignDripAutomationToInbox,
  sendAutoDrip,
  removeAutoDrip,
  getSingleDripAutomation,
  updateSingleMessage,
  dripFilterForSpecificInbox,
};
