const httpStatus = require("http-status");
const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { batchService } = require("../services");
const pick = require("../utils/pick");
const axios = require("axios");
const { Integration, InboxDripAutomation } = require("./../models");
const {
  User,
  Batch,
  Admin,
  DirectImport,
  Market,
  InitialAndFollowTemplate,
  Reminder,
  Flag,
  Activity,
  DNC,
  Compaign,
  DashStats,
} = require("../models");
const { Inbox, CsvData } = require("../models");
const { compaignService } = require("../services");
const mysql = require("mysql2/promise");
const moment = require("moment");
const Queue = require("bull");
const momenT = require("moment-timezone");
const { Client, ApiController } = require("@bandwidth/messaging");
const BW_USERNAME = "ZeitBlast_API";
const BW_PASSWORD = "AnjumAPI2024!";
const BW_ACCOUNT_ID = "5009813";
const BW_MESSAGING_APPLICATION_ID = process.env.dev_bw_id;
const BW_NUMBER = "+14702893577";
const USER_NUMBER = "+13105622006";
const messageId = "16946869536982njl2igxirrbzqvw";
const qs = require("qs");
const { response } = require("express");

const client = new Client({
  basicAuthUserName: BW_USERNAME,
  basicAuthPassword: BW_PASSWORD,
});

const controller = new ApiController(client);

const accountId = BW_ACCOUNT_ID;

