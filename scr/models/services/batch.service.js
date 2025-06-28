const httpStatus = require("http-status");
const {
  Batch,
  InitialAndFollowTemplate,
  DirectImport,
  Compaign,
  Inbox,
  Tag,
  Activity,
  Reminder,
  Status,
  User,
  Admin,
  Market,
  DNC,
  CsvData,
  InboxDripAutomation,
  DashStats,
} = require("../models");
const ApiError = require("../utils/ApiError");
const { Client, ApiController } = require("@bandwidth/messaging");
const mysql = require("mysql2/promise");
const pool = mysql.createPool({
  host: process.env.dbWriteHost,
  user: process.env.dbUser,
  database: "launchsms",
  password: process.env.dbPassword,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 3600000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

const BW_USERNAME = "ZeitBlast_API";
const BW_PASSWORD = "AnjumAPI2024!";
const BW_ACCOUNT_ID = "5009813";
const BW_MESSAGING_APPLICATION_ID = process.env.dev_bw_id;
const BW_NUMBER = "+14702893577";
const USER_NUMBER = "+13105622006";
const messageId = "16946869536982njl2igxirrbzqvw";

const client = new Client({
  basicAuthUserName: BW_USERNAME,
  basicAuthPassword: BW_PASSWORD,
});

const controller = new ApiController(client);

const accountId = BW_ACCOUNT_ID;

/**
 * Create a batch
 * @param {Object} batchBody
 * @returns {Promise<Batch>}
 */

const getNextBatchNumber = async () => {
  try {
    // const lastBatch = await Batch.findOne().sort("-batchNumber").exec();
    const lastBatch = await Batch.findOne().sort({ createdAt: -1 }).exec();
    const nextBatchNumber = (lastBatch && lastBatch.batchNumber + 1) || 1;
    return nextBatchNumber;
  } catch (error) {
    throw error;
  }
};

// const createBatch = async (batchBody) => {
//   try {
//     let template = await InitialAndFollowTemplate.findById(batchBody.template);
//     template = template.messages;

//     if (!template) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
//     }

//     let backCampaign = await Compaign.findById(batchBody.campagin)
//       .populate("market")
//       .populate("followMarket");

//     console.log("backCampaign", backCampaign);
//     let idsToFind = [];

//     // Check if market is populated and push its _id
//     if (backCampaign.market) {
//       idsToFind.push(backCampaign.market._id);
//     }

//     // Check if followMarket is populated and push its _id
//     if (backCampaign.followMarket) {
//       idsToFind.push(backCampaign.followMarket._id);
//     }

//     if (backCampaign.followMarket) {
//       backCampaign.market = backCampaign.followMarket;
//       delete backCampaign.followMarket;
//     }
//     if (!("name" in backCampaign)) {
//       backCampaign.name = backCampaign.title;
//     }

//     let marketData = await Market.findOne({
//       _id: { $in: idsToFind },
//     });
//     console.log("marketData.phone", marketData);
//     backCampaign.phone = marketData.phone;

//     // if(backCampaign.totalProspectsRemaining === 0){
//     //   throw new ApiError(httpStatus.BAD_REQUEST, "No prospects available");
//     // }

//     connection = await pool.getConnection();
//     await connection.beginTransaction();
//     let updateSql;
//     if (backCampaign.permission === "compaign") {
//       updateSql =
//         "SELECT * FROM launchsms.csvdata WHERE campaignId = ? AND status = 0 AND batchId IS NULL AND response = 0 AND response2 = 0 AND response3 = 0 ORDER BY created_at DESC LIMIT " +
//         batchBody.batchSize;
//     } else if (backCampaign.permission === "followCompaign") {
//       updateSql =
//         "SELECT * FROM launchsms.csvdata WHERE campaignId1 = ? AND status = 0 AND batchId IS NULL AND response = 0 AND response2 = 0 AND response3 = 0 ORDER BY created_at DESC LIMIT " +
//         batchBody.batchSize;
//     } else if (backCampaign.permission === "followCompaign2") {
//       updateSql =
//         "SELECT * FROM launchsms.csvdata WHERE campaignId2 = ? AND status = 0 AND batchId IS NULL AND response = 0 AND response2 = 0 AND response3 = 0 ORDER BY created_at DESC LIMIT " +
//         batchBody.batchSize;
//     } else if (backCampaign.permission === "followCompaign3") {
//       updateSql =
//         "SELECT * FROM launchsms.csvdata WHERE campaignId3 = ? AND status = 0 AND batchId IS NULL AND response = 0 AND response2 = 0 AND response3 = 0 ORDER BY created_at DESC LIMIT " +
//         batchBody.batchSize;
//     }
//     console.log("updateSql", updateSql);

//     const [batchProspects] = await connection.query(updateSql, [
//       batchBody.campagin,
//     ]);
//     console.log("batchProspects", batchBody.campagin);

//     const directImport = batchProspects;

//     // let campagin = await DirectImport.find({
//     //   assignCampaign: batchBody.campagin,
//     // });

//     if (batchProspects.length <= 0) {
//       throw new ApiError(httpStatus.BAD_REQUEST, "No campaign found");
//     }

//     let totalProspects = batchProspects.length;

//     // const nextBatchNumber = await getNextBatchNumber();
//     // batchBody.batchNumber = nextBatchNumber;
//     batchBody.totalProspects = totalProspects;
//     batchBody.batchTotalProspects = totalProspects;
//     let batch = await Batch.create(batchBody);
//     // backCampaign.remaning = totalProspects;
//     await backCampaign.save();
//     let finalResult = { directImport, batch, template, backCampaign };
//     return finalResult;
//   } catch (error) {
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
//   }
// };

const getAllBatch = async (filter, options) => {
  try {
    return await Batch.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getBatchByStatusCompleted = async (filter, options) => {
  try {
    return await Batch.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
let countresp = 0;
const sendMessage = async (body) => {
  let connection;
  try {
    console.log("body servise", body);
    const batch = await Batch.findById(body.batchId);
    if (!batch) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No batch found");
    }
    // await Batch.findByIdAndUpdate(
    //   body.batchId,
    //   { $inc: { batchSendMessage: 1 } },
    //   { new: true }
    // );
    await Batch.findByIdAndUpdate(
      body.batchId,
      {
        $set: { batchSendMessage: body.batchSendMessage },
      },
      { new: true }
    );
    let campagin = await Compaign.findById(batch.campagin);
    if (!campagin) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No campagin found");
    }

    let template = await InitialAndFollowTemplate.findById(batch.template);
    if (!template) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
    }
    const messageTemplate = template.messages;
    const recipients = [{ FirstName: body.userName, PhoneNumber: body.phone }];
    let messageBody = {
      content: body.message,
      phone: "+1" + body.phone,
      creationDate: new Date(),
      isOutgoing: true,
    };
    let inboxExist = await Inbox.findOneAndUpdate(
      {
        $and: [{ from: body.senderPhoneNumber }, { to: body.phone }],
      },
      { $push: { messages: messageBody } }
    );
    connection = await pool.getConnection();
    await connection.beginTransaction();
    if (!inboxExist) {
      await Inbox.create({
        campagin: campagin._id,
        batch: body.batchId,
        from: body.senderPhoneNumber,
        to: body.phone,
        messages: messageBody,
        userName: body.userName,
      });
    }
    const response = await sendSMS(
      messageTemplate,
      recipients,
      "+1" + body.phone,
      "+1" + body.senderPhoneNumber,
      body.message,
      body.phoneId
    );
    countresp = countresp + 1;

    if (response) {
      batch.sentMessage = campagin.sent;
      if (campagin.permission === "compaign") {
        updateSql =
          "SELECT COUNT(*) as totalCount, SUM(delivered) as totalDelivered, SUM(response) as totalResponse FROM launchsms.csvdata WHERE campaignId = ?";
      } else if (campagin.permission === "followCompaign") {
        updateSql =
          "SELECT COUNT(*) as totalCount, SUM(delivered) as totalDelivered, SUM(response) as totalResponse FROM launchsms.csvdata WHERE campaignId1 = ?";
      } else if (campagin.permission === "followCompaign2") {
        updateSql =
          "SELECT COUNT(*) as totalCount, SUM(delivered) as totalDelivered, SUM(response) as totalResponse FROM launchsms.csvdata WHERE campaignId2 = ? ";
      } else if (campagin.permission === "followCompaign3") {
        updateSql =
          "SELECT COUNT(*) as totalCount, SUM(delivered) as totalDelivered, SUM(response) as totalResponse FROM launchsms.csvdata WHERE campaignId3 = ?";
      }
      const [batchProspects] = await connection.query(updateSql, [
        String(campagin._id),
      ]);
      let prospects = batchProspects[0].totalCount;
      let sendedMessage = campagin.sent + 1;
      let remaning = prospects - sendedMessage;
      campagin.sent += 1;
      if (remaning <= 0) {
        campagin.remaning = 0;
        campagin.sent = prospects;
      } else {
        campagin.remaning = remaning;
      }
      if (sendedMessage >= prospects) {
        await DirectImport.updateMany(
          { assignCampaign: campagin._id },
          {
            $set: {
              assignCamapingCompleted: true,
            },
          },
          { new: true }
        );
      }

      // let directImportArray;
      // for (let i = 0; i < updatedDirectImport.length; i++) {
      //   let directImportId = updatedDirectImport[i]._id;
      //   directImportId = String(directImportId);
      //   const updateSql =
      //     "SELECT * FROM launchsms.csvdata WHERE directImportId = ?";
      //   directImportArray = await connection.query(updateSql, [
      //     directImportId ? directImportId : 0,
      //   ]);
      // }
      // let finalDirectImportArray = directImportArray[0];
      const totalDeliveredMessages = batchProspects[0].totalDelivered;
      const percentageDelivered =
        (totalDeliveredMessages / (prospects * 1.0)) * 100;
      const totalResponseMessages = batchProspects[0].totalResponse;
      let percentageResponse = 0;
      if (totalDeliveredMessages > 0) {
        percentageResponse =
          (totalResponseMessages / (totalDeliveredMessages * 1.0)) * 100;
      }
      campagin.delivered = percentageDelivered;
      campagin.response = percentageResponse;
      campagin.totalDelivered = totalDeliveredMessages;
      campagin.totalResponse = totalResponseMessages;
      await campagin.save();
      await batch.save();

      const totalMessage = await Batch.countDocuments({});

      const sentTotalMessageWithTemplate = await Batch.countDocuments({
        $and: [{ delivered: { $gt: 0 } }, { template: batch.template }],
      });
      const receiveTotalMessageWithTemplate = await Batch.countDocuments({
        $and: [{ response: { $gt: 0 } }, { template: batch.template }],
      });
      const receivedPercentageWithTemplate =
        (receiveTotalMessageWithTemplate / totalMessage) * 100;
      const deliveredPercentageWithTemplate =
        (sentTotalMessageWithTemplate / totalMessage) * 100;
      template.deliveredPercentage = deliveredPercentageWithTemplate;
      template.responsePercentage = receivedPercentageWithTemplate;
      // template.quantity += 1;
      template.save();
      await connection.commit();
      return response;
    } else {
      // batch.batchSendMessage += 1;
      // await batch.save();
      return "Something went wrong while sending message";
    }
    // }
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.log("error is ishmam", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const sendMessageFromInbox = async (body) => {
  let oldInbox = await Inbox.findOne({ to: body.phone });
  if (oldInbox.isWrongNumber === true || oldInbox.isAddedToDNC === true) {
    // throw Error(
    //   httpStatus.BAD_REQUEST,
    //   "Number in wrong state u can't send message"
    // );
    return { message: "Number in wrong state u can't send message" };
  }
  const response = sendSMS(
    "",
    "",
    "+1" + body.phone,
    "+1" + body.senderPhoneNumber,
    body.message,
    body.phoneId
  );
  if (response) {
    let messageBody = {
      content: body.message,
      phone: "+1" + body.phone,
      creationDate: new Date(),
      isOutgoing: true,
      type: "inbox",
    };
    let inboxUpdated = await Inbox.findOneAndUpdate(
      {
        $and: [{ from: body.senderPhoneNumber }, { to: body.phone }],
      },
      {
        $push: { messages: messageBody },
        $set: { lastMessageSendDate: new Date(), isUnAnswered: false },
      },
      {
        timestamps: false,
      }
    );
    if (inboxUpdated) {
      await DashStats.updateOne(
        { inboxId: inboxUpdated?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      );
    }
    return response;
  }
  return {};
};

const sendMessageFromInboxOfPhone2 = async (body) => {
  let oldInbox = await Inbox.findOne({ phone2: body.phone });
  if (
    oldInbox.isWrongNumberPhone2 === true ||
    oldInbox.isAddedToDNCPhone2 === true
  ) {
    return { message: "Number in wrong state u can't send message" };
  }
  const response = sendSMS(
    "",
    "",
    "+1" + body.phone,
    "+1" + body.senderPhoneNumber,
    body.message,
    body.phoneId
  );
  if (response) {
    let messageBody = {
      content: body.message,
      phone: "+1" + body.phone,
      creationDate: new Date(),
      isOutgoing: true,
      type: "inbox",
    };
    let inboxUpdated = await Inbox.findOneAndUpdate(
      {
        $and: [{ from: body.senderPhoneNumber }, { phone2: body.phone }],
      },
      {
        $push: { messagesPhone2: messageBody },
        $set: { lastMessageSendDate: new Date(), isUnAnswered: false },
      },
      {
        timestamps: false,
      }
      // { $push: { messagesPhone2: messageBody } },
      // { $set: { lastMessageSendDate: new Date() } }
    );
    if (inboxUpdated) {
      await DashStats.updateOne(
        { inboxId: inboxUpdated?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      );
    }
    return response;
  }
  return {};
};

const sendMessageFromInboxOfPhone3 = async (body) => {
  let oldInbox = await Inbox.findOne({ phone3: body.phone });
  if (
    oldInbox.isWrongNumberPhone3 === true ||
    oldInbox.isAddedToDNCPhone3 === true
  ) {
    return { message: "Number in wrong state u can't send message" };
  }
  const response = sendSMS(
    "",
    "",
    "+1" + body.phone,
    "+1" + body.senderPhoneNumber,
    body.message,
    body.phoneId
  );
  if (response) {
    let messageBody = {
      content: body.message,
      phone: "+1" + body.phone,
      creationDate: new Date(),
      isOutgoing: true,
      type: "inbox",
    };
    let inboxUpdated = await Inbox.findOneAndUpdate(
      {
        $and: [{ from: body.senderPhoneNumber }, { phone3: body.phone }],
      },
      // { $push: { messagesPhone3: messageBody } },
      // { $set: { lastMessageSendDate: new Date() } }
      {
        $push: { messagesPhone3: messageBody },
        $set: { lastMessageSendDate: new Date(), isUnAnswered: false },
      },
      {
        timestamps: false,
      }
    );
    if (inboxUpdated) {
      await DashStats.updateOne(
        { inboxId: inboxUpdated?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      );
    }
    return response;
  }
  return {};
};

async function sendSMS(
  messageTemplates,
  recipients,
  phone,
  senderPhoneNumber,
  bodyMessage,
  phoneId
) {
  try {
    const response = await controller.createMessage(accountId, {
      applicationId: BW_MESSAGING_APPLICATION_ID,
      // to: [USER_NUMBER],
      to: [phone],
      // from: BW_NUMBER,
      from: senderPhoneNumber,
      // text: message,
      text: bodyMessage,
      tag: String(phoneId),
    });
    return response;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
}

const getBatchById = async (id) => {
  try {
    const batch = await Batch.findById(id)
      .populate("campagin")
      .populate("template")
      .populate("user")
      .populate("admin");
    if (!batch) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No batch found");
    } else {
      // let campagin = await DirectImport.find({
      //   assignCampaign: batch.campagin,
      // });
      // if (campagin.length <= 0) {
      //   throw new ApiError(httpStatus.BAD_REQUEST, "No directImport found");
      // }
      let backCampaign = await Compaign.findById(batch.campagin._id)
        .populate("market")
        .populate("followMarket");

      //console.log("backCampaign", backCampaign);
      let idsToFind = [];

      // Check if market is populated and push its _id
      if (backCampaign.market) {
        idsToFind.push(backCampaign.market._id);
      }

      // Check if followMarket is populated and push its _id
      if (backCampaign.followMarket) {
        idsToFind.push(backCampaign.followMarket._id);
      }

      if (backCampaign.followMarket) {
        backCampaign.market = backCampaign.followMarket;
        delete backCampaign.followMarket;
      }
      if (!("name" in backCampaign)) {
        backCampaign.name = backCampaign.title;
      }
      backCampaign.name = backCampaign.name || backCampaign.title;
      console.log("backCampaign", backCampaign);
      let marketData = await Market.findOne({
        _id: { $in: idsToFind },
      });
      //console.log("marketData.phone", marketData);
      backCampaign.phone = marketData.phone;
      let template = await InitialAndFollowTemplate.findById(
        batch.template._id
      );
      template = template.messages;
      if (!template) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
      }
      if (!backCampaign) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No comapign found");
      }
      return { batch, backCampaign, template };
    }
  } catch (error) {
    console.log("error", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateBatchById = async (id, updateBody) => {
  try {
    const batch = await Batch.findById(id);
    if (!batch) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No batch found");
    }
    Object.assign(batch, updateBody);
    await batch.save();
    return batch;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteBatchById = async (id) => {
  try {
    const batch = await Batch.findByIdAndRemove(id);
    if (!batch) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No batch found");
    }
    return "Delete successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCampagin = async (filter, options) => {
  return await Compaign.paginate(filter, options);
};

const getBatchForSingleCampaign = async (id, page, limit, skip) => {
  try {
    const totalCount = await Batch.countDocuments({ campagin: id });

    let batches = await Batch.find({ campagin: id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate("campagin")
      .populate("template")
      .populate("admin")
      .populate("user")
      .lean();

    if (batches.length > 0) {
      const directImportPromises = batches.map(async (batch) => {
        const directImport = await CsvData.findOne({
          batchId: String(batch._id),
        })
          .select("directImportId")
          .lean();
        return { directImport, batch };
      });
      const directImports = await Promise.all(directImportPromises);
      const directDataPromises = directImports.map(
        async ({ directImport, batch }) => {
          if (directImport?.directImportId) {
            const directData = await DirectImport.findById(
              directImport.directImportId
            )
              .select("listName")
              .lean();
            return { directData, batch };
          }
          return { directData: null, batch };
        }
      );
      const directDataResults = await Promise.all(directDataPromises);
      directDataResults.forEach(({ directData, batch }) => {
        if (directData) {
          batch.listName = directData.listName;
        }
      });
    }

    const totalPages = Math.ceil(totalCount / limit);

    return {
      page,
      result: batches,
      limit,
      totalPages,
      totalResults: totalCount,
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getInbox = async (filter, options) => {
  try {
    return await Inbox.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const addTagToInbox = async (body, inboxId) => {
  try {
    let tag = await Tag.findById(body);
    if (!tag) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No tag found");
    }
    let inbox = await Inbox.findByIdAndUpdate(
      inboxId,
      {
        $addToSet: { tags: body },
        $set: { tagDate: new Date(), isUnAnswered: false },
      },
      { new: true, timestamps: false }
    ).populate("tags");
    let updatedResult = await Inbox.findOneAndUpdate(
      { _id: inboxId, "tagDateArray.tag": body },
      {
        $set: {
          "tagDateArray.$.date": new Date(),
          isUnAnswered: false,
        },
      },
      { new: true, timestamps: false }
    );
    if (!updatedResult) {
      await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $addToSet: {
            tagDateArray: {
              date: new Date(),
              tag: body,
            },
          },
          $set: { isUnAnswered: false },
        },
        { new: true, timestamps: false }
      );
    }
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No message found");
    }
    // await DashStats.updateOne(
    //   { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
    //   {
    //     $inc: { unAnswered: -1 },
    //   }
    // );
    let tagName = tag.name;
    let activity = "Added tag" + " " + tagName;
    await Activity.create({ name: activity, inbox: inboxId, type: "addTag" });
    tag.prospect = tag.prospect + 1;
    tag.save();
    return inbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const removeTagToInbox = async (body, inboxId) => {
  try {
    let tag = await Tag.findById(body);
    if (!tag) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No tag found");
    }
    let inbox = await Inbox.findByIdAndUpdate(
      inboxId,
      {
        $pull: {
          tags: body,
          tagDateArray: { tag: body },
        },
        $set: { isUnAnswered: false },
      },
      { new: true, timestamps: false }
    ).populate("tags");
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No message found");
    }
    // await DashStats.updateOne(
    //   { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
    //   {
    //     $inc: { unAnswered: -1 },
    //   }
    // );
    let tagName = tag.name;
    let activity = "Remove tag" + " " + tagName;
    await Activity.create({
      name: activity,
      inbox: inboxId,
      type: "removeTag",
    });
    tag.prospect = tag.prospect - 1;
    tag.save();
    return inbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const addNoteToInbox = async (body, inboxId) => {
  try {
    let finalResult = { title: body, created: new Date() };
    let titleFound = await Inbox.findOne({
      $and: [{ _id: inboxId }, { "notes.title": body }],
    });
    if (titleFound) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Same note already exist");
    }

    let inbox = await Inbox.findByIdAndUpdate(
      inboxId,
      {
        $addToSet: { notes: finalResult },
      },
      { new: true, timestamps: false }
    );
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No message found");
    }
    let activity = body;
    await Activity.create({
      name: activity,
      inbox: inboxId,
      type: "addNote",
    });
    return inbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getNoteOfInbox = async (inboxId) => {
  try {
    let inbox = await Inbox.findById(inboxId);
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let notesOfInbox = inbox.notes;
    return notesOfInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCroneBatch = async (inboxId) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const query = {
      created_at: { $gte: oneDayAgo }, // Assuming you have a "created_at" field in the "Batch" collection
    };

    let batches = Batch.find(query);
    if (!batches) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    return batches;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteNoteOfInbox = async (noteId, inboxId) => {
  try {
    let oldInbox = await Inbox.findById(inboxId);
    if (!oldInbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let oldNoteId = oldInbox.notes.find(
      (item) => item._id.toString() === noteId.toString()
    );
    if (oldNoteId) {
      await Activity.updateMany(
        { $and: [{ inbox: inboxId }, { name: oldNoteId.title }] },
        { $set: { name: "note deleted", type: "removeNote" } },
        { new: true }
      );
    }
    let inbox = await Inbox.findByIdAndUpdate(
      inboxId,
      {
        $pull: { notes: { _id: noteId } },
      },
      { new: true, timestamps: false }
    );
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let notesOfInbox = inbox.notes;
    return notesOfInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getListOfActivity = async (inboxId) => {
  try {
    return await Activity.find({ inbox: inboxId }).sort({ createdAt: -1 });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const addToVerfiedNumber = async (body, inboxId) => {
  try {
    let inbox;
    if (body.phone) {
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isVerifiedNumber: true,
            isVerifiedNumberPhone2: false,
            isVerifiedNumberPhone3: false,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        await CsvData.findOneAndUpdate(
          { phone1: inbox.to },
          { $set: { isPhone1Verified: true } }
        );
      }
    } else if (body.phone2) {
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isVerifiedNumberPhone2: true,
            isVerifiedNumber: false,
            isVerifiedNumberPhone3: false,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        await CsvData.findOneAndUpdate(
          { phone2: inbox.phone2 },
          { $set: { isPhone2Verified: true } }
        );
      }
    } else if (body.phone3) {
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isVerifiedNumberPhone3: true,
            isVerifiedNumber: false,
            isVerifiedNumberPhone2: false,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        await CsvData.findOneAndUpdate(
          { phone3: inbox.phone3 },
          { $set: { isPhone3Verified: true } }
        );
      }
    }
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let dashQueryPromise = [
      Inbox.findById(inbox).populate("tags"),
      DashStats.updateOne(
        { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      ),
    ];
    let [updatedInbox] = await Promise.all(dashQueryPromise);
    let activity;
    if (body.phone) {
      activity = body.phone + " " + "was set as the verified number";
    } else if (body.phone2) {
      activity = body.phone2 + " " + "was set as the verified number";
    } else if (body.phone3) {
      activity = body.phone3 + " " + "was set as the verified number";
    }
    let activityResult = await Activity.create({
      name: activity,
      inbox: inboxId,
      type: "addVerifiedNumber",
    });
    if (!activityResult) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    return updatedInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const removeToVerfiedNumber = async (body, inboxId) => {
  try {
    let inbox;
    if (body.phone) {
      inbox = await Inbox.findById(inboxId);
      if (inbox.status.toString() === "651ebe648042b1b3f4674ea2") {
        inbox = await Inbox.findByIdAndUpdate(
          inbox._id,
          {
            $set: {
              status: "651ebe828042b1b3f4674ea8",
              isVerifiedNumber: false,
              isUnAnswered: false,
            },
            $unset: { dripAutomation: 1, dripAutomationSchedule: 1 },
          },
          { new: true, timestamps: false }
        );
        await InboxDripAutomation.deleteMany({ inboxId: inbox._id });
      } else {
        inbox = await Inbox.findByIdAndUpdate(
          inboxId,
          {
            $set: {
              isVerifiedNumber: false,
              isUnAnswered: false,
              status: "651ebe828042b1b3f4674ea8",
            },
          },
          { new: true, timestamps: false }
        );
      }
      if (inbox) {
        await CsvData.findOneAndUpdate(
          { phone1: inbox.to },
          { $set: { isPhone1Verified: false } }
        );
      }
    } else if (body.phone2) {
      inbox = await Inbox.findById(inboxId);
      if (inbox.status.toString() === "651ebe648042b1b3f4674ea2") {
        inbox = await Inbox.findByIdAndUpdate(
          inbox._id,
          {
            $set: {
              status: "651ebe828042b1b3f4674ea8",
              isVerifiedNumberPhone2: false,
              isUnAnswered: false,
            },
            $unset: { dripAutomation: 1, dripAutomationSchedule: 1 },
          },
          { new: true, timestamps: false }
        );
        await InboxDripAutomation.deleteMany({ inboxId: inbox._id });
      } else {
        inbox = await Inbox.findByIdAndUpdate(
          inboxId,
          {
            $set: {
              isVerifiedNumberPhone2: false,
              isUnAnswered: false,
              status: "651ebe828042b1b3f4674ea8",
            },
          },
          { new: true, timestamps: false }
        );
      }
      if (inbox) {
        await CsvData.findOneAndUpdate(
          { phone2: inbox.phone2 },
          { $set: { isPhone2Verified: false } }
        );
      }
    } else if (body.phone3) {
      inbox = await Inbox.findById(inboxId);
      if (inbox.status.toString() === "651ebe648042b1b3f4674ea2") {
        inbox = await Inbox.findByIdAndUpdate(
          inbox._id,
          {
            $set: {
              status: "651ebe828042b1b3f4674ea8",
              isVerifiedNumberPhone3: false,
              isUnAnswered: false,
            },
            $unset: { dripAutomation: 1, dripAutomationSchedule: 1 },
          },
          { new: true, timestamps: false }
        );
        await InboxDripAutomation.deleteMany({ inboxId: inbox._id });
      } else {
        inbox = await Inbox.findByIdAndUpdate(
          inboxId,
          {
            $set: {
              isVerifiedNumberPhone3: false,
              isUnAnswered: false,
              status: "651ebe828042b1b3f4674ea8",
            },
          },
          { new: true, timestamps: false }
        );
      }
      if (inbox) {
        await CsvData.findOneAndUpdate(
          { phone3: inbox.phone3 },
          { $set: { isPhone3Verified: false } }
        );
      }
    }
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let dashQueryPromise = [
      Inbox.findById(inbox).populate("tags"),
      DashStats.updateOne(
        { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      ),
    ];
    let [updatedInbox] = await Promise.all(dashQueryPromise);
    let activity;
    if (body.phone) {
      activity = body.phone + " " + "was removed as the verified number";
    } else if (body.phone2) {
      activity = body.phone2 + " " + "was removed as the verified number";
    } else if (body.phone3) {
      activity = body.phone3 + " " + "was removed as the verified number";
    }
    let activityResult = await Activity.create({
      name: activity,
      inbox: inboxId,
      type: "removeVerifiedNumber",
    });
    if (!activityResult) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    return updatedInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const addToWrongNumber = async (body, inboxId) => {
  try {
    let inbox;
    if (body.phone) {
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isWrongNumber: true,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      // if (inbox.status.toString() === "651ebe648042b1b3f4674ea2") {
      //   await Inbox.findByIdAndUpdate(
      //     inbox._id,
      //     {
      //       $set: { status: "651ebe828042b1b3f4674ea8" },
      //       $unset: { dripAutomation: 1, dripAutomationSchedule: 1 },
      //     },
      //     { new: true }
      //   );
      // }
    } else if (body.phone2) {
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isWrongNumberPhone2: true,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      // if (inbox.status.toString() === "651ebe648042b1b3f4674ea2") {
      //   await Inbox.findByIdAndUpdate(
      //     inbox._id,
      //     {
      //       $set: { status: "651ebe828042b1b3f4674ea8" },
      //       $unset: { dripAutomation: 1, dripAutomationSchedule: 1 },
      //     },
      //     { new: true }
      //   );
      // }
    } else if (body.phone3) {
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isWrongNumberPhone3: true,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      // if (inbox.status.toString() === "651ebe648042b1b3f4674ea2") {
      //   await Inbox.findByIdAndUpdate(
      //     inbox._id,
      //     {
      //       $set: { status: "651ebe828042b1b3f4674ea8" },
      //       $unset: { dripAutomation: 1, dripAutomationSchedule: 1 },
      //     },
      //     { new: true }
      //   );
      // }
    }
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let dashQueryPromise = [
      Inbox.findById(inbox).populate("tags"),
      DashStats.updateOne(
        { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      ),
    ];
    let [updatedInbox] = await Promise.all(dashQueryPromise);
    if (
      updatedInbox.messages.length > 0 &&
      updatedInbox.messagesPhone2.length &&
      updatedInbox.messagesPhone3.length > 0
    ) {
      if (
        updatedInbox.isWrongNumber === true &&
        updatedInbox.isWrongNumberPhone2 === true &&
        updatedInbox.isWrongNumberPhone3 === true
      ) {
        updatedInbox.status = "651ebe798042b1b3f4674ea6";
        await updatedInbox.save({ timestamps: false });
      }
    } else if (
      updatedInbox.messages.length > 0 &&
      updatedInbox.messagesPhone2.length
    ) {
      if (
        updatedInbox.isWrongNumber === true &&
        updatedInbox.isWrongNumberPhone2 === true
      ) {
        updatedInbox.status = "651ebe798042b1b3f4674ea6";
        await updatedInbox.save({ timestamps: false });
      }
    } else {
      if (updatedInbox.isWrongNumber === true) {
        updatedInbox.status = "651ebe798042b1b3f4674ea6";
        await updatedInbox.save({ timestamps: false });
      }
    }

    let activity;
    if (body.phone) {
      activity = body.phone + " " + "was marked as wrong number";
    } else if (body.phone2) {
      activity = body.phone2 + " " + "was marked as wrong number";
    } else if (body.phone3) {
      activity = body.phone3 + " " + "was marked as wrong number";
    }
    let activityResult = await Activity.create({
      name: activity,
      inbox: inboxId,
      type: "addWrongNumber",
    });
    if (!activityResult) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    return updatedInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const removeToWrongNumber = async (body, inboxId) => {
  try {
    let inbox;
    if (body.phone) {
      // inbox = await Inbox.findByIdAndUpdate(
      //   inboxId,
      //   {
      //     $set: { isWrongNumber: false },
      //   },
      //   { new: true }
      // );
      inbox = await Inbox.findById(inboxId);
      if (inbox) {
        if (inbox.status.toString() === "651ebe798042b1b3f4674ea6") {
          inbox.isWrongNumber = false;
          inbox.status = "651ebe828042b1b3f4674ea8";
          inbox.isUnAnswered = false;
          await inbox.save({ timestamps: false });
        } else {
          inbox.isWrongNumber = false;
          inbox.isUnAnswered = false;
          await inbox.save({ timestamps: false });
        }
      }
    } else if (body.phone2) {
      // inbox = await Inbox.findByIdAndUpdate(
      //   inboxId,
      //   {
      //     $set: {
      //       isWrongNumberPhone2: false,
      //       // status: "651ebe828042b1b3f4674ea8",
      //     },
      //   },
      //   { new: true }
      // );
      inbox = await Inbox.findById(inboxId);
      if (inbox) {
        if (inbox.status.toString() === "651ebe798042b1b3f4674ea6") {
          inbox.isWrongNumberPhone2 = false;
          inbox.status = "651ebe828042b1b3f4674ea8";
          inbox.isUnAnswered = false;
          await inbox.save({ timestamps: false });
        } else {
          inbox.isWrongNumberPhone2 = false;
          inbox.isUnAnswered = false;
          await inbox.save({ timestamps: false });
        }
      }
    } else if (body.phone3) {
      // inbox = await Inbox.findByIdAndUpdate(
      //   inboxId,
      //   {
      //     $set: {
      //       isWrongNumberPhone3: false,
      //       // status: "651ebe828042b1b3f4674ea8",
      //     },
      //   },
      //   { new: true }
      // );
      inbox = await Inbox.findById(inboxId);
      if (inbox) {
        if (inbox.status.toString() === "651ebe798042b1b3f4674ea6") {
          inbox.isWrongNumberPhone3 = false;
          inbox.status = "651ebe828042b1b3f4674ea8";
          inbox.isUnAnswered = false;
          await inbox.save({ timestamps: false });
        } else {
          inbox.isWrongNumberPhone3 = false;
          inbox.isUnAnswered = false;
          await inbox.save({ timestamps: false });
        }
      }
    }
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let dashQueryPromise = [
      Inbox.findById(inbox).populate("tags"),
      DashStats.updateOne(
        { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      ),
    ];
    let [updatedInbox] = await Promise.all(dashQueryPromise);
    // if (updatedInbox && updatedInbox.messages.length > 0) {
    //   const lastMessage = inbox.messagesPhone2[inbox.messagesPhone2.length - 1];
    //   if (lastMessage?.isIncoming === true) {
    //     await DashStats.updateOne(
    //       { inboxId: inbox?._id, unAnswered: { $eq: 0 } },
    //       {
    //         $inc: { unAnswered: 1 },
    //       }
    //     );
    //   }
    // } else if (updatedInbox && updatedInbox.messagesPhone2.length > 0) {
    //   const lastMessage = inbox.messagesPhone2[inbox.messagesPhone2.length - 1];
    //   if (lastMessage?.isIncoming === true) {
    //     await DashStats.updateOne(
    //       { inboxId: inbox?._id, unAnswered: { $eq: 0 } },
    //       {
    //         $inc: { unAnswered: 1 },
    //       }
    //     );
    //   }
    // } else if (updatedInbox && updatedInbox.messagesPhone3.length > 0) {
    //   const lastMessage = inbox.messagesPhone3[inbox.messagesPhone3.length - 1];
    //   if (lastMessage?.isIncoming === true) {
    //     await DashStats.updateOne(
    //       { inboxId: inbox?._id, unAnswered: { $eq: 0 } },
    //       {
    //         $inc: { unAnswered: 1 },
    //       }
    //     );
    //   }
    // }
    if (
      updatedInbox.messages.length > 0 &&
      updatedInbox.messagesPhone2.length &&
      updatedInbox.messagesPhone3.length > 0
    ) {
      if (
        updatedInbox.isWrongNumber === true &&
        updatedInbox.isWrongNumberPhone2 === true &&
        updatedInbox.isWrongNumberPhone3 === true
      ) {
        // updatedInbox.status = "651ebe798042b1b3f4674ea6";
        // await updatedInbox.save();
      }
    } else if (
      updatedInbox.messages.length > 0 &&
      updatedInbox.messagesPhone2.length
    ) {
      if (
        updatedInbox.isWrongNumber === true &&
        updatedInbox.isWrongNumberPhone2 === true
      ) {
        // updatedInbox.status = "651ebe798042b1b3f4674ea6";
        // await updatedInbox.save();
      }
    } else {
      if (updatedInbox.isWrongNumber === true) {
        updatedInbox.status = "651ebe798042b1b3f4674ea6";
        await updatedInbox.save({ timestamps: false });
      }
    }

    let activity;
    if (body.phone) {
      activity = "Removed Wrong Number mark for" + " " + body.phone;
    } else if (body.phone2) {
      activity = "Removed Wrong Number mark for" + " " + body.phone2;
    } else if (body.phone3) {
      activity = "Removed Wrong Number mark for" + " " + body.phone3;
    }
    let activityResult = await Activity.create({
      name: activity,
      inbox: inboxId,
      type: "removeWrongNumber",
    });
    if (!activityResult) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    return updatedInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const addToDNCNumber = async (body, inboxId) => {
  try {
    let inbox;
    if (body.phone) {
      let inComingMessageExist = await Inbox.findOne({
        $and: [
          { _id: inboxId },
          {
            "messages.isIncoming": true,
          },
        ],
      });
      if (!inComingMessageExist) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "DNC cannot be added to leads without a response."
        );
      }
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isAddedToDNC: true,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        let inboxDetail = await CsvData.findOne({ phone1: body.phone });
        if (inboxDetail) {
          await DNC.create({
            number: body.phone,
            firstName: inboxDetail.firstName,
            lastName: inboxDetail.lastName,
          });
          inboxDetail.dncPhone1 = true;
          await inboxDetail.save();
        } else {
          let queryPromise = [
            DNC.create({ number: body.phone }),
            CsvData.findOneAndUpdate(
              { phone1: body.phone },
              { $set: { dncPhone1: true } }
            ),
          ];
          await Promise.all(queryPromise);
        }
      }
    } else if (body.phone2) {
      let inComingMessageExist = await Inbox.findOne({
        $and: [
          { _id: inboxId },
          {
            "messagesPhone2.isIncoming": true,
          },
        ],
      });
      if (!inComingMessageExist) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "DNC cannot be added to leads without a response."
        );
      }
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isAddedToDNCPhone2: true,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        let inboxDetail = await CsvData.findOne({ phone2: body.phone2 });
        if (inboxDetail) {
          await DNC.create({
            number: body.phone2,
            firstName: inboxDetail.firstName,
            lastName: inboxDetail.lastName,
          });
          inboxDetail.dncPhone2 = true;
          await inboxDetail.save();
        } else {
          let queryPromise = [
            DNC.create({ number: body.phone2 }),
            CsvData.findOneAndUpdate(
              { phone2: body.phone2 },
              { $set: { dncPhone2: true } }
            ),
          ];
          await Promise.all(queryPromise);
        }
      }
    } else if (body.phone3) {
      let inComingMessageExist = await Inbox.findOne({
        $and: [
          { _id: inboxId },
          {
            "messagesPhone3.isIncoming": true,
          },
        ],
      });
      if (!inComingMessageExist) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "DNC cannot be added to leads without a response."
        );
      }
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            isAddedToDNCPhone3: true,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        let inboxDetail = await CsvData.findOne({ phone3: body.phone3 });
        if (inboxDetail) {
          await DNC.create({
            number: body.phone3,
            firstName: inboxDetail.firstName,
            lastName: inboxDetail.lastName,
          });
          inboxDetail.dncPhone3 = true;
          await inboxDetail.save();
        } else {
          let queryPromise = [
            DNC.create({ number: body.phone3 }),
            CsvData.findOneAndUpdate(
              { phone3: body.phone3 },
              { $set: { dncPhone3: true } }
            ),
          ];
          await Promise.all(queryPromise);
        }
      }
    }
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let dashQueryPromise = [
      Inbox.findById(inbox).populate("tags"),
      DashStats.updateOne(
        { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      ),
    ];
    let [updatedInbox] = await Promise.all(dashQueryPromise);
    let messageHasIncomingMessage = updatedInbox.messages.filter(
      (item) => item.isIncoming
    );
    let messagePhone2HasIncomingMessage = updatedInbox.messagesPhone2.filter(
      (item) => item.isIncoming
    );
    let messagePhone3HasIncomingMessage = updatedInbox.messagesPhone3.filter(
      (item) => item.isIncoming
    );
    if (
      updatedInbox.messages.length > 0 &&
      updatedInbox.messagesPhone2.length > 0 &&
      updatedInbox.messagesPhone3.length > 0
    ) {
      if (
        updatedInbox.isAddedToDNC === true &&
        updatedInbox.isAddedToDNCPhone2 === true &&
        updatedInbox.isAddedToDNCPhone3 === true
      ) {
        updatedInbox.status = "65ba97b6ae9753518b56d3d4";
        await updatedInbox.save({ timestamps: false });
      } else if (
        (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
          updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
          updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
          updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
          messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length <= 0)
      ) {
        if (
          (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
            updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
            updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
            updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
            updatedInbox.isAddedToDNC === true) ||
          updatedInbox.isAddedToDNCPhone2 === true ||
          updatedInbox.isAddedToDNCPhone3 === true
        ) {
          updatedInbox.status = "65ba97b6ae9753518b56d3d4";
          await updatedInbox.save({ timestamps: false });
        }
      }
    } else if (
      updatedInbox.messages.length > 0 &&
      updatedInbox.messagesPhone2.length > 0
    ) {
      if (
        updatedInbox.isAddedToDNC === true &&
        updatedInbox.isAddedToDNCPhone2 === true
      ) {
        updatedInbox.status = "65ba97b6ae9753518b56d3d4";
        await updatedInbox.save({ timestamps: false });
      } else if (
        (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
          updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
          updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
          updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
          messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length > 0)
      ) {
        if (
          (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
            updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
            updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
            updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
            // updatedInbox.isVerifiedNumber !== true &&
            // updatedInbox.isVerifiedNumberPhone2 !== true &&
            updatedInbox.isAddedToDNC === true) ||
          updatedInbox.isAddedToDNCPhone2 === true
        ) {
          updatedInbox.status = "65ba97b6ae9753518b56d3d4";
          await updatedInbox.save({ timestamps: false });
        }
      }
    } else {
      if (updatedInbox.isAddedToDNC === true) {
        updatedInbox.status = "65ba97b6ae9753518b56d3d4";
        await updatedInbox.save({ timestamps: false });
      } else if (
        messageHasIncomingMessage.length > 0 &&
        updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
        updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
        updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
        updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d"
      ) {
        if (
          updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
          updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
          updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
          updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
          updatedInbox.isAddedToDNC === true
        ) {
          updatedInbox.status = "65ba97b6ae9753518b56d3d4";
          await updatedInbox.save({ timestamps: false });
        }
      }
    }
    let activity;
    if (body.phone) {
      activity = body.phone + " " + "was added to DNC";
    } else if (body.phone2) {
      activity = body.phone2 + " " + "was added to DNC";
    } else if (body.phone3) {
      activity = body.phone3 + " " + "was added to DNC";
    }
    let activityResult = await Activity.create({
      name: activity,
      inbox: inboxId,
      type: "addDncNumber",
    });
    if (!activityResult) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    return updatedInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const removeToDNCNumber = async (body, inboxId) => {
  try {
    let inbox;
    if (body.phone) {
      let dncData = await DNC.findOne({ number: body.phone });
      if (dncData && dncData.permanent) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Dnc added permanetly can't be delete"
        );
      }
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: { isAddedToDNC: false, isUnAnswered: false },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        let queryPromise = [
          CsvData.findOneAndUpdate(
            { phone1: body.phone },
            { $set: { dncPhone1: false } }
          ),
          DNC.findOneAndRemove({ number: body.phone }),
        ];
        await Promise.all(queryPromise);
      }
    } else if (body.phone2) {
      let dncData = await DNC.findOne({ number: body.phone2 });
      if (dncData && dncData.permanent) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Dnc added permanetly can't be delete"
        );
      }
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: { isAddedToDNCPhone2: false, isUnAnswered: false },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        let queryPromise = [
          CsvData.findOneAndUpdate(
            { phone2: body.phone2 },
            { $set: { dncPhone2: false } }
          ),
          DNC.findOneAndRemove({ number: body.phone2 }),
        ];
        await Promise.all(queryPromise);
      }
    } else if (body.phone3) {
      let dncData = await DNC.findOne({ number: body.phone3 });
      if (dncData && dncData.permanent) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Dnc added permanetly can't be delete"
        );
      }
      inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: { isAddedToDNCPhone3: false, isUnAnswered: false },
        },
        { new: true, timestamps: false }
      );
      if (inbox) {
        let queryPromise = [
          CsvData.findOneAndUpdate(
            { phone3: body.phone3 },
            { $set: { dncPhone3: false } }
          ),
          DNC.findOneAndRemove({ number: body.phone3 }),
        ];
        await Promise.all(queryPromise);
      }
    }
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let dashQueryPromise = [
      Inbox.findById(inbox).populate("tags"),
      DashStats.updateOne(
        { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      ),
    ];
    let [updatedInbox] = await Promise.all(dashQueryPromise);
    // if (updatedInbox && updatedInbox.messages.length > 0) {
    //   const lastMessage = inbox.messagesPhone2[inbox.messagesPhone2.length - 1];
    //   if (lastMessage?.isIncoming === true) {
    //     await DashStats.updateOne(
    //       { inboxId: inbox?._id, unAnswered: { $eq: 0 } },
    //       {
    //         $inc: { unAnswered: 1 },
    //       }
    //     );
    //   }
    // } else if (updatedInbox && updatedInbox.messagesPhone2.length > 0) {
    //   const lastMessage = inbox.messagesPhone2[inbox.messagesPhone2.length - 1];
    //   if (lastMessage?.isIncoming === true) {
    //     await DashStats.updateOne(
    //       { inboxId: inbox?._id, unAnswered: { $eq: 0 } },
    //       {
    //         $inc: { unAnswered: 1 },
    //       }
    //     );
    //   }
    // } else if (updatedInbox && updatedInbox.messagesPhone3.length > 0) {
    //   const lastMessage = inbox.messagesPhone3[inbox.messagesPhone3.length - 1];
    //   if (lastMessage?.isIncoming === true) {
    //     await DashStats.updateOne(
    //       { inboxId: inbox?._id, unAnswered: { $eq: 0 } },
    //       {
    //         $inc: { unAnswered: 1 },
    //       }
    //     );
    //   }
    // }
    let messageHasIncomingMessage = updatedInbox.messages.filter(
      (item) => item.isIncoming
    );
    let messagePhone2HasIncomingMessage = updatedInbox.messagesPhone2.filter(
      (item) => item.isIncoming
    );
    let messagePhone3HasIncomingMessage = updatedInbox.messagesPhone3.filter(
      (item) => item.isIncoming
    );
    if (
      (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
        updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
        updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
        updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
        messageHasIncomingMessage.length > 0 &&
        messagePhone2HasIncomingMessage.length <= 0 &&
        messagePhone3HasIncomingMessage.length <= 0) ||
      (messageHasIncomingMessage.length <= 0 &&
        messagePhone2HasIncomingMessage.length > 0 &&
        messagePhone3HasIncomingMessage.length <= 0) ||
      (messageHasIncomingMessage.length <= 0 &&
        messagePhone2HasIncomingMessage.length <= 0 &&
        messagePhone3HasIncomingMessage.length > 0) ||
      (messageHasIncomingMessage.length <= 0 &&
        messagePhone2HasIncomingMessage.length > 0 &&
        messagePhone3HasIncomingMessage.length > 0) ||
      (messageHasIncomingMessage.length > 0 &&
        messagePhone2HasIncomingMessage.length <= 0 &&
        messagePhone3HasIncomingMessage.length > 0) ||
      (messageHasIncomingMessage.length > 0 &&
        messagePhone2HasIncomingMessage.length > 0 &&
        messagePhone3HasIncomingMessage.length <= 0) ||
      (messageHasIncomingMessage.length > 0 &&
        messagePhone2HasIncomingMessage.length > 0 &&
        messagePhone3HasIncomingMessage.length > 0)
    ) {
      if (
        updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
        updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
        updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
        updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
        (updatedInbox.isAddedToDNC === false ||
          updatedInbox.isAddedToDNCPhone2 === false ||
          updatedInbox.isAddedToDNCPhone3 === false)
      ) {
        updatedInbox.status = "651ebe828042b1b3f4674ea8";
        await updatedInbox.save({ timestamps: false });
      }
    }
    let activity;
    if (body.phone) {
      activity = body.phone + " " + "was removed from DNC";
    } else if (body.phone2) {
      activity = body.phone2 + " " + "was removed from DNC";
    } else if (body.phone3) {
      activity = body.phone3 + " " + "was removed from DNC";
    }
    let activityResult = await Activity.create({
      name: activity,
      inbox: inboxId,
      type: "removeDncNumber",
    });
    if (!activityResult) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    return updatedInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const setReminder = async (body, inboxId) => {
  try {
    let inbox = await Inbox.findById(inboxId).populate("tags");
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    let reminder = await Reminder.findOne({ inbox: inboxId });
    if (reminder) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Already set reminder with this inbox"
      );
    }
    await DashStats.updateOne(
      { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
      {
        $inc: { unAnswered: -1 },
      }
    );
    inbox.isUnAnswered = false;
    const incomingMessages = inbox.messages.filter(
      (message) => message.isIncoming
    );
    const incomingMessages2 = inbox.messagesPhone2.filter(
      (message) => message.isIncoming
    );
    const incomingMessages3 = inbox.messagesPhone3.filter(
      (message) => message.isIncoming
    );
    if (
      incomingMessages.length > 0 &&
      inbox.isVerifiedNumber === true &&
      inbox.isAddedToDNC === false
    ) {
      body.to = inbox.to;
    } else if (
      incomingMessages2.length > 0 &&
      inbox.isVerifiedNumberPhone2 === true &&
      inbox.isAddedToDNCPhone2 === false
    ) {
      body.to = inbox.phone2;
    } else if (
      incomingMessages3.length > 0 &&
      inbox.isVerifiedNumberPhone3 === true &&
      inbox.isAddedToDNCPhone3 === false
    ) {
      body.to = inbox.phone3;
    }
    body.from = inbox.from;
    body.inbox = inbox._id;
    const result = await Reminder.create(body);
    inbox.isReminderSet = true;
    inbox.reminder = result._id;
    await inbox.save({ timestamps: false });
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getReminder = async (reminderId) => {
  try {
    const result = await Reminder.findOne({ inbox: reminderId }).populate(
      "inbox"
    );
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No reminder found");
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateReminder = async (reminderId, body) => {
  try {
    let queryPromise = [
      Reminder.findOneAndUpdate(
        { inbox: reminderId },
        { $set: body },
        { new: true }
      ),
      Inbox.findById(reminderId),
    ];
    let [result, inbox] = await Promise.all(queryPromise);
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No reminder found");
    }
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    await DashStats.updateOne(
      { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
      {
        $inc: { unAnswered: -1 },
      }
    );

    inbox.isUnAnswered = false;
    await inbox.save({ timestamps: false });
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteReminder = async (reminderId) => {
  try {
    const result = await Reminder.findOneAndRemove({ inbox: reminderId });
    if (!result) {
      return "No reminder found";
    }
    await Promise.all(
      Inbox.findByIdAndUpdate(
        reminderId,
        {
          $set: {
            isReminderSet: false,
            isReminderSetPhone2: false,
            isReminderSetPhone3: false,
            reminder: null,
            isUnAnswered: false,
          },
        },
        { new: true, timestamps: false }
      ),
      DashStats.updateOne(
        { inboxId: reminderId, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      )
    );
    // await controller.createMessage(accountId, {
    //   applicationId: BW_MESSAGING_APPLICATION_ID,
    //   to: [result.to],
    //   from: result.from,
    //   text: result.message,
    // });
    // let messageBody = {
    //   content: result.message,
    //   phone: result.to,
    //   creationDate: new Date(),
    //   isIncoming: false,
    //   isOutgoing: true,
    //   isViewed: false,
    // };
    // let updateInbox = await Inbox.findByIdAndUpdate(reminderId, {
    //   $set: { isReminderSet: false },
    //   $push: { messages: messageBody },
    //   $unset: { reminder: 1 },
    // });
    // if (!updateInbox) {
    //   throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    // }
    // const responseBody = {
    //   content: result.message,
    //   phone: result.to,
    //   isIncoming: false,
    //   isOutgoing: true,
    //   inboxId: updateInbox._id,
    //   isViewed: false,
    // };
    // io.emit("new-message", responseBody);
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
const getAllReminder = async (filter, options) => {
  try {
    return await Reminder.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const markAsRead = async (inboxId) => {
  try {
    let isViewed = await Inbox.findOne({
      _id: inboxId,
      $or: [
        { messages: { $elemMatch: { isViewed: false } } },
        { messagesPhone2: { $elemMatch: { isViewed: false } } },
        { messagesPhone3: { $elemMatch: { isViewed: false } } },
      ],
    });
    if (isViewed) {
      const inbox = await Inbox.findByIdAndUpdate(
        inboxId,
        {
          $set: {
            "messages.$[].isViewed": true,
            "messagesPhone2.$[].isViewed": true,
            "messagesPhone3.$[].isViewed": true,
            isRead: true,
            isUnRead: false,
          },
        },
        { new: true, timestamps: false }
      );
      if (!inbox) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
      }
      await DashStats.updateOne(
        { inboxId: inbox?._id, unRead: { $gt: 0 } },
        {
          $inc: { unRead: -1 },
        }
      );
      return inbox;
    } else {
      return "Already updated";
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const markAsUnRead = async (inboxId) => {
  try {
    const inbox = await Inbox.findByIdAndUpdate(
      inboxId,
      {
        $set: {
          "messages.$[].isViewed": false,
          "messagesPhone2.$[].isViewed": false,
          "messagesPhone3.$[].isViewed": false,
          isRead: false,
          isUnRead: true,
        },
      },
      { new: true, timestamps: false }
    );
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    await DashStats.updateOne(
      { inboxId: inbox?._id },
      {
        $inc: { unRead: 1 },
      }
    );
    return inbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const addStatusInInbox = async (body, inboxId) => {
  let inbox = await Inbox.findById(inboxId).populate(
    "tags campagin batch status"
  );
  if (!inbox) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
  }
  const status = await Status.findById(body.status);
  if (!status) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No status found");
  }

  if (inbox.status._id.toString() === "651ebe648042b1b3f4674ea2") {
    inbox = await Inbox.findByIdAndUpdate(
      inbox._id,
      {
        $set: { status: "651ebe828042b1b3f4674ea8" },
        $unset: {
          dripAutomation: 1,
          dripAutomationSchedule: 1,
          dripAutomationDate: 1,
          dripTimeZone: 1,
        },
      },
      { new: true, timestamps: false }
    ).populate("tags campagin batch status");
    await InboxDripAutomation.deleteMany({ inboxId: inbox._id });
  }
  await DashStats.updateOne(
    { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
    {
      $inc: { unAnswered: -1 },
    }
  );
  inbox.isUnAnswered = false;
  if (
    body.phone &&
    (status.name === "Hot" ||
      status.name === "Warm" ||
      status.name === "Nurture")
  ) {
    inbox.status = body.status;
    inbox.isVerifiedNumber = true;
    inbox.isVerifiedNumberPhone2 = false;
    inbox.isVerifiedNumberPhone3 = false;
    inbox.statusDate = new Date();
    await inbox.save({ timestamps: false });
  } else if (
    body.phone2 &&
    (status.name === "Hot" ||
      status.name === "Warm" ||
      status.name === "Nurture")
  ) {
    inbox.status = body.status;
    inbox.isVerifiedNumber = false;
    inbox.isVerifiedNumberPhone2 = true;
    inbox.isVerifiedNumberPhone3 = false;
    inbox.statusDate = new Date();
    await inbox.save({ timestamps: false });
  } else if (
    body.phone3 &&
    (status.name === "Hot" ||
      status.name === "Warm" ||
      status.name === "Nurture")
  ) {
    inbox.status = body.status;
    inbox.isVerifiedNumber = false;
    inbox.isVerifiedNumberPhone2 = false;
    inbox.isVerifiedNumberPhone3 = true;
    inbox.statusDate = new Date();
    await inbox.save({ timestamps: false });
  } else if (status.name === "Wrong Number") {
    if (body.phone) {
      inbox.isVerifiedNumber = false;
    } else if (body.phone2) {
      inbox.isVerifiedNumberPhone2 = false;
    } else {
      inbox.isVerifiedNumberPhone3 = false;
    }
    inbox.status = body.status;
    inbox.isWrongNumber = true;
    inbox.statusDate = new Date();
    await inbox.save({ timestamps: false });
  } else {
    inbox.status = body.status;
    inbox.statusDate = new Date();
    await inbox.save({ timestamps: false });
  }

  let statusAdded = status.name;
  let activity = "Added status" + " " + statusAdded;
  await Activity.create({
    name: activity,
    inbox: inboxId,
    type: `addStatus${statusAdded}`,
  });
  return inbox;
};

const deleteStatusInInbox = async (inboxId, body) => {
  try {
    let oldInbox = await Inbox.findById(inboxId).populate("campagin");
    if (!oldInbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    const status = await Status.findById(oldInbox.status);
    if (!status) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No status found");
    }
    const inbox = await Inbox.findByIdAndUpdate(
      inboxId,
      { $set: { status: "651ebe828042b1b3f4674ea8", statusDate: new Date() } },
      { new: true, timestamps: false }
    );
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    await DashStats.updateOne(
      { inboxId: inbox?._id, unAnswered: { $gt: 0 } },
      {
        $inc: { unAnswered: -1 },
      }
    );
    inbox.isUnAnswered = false;
    // if (status?.name === "Hot") {
    //   await Compaign.updateOne(
    //     {
    //       _id: oldInbox?.campagin?._id,
    //       hot: { $gt: 0 },
    //     },
    //     {
    //       $inc: { hot: -1 },
    //     }
    //   );
    // } else if (status?.name === "Warm") {
    //   await Compaign.updateOne(
    //     {
    //       _id: oldInbox?.campagin?._id,
    //       warm: { $gt: 0 },
    //     },
    //     {
    //       $inc: { warm: -1 },
    //     }
    //   );
    // } else if (status?.name === "Nurture") {
    //   await Compaign.updateOne(
    //     {
    //       _id: oldInbox?.campagin?._id,
    //       nurture: { $gt: 0 },
    //     },
    //     {
    //       $inc: { nurture: -1 },
    //     }
    //   );
    // } else if (status?.name === "Drip") {
    //   await Compaign.updateOne(
    //     {
    //       _id: oldInbox?.campagin?._id,
    //       drip: { $gt: 0 },
    //     },
    //     {
    //       $inc: { drip: -1 },
    //     }
    //   );
    // }

    if (status.name === "Wrong Number") {
      inbox.isWrongNumber = false;
      await inbox.save({ timestamps: false });
    }
    let statusDeleted = status.name;
    let activity = "Removed status" + " " + statusDeleted;
    await Activity.create({
      name: activity,
      inbox: inboxId,
      type: `removeStatus${statusDeleted}`,
    });
    let updatedBox = await Inbox.findById(inboxId).populate(
      "tags campagin batch"
    );
    return updatedBox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const changeTemplate = async (body, batchId) => {
  try {
    const batch = await Batch.findByIdAndUpdate(
      batchId,
      { $set: body },
      { new: true }
    );
    if (!batch) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No batch found");
    }
    return batch;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllPreviousDayBatches = async (filter) => {
  try {
    return await Batch.find(filter);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllFourtyEightHourPreviousBatches = async (filter) => {
  try {
    return await Batch.find(filter);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getUserForInboxSearch = async () => {
  try {
    let queryPromises = [User.find({}), Admin.find({})];
    let [user, admin] = await Promise.all(queryPromises);
    let finalArray = user.concat(admin);
    return finalArray;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const changeProspectName = async (inboxId, name) => {
  try {
    let inbox = await Inbox.findById(inboxId).populate("tags");
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    const lastSpaceIndex = name?.lastIndexOf(" ");

    const firstName = name?.substring(0, lastSpaceIndex);
    const lastName = name?.substring(lastSpaceIndex + 1);
    let csvData = await CsvData.findOneAndUpdate(
      {
        phone1: inbox?.to,
      },
      { $set: { firstName: firstName, lastName: lastName } },
      { new: true }
    );
    if (!csvData) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    inbox.userName = name;
    await inbox.save({ timestamps: false });
    await Activity.create({
      name: "Prospect's name changed",
      inbox: inboxId,
      type: "addProspect",
    });
    return inbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  //createBatch,
  getAllBatch,
  sendSMS,
  getBatchById,
  updateBatchById,
  deleteBatchById,
  sendMessage,
  getCampagin,
  getBatchForSingleCampaign,
  getInbox,
  addTagToInbox,
  addNoteToInbox,
  getNoteOfInbox,
  deleteNoteOfInbox,
  getListOfActivity,
  addToVerfiedNumber,
  removeToVerfiedNumber,
  addToWrongNumber,
  removeToWrongNumber,
  addToDNCNumber,
  removeToDNCNumber,
  removeTagToInbox,
  setReminder,
  getReminder,
  getAllReminder,
  markAsRead,
  markAsUnRead,
  deleteReminder,
  updateReminder,
  addStatusInInbox,
  deleteStatusInInbox,
  getCroneBatch,
  changeTemplate,
  getAllPreviousDayBatches,
  getAllFourtyEightHourPreviousBatches,
  sendMessageFromInbox,
  sendMessageFromInboxOfPhone2,
  sendMessageFromInboxOfPhone3,
  getUserForInboxSearch,
  changeProspectName,
  getBatchByStatusCompleted,
};
