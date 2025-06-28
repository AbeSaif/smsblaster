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
} = require("../models");
const ApiError = require("../utils/ApiError");
const { Client, ApiController } = require("@bandwidth/messaging");
const moment = require("moment");
const mysql = require("mysql2/promise");
const axios = require("axios");
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
 * batch
 * @param {Object} batchBody
 * @returns {Promise<Batch>}
 */

const getAllBatch = async (filter, options) => {
  try {
    let result = await Batch.paginate(filter, options);
    if (result.results.length > 0) {
      const marketIds = result.results.map((batch) => batch.market);
      const markets = await Market.find({ _id: { $in: marketIds } }).select(
        "timeZone"
      );
      await Promise.all(
        result.results.map(async (batch, index) => {
          const market = markets.find((m) => m._id.equals(batch.market));
          const marketTimeZone = market ? market.timeZone : "UTC";
          const currentTime = moment().tz(marketTimeZone);
          if (currentTime.isValid()) {
            const startTime = moment.tz(
              `${currentTime.format("YYYY-MM-DD")} 08:00:00`,
              "YYYY-MM-DD HH:mm:ss",
              marketTimeZone
            );
            const endTime = moment.tz(
              `${currentTime.format("YYYY-MM-DD")} 21:00:00`,
              "YYYY-MM-DD HH:mm:ss",
              marketTimeZone
            );
            if (!currentTime.isBetween(startTime, endTime)) {
              result.results[index].batchActive = false;
            } else {
              result.results[index].batchActive = true;
            }
          } else {
            result.results[index].batchActive = true;
          }
        })
      );
    }
    return result;
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
    const batch = await Batch.findById(body.batchId);
    if (!batch) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No batch found");
    }
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
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// async function sendSMS(
//   messageTemplates,
//   recipients,
//   phone,
//   senderPhoneNumber,
//   bodyMessage,
//   phoneId
// ) {
//   try {
//     const response = await controller.createMessage(accountId, {
//       applicationId: BW_MESSAGING_APPLICATION_ID,
//       // to: [USER_NUMBER],
//       to: [phone],
//       // from: BW_NUMBER,
//       from: senderPhoneNumber,
//       // text: message,
//       text: bodyMessage,
//       tag: String(phoneId),
//     });
//     return response;
//   } catch (error) {
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
//   }
// }

async function sendSMS(
  messageTemplates,
  recipients,
  phone,
  senderPhoneNumber,
  bodyMessage,
  phoneId
) {
  const data = JSON.stringify({
    "from": senderPhoneNumber,
    "to": [
      phone
    ],
    "body": bodyMessage,
    "delivery_report": "full",
    "type": "mt_text"
  });

  console.log(data);


  const config = {
    method: 'post',
    url: 'https://sms.api.sinch.com/xms/v1/cad602b842804565a11941bc9725f031/batches',
    headers: {
      'Authorization': 'Bearer 05c060d56c78484389e735ee250cc301',
      'Content-Type': 'application/json'
    },
    data: data
  };

  try {
    const response = await axios(config);
    return response.data; // Return response data or handle as needed
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error; // Throw error or handle as needed
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
      let marketData = await Market.findOne({
        _id: { $in: idsToFind },
      });
      //console.log("marketData.phone", marketData);
      const activePhoneNumbers = marketData?.phoneNumber?.filter(
        (item) => item.active === true
      );
      backCampaign.phone =
        activePhoneNumbers?.length > 0
          ? activePhoneNumbers.map((item) => item.number)
          : [];
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

const changeTemplate = async (body, batchId) => {
  try {
    const previousBatch = await Batch.findById(batchId);
    if (!previousBatch) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No batch found");
    }
    if (previousBatch.batchSendMessage >= 1) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Template can't be change as message has been sent"
      );
    }
    let template = await InitialAndFollowTemplate.findById(body.template);
    let oldTemplate = await InitialAndFollowTemplate.findById(
      previousBatch.template
    );
    if (!template) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
    }
    if (!oldTemplate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
    }
    if (template.quantity >= 300) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Template already reached to limit"
      );
    }
    oldTemplate.quantity =
      oldTemplate.quantity - previousBatch.batchTotalProspects;
    template.quantity = template.quantity + previousBatch.batchTotalProspects;
    previousBatch.template = body.template;
    await oldTemplate.save();
    await template.save();
    await previousBatch.save();
    // const batch = await Batch.findByIdAndUpdate(
    //   batchId,
    //   { $set: body },
    //   { new: true }
    // );
    // if (!batch) {
    //   throw new ApiError(httpStatus.BAD_REQUEST, "No batch found");
    // }
    return previousBatch;
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
  getBatchByStatusCompleted,
  getCampagin,
  changeTemplate,
};
