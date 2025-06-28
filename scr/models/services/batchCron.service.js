const httpStatus = require("http-status");
const { Batch } = require("../models");
const ApiError = require("../utils/ApiError");
const { Client, ApiController } = require("@bandwidth/messaging");

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
    console.log("in api call",error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
}

module.exports = {
  getAllPreviousDayBatches,
  getAllFourtyEightHourPreviousBatches,
  sendSMS
};