const getBatchById = catchAsync(async (req, res) => {
  let connection;
  try {
    let id = req.params.batchId;
    const batch = await batchService.getBatchById(id);
    let batchId = String(id);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const updateSql = "SELECT * FROM launchsms.csvdata WHERE batchId = ?";
    let directImportFinalData = await connection.query(updateSql, [
      batchId ? batchId : 0,
    ]);
    await connection.commit();
    let finalBatch = batch.batch;
    let finalCampaign = batch.backCampaign;
    let finalTemplate = batch.template;
    let finalResult = {
      directImport: directImportFinalData[0],
      finalBatch,
      finalCampaign,
      finalTemplate,
    };
    res.status(httpStatus.CREATED).send(finalResult);
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error("Error inserting data:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

const updateBatchById = catchAsync(async (req, res) => {
  let id = req.params.batchId;
  let body = req.body;
  const batch = await batchService.updateBatchById(id, body);
  res.status(httpStatus.CREATED).send(batch);
});

const deleteBatchById = catchAsync(async (req, res) => {
  let id = req.params.batchId;
  const batch = await batchService.deleteBatchById(id);
  res.status(httpStatus.CREATED).send(batch);
});

const getCampagin = catchAsync(async (req, res) => {
  let filter = {
    // assignCampaign: { $exists: true },
    // assignCamapingCompleted: false,
  };
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:desc";
  //options.populate = "assignCampaign";
  const response = await batchService.getCampagin(filter, options);
  let connection;
  try {
    if (!response.results.length) {
      return response;
    }

    connection = await pool.getConnection();

    let totalPrsopects = 0;
    let filteredResults = [];
    let column = "";
    let campQuery = "";
    let data = response.results;
    for (let i = 0; i < response.results.length; i++) {
      if (data[i].permission === "compaign") {
        column = "campaignId";
        campQuery = `SELECT * FROM launchsms.csvdata WHERE ${column}='${data[i]._id}' AND batchId IS NULL AND status = 0 AND response = 0 AND response2 = 0 AND response3 = 0;`;
      } else if (data[i].permission === "followCompaign") {
        column = "campaignId1";
        campQuery = `SELECT * FROM launchsms.csvdata WHERE ${column}='${data[i]._id}' AND batchId IS NULL AND status = 0 AND response = 0 AND response2 = 0 AND response3 = 0;`;
      } else if (data[i].permission === "followCompaign2") {
        column = "campaignId2";
        campQuery = `SELECT * FROM launchsms.csvdata WHERE ${column}='${data[i]._id}' AND batchId IS NULL AND status = 0 AND response = 0 AND response2 = 0 AND response3 = 0;`;
      } else if (data[i].permission === "followCompaign3") {
        column = "campaignId3";
        campQuery = `SELECT * FROM launchsms.csvdata WHERE ${column}='${data[i]._id}' AND batchId IS NULL AND status = 0 AND response = 0 AND response2 = 0 AND response3 = 0;`;
      }
      await connection.beginTransaction();
      let [campResult] = await connection.query(campQuery);
      data[i].totalProspectsRemaining = campResult.length;
      await connection.commit();
    }

    res.status(httpStatus.CREATED).send(response);
    // // Create all the queries first and then execute them
    // const queries = response.results.map(data => {
    //   let column = "";
    //   if (data.permission === "compaign") column = "campaignId";
    //   else if (data.permission === "followCompaign") column = "campaignId1";
    //   else if (data.permission === "followCompaign2") column = "campaignId2";
    //   else if (data.permission === "followCompaign3") column = "campaignId3";

    //   return column ? `SELECT * FROM launchsms.csvdata WHERE ${column}='${data._id}' AND batchId IS NULL AND status = 0 AND response = 0 AND response2 = 0 AND response3 = 0;` : null;
    // }).filter(query => query !== null);

    // // Execute all queries in parallel
    // const results = await Promise.all(queries.map(query => connection.query(query)));

    // results.forEach((resultQuery, i) => {
    //   console.log("resultQuery", resultQuery[0].length);
    //   totalPrsopects += resultQuery[0].length;

    //   if (resultQuery[0].length > 0) {
    //     filteredResults.push(response.results[i]);
    //   }
    // });

    // await connection.commit();
    // response.results = filteredResults;

    //return totalPrsopects > 0 ? response : {};
  } catch (error) {
    if (connection) {
      await connection.rollback(); // If there's an error, rollback the transaction.
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  } finally {
    if (connection) {
      connection.release(); // Always release the connection back to the pool
    }
  }
});

const sendMessageFromInbox = catchAsync(async (req, res) => {
  try {
    let body = req.body;
    let inbox = await batchService.sendMessageFromInbox(body);
    // if (inbox?.message) {
    //   if (inbox?.message === "Number in wrong state u can't send message") {
    //     return res
    //       .status(httpStatus.INTERNAL_SERVER_ERROR)
    //       .send("Number in wrong state u can't send message");
    //   }
    // } else {
    //   return res.status(httpStatus.OK).send(inbox);
    // }
    return res.status(httpStatus.OK).send(inbox);
  } catch (error) {
    console.error("Error queueing message:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
});

const sendMessageFromInboxOfPhone2 = catchAsync(async (req, res) => {
  try {
    let body = req.body;
    let inbox = await batchService.sendMessageFromInboxOfPhone2(body);
    return res.status(httpStatus.OK).send(inbox);
  } catch (error) {
    console.error("Error queueing message:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
});

const sendMessageFromInboxOfPhone3 = catchAsync(async (req, res) => {
  try {
    let body = req.body;
    let inbox = await batchService.sendMessageFromInboxOfPhone3(body);
    return res.status(httpStatus.OK).send(inbox);
  } catch (error) {
    console.error("Error queueing message:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
});

const smsStatus = catchAsync(async (req, res) => {
  try {
    const callback = req.body.statuses[0];
    console.log( callback);
    let PhoneNumber;
    let updateSql;

    switch (callback.status) {
      case "message-sending":
        console.log(`message-sending type is only for MMS`);
        break;
      case "Delivered":
        if (req.body.batch_id !== "undefined") {
          PhoneNumber = callback.recipients[0];
          const valueToCheck = req.body.batch_id;
          console.log("valueToCheck",valueToCheck)
          const aggregatedData = await CsvData.aggregate([
            {
              $match: {
                $or: [
                  { bandwithsendid1: valueToCheck },
                  { bandwithsendid2: valueToCheck },
                  { bandwithsendid3: valueToCheck },
                ],
              },
            },
            {
              $project: {
                matchingField: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$bandwithsendid1", valueToCheck] },
                        then: "bandwithsendid1",
                      },
                      {
                        case: { $eq: ["$bandwithsendid2", valueToCheck] },
                        then: "bandwithsendid2",
                      },
                      {
                        case: { $eq: ["$bandwithsendid3", valueToCheck] },
                        then: "bandwithsendid3",
                      },
                    ],
                    default: null, // Ensures no ambiguous matches.
                  },
                },
              },
            },
            {
              $match: {
                matchingField: { $ne: null }, // Filter to ensure only valid matches are returned.
              },
            },
          ]);
          

          console.log("agg", aggregatedData);
          if (aggregatedData.length > 0) {
            const matchingField = aggregatedData[0].matchingField;
            let deliveryUpdate;
            let foundDeliverd;

            switch (matchingField) {
              case "bandwithsendid1":
                deliveryUpdate = { delivered: 1 };
                foundDeliverd = await CsvData.find({
                  bandwithsendid1: valueToCheck,
                  delivered: 1,
                });
                break;
              case "bandwithsendid2":
                deliveryUpdate = { delivered2: 1 };
                foundDeliverd = await CsvData.find({
                  bandwithsendid2: valueToCheck,
                  delivered2: 1,
                });
                break;
              case "bandwithsendid3":
                deliveryUpdate = { delivered3: 1 };
                foundDeliverd = await CsvData.find({
                  bandwithsendid3: valueToCheck,
                  delivered3: 1,
                });
                break;
              default:
                return "Nothing";
            }
            console.log("foundDeliverd", foundDeliverd);
            if (foundDeliverd.length == 0) {
              console.log("foundDeliverd", foundDeliverd);
              const updatedCsvData = await CsvData.findOneAndUpdate(
                { _id: aggregatedData[0]._id },
                deliveryUpdate,
                { new: true }
              );

              if (updatedCsvData) {
                console.log(
                  "pdatedCsvData.directImportId",
                  updatedCsvData.directImportId
                );

                let campaignId;

                if (
                  updatedCsvData.campaignId &&
                  updatedCsvData.campaignId !== ""
                ) {
                  campaignId = updatedCsvData.campaignId;
                } else if (
                  updatedCsvData.campaignId1 &&
                  updatedCsvData.campaignId1 !== ""
                ) {
                  campaignId = updatedCsvData.campaignId1;
                } else if (
                  updatedCsvData.campaignId2 &&
                  updatedCsvData.campaignId2 !== ""
                ) {
                  campaignId = updatedCsvData.campaignId2;
                } else if (
                  updatedCsvData.campaignId3 &&
                  updatedCsvData.campaignId3 !== ""
                ) {
                  campaignId = updatedCsvData.campaignId3;
                }

                if (campaignId) {
                  const campaignUpdate = Compaign.findOneAndUpdate(
                    { _id: campaignId },
                    { $inc: { totalDelivered: 1 } },
                    { new: true }
                  );

                  const directImportUpdate = DirectImport.findOneAndUpdate(
                    { _id: updatedCsvData.directImportId },
                    { $inc: { delivered: 1 } },
                    { new: true }
                  );

                  // Execute both updates in parallel within the transaction
                  const [updatedCampaign, updatedDirectImport] =
                    await Promise.all([campaignUpdate, directImportUpdate]);

                  if (!updatedCampaign) {
                    throw new Error(
                      `Campaign with ID ${campaignId} not found.`
                    );
                  }

                  if (!updatedDirectImport) {
                    throw new Error(
                      `DirectImport with ID ${updatedCsvData.directImportId} not found.`
                    );
                  }
                } else {
                  console.log(
                    "No campaign ID found to increment delivered value."
                  );
                }
              } else {
                console.log("Failed to update CsvData.");
              }
            } else {
              console.log("already delivered");
            }
          } else {
            console.log("No matching data found in aggregation.");
          }
        }
        console.log(`Message delivered callback received.`);
        break;
      case "Failed":
        PhoneNumber = callback.recipients[0];
        const newDelivered = 1;
        let flagRecordExist = await Flag.findOne({
          $and: [
            { to: PhoneNumber },
            { "message.from": callback?.from },
          ],
        });
        if (!flagRecordExist) {
          await Flag.create(callback);
        }
        const valueToCheck = callback.batch_id;
        const aggregatedData = await CsvData.aggregate([
          {
            $match: {
              $or: [
                { bandwithsendid1: valueToCheck },
                { bandwithsendid2: valueToCheck },
                { bandwithsendid3: valueToCheck },
              ],
            },
          },
          {
            $project: {
              matchingField: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$bandwithsendid1", valueToCheck] },
                      then: "bandwithsendid1",
                    },
                    {
                      case: { $eq: ["$bandwithsendid2", valueToCheck] },
                      then: "bandwithsendid2",
                    },
                    {
                      case: { $eq: ["$bandwithsendid3", valueToCheck] },
                      then: "bandwithsendid3",
                    },
                  ],
                  default: "None",
                },
              },
            },
          },
        ]);
        if (aggregatedData.length > 0) {
          let deliveryUpdate;

          if (aggregatedData[0].matchingField === "bandwithsendid1") {
            deliveryUpdate = {
              undelivered: 1,
            };
          } else if (aggregatedData[0].matchingField === "bandwithsendid2") {
            deliveryUpdate = {
              undelivered2: 1,
            };
          } else if (aggregatedData[0].matchingField === "bandwithsendid3") {
            deliveryUpdate = {
              undelivered3: 1,
            };
          } else {
            return "Nothing";
          }

          const updaeCsvData = await CsvData.findOneAndUpdate(
            { _id: aggregatedData[0]._id },
            deliveryUpdate,
            { new: true }
          );
        }
        break;
      default:
        console.log(`Unrecognized message type.`);
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error updating data:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error.message);
  }
});


const getInbound = async (req, res, io, userSocketMap, redisPublisher) => {
  try {
    const callback = req.body;
    let updateInbox;

    switch (callback.type) {
      case "mo_text":
        const existingPhoneNumber = callback.from.replace(/^\+?1/,"");
        const filter = {
          $or: [
            {
              $and: [
                { to: existingPhoneNumber },
                { "messages.bandWidthId": { $ne: callback.id } },
                { isWrongNumber: false },
                { isAddedToDNC: false },
              ],
            },
            {
              $and: [
                { phone2: existingPhoneNumber },
                { "messagesPhone2.bandWidthId": { $ne: callback.id } },
                { isWrongNumberPhone2: false },
                { isAddedToDNCPhone2: false },
              ],
            },
            {
              $and: [
                { phone3: existingPhoneNumber },
                { "messagesPhone3.bandWidthId": { $ne: callback.id } },
                { isWrongNumberPhone3: false },
                { isAddedToDNCPhone3: false },
              ],
            },
          ],
        };
        let messageBody = {
          content: callback.body,
          phone: existingPhoneNumber,
          creationDate: new Date(),
          isIncoming: true,
          isOutgoing: false,
          isViewed: false,
          bandWidthId: callback.id,
        };
        let inboxAndCsvQuery = [
          Inbox.findOne(filter).populate("campagin"),
          CsvData.findOne({
            status: 1,
            $or: [
              { phone1: existingPhoneNumber },
              { phone2: existingPhoneNumber },
              { phone3: existingPhoneNumber },
            ],
          }),
        ];
        let [inbox, csvResult] = await Promise.all(inboxAndCsvQuery);
        if (inbox && csvResult) {
          if (inbox.to === existingPhoneNumber) {
            let lastMessageType = "initial";
            if (inbox.messages.length > 0) {
              const lastMessage = inbox.messages[inbox.messages.length - 1];
              lastMessageType = lastMessage.type;
              if (lastMessage?.isOutgoing === true) {
                messageBody.type = lastMessage.type;
                if (
                  lastMessageType === "initial" ||
                  lastMessageType === "follow"
                ) {
                  await Compaign.findByIdAndUpdate(inbox?.campagin?._id, {
                    $inc: { totalResponse: 1 },
                  });
                  await DirectImport.findOneAndUpdate(
                    { assignCampaign: inbox?.campagin?._id }, // Find by assignedCampaign
                    { $inc: { response: 1 } }, // Increment delivered by 1
                    { new: true } // Return the updated document
                  );

                  // await DashStats.updateOne(
                  //   {},
                  //   {
                  //     $inc: { unRead: 1, unAnswered: 1 },
                  //   }
                  // );
                }
                if (
                  inbox.isVerifiedNumber === true &&
                  lastMessage.type === "drip"
                ) {
                  messageBody.isDripIncomingMessage = true;
                }
              } else if (
                lastMessage.isIncoming === true &&
                (lastMessage.type === "initial" ||
                  lastMessage.type === "follow" ||
                  lastMessage.type === "drip" ||
                  lastMessage.type === "inbox" ||
                  lastMessage.type === "other")
              ) {
                messageBody.type = "other";
              } else {
                messageBody.type = "inbox";
              }
            }
            inbox.messages.push(messageBody);
          } else if (inbox.phone2 === existingPhoneNumber) {
            let lastMessageType = "initial";
            if (inbox.messagesPhone2.length > 0) {
              const lastMessage =
                inbox.messagesPhone2[inbox.messagesPhone2.length - 1];
              lastMessageType = lastMessage.type;
              if (lastMessage?.isOutgoing === true) {
                messageBody.type = lastMessage.type;
                if (
                  lastMessageType === "initial" ||
                  lastMessageType === "follow"
                ) {
                  await Compaign.findByIdAndUpdate(inbox?.campagin?._id, {
                    $inc: { totalResponse: 1 },
                  });
                  await DirectImport.findOneAndUpdate(
                    { assignCampaign: inbox?.campagin?._id }, // Find by assignedCampaign
                    { $inc: { response: 1 } }, // Increment delivered by 1
                    { new: true } // Return the updated document
                  );
                  // await DashStats.updateOne(
                  //   {},
                  //   {
                  //     $inc: { unRead: 1, unAnswered: 1 },
                  //   }
                  // );
                }
                if (
                  inbox.isVerifiedNumber === true &&
                  lastMessage.type === "drip"
                ) {
                  messageBody.isDripIncomingMessage = true;
                }
              } else if (
                lastMessage.isIncoming === true &&
                (lastMessage.type === "initial" ||
                  lastMessage.type === "follow" ||
                  lastMessage.type === "drip" ||
                  lastMessage.type === "inbox" ||
                  lastMessage.type === "other")
              ) {
                messageBody.type = "other";
              } else {
                messageBody.type = "inbox";
              }
            }

            inbox.messagesPhone2.push(messageBody);
          } else if (inbox.phone3 === existingPhoneNumber) {
            let lastMessageType = "initial";
            if (inbox.messagesPhone3.length > 0) {
              const lastMessage =
                inbox.messagesPhone3[inbox.messagesPhone3.length - 1];
              lastMessageType = lastMessage.type;
              if (lastMessage?.isOutgoing === true) {
                messageBody.type = lastMessage.type;
                if (
                  lastMessageType === "initial" ||
                  lastMessageType === "follow"
                ) {
                  await Compaign.findByIdAndUpdate(inbox?.campagin?._id, {
                    $inc: { totalResponse: 1 },
                  });
                  await DirectImport.findOneAndUpdate(
                    { assignCampaign: inbox?.campagin?._id }, // Find by assignedCampaign
                    { $inc: { response: 1 } }, // Increment delivered by 1
                    { new: true } // Return the updated document
                  );
                  // await DashStats.updateOne(
                  //   {},
                  //   {
                  //     $inc: { unRead: 1, unAnswered: 1 },
                  //   }
                  // );
                }
                if (
                  inbox.isVerifiedNumber === true &&
                  lastMessage.type === "drip"
                ) {
                  messageBody.isDripIncomingMessage = true;
                }
              } else if (
                lastMessage.isIncoming === true &&
                (lastMessage.type === "initial" ||
                  lastMessage.type === "follow" ||
                  lastMessage.type === "drip" ||
                  lastMessage.type === "inbox" ||
                  lastMessage.type === "other")
              ) {
                messageBody.type = "other";
              } else {
                messageBody.type = "inbox";
              }
            } else {
              messageBody.type = "initial";
            }

            inbox.messagesPhone3.push(messageBody);
          }
          inbox["isIncoming"] = true;
          updateInbox = await Inbox.findOneAndUpdate(filter, inbox, {
            new: true,
          });
        }
        if (updateInbox && csvResult) {
          let updatedInbox = await Inbox.findById(inbox._id);
          let messageHasIncomingMessage = updatedInbox.messages.filter(
            (item) => item.isIncoming
          );
          let messagePhone2HasIncomingMessage =
            updatedInbox.messagesPhone2.filter((item) => item.isIncoming);
          let messagePhone3HasIncomingMessage =
            updatedInbox.messagesPhone3.filter((item) => item.isIncoming);
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
              await updatedInbox.save();
            }
          }
          let inboxAfterDnc = {};
          let responseBody = {
            content: messageBody.content,
            phone: messageBody.phone,
            isIncoming: messageBody.isIncoming,
            isOutgoing: messageBody.isOutgoing,
            inboxId: updateInbox._id,
            isViewed: messageBody.isViewed,
          };
          if (
            updateInbox.to === existingPhoneNumber &&
            updateInbox.isAddedToDNCPermanent === false
          ) {
            if (updateInbox.messages.length > 0) {
              let filteredArray = updateInbox.messages.filter(
                (item) => item.isIncoming === true
              );
              if (
                filteredArray.length > 0 &&
                (filteredArray[0].content.toLowerCase() ===
                  "stop".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "do not call.".toLowerCase())
              ) {
                let inboxDetail = await CsvData.findOne({ phone1: inbox.to });
                if (inboxDetail) {
                  let numberExist = await DNC.findOneAndUpdate(
                    { number: inbox.to },
                    {
                      $set: {
                        firstName: inboxDetail.firstName,
                        lastName: inboxDetail.lastName,
                        permanent: true,
                      },
                    },
                    { new: true }
                  );
                  if (!numberExist) {
                    await DNC.create({
                      number: inbox.to,
                      firstName: inboxDetail.firstName,
                      lastName: inboxDetail.lastName,
                      permanent: true,
                    });
                  }
                  inboxDetail.dncPhone1 = true;
                  await inboxDetail.save();
                } else {
                  let numberExist = await DNC.findOneAndUpdate(
                    { number: inbox.to },
                    { $set: { permanent: true } },
                    { new: true }
                  );
                  if (!numberExist) {
                    await DNC.create({ number: inbox.to, permanent: true });
                  }
                }
                let activity = inbox.to + " " + "was added to DNC";
                await Activity.create({
                  name: activity,
                  inbox: inbox._id,
                  type: "addDncNumber",
                });
                inboxAfterDnc = await Inbox.findOneAndUpdate(
                  {
                    _id: inbox._id,
                    "messages._id": filteredArray[0]._id,
                  },
                  {
                    $set: {
                      "messages.$.isViewed": true,
                      isAddedToDNCPermanent: true,
                      isAddedToDNC: true,
                    },
                  },
                  { new: true }
                );
                let updatedInboxAfterDNC = await Inbox.findById(inbox._id);
                let messageHasIncomingMessage =
                  updatedInboxAfterDNC?.messages?.filter(
                    (item) => item?.isIncoming
                  );
                if (
                  (messageHasIncomingMessage?.length > 0 &&
                    messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messageHasIncomingMessage =
                    messageHasIncomingMessage?.slice(1);
                }
                let messagePhone2HasIncomingMessage =
                  updatedInboxAfterDNC?.messagesPhone2?.filter(
                    (item) => item?.isIncoming
                  );

                if (
                  (messagePhone2HasIncomingMessage?.length > 0 &&
                    messagePhone2HasIncomingMessage[0]?.content.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messagePhone2HasIncomingMessage[0]?.content.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messagePhone2HasIncomingMessage[0]?.content.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messagePhone2HasIncomingMessage[0]?.content.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messagePhone2HasIncomingMessage =
                    messagePhone2HasIncomingMessage?.slice(1);
                }
                let messagePhone3HasIncomingMessage =
                  updatedInboxAfterDNC?.messagesPhone3?.filter(
                    (item) => item?.isIncoming
                  );
                if (
                  (messagePhone3HasIncomingMessage?.length > 0 &&
                    messagePhone3HasIncomingMessage[0]?.content.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messagePhone3HasIncomingMessage[0]?.content.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messagePhone3HasIncomingMessage[0]?.content.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messagePhone3HasIncomingMessage[0]?.content.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messagePhone3HasIncomingMessage =
                    messagePhone3HasIncomingMessage?.slice(1);
                }
                if (
                  updatedInboxAfterDNC.to &&
                  updatedInboxAfterDNC.phone2 &&
                  updatedInboxAfterDNC.phone3
                ) {
                  if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length <= 0 &&
                    messagePhone2HasIncomingMessage.length <= 0 &&
                    messagePhone3HasIncomingMessage.length <= 0
                  ) {
                    if (
                      (updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe5b8042b1b3f4674ea0" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe268042b1b3f4674e9b" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe4e8042b1b3f4674e9d" &&
                        updatedInboxAfterDNC.isAddedToDNC === true) ||
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true ||
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  } else if (
                    (updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
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
                    (messageHasIncomingMessage.length <= 0 &&
                      messagePhone2HasIncomingMessage.length <= 0 &&
                      messagePhone3HasIncomingMessage.length <= 0)
                  ) {
                    if (
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      updatedInboxAfterDNC.isAddedToDNC === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  } else if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length > 0 &&
                    messagePhone2HasIncomingMessage.length > 0 &&
                    messagePhone3HasIncomingMessage.length > 0
                  ) {
                    if (
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      updatedInboxAfterDNC.isAddedToDNC === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                } else if (
                  updatedInboxAfterDNC.to &&
                  updatedInboxAfterDNC.phone2 &&
                  !updatedInboxAfterDNC.phone3
                ) {
                  if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length <= 0 &&
                    messagePhone2HasIncomingMessage.length <= 0
                  ) {
                    if (
                      (updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe5b8042b1b3f4674ea0" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe268042b1b3f4674e9b" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe4e8042b1b3f4674e9d" &&
                        updatedInboxAfterDNC.isAddedToDNC === true) ||
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                } else {
                  if (
                    (updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
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
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      // (updatedInboxAfterDNC.isVerifiedNumber !== true ||
                      //   updatedInboxAfterDNC.isVerifiedNumberPhone2 !== true ||
                      //   updatedInboxAfterDNC.isVerifiedNumberPhone2 !== true) &&
                      (updatedInboxAfterDNC.isAddedToDNC === true ||
                        updatedInboxAfterDNC.isAddedToDNCPhone2 === true ||
                        updatedInboxAfterDNC.isAddedToDNCPhone3 === true)
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                }
                responseBody = {
                  content: messageBody.content,
                  phone: messageBody.phone,
                  isIncoming: messageBody.isIncoming,
                  isOutgoing: messageBody.isOutgoing,
                  inboxId: updateInbox._id,
                  isViewed: true,
                  isAddedToDNCPermanent: true,
                  isAddedToDNC: true,
                };
              }
            }
          } else if (
            updateInbox.phone2 === existingPhoneNumber &&
            updateInbox.isAddedToDNCPhone2Permanent === false
          ) {
            if (updateInbox.messagesPhone2.length > 0) {
              let filteredArray = updateInbox.messagesPhone2.filter(
                (item) => item.isIncoming === true
              );
              if (
                filteredArray.length > 0 &&
                (filteredArray[0].content.toLowerCase() ===
                  "stop".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "do not call.".toLowerCase())
              ) {
                let inboxDetail = await CsvData.findOne({
                  phone2: inbox.phone2,
                });
                if (inboxDetail) {
                  let numberExist = await DNC.findOneAndUpdate(
                    { number: inbox.phone2 },
                    {
                      $set: {
                        firstName: inboxDetail.firstName,
                        lastName: inboxDetail.lastName,
                        permanent: true,
                      },
                    },
                    { new: true }
                  );
                  if (!numberExist) {
                    await DNC.create({
                      number: inbox.phone2,
                      firstName: inboxDetail.firstName,
                      lastName: inboxDetail.lastName,
                      permanent: true,
                    });
                  }
                  inboxDetail.dncPhone2 = true;
                  await inboxDetail.save();
                } else {
                  let numberExist = await DNC.findOneAndUpdate(
                    { number: inbox.phone2 },
                    {
                      $set: {
                        permanent: true,
                      },
                    },
                    { new: true }
                  );
                  if (!numberExist) {
                    await DNC.create({ number: inbox.phone2, permanent: true });
                  }
                }
                let activity = inbox.phone2 + " " + "was added to DNC";
                await Activity.create({
                  name: activity,
                  inbox: inbox._id,
                  type: "addDncNumber",
                });
                inboxAfterDnc = await Inbox.findOneAndUpdate(
                  {
                    _id: inbox._id,
                    "messagesPhone2._id": filteredArray[0]._id,
                  },
                  {
                    $set: {
                      "messagesPhone2.$.isViewed": true,
                      isAddedToDNCPhone2Permanent: true,
                      isAddedToDNCPhone2: true,
                    },
                  },
                  { new: true }
                );
                let updatedInboxAfterDNC = await Inbox.findById(inbox._id);
                let messageHasIncomingMessage =
                  updatedInboxAfterDNC?.messages?.filter(
                    (item) => item?.isIncoming
                  );
                if (
                  (messageHasIncomingMessage?.length > 0 &&
                    messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messageHasIncomingMessage =
                    messageHasIncomingMessage?.slice(1);
                }
                let messagePhone2HasIncomingMessage =
                  updatedInboxAfterDNC?.messagesPhone2?.filter(
                    (item) => item?.isIncoming
                  );
                if (
                  (messagePhone2HasIncomingMessage?.length > 0 &&
                    messagePhone2HasIncomingMessage[0]?.content?.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messagePhone2HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messagePhone2HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messagePhone2HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messagePhone2HasIncomingMessage =
                    messagePhone2HasIncomingMessage?.slice(1);
                }
                let messagePhone3HasIncomingMessage =
                  updatedInboxAfterDNC?.messagesPhone3?.filter(
                    (item) => item?.isIncoming
                  );
                if (
                  (messagePhone3HasIncomingMessage?.length > 0 &&
                    messagePhone3HasIncomingMessage[0]?.content.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messagePhone3HasIncomingMessage[0]?.content.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messagePhone3HasIncomingMessage[0]?.content.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messagePhone3HasIncomingMessage[0]?.content.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messagePhone3HasIncomingMessage =
                    messagePhone3HasIncomingMessage?.slice(1);
                }
                if (
                  updatedInboxAfterDNC.to &&
                  updatedInboxAfterDNC.phone2 &&
                  updatedInboxAfterDNC.phone3
                ) {
                  if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length <= 0 &&
                    messagePhone2HasIncomingMessage.length <= 0 &&
                    messagePhone3HasIncomingMessage.length <= 0
                  ) {
                    if (
                      (updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe5b8042b1b3f4674ea0" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe268042b1b3f4674e9b" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe4e8042b1b3f4674e9d" &&
                        updatedInboxAfterDNC.isAddedToDNC === true) ||
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true ||
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  } else if (
                    (updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
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
                    (messageHasIncomingMessage.length <= 0 &&
                      messagePhone2HasIncomingMessage.length <= 0 &&
                      messagePhone3HasIncomingMessage.length <= 0)
                  ) {
                    if (
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      updatedInboxAfterDNC.isAddedToDNC === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  } else if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length > 0 &&
                    messagePhone2HasIncomingMessage.length > 0 &&
                    messagePhone3HasIncomingMessage.length > 0
                  ) {
                    if (
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      updatedInboxAfterDNC.isAddedToDNC === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                } else if (
                  updatedInboxAfterDNC.to &&
                  updatedInboxAfterDNC.phone2 &&
                  !updatedInboxAfterDNC.phone3
                ) {
                  if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length <= 0 &&
                    messagePhone2HasIncomingMessage.length <= 0
                  ) {
                    if (
                      (updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe5b8042b1b3f4674ea0" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe268042b1b3f4674e9b" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe4e8042b1b3f4674e9d" &&
                        updatedInboxAfterDNC.isAddedToDNC === true) ||
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                } else {
                  if (
                    (updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
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
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      (updatedInboxAfterDNC.isAddedToDNC === true ||
                        updatedInboxAfterDNC.isAddedToDNCPhone2 === true ||
                        updatedInboxAfterDNC.isAddedToDNCPhone3 === true)
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                }
                responseBody = {
                  content: messageBody.content,
                  phone: messageBody.phone,
                  isIncoming: messageBody.isIncoming,
                  isOutgoing: messageBody.isOutgoing,
                  inboxId: updateInbox._id,
                  isViewed: true,
                  isAddedToDNCPhone2Permanent: true,
                  isAddedToDNCPhone2: true,
                };
              }
            }
          } else if (
            updateInbox.phone3 === existingPhoneNumber &&
            updateInbox.isAddedToDNCPhone3Permanent === false
          ) {
            if (updateInbox.messagesPhone3.length > 0) {
              let filteredArray = updateInbox.messagesPhone3.filter(
                (item) => item.isIncoming === true
              );
              if (
                filteredArray.length > 0 &&
                (filteredArray[0].content.toLowerCase() ===
                  "stop".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  filteredArray[0].content.toLowerCase() ===
                    "do not call.".toLowerCase())
              ) {
                let inboxDetail = await CsvData.findOne({
                  phone3: inbox.phone3,
                });
                if (inboxDetail) {
                  let numberExist = await DNC.findOneAndUpdate(
                    { number: inbox.phone3 },
                    {
                      $set: {
                        firstName: inboxDetail.firstName,
                        lastName: inboxDetail.lastName,
                        permanent: true,
                      },
                    },
                    { new: true }
                  );
                  if (!numberExist) {
                    await DNC.create({
                      number: inbox.phone3,
                      firstName: inboxDetail.firstName,
                      lastName: inboxDetail.lastName,
                      permanent: true,
                    });
                  }
                  inboxDetail.dncPhone3 = true;
                  await inboxDetail.save();
                } else {
                  let numberExist = await DNC.findOneAndUpdate(
                    { number: inbox.phone3 },
                    {
                      $set: {
                        permanent: true,
                      },
                    },
                    { new: true }
                  );
                  if (!numberExist) {
                    await DNC.create({ number: inbox.phone3, permanent: true });
                  }
                }
                let activity = inbox.phone3 + " " + "was added to DNC";
                await Activity.create({
                  name: activity,
                  inbox: inbox._id,
                  type: "addDncNumber",
                });
                inboxAfterDnc = await Inbox.findOneAndUpdate(
                  {
                    _id: inbox._id,
                    "messagesPhone3._id": filteredArray[0]._id,
                  },
                  {
                    $set: {
                      "messagesPhone3.$.isViewed": true,
                      isAddedToDNCPhone3Permanent: true,
                      isAddedToDNCPhone3: true,
                    },
                  },
                  { new: true }
                );
                let updatedInboxAfterDNC = await Inbox.findById(inbox._id);
                let messageHasIncomingMessage =
                  updatedInboxAfterDNC?.messages.filter(
                    (item) => item?.isIncoming
                  );
                if (
                  (messageHasIncomingMessage?.length > 0 &&
                    messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messageHasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messageHasIncomingMessage =
                    messageHasIncomingMessage?.slice(1);
                }
                let messagePhone2HasIncomingMessage =
                  updatedInboxAfterDNC?.messagesPhone2?.filter(
                    (item) => item.isIncoming
                  );

                if (
                  (messagePhone2HasIncomingMessage?.length > 0 &&
                    messagePhone2HasIncomingMessage[0]?.content?.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messagePhone2HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messagePhone2HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messagePhone2HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messagePhone2HasIncomingMessage =
                    messagePhone2HasIncomingMessage?.slice(1);
                }
                let messagePhone3HasIncomingMessage =
                  updatedInboxAfterDNC?.messagesPhone3?.filter(
                    (item) => item?.isIncoming
                  );

                if (
                  (messagePhone3HasIncomingMessage?.length > 0 &&
                    messagePhone3HasIncomingMessage[0]?.content?.toLowerCase() ===
                      "stop".toLowerCase()) ||
                  messagePhone3HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "stop.".toLowerCase() ||
                  messagePhone3HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call".toLowerCase() ||
                  messagePhone3HasIncomingMessage[0]?.content?.toLowerCase() ===
                    "do not call.".toLowerCase()
                ) {
                  messagePhone3HasIncomingMessage =
                    messagePhone3HasIncomingMessage?.slice(1);
                }
                if (
                  updatedInboxAfterDNC.to &&
                  updatedInboxAfterDNC.phone2 &&
                  updatedInboxAfterDNC.phone3
                ) {
                  if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length <= 0 &&
                    messagePhone2HasIncomingMessage.length <= 0 &&
                    messagePhone3HasIncomingMessage.length <= 0
                  ) {
                    if (
                      (updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe5b8042b1b3f4674ea0" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe268042b1b3f4674e9b" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe4e8042b1b3f4674e9d" &&
                        updatedInboxAfterDNC.isAddedToDNC === true) ||
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true ||
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  } else if (
                    (updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
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
                      messagePhone3HasIncomingMessage.length <= 0 &&
                      messageHasIncomingMessage.length <= 0 &&
                      messagePhone2HasIncomingMessage.length <= 0 &&
                      messagePhone3HasIncomingMessage.length <= 0)
                  ) {
                    if (
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      updatedInboxAfterDNC.isAddedToDNC === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  } else if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length > 0 &&
                    messagePhone2HasIncomingMessage.length > 0 &&
                    messagePhone3HasIncomingMessage.length > 0
                  ) {
                    if (
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      updatedInboxAfterDNC.isAddedToDNC === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true &&
                      updatedInboxAfterDNC.isAddedToDNCPhone3 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                } else if (
                  updatedInboxAfterDNC.to &&
                  updatedInboxAfterDNC.phone2 &&
                  !updatedInboxAfterDNC.phone3
                ) {
                  if (
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInboxAfterDNC.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage.length <= 0 &&
                    messagePhone2HasIncomingMessage.length <= 0
                  ) {
                    if (
                      (updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe5b8042b1b3f4674ea0" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe268042b1b3f4674e9b" &&
                        updatedInboxAfterDNC.status.toString() !==
                          "651ebe4e8042b1b3f4674e9d" &&
                        updatedInboxAfterDNC.isAddedToDNC === true) ||
                      updatedInboxAfterDNC.isAddedToDNCPhone2 === true
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                } else {
                  if (
                    (updatedInboxAfterDNC.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
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
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe648042b1b3f4674ea2" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInboxAfterDNC.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      (updatedInboxAfterDNC.isAddedToDNC === true ||
                        updatedInboxAfterDNC.isAddedToDNCPhone2 === true ||
                        updatedInboxAfterDNC.isAddedToDNCPhone3 === true)
                    ) {
                      updatedInboxAfterDNC.status = "65ba97b6ae9753518b56d3d4";
                      await updatedInboxAfterDNC.save();
                    }
                  }
                }
                responseBody = {
                  content: messageBody.content,
                  phone: messageBody.phone,
                  isIncoming: messageBody.isIncoming,
                  isOutgoing: messageBody.isOutgoing,
                  inboxId: updateInbox._id,
                  isViewed: true,
                  isAddedToDNCPhone3Permanent: true,
                  isAddedToDNCPhone3: true,
                };
              }
            }
          }
          if (
            Object.keys(inboxAfterDnc).length != 0 &&
            inboxAfterDnc.messages.length > 0 &&
            inboxAfterDnc.messagesPhone2.length > 0 &&
            inboxAfterDnc.messagesPhone3.length > 0
          ) {
            if (
              Object.keys(inboxAfterDnc).length != 0 &&
              inboxAfterDnc.isAddedToDNC === true &&
              inboxAfterDnc.isAddedToDNCPhone2 === true &&
              inboxAfterDnc.isAddedToDNCPhone3 === true
            ) {
              updatedInbox.status = "65ba97b6ae9753518b56d3d4";
              await updatedInbox.save();
            }
          } else if (
            Object.keys(inboxAfterDnc).length != 0 &&
            inboxAfterDnc.messages.length > 0 &&
            inboxAfterDnc.messagesPhone2.length
          ) {
            if (
              Object.keys(inboxAfterDnc).length != 0 &&
              inboxAfterDnc.isAddedToDNC === true &&
              inboxAfterDnc.isAddedToDNCPhone2 === true
            ) {
              updatedInbox.status = "65ba97b6ae9753518b56d3d4";
              await updatedInbox.save();
            }
          } else {
            if (
              Object.keys(inboxAfterDnc).length != 0 &&
              inboxAfterDnc.isAddedToDNC === true
            ) {
              updatedInbox.status = "65ba97b6ae9753518b56d3d4";
              await updatedInbox.save();
            }
          }

          if (
            updateInbox.isVerifiedNumber === true &&
            updateInbox.to === existingPhoneNumber &&
            updateInbox.status.toString() === "651ebe648042b1b3f4674ea2"
          ) {
            if (updateInbox.messages.length > 0) {
              let filteredArray = updateInbox.messages.filter(
                (item) => item.isOutgoing === true
              );
              if (filteredArray.length > 0) {
                const lastElement = filteredArray[filteredArray.length - 1];
                if (lastElement.isDripOutgoingMessage) {
                  let inboxQueryPromise = [
                    Inbox.findByIdAndUpdate(
                      inbox._id,
                      {
                        $set: { status: "651ebe828042b1b3f4674ea8" },
                        $unset: {
                          dripAutomation: 1,
                          dripAutomationSchedule: 1,
                        },
                      },
                      { new: true }
                    ),
                    InboxDripAutomation.deleteMany({ inboxId: inbox?._id }),
                  ];
                  await Promise.all(inboxQueryPromise);
                  let activity = "Status was changed to No Status";
                  await Activity.create({
                    name: activity,
                    inbox: inbox._id,
                    type: `addStatusNo Status`,
                  });
                  responseBody = {
                    content: messageBody.content,
                    phone: messageBody.phone,
                    isIncoming: messageBody.isIncoming,
                    isOutgoing: messageBody.isOutgoing,
                    inboxId: updateInbox._id,
                    isViewed: messageBody.isViewed,
                    isVerifiedNumber: updateInbox.isVerifiedNumber,
                    isVerifiedNumberPhone2: updateInbox.isVerifiedNumberPhone2,
                    isVerifiedNumberPhone3: updateInbox.isVerifiedNumberPhone3,
                    status: "651ebe648042b1b3f4674ea2",
                  };
                }
              }
            }
          } else if (
            updateInbox.phone2 === existingPhoneNumber &&
            updateInbox.isVerifiedNumberPhone2 === true &&
            updateInbox.status.toString() === "651ebe648042b1b3f4674ea2"
          ) {
            if (updateInbox.messagesPhone2.length > 0) {
              let filteredArray = updateInbox.messagesPhone2.filter(
                (item) => item.isOutgoing === true
              );
              if (filteredArray.length > 0) {
                const lastElement = filteredArray[filteredArray.length - 1];
                if (lastElement.isDripOutgoingMessage) {
                  let inboxQueryPromise = [
                    Inbox.findByIdAndUpdate(
                      inbox._id,
                      {
                        $set: { status: "651ebe828042b1b3f4674ea8" },
                        $unset: {
                          dripAutomation: 1,
                          dripAutomationSchedule: 1,
                        },
                      },
                      { new: true }
                    ),
                    InboxDripAutomation.deleteMany({ inboxId: inbox?._id }),
                  ];
                  await Promise.all(inboxQueryPromise);
                  let activity = "Status was changed to No Status";
                  await Activity.create({
                    name: activity,
                    inbox: inbox._id,
                    type: `addStatusNo Status`,
                  });
                  responseBody = {
                    content: messageBody.content,
                    phone: messageBody.phone,
                    isIncoming: messageBody.isIncoming,
                    isOutgoing: messageBody.isOutgoing,
                    inboxId: updateInbox._id,
                    isViewed: messageBody.isViewed,
                    isVerifiedNumber: updateInbox.isVerifiedNumber,
                    isVerifiedNumberPhone2: updateInbox.isVerifiedNumberPhone2,
                    isVerifiedNumberPhone3: updateInbox.isVerifiedNumberPhone3,
                    status: "651ebe648042b1b3f4674ea2",
                  };
                }
              }
            }
          } else if (
            updateInbox.phone3 === existingPhoneNumber &&
            updateInbox.isVerifiedNumberPhone3 === true &&
            updateInbox.status.toString() === "651ebe648042b1b3f4674ea2"
          ) {
            if (updateInbox.messagesPhone3.length > 0) {
              let filteredArray = updateInbox.messagesPhone3.filter(
                (item) => item.isOutgoing === true
              );
              if (filteredArray.length > 0) {
                const lastElement = filteredArray[filteredArray.length - 1];
                if (lastElement.isDripOutgoingMessage) {
                  let inboxQueryPromise = [
                    Inbox.findByIdAndUpdate(
                      inbox._id,
                      {
                        $set: { status: "651ebe828042b1b3f4674ea8" },
                        $unset: {
                          dripAutomation: 1,
                          dripAutomationSchedule: 1,
                        },
                      },
                      { new: true }
                    ),
                    InboxDripAutomation.deleteMany({ inboxId: inbox?._id }),
                  ];
                  await Promise.all(inboxQueryPromise);
                  let activity = "Status was changed to No Status";
                  await Activity.create({
                    name: activity,
                    inbox: inbox._id,
                    type: `addStatusNo Status`,
                  });
                  responseBody = {
                    content: messageBody.content,
                    phone: messageBody.phone,
                    isIncoming: messageBody.isIncoming,
                    isOutgoing: messageBody.isOutgoing,
                    inboxId: updateInbox._id,
                    isViewed: messageBody.isViewed,
                    isVerifiedNumber: updateInbox.isVerifiedNumber,
                    isVerifiedNumberPhone2: updateInbox.isVerifiedNumberPhone2,
                    isVerifiedNumberPhone3: updateInbox.isVerifiedNumberPhone3,
                    status: "651ebe648042b1b3f4674ea2",
                  };
                }
              }
            }
          }

          const receiverPhoneNumber = existingPhoneNumber;
          const aggregatedData = await CsvData.aggregate([
            {
              $match: {
                $or: [
                  { phone1: receiverPhoneNumber },
                  { phone2: receiverPhoneNumber },
                  { phone3: receiverPhoneNumber },
                ],
              },
            },
            {
              $project: {
                matchingField: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$phone1", receiverPhoneNumber] },
                        then: "phone1",
                      },
                      {
                        case: { $eq: ["$phone2", receiverPhoneNumber] },
                        then: "phone2",
                      },
                      {
                        case: { $eq: ["$phone3", receiverPhoneNumber] },
                        then: "phone3",
                      },
                    ],
                    default: "None",
                  },
                },
              },
            },
          ]);
          if (aggregatedData.length > 0) {
            let deliveryUpdate;

            if (aggregatedData[0].matchingField === "phone1") {
              deliveryUpdate = {
                response: 1,
                respDate: new Date(),
              };
            } else if (aggregatedData[0].matchingField === "phone2") {
              deliveryUpdate = {
                response2: 1,
                respDate2: new Date(),
              };
            } else if (aggregatedData[0].matchingField === "phone3") {
              deliveryUpdate = {
                response3: 1,
                respDate3: new Date(),
              };
            } else {
              return "Nothing";
            }

            await CsvData.findOneAndUpdate(
              { _id: aggregatedData[0]._id },
              deliveryUpdate,
              { new: true }
            );
            // io.emit("new-message", responseBody);
            const message = {
              userId: null,
              data: responseBody,
            };
            const messageString = JSON.stringify(message);
            await redisPublisher.publish("socket-channel", messageString);
          }
        }
        let latestInbox = await Inbox.findById(inbox?._id);
        if (latestInbox && latestInbox?.to === existingPhoneNumber) {
          if (!latestInbox.isWrongNumber && !latestInbox.isAddedToDNC) {
            let statsResult = await DashStats.findOne({
              inboxId: latestInbox?._id,
            });
            if (!statsResult) {
              let userId = latestInbox?.user
                ? latestInbox?.user
                : latestInbox?.admin
                ? latestInbox?.admin
                : "";
              await DashStats.create({
                unRead: 1,
                unAnswered: 1,
                inboxId: latestInbox?._id,
                userId: userId,
              });
            }
            if (statsResult && statsResult.unRead === 0) {
              statsResult.unRead = 1;
            }
            if (statsResult && statsResult.unAnswered === 0) {
              statsResult.unAnswered = 1;
            }
            if (statsResult) {
              await statsResult.save();
            }
            latestInbox.isUnAnswered = true;
            latestInbox.isUnRead = true;
            await latestInbox.save();
          }
        } else if (latestInbox && latestInbox?.phone2 === existingPhoneNumber) {
          if (
            !latestInbox.isWrongNumberPhone2 &&
            !latestInbox.isAddedToDNCPhone2
          ) {
            let statsResult = await DashStats.findOne({
              inboxId: latestInbox?._id,
            });
            if (!statsResult) {
              let userId = latestInbox?.user
                ? latestInbox?.user
                : latestInbox?.admin
                ? latestInbox?.admin
                : "";
              await DashStats.create({
                unRead: 1,
                unAnswered: 1,
                inboxId: latestInbox?._id,
                userId: userId,
              });
            }
            if (statsResult && statsResult.unRead === 0) {
              statsResult.unRead = 1;
            }
            if (statsResult && statsResult.unAnswered === 0) {
              statsResult.unAnswered = 1;
            }
            if (statsResult) {
              await statsResult.save();
            }
            latestInbox.isUnAnswered = true;
            latestInbox.isUnRead = true;
            await latestInbox.save();
          }
        } else if (latestInbox && latestInbox?.phone3 === existingPhoneNumber) {
          if (
            !latestInbox.isWrongNumberPhone3 &&
            !latestInbox.isAddedToDNCPhone3
          ) {
            let statsResult = await DashStats.findOne({
              inboxId: latestInbox?._id,
            });
            if (!statsResult) {
              let userId = latestInbox?.user
                ? latestInbox?.user
                : latestInbox?.admin
                ? latestInbox?.admin
                : "";
              await DashStats.create({
                unRead: 1,
                unAnswered: 1,
                inboxId: latestInbox?._id,
                userId: userId,
              });
            }
            if (statsResult && statsResult.unRead === 0) {
              statsResult.unRead = 1;
            }
            if (statsResult && statsResult.unAnswered === 0) {
              statsResult.unAnswered = 1;
            }
            if (statsResult) {
              await statsResult.save();
            }
            latestInbox.isUnAnswered = true;
            latestInbox.isUnRead = true;
            await latestInbox.save();
          }
        }
        break;
      case "message-sending":
        console.log(`message-sending type is only for MMS`);
        break;
      default:
        console.log(`Message type does not match endpoint.`);
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Error inserting data:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error.message);
  }
};

const socketTest = async (req, res, io) => {
  try {
    const messageBody = {
      content: "New incoming message: " + new Date(),
      phone: req.query.phone,
      isIncoming: req.query.incoming == "false" ? false : true,
      inboxId: req.query.id,
      reminder: null,
    };
    messageBody.isViewed = !messageBody.isIncoming;
    io.emit("new-message", messageBody);
    res.status(httpStatus.CREATED).send(messageBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};




const incrementDeliveredValue = async (campaignId) => {
  try {
    // Find the campaign by campaignId
    const campaign = await Compaign.findOne({ _id: campaignId });

    if (campaign) {
      // Increment the delivered value
      const newDeliveredValue = (parseInt(campaign.totalDelivered) || 0) + 1;

      // Update the campaign with the new delivered value
      await Compaign.updateOne(
        { _id: campaign._id },
        { $set: { totalDelivered: newDeliveredValue } }
      );

      console.log(
        `Campaign ${campaignId} updated with new delivered value: ${newDeliveredValue}`
      );
      return newDeliveredValue;
    } else {
      console.log(`Campaign with ID ${campaignId} not found.`);
      return null;
    }
  } catch (error) {
    console.error("Error updating delivered value:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getBatchForSingleCampaign = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5000;
  const skip = (page - 1) * limit;
  let id = req.params.batchId;
  const batch = await batchService.getBatchForSingleCampaign(
    id,
    page,
    limit,
    skip
  );
  res.status(httpStatus.CREATED).send(batch);
});

const getInboxDetail = async (req, res, io) => {
  try {
    let { phone, inboxId } = req.params;

    // Use Promise.all to parallelize database queries
    const [inbox, detailInbox] = await Promise.all([
      Inbox.findById(inboxId).populate("batch", { batchNumber: 1 }),
      CsvData.findOne({ phone1: phone }).populate("directImportId", {
        listName: 1,
        createdAt: 1,
      }),
    ]);

    if (!inbox) {
      return res.status(httpStatus.BAD_REQUEST).send("No inbox found");
    }
    let finalResult = [];
    if (detailInbox) {
      let directImport = await DirectImport.findById(
        detailInbox.directImportId
      );
      if (directImport) {
        finalResult.push({
          listName: directImport?.listName,
          uploadedAt: directImport?.createdAt,
          companyName: inbox.companyName,
          aliasName: inbox.aliasName,
          batchNumber: inbox?.batch?.batchNumber,
          ...detailInbox.toObject(),
        });
      } else {
        finalResult.push({
          companyName: inbox.companyName,
          aliasName: inbox.aliasName,
          batchNumber: inbox?.batch?.batchNumber,
          ...detailInbox.toObject(),
        });
      }
    }

    return res.status(httpStatus.CREATED).send(finalResult);
  } catch (error) {
    console.error("Error inserting data:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const addTagToInbox = catchAsync(async (req, res) => {
  let inboxId = req.params.inboxId;
  let { tagId } = req.body;
  const inbox = await batchService.addTagToInbox(tagId, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const removeTagToInbox = catchAsync(async (req, res) => {
  let inboxId = req.params.inboxId;
  let { tagId } = req.body;
  const inbox = await batchService.removeTagToInbox(tagId, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});
const addNoteToInbox = catchAsync(async (req, res) => {
  let inboxId = req.params.inboxId;
  let { title } = req.body;
  const inbox = await batchService.addNoteToInbox(title, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const getNoteOfInbox = catchAsync(async (req, res) => {
  let inboxId = req.params.inboxId;
  const inbox = await batchService.getNoteOfInbox(inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const getCroneBatch = catchAsync(async (req, res) => {
  const inbox = await batchService.getCroneBatch();
  res.status(httpStatus.CREATED).send(inbox);
});
const deleteNoteOfInbox = catchAsync(async (req, res) => {
  let inboxId = req.params.inboxId;
  let { noteId } = req.body;
  const inbox = await batchService.deleteNoteOfInbox(noteId, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const getListOfActivity = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  const inbox = await batchService.getListOfActivity(inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const addToVerfiedNumber = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (Object.keys(body).length === 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Body is required" });
  }
  const inbox = await batchService.addToVerfiedNumber(body, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const removeToVerfiedNumber = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (Object.keys(body).length === 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Body is required" });
  }
  const inbox = await batchService.removeToVerfiedNumber(body, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const addToWrongNumber = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (Object.keys(body).length === 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Body is required" });
  }
  const inbox = await batchService.addToWrongNumber(body, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const removeToWrongNumber = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (Object.keys(body).length === 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Body is required" });
  }
  const inbox = await batchService.removeToWrongNumber(body, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const addToDNCNumber = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (Object.keys(body).length === 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Body is required" });
  }
  const inbox = await batchService.addToDNCNumber(body, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const removeToDNCNumber = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (Object.keys(body).length === 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Body is required" });
  }
  const inbox = await batchService.removeToDNCNumber(body, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const setReminder = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (req.user.role === "admin") {
    let { _id } = req.user;
    body.admin = _id;
  } else {
    let { _id } = req.user;
    body.user = _id;
  }
  const inbox = await batchService.setReminder(body, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const getReminder = catchAsync(async (req, res) => {
  let { reminderId } = req.params;
  const reminder = await batchService.getReminder(reminderId);
  res.status(httpStatus.CREATED).send(reminder);
});

const updateReminder = catchAsync(async (req, res) => {
  let { reminderId } = req.params;
  let body = req.body;
  const reminder = await batchService.updateReminder(reminderId, body);
  res.status(httpStatus.CREATED).send(reminder);
});
const deleteReminder = async (req, res) => {
  let { reminderId } = req.params;
  const reminder = await batchService.deleteReminder(reminderId);
  res.status(httpStatus.CREATED).send(reminder);
};

// const deleteReminder = async (req, res, io) => {
//   let { reminderId } = req.params;
//   const reminder = await batchService.deleteReminder(reminderId, io);
//   res.status(httpStatus.CREATED).send(reminder);
// };

const getAllReminder = catchAsync(async (req, res) => {
  let filter;
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:desc";
  options.populate = "inbox";
  if (req.user.role === "admin") {
    filter = {};
  } else {
    let { _id } = req.user;
    filter = { user: _id };
  }
  const reminder = await batchService.getAllReminder(filter, options);
  res.status(httpStatus.CREATED).send(reminder);
});

const markAsRead = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  const inbox = await batchService.markAsRead(inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const markAsUnRead = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  const inbox = await batchService.markAsUnRead(inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const addStatusInInbox = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (!body.phone && !body.phone2 && !body.phone3) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Verified Phone , phone2 or phone3 is required" });
  }
  const inbox = await batchService.addStatusInInbox(body, inboxId);
  res.status(httpStatus.CREATED).send(inbox);
});

const deleteStatusInInbox = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let body = req.body;
  if (!body.phone && !body.phone2 && !body.phone3) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Phone , phone2 or phone3 is required" });
  }
  const inbox = await batchService.deleteStatusInInbox(inboxId, body);
  res.status(httpStatus.CREATED).send(inbox);
});

const changeTemplate = catchAsync(async (req, res) => {
  let { batchId } = req.params;
  let body = req.body;
  const batch = await batchService.changeTemplate(body, batchId);
  res.status(httpStatus.CREATED).send(batch);
});

const getUserForInboxSearch = catchAsync(async (req, res) => {
  const users = await batchService.getUserForInboxSearch();
  res.status(httpStatus.CREATED).send(users);
});

const pushDataIntoCrm = catchAsync(async (req, res) => {
  let body = req.body;
  let inbox = await Inbox.findById(body.inbox);
  if (!inbox) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "No inbox found" });
  }
  if (inbox.isPushedToCrm === true) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "Already pushed" });
  }
  if (inbox.isVerifiedNumber) {
    body.phone1 = inbox.to;
  }
  if (inbox.isVerifiedNumberPhone2) {
    body.phone1 = inbox.phone2;
  }
  if (inbox.isVerifiedNumberPhone3) {
    body.phone1 = inbox.phone3;
  }

  // let oldPodioCode ="https://workflow-automation.podio.com/catch/290w62we4mv4629"
  let dynamicLink = await Integration.find({});
  if (dynamicLink?.length <= 0) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "No integrated crm found" });
  }
  const buildQueryString = (params) => {
    return qs.stringify(params, { skipNulls: true, encode: false });
  };
  const params = {
    inboxId: body.inbox,
    phone1: body?.phone1,
    verifiedNumber: body?.phone1,
    firstName: body?.firstName,
    lastName: body?.lastName,
    propertyAddress: body?.propertyAddress,
    propertyState: body?.propertyState,
    propertyZip: body?.propertyZip,
    propertyCity: body?.propertyCity,
    pushedToCrmDate: new Date(),
    status: 1,
  };
  // mailingAddress: body?.mailingAddress,
  // campaignId: body?.campaignId,
  // batchId: body?.batchId,
  // directImportId: body?.importfile ? body.directImportId : "",
  // listName: body?.listName,
  // uploadedAt: body?.uploadedAt,
  // id: body?.id,
  // mailingCity: body?.mailingCity,
  // mailingState: body?.mailingState,
  // mailingZip: body?.mailingZip,
  // phone2: body?.phone2,
  // phone3: body?.phone3,
  // status: body?.status,
  // delivered: body?.delivered,
  // response: body?.response,
  // undelivered: body?.undelivered,
  // created_at: body?.created_at,
  // updated_at: body?.updated_at,
  // isverified: body?.isverified,
  // campaignId1: body?.campaignId1,
  // campaignId2: body?.campaignId2,
  // campaignId3: body?.campaignId3,
  // status2: body?.status2,
  // status3: body?.status3,
  // delivered2: body?.delivered2,
  // delivered3: body?.delivered3,
  // response2: body?.response2,
  // response3: body?.response3,
  // msgDate: body?.msgDate,
  // companyName: body?.companyName,
  // aliasName: body?.aliasName,
  const queryString = buildQueryString(params);
  const url = `${dynamicLink[0]?.link}?${queryString}`;
  await axios.get(url).catch((e) => {
    throw e;
  });
  // let activity = body.phone1 + " " + "Has been pushed into crm";
  // let queryPromise = [
  //   Inbox.findByIdAndUpdate(
  //     body.inbox,
  //     { $set: { isPushedToCrm: true, pushedToCrmDate: new Date() } },
  //     { new: true }
  //   ),
  //   Activity.create({
  //     name: activity,
  //     inbox: body.inbox,
  //     type: "pushToCrm",
  //   }),
  // ];
  // await Promise.all(queryPromise);
  res.status(httpStatus.CREATED).send({ message: "Has been pushed into crm" });
});

const callBackpushDataIntoCrm = catchAsync(async (req, res) => {
  let body = req.query;
  if (body.inboxId && body.status) {
    let inbox = await Inbox.findById(body.inboxId);
    if (!inbox) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "No inbox found" });
    }
    if (inbox.isPushedToCrm === true) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Already pushed" });
    }
    if (inbox.isVerifiedNumber) {
      body.phone1 = inbox.to;
    }
    if (inbox.isVerifiedNumberPhone2) {
      body.phone1 = inbox.phone2;
    }
    if (inbox.isVerifiedNumberPhone3) {
      body.phone1 = inbox.phone3;
    }
    let activity = body.phone1 + " " + "Has been pushed into crm";
    let queryPromise = [
      Inbox.findByIdAndUpdate(
        body.inboxId,
        {
          $set: {
            isPushedToCrm: true,
            pushedToCrmDate: new Date(),
            isUnAnswered: false,
          },
        },
        { new: true }
      ),
      Activity.create({
        name: activity,
        inbox: body.inboxId,
        type: "pushToCrm",
      }),
      DashStats.updateOne(
        { inboxId: body.inboxId, unAnswered: { $gt: 0 } },
        {
          $inc: { unAnswered: -1 },
        }
      ),
    ];
    await Promise.all(queryPromise);
    res
      .status(httpStatus.CREATED)
      .send({ message: "Has been pushed into crm" });
  } else {
    return res
      .status(httpStatus.BAD_REQUEST)
      .send({ message: "No inbox found" });
  }
});

const changeProspectName = catchAsync(async (req, res) => {
  let { inboxId } = req.params;
  let { name } = req.body;
  const inbox = await batchService.changeProspectName(inboxId, name);
  res.status(httpStatus.CREATED).send(inbox);
});

const sendAutoReminder = async (req, res, io) => {
  const now = new Date();
  try {
    const dueReminders = await Reminder.find({ date: { $lte: now } });
    if (dueReminders.length > 0) {
      dueReminders.forEach(async (reminder) => {
        if (reminder.isVerified === true) {
          await controller.createMessage(accountId, {
            applicationId: BW_MESSAGING_APPLICATION_ID,
            to: [reminder.to],
            from: reminder.from,
            text: reminder.message,
          });
        }
        let messageBody = {
          content: reminder.message,
          phone: reminder.to,
          creationDate: new Date(),
          isIncoming: false,
          isOutgoing: true,
          isViewed: false,
        };
        let existingPhoneNumber = reminder.to;
        const filter = {
          $or: [
            { to: existingPhoneNumber },
            { phone2: existingPhoneNumber },
            { phone3: existingPhoneNumber },
          ],
        };
        const options = {
          new: true,
        };
        const inbox = await Inbox.findOne(filter);
        if (inbox) {
          if (inbox.to === existingPhoneNumber) {
            inbox.messages.push(messageBody);
          } else if (inbox.phone2 === existingPhoneNumber) {
            inbox.messagesPhone2.push(messageBody);
          } else if (inbox.phone3 === existingPhoneNumber) {
            inbox.messagesPhone3.push(messageBody);
          }
          let updatedInbox = false;
          if (reminder.isVerified === true) {
            updatedInbox = await Inbox.findOneAndUpdate(filter, inbox, options);
          }
          if (updatedInbox) {
            let responseBody = {
              content: reminder.message,
              phone: reminder.to,
              creationDate: new Date(),
              isIncoming: false,
              isOutgoing: true,
              inboxId: updatedInbox._id,
              isViewed: false,
              isReminderSet: false,
            };
            io.emit("new-message", responseBody);
          } else {
            let responseBody = {
              isReminderSet: false,
            };
            io.emit("new-message", responseBody);
          }
        }
        await Reminder.findByIdAndDelete(reminder._id);
      });
    }
    res.status(200).send({ message: "Reminder has been trigerred" });
  } catch (err) {
    console.error("Error checking due reminders:", err);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
};

const resetAutoTemplate = async (req, res) => {
  try {
    const result = await InitialAndFollowTemplate.updateMany(
      {},
      { quantity: 0 }
    );
    res
      .status(200)
      .send({ message: `Updated ${result.modifiedCount} templates.` });
  } catch (error) {
    console.error("Error updating templates:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
};

module.exports = {
  getBatchById,
  updateBatchById,
  deleteBatchById,
  getCampagin,
  getInbound,
  smsStatus,
  getBatchForSingleCampaign,
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
  socketTest,
  changeTemplate,
  sendMessageFromInbox,
  sendMessageFromInboxOfPhone2,
  sendMessageFromInboxOfPhone3,
  getUserForInboxSearch,
  pushDataIntoCrm,
  changeProspectName,
  getInboxDetail,
  sendAutoReminder,
  resetAutoTemplate,
  callBackpushDataIntoCrm,
};
