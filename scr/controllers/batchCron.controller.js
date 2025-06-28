const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const { batchCronService } = require("../services");
const {
  User,
  Batch,
  Admin,
  DirectImport,
  Market,
  InitialAndFollowTemplate,
  Reminder,
  CsvData,
  CampaignStats,
  Inbox,
  Compaign,
} = require("../models");

const mysql = require("mysql2/promise");
const moment = require("moment-timezone");
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
const redis = require("redis");

// const { mongoose } = require("../config/config");
const mongoose = require("mongoose");
const client = new Client({
  basicAuthUserName: BW_USERNAME,
  basicAuthPassword: BW_PASSWORD,
});

const controller = new ApiController(client);

const accountId = BW_ACCOUNT_ID;

const batchProcessingQueue = new Queue("batchProcessing", {
  redis: {
    host: process.env.redis_host,
    port: process.env.redis_port,
    username: process.env.redis_user,
    password: process.env.redis_pass,
  },
});

// Function to process a job in the queue
batchProcessingQueue.process(async (job) => {
  const { batchId } = job.data;

  // Add your batch processing logic here (see below for the integration)
  //await processBatch(batchId);
});

const fortyEightbatchProcessingQueue = new Queue("fortyeightbatchProcessing", {
  redis: {
    host: process.env.redis_host,
    port: process.env.redis_port,
    username: process.env.redis_user,
    password: process.env.redis_pass,
  },
});

// Function to process a job in the queue
fortyEightbatchProcessingQueue.process(async (job) => {
  const { batchId } = job.data;

  // Add your batch processing logic here (see below for the integration)
  await fortyeightprocessBatch(batchId);
});

// const getAllPreviousDayBatches = async (req, res) => {
//   try {
//     // Get the start of yesterday
//     let yesterday = moment().subtract(1, "days").startOf("day");

//     // Get the current time today (but we will apply it to yesterday)
//     let now = moment();

//     // Set the "end" time to match the current time, but for yesterday
//     let endOfYesterday = moment(yesterday).set({
//       hour: now.hour(),
//       minute: now.minute(),
//       second: now.second(),
//       millisecond: now.millisecond(),
//     });

//     // Fetch the leads from the database
//     const yesterdayLeads = await CsvData.find({
//       isPhone1Verified: false,
//       isPhone2Verified: false,
//       isPhone3Verified: false,
//       phone2: { $nin: ["N/A", ""] },
//       status2: 0,
//       msgDate: {
//         $gte: yesterday.toDate(),
//         $lt: endOfYesterday.toDate(),
//       },
//     });

//     // Send the response immediately
//     res.status(200).json({
//       message: "Lead batch fetched successfully",
//       count: yesterdayLeads.length,
//     });

//     // Process the batch in the background after the response is sent
//     if (yesterdayLeads.length > 0) {
//       setImmediate(async () => {
//         try {
//           await processBatch(yesterdayLeads);
//           console.log("Batch processing completed");
//         } catch (batchError) {
//           console.error("Error while processing batch", batchError);
//         }
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("An error occurred while fetching the batches");
//   }
// };

const getAllPreviousDayBatches = async (req, res) => {
  try {
    // Fetch all markets with their timezones
    const markets = await Market.find().select("_id abbrevation");

    // Initialize an object to store results per market
    const marketResults = {};

    // Process each market's data
    const marketProcessingPromises = markets.map(async (market) => {
      const { _id: marketId, abbrevation } = market;

      // Get the start of yesterday in the market's timezone
      const yesterdayInMarketTz = moment.tz(abbrevation).subtract(1, "days").startOf("day");

      // Get the current time in the market's timezone
      const currentTimeInMarketTz = moment.tz(abbrevation);

      // Define the start of yesterday (8 AM) and the dynamic end of yesterday (current time)
      const startOfYesterday = yesterdayInMarketTz.clone().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).toDate();
      const endOfYesterday = yesterdayInMarketTz.clone().set({
        hour: currentTimeInMarketTz.hour(),
        minute: currentTimeInMarketTz.minute(),
        second: currentTimeInMarketTz.second(),
        millisecond: currentTimeInMarketTz.millisecond(),
      }).toDate();
      
      console.log(`Market: ${marketId} (${abbrevation})`);
      console.log("Start of Yesterday:", startOfYesterday);
      console.log("End of Yesterday:", endOfYesterday);

      // Fetch batches for the current market
      const batches = await Batch.find({ market: marketId });

      if (!batches.length) {
        console.log(`No batches found for market ${marketId}`);
        return;
      }

      const batchProcessingPromises = batches.map(async (batch) => {
        const { _id: batchId } = batch;

        // Fetch CsvData for the batch within the market's time window
        const yesterdayLeads = await CsvData.find({
          batchId,
          isPhone1Verified: false,
          isPhone2Verified: false,
          isPhone3Verified: false,
          phone2: { $nin: ["N/A", ""] },
          status2: 0,
          msgDate: {
            $gte: startOfYesterday,
            $lt: endOfYesterday,
          },
        });

        // Update market results with lead counts per batch
        if (!marketResults[marketId]) {
          marketResults[marketId] = {
            abbrevation,
            batches: [],
          };
        }

        marketResults[marketId].batches.push({
          batchId,
          leadCount: yesterdayLeads.length,
        });

        // Process the batch in the background for this market
        if (yesterdayLeads.length > 0) {
          setImmediate(async () => {
            try {
              await processBatch(yesterdayLeads);
              console.log(`${yesterdayLeads.length}`);
            } catch (batchError) {
              console.error(`Error while processing batch ${batchId} for market ${marketId}:`, batchError);
            }
          });
        }
      });

      // Wait for all batches of the current market to complete processing
      await Promise.all(batchProcessingPromises);
    });

    // Wait for all markets to complete processing
    await Promise.all(marketProcessingPromises);

    // Send the response with aggregated results
    res.status(200).json({
      message: "Lead batches fetched successfully",
      results: marketResults,
    });
  } catch (error) {
    console.error("Error fetching previous day batches:", error);
    res.status(500).send("An error occurred while fetching the batches");
  }
};


let counting = 0;
const processBatch = async (row) => {
  try {
    counting = counting + row.length;
    for (let j = 0; j < row.length; j++) {
      console.log(row[j]);
      console.log(row[j].phone2);

      const inboxCheck = await Inbox.find({
        $or: [
          { to: row[j].phone1, isVerifiedNumber: true },
          {
            phone2: row[j].phone2,
            isVerifiedNumberPhone2: true,
          },
          {
            phone3: row[j].phone3,
            isVerifiedNumberPhone3: true,
          },
        ],
      });
      console.log("inboxCheck", inboxCheck);
      if (inboxCheck.length === 0) {
        let inboxData = await Inbox.findOne({
          to: row[j].phone1,
        });

        if (inboxData) {
          if (row[j].phone2 != "N/A") {
            let messageBody1 = {
              content: inboxData.messages[0].content,
              phone2: "+1" + row[j].phone2,
              creationDate: new Date(),
              type: "initial",
              isOutgoing: true,
              from: inboxData.from,
              id: String(row[j]._id),
            };

            console.log("messageBody1", messageBody1);
            const smsSend = await batchCronService.sendSMS(
              "",
              "",
              "+1" + row[j].phone2,
              "+1" + inboxData.from,
              inboxData.messages[0].content,
              String(row[j]._id)
            );
            if (smsSend) {
              
              let messageBody = {
                content: inboxData.messages[0].content,
                phone2: "+1" + row[j].phone2,
                creationDate: new Date(),
                type: "initial",
                isOutgoing: true,
              };
              let queryPromise = [
                Inbox.findOneAndUpdate(
                  {
                    $and: [{ from: inboxData.from }, { to: row[j].phone1 }],
                  },
                  {
                    $push: { messagesPhone2: messageBody },
                    $set: {
                      phone2: row[j].phone2,
                      lastMessageSendDate: new Date(),
                    },
                  },
                  { new: true },
                  {
                    timestamps: false,
                  }
                ),
                Market.findOneAndUpdate(
                  { "phoneNumber.number": inboxData.from },
                  { $inc: { "phoneNumber.$.sendDailyMessageCount": 1 } }
                ),
              ];
              let [inboxExist] = await Promise.all(queryPromise);
              let processedResults = {
                bandwithsendid2: smsSend.result.id,
                msgDate2: new Date(),
              };
              const updaeCsvData = await CsvData.findOneAndUpdate(
                { phone2: row[j].phone2 },
                processedResults,
                { new: true }
              );

              if (updaeCsvData.campaignId && updaeCsvData.campaignId !== "") {
                await incrementDeliveredValue(updaeCsvData.campaignId);
              } else if (
                updaeCsvData.campaignId1 &&
                updaeCsvData.campaignId1 !== ""
              ) {
                await incrementDeliveredValue(updaeCsvData.campaignId1);
              } else if (
                updaeCsvData.campaignId2 &&
                updaeCsvData.campaignId2 !== ""
              ) {
                await incrementDeliveredValue(updaeCsvData.campaignId2);
              } else if (
                updaeCsvData.campaignId3 &&
                updaeCsvData.campaignId3 !== ""
              ) {
                await incrementDeliveredValue(updaeCsvData.campaignId3);
              }

              if (
                inboxExist &&
                inboxExist.status.toString() === "651ebe798042b1b3f4674ea6"
              ) {
                if (inboxExist.isWrongNumber === true) {
                  if (
                    inboxExist.messagesPhone2.length > 0 &&
                    inboxExist.isWrongNumberPhone2 === false
                  ) {
                    inboxExist.status = "651ebe828042b1b3f4674ea8";
                    await inboxExist.save();
                  }
                }
              }

              const batchData = await Batch.findOne({ _id: row[j].batchId });

              const batchSendMessage = batchData.batchSendMessage + 1;
              const batchTotalProspects = batchData.batchTotalProspects + 1;
              let datatoUpdate = {
                batchSendMessage: batchSendMessage,
                batchTotalProspects: batchTotalProspects,
                lastSent: new Date(),
              };
              if (batchData?.totalMessagesInQueue > 0) {
                datatoUpdate["totalMessagesInQueue"] =
                  batchData?.totalMessagesInQueue - 1;
              }
              const updateBatch = await Batch.findOneAndUpdate(
                { _id: row[j].batchId },
                {
                  $inc: { batchSendMessage: 1, batchTotalProspects: 1, totalMessagesInQueue: -1 },
                  lastSent: new Date(),
                },
                { new: true }
              );
              const query = { batchId: row[j].batchId, phone2: row[j].phone2 };
              const update = { $set: { status2: "1" } };

              await CsvData.updateMany(query, update);
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const incrementDeliveredValue = async (campaignId) => {
  try {
    // Find the campaign by campaignId
    const campaign = await Compaign.findOne({ _id: campaignId });

    if (campaign) {
      // Increment the delivered value
      const newDeliveredValue = (parseInt(campaign.sentALL) || 0) + 1;

      // Update the campaign with the new delivered value
      await Compaign.findOneAndUpdate(
        { _id: campaign._id },
        { $inc: { sentALL: 1 } }
      );

      await DirectImport.findOneAndUpdate(
        { assignCampaign: campaign._id },  // Find by assignedCampaign
        { $inc: { sentCount: 1 } },              // Increment delivered by 1
        { new: true }                            // Return the updated document
      ),

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

const getAllFourtyEightHourPreviousBatches = async (req, res) => {

  try {
    // Fetch all markets with their timezones
    const markets = await Market.find().select("_id abbrevation");

    // Initialize an object to store results per market
    const marketResults = {};

    // Process each market's data
    const marketProcessingPromises = markets.map(async (market) => {
      const { _id: marketId, abbrevation } = market;

      // Get the start of yesterday in the market's timezone
      const yesterdayInMarketTz = moment.tz(abbrevation).subtract(2, "days").startOf("day");

      // Get the current time in the market's timezone
      const currentTimeInMarketTz = moment.tz(abbrevation);

      // Define the start of yesterday (8 AM) and the dynamic end of yesterday (current time)
      const startOfYesterday = yesterdayInMarketTz.clone().set({ hour: 8, minute: 0, second: 0, millisecond: 0 }).toDate();
      const endOfYesterday = yesterdayInMarketTz.clone().set({
        hour: currentTimeInMarketTz.hour(),
        minute: currentTimeInMarketTz.minute(),
        second: currentTimeInMarketTz.second(),
        millisecond: currentTimeInMarketTz.millisecond(),
      }).toDate();

      console.log(`Market: ${marketId} (${abbrevation})`);
      console.log("Start of Yesterday:", startOfYesterday);
      console.log("End of Yesterday:", endOfYesterday);

      // Fetch batches for the current market
      const batches = await Batch.find({ market: marketId });

      if (!batches.length) {
        console.log(`No batches found for market ${marketId}`);
        return;
      }

      const batchProcessingPromises = batches.map(async (batch) => {
        const { _id: batchId } = batch;
       
        
        // Fetch CsvData for the batch within the market's time window
        const yesterdayLeads = await CsvData.find({
          batchId,
          isPhone1Verified: false,
          isPhone2Verified: false,
          isPhone3Verified: false,
          phone3: { $nin: ["N/A", ""] },
          status3: 0,
          msgDate: {
            $gte: startOfYesterday,
            $lt: endOfYesterday,
          },
        });
        if(yesterdayLeads.length > 0){
          console.log("yesterdayLeads",yesterdayLeads);
        }
        
        // Update market results with lead counts per batch
        if (!marketResults[marketId]) {
          marketResults[marketId] = {
            abbrevation,
            batches: [],
          };
        }

        marketResults[marketId].batches.push({
          batchId,
          leadCount: yesterdayLeads.length,
        });

        // Process the batch in the background for this market
        if (yesterdayLeads.length > 0) {
          setImmediate(async () => {
            try {
                await fortyeightprocessBatch(yesterdayLeads);

              console.log(`${yesterdayLeads.length}`);
            } catch (batchError) {
              console.error(`Error while processing batch ${batchId} for market ${marketId}:`, batchError);
            }
          });
        }
      });

      // Wait for all batches of the current market to complete processing
      await Promise.all(batchProcessingPromises);
    });

    // Wait for all markets to complete processing
    await Promise.all(marketProcessingPromises);

    // Send the response with aggregated results
    res.status(200).json({
      message: "Lead batches fetched successfully",
      results: marketResults,
    });
  } catch (error) {
    console.error("Error fetching previous day batches:", error);
    res.status(500).send("An error occurred while fetching the batches");
  }
};

// Function to process each batch (integrating your logic)
const fortyeightprocessBatch = async (row) => {
  try {
    for (let j = 0; j < row.length; j++) {
      const inboxCheck = await Inbox.find({
        $or: [
          { to: row[j].phone1, isVerifiedNumber: true },
          {
            phone2: row[j].phone2,
            isVerifiedNumberPhone2: true,
          },
          {
            phone3: row[j].phone3,
            isVerifiedNumberPhone3: true,
          },
        ],
      });
      console.log("inboxCheck",inboxCheck);
      if (inboxCheck.length === 0) {
        let inboxData = await Inbox.findOne({
          to: row[j].phone1,
        });
        if (inboxData) {
          if (row[j].phone3 !== "N/A") {
            const smsSend = await batchCronService.sendSMS(
              "",
              "",
              "+1" + row[j].phone3,
              "+1" + inboxData.from,
              inboxData.messages[0].content,
              String(row[j]._id)
            );
            console.log("smsSend",smsSend)
            if (smsSend) {
              let messageBody = {
                content: inboxData.messages[0].content,
                phone3: "+1" + row[j].phone3,
                creationDate: new Date(),
                type: "initial",
                isOutgoing: true,
              };
              let queryPromise = [
                Inbox.findOneAndUpdate(
                  {
                    $and: [{ from: inboxData.from }, { to: row[j].phone1 }],
                  },
                  {
                    $push: { messagesPhone3: messageBody },
                    $set: {
                      phone3: row[j].phone3,
                      lastMessageSendDate: new Date(),
                    },
                  },
                  { new: true },
                  {
                    timestamps: false,
                  }
                ),
                Market.findOneAndUpdate(
                  { "phoneNumber.number": inboxData.from },
                  { $inc: { "phoneNumber.$.sendDailyMessageCount": 1 } }
                ),
              ];
              let [inboxExist] = await Promise.all(queryPromise);
              let processedResults = {
                bandwithsendid3: smsSend.result.id,
                msgDate3: new Date(),
              };
              let updaeCsvData3 = await CsvData.findOneAndUpdate(
                { phone3: row[j].phone3 },
                processedResults,
                { new: true }
              );

              if (updaeCsvData3.campaignId && updaeCsvData3.campaignId !== "") {
                await incrementDeliveredValue(updaeCsvData3.campaignId);
              } else if (
                updaeCsvData3.campaignId1 &&
                updaeCsvData3.campaignId1 !== ""
              ) {
                await incrementDeliveredValue(updaeCsvData3.campaignId1);
              } else if (
                updaeCsvData3.campaignId2 &&
                updaeCsvData3.campaignId2 !== ""
              ) {
                await incrementDeliveredValue(updaeCsvData3.campaignId2);
              } else if (
                updaeCsvData3.campaignId3 &&
                updaeCsvData3.campaignId3 !== ""
              ) {
                await incrementDeliveredValue(updaeCsvData3.campaignId3);
              }

              if (
                inboxExist &&
                inboxExist.status.toString() === "651ebe798042b1b3f4674ea6"
              ) {
                if (
                  inboxExist.isWrongNumber === true &&
                  inboxExist.isWrongNumberPhone2 === true
                ) {
                  if (
                    inboxExist.messagesPhone3.length > 0 &&
                    inboxExist.isWrongNumberPhone3 === false
                  ) {
                    inboxExist.status = "651ebe828042b1b3f4674ea8";
                    await inboxExist.save();
                  }
                }
              }
              const batchData = await Batch.findOne({ _id: row[j].batchId });

              const batchSendMessage = batchData.batchSendMessage + 1;
              const batchTotalProspects = batchData.batchTotalProspects + 1;
              let datatoUpdate = {
                batchSendMessage: batchSendMessage,
                batchTotalProspects: batchTotalProspects,
                lastSent: new Date(),
              };
              console.log("que",batchData?.totalMessagesInQueue);
              if (batchData?.totalMessagesInQueue > 0) {
                datatoUpdate["totalMessagesInQueue"] =
                  batchData?.totalMessagesInQueue - 1;
              }
              const updateBatch = await Batch.findOneAndUpdate(
                { _id: row[j].batchId },
                {
                  $inc: { batchSendMessage: 1, batchTotalProspects: 1, totalMessagesInQueue: -1 },
                  lastSent: new Date(),
                },
                { new: true }
              );

              const query = { batchId: row[j].batchId, phone3: row[j].phone3 };
              const update = { $set: { status3: "1" } };

              await CsvData.updateMany(query, update);
            }
          }
        }
      }
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const sendAutoReminder = async (
  req,
  res,
  io,
  userSocketMap,
  redisPublisher
) => {
  const now = new Date();

  try {
    const dueReminders = await Reminder.find({ date: { $lte: now } });
    for (const reminder of dueReminders) {
      try {
        let userId;
        if (reminder.admin) {
          userId = reminder.admin;
        } else {
          userId = reminder.user;
        }
        if (reminder.isVerified === true) {
          // Assuming 'controller.createMessage' and related variables are defined and available
          await controller.createMessage(accountId, {
            applicationId: BW_MESSAGING_APPLICATION_ID,
            to: [reminder.to],
            from: reminder.from,
            text: reminder.message,
          });
        }
        await Inbox.findByIdAndUpdate(
          reminder.inbox,
          {
            $set: { isReminderSet: false },
            $unset: { reminder: 1 },
          },
          {
            timestamps: false,
          }
        );

        let messageBody = {
          content: reminder.message,
          phone: reminder.to,
          creationDate: new Date(),
          isIncoming: false,
          isOutgoing: true,
          isViewed: false,
          type: "reminder",
        };

        let existingPhoneNumber = reminder.to;
        const filter = {
          $or: [
            { to: existingPhoneNumber },
            { phone2: existingPhoneNumber },
            { phone3: existingPhoneNumber },
          ],
        };

        const options = { new: true };
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
          inbox.lastMessageSendDate = new Date();

          if (reminder.isVerified === true) {
            updatedInbox = await Inbox.findOneAndUpdate(
              filter,
              inbox,
              options,
              {
                timestamps: false,
              }
            );
          }

          let responseBody = updatedInbox
            ? {
                content: reminder.message,
                phone: reminder.to,
                creationDate: new Date(),
                isIncoming: false,
                isOutgoing: true,
                inboxId: updatedInbox._id,
                isViewed: false,
                isReminderSet: false,
              }
            : { isReminderSet: false };

          const socketId = userSocketMap.get(String(userId));

          // if (socketId) {
          //await io.to(socketId).emit("new-message", responseBody);

          const message = {
            userId: String(userId),
            data: responseBody,
          };
          const messageString = JSON.stringify(message);
          const redisres = await redisPublisher.publish(
            "socket-channel",
            messageString
          );
        }

        await Reminder.findByIdAndDelete(reminder._id);
      } catch (innerErr) {
        console.error("Error in processing reminder:", innerErr);
      }
    }

    res.status(200).send({ message: "Reminders processed" });
  } catch (err) {
    console.error("Error checking due reminders:", err);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
};

const resetAutoTemplate = async (req, res) => {
  try {
    let querypromise = [
      InitialAndFollowTemplate.updateMany({}, { quantity: 0 }),
      Market.updateMany(
        {},
        { $set: { "phoneNumber.$[].sendDailyMessageCount": 0 } }
      ),
    ];
    let [result] = await Promise.all(querypromise)
      .status(200)
      .send({ message: `Updated ${result.modifiedCount} templates.` });
  } catch (error) {
    console.error("Error updating templates:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
};

const setCampaignStats = async (req, res) => {
  try {
    return await CampaignStats.find();
  } catch (error) {
    console.error("Error updating templates:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
};

const updateVerifiedUnVerifidField = async (req, res) => {
  try {
    let inboxes = await Inbox.find({});
    if (inboxes.length > 0) {
      for (const inbox of inboxes) {
        await CsvData.findOneAndUpdate(
          { phone1: inbox.to },
          { $set: { isPhone1Verified: inbox.isVerifiedNumber } }
        );
        await CsvData.findOneAndUpdate(
          { phone2: inbox.phone2 },
          { $set: { isPhone2Verified: inbox.isVerifiedNumberPhone2 } }
        );
        await CsvData.findOneAndUpdate(
          { phone3: inbox.phone3 },
          { $set: { isPhone3Verified: inbox.isVerifiedNumberPhone3 } }
        );
      }
    }
    return inboxes.length;
  } catch (error) {
    console.error("Error updating templates:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
};

const updateCountOfPhoneTwoAndPhoneThree = async (req, res) => {
  try {
    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");

    // Start of yesterday in PST
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    // End of yesterday in PST (start of today)
    const endOfYesterday = yesterdayInPST.clone().endOf("day").toDate();

    console.log(startOfYesterday);
    console.log(endOfYesterday);

    let phone2Que = await CsvData.aggregate([
      {
        $match: {
          $or: [
            {
              $and: [
                {
                  msgDate: {
                    $gte: startOfYesterday,
                    $lte: endOfYesterday,
                  },
                },
                { status2: 0 }, // Filter by status2 being 0
                { phone2: { $ne: "" } }, // Ensure phone2 is not empty
              ],
            },
          ],
        },
      },
      {
        $match: {
          $nor: [
            { isPhone1Verified: true },
            { isPhone2Verified: true },
            { isPhone3Verified: true }, // Ensure none of the phone numbers are verified
          ],
        },
      },
      {
        $group: {
          _id: {
            marketSenderNumber: "$marketSenderNumber", // Group by marketSenderNumber
            phone2: "$phone2", // And also group by phone2
          },
          count: {
            $sum: 1, // Count occurrences for each combination of marketSenderNumber and phone2
          },
        },
      },
      {
        $group: {
          _id: "$_id.marketSenderNumber", // Group by marketSenderNumber
          // Collect phone2 and its count for each marketSenderNumber
          total: {
            $sum: "$count", // Sum the total count for each marketSenderNumber
          },
        },
      },
      {
        $sort: { total: -1 }, // Sort by total count in descending order
      },
    ]);

    // Get 'the day before yesterday' in PST timezone
    const twoDaysAgoInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(2, "days");

    // Start of 'the day before yesterday' in PST
    const previousYesterday = twoDaysAgoInPST.clone().startOf("day").toDate();

    // End of 'the day before yesterday' in PST (start of yesterday)
    const endOfPreviousYesterday = twoDaysAgoInPST
      .clone()
      .endOf("day")
      .toDate();

    let phone3Que = await CsvData.aggregate([
      {
        $match: {
          $or: [
            {
              $and: [
                {
                  msgDate: {
                    $gte: previousYesterday,
                    $lte: endOfPreviousYesterday,
                  },
                },
                { status3: 0 },
                { phone3: { $ne: "" } }, // Ensure phone3 is not empty
              ],
            },
          ],
        },
      },
      {
        $match: {
          $nor: [
            { isPhone1Verified: true },
            { isPhone2Verified: true },
            { isPhone3Verified: true }, // Ensure none of the phone numbers are verified
          ],
        },
      },
      {
        $group: {
          _id: {
            marketSenderNumber: "$marketSenderNumber", // Group by marketSenderNumber
            phone3: "$phone3", // And also group by phone3
          },
          count: {
            $sum: 1, // Count occurrences for each combination of marketSenderNumber and phone3
          },
        },
      },
      {
        $group: {
          _id: "$_id.marketSenderNumber", // Group by marketSenderNumber
          // phones: {
          //   $push: {
          //     phone3: "$_id.phone3",
          //     count: "$count",
          //   }, // Collect phone3 and its count for each marketSenderNumber
          // },
          total: {
            $sum: "$count", // Sum the total count for each marketSenderNumber
          },
        },
      },
      {
        $sort: { total: -1 }, // Sort by total count in descending order
      },
    ]);
    if (phone2Que?.length > 0) {
      for (let i = 0; i < phone2Que.length; i++) {
        await Market.findOneAndUpdate(
          {
            "phoneNumber.number": phone2Que[i]?._id,
          },
          {
            $set: {
              "phoneNumber.$[elem].phone2QueryCount": phone2Que[i]?.total,
            },
          },
          {
            arrayFilters: [{ "elem.number": phone2Que[i]?._id }],
            new: true,
          }
        );
      }
    }
    if (phone3Que?.length > 0) {
      for (let i = 0; i < phone3Que.length; i++) {
        await Market.findOneAndUpdate(
          {
            "phoneNumber.number": phone3Que[i]?._id,
          },
          {
            $set: {
              "phoneNumber.$[elem].phone3QueryCount": phone3Que[i]?.total,
            },
          },
          {
            arrayFilters: [{ "elem.number": phone3Que[i]?._id }],
            new: true,
          }
        );
      }
    }
    let finalResult = { phone2Que, phone3Que };
    res.status(200).send(finalResult);
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
};

const updateBatchStatus = async (req, res) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const pendingBatches = await Batch.find({ status: "pending" });

    const updates = pendingBatches?.map(async (batch) => {
      const { _id: batchId, createdAt } = batch;

      // Count delivered and total records for this batch
      const [deliveredCount, overAllBatchCount] = await Promise.all([
        CsvData.countDocuments({
          batchId: batchId.toString(),
          $or: [{ delivered: 1 }, { undelivered: 1 }],
        }),
        CsvData.countDocuments({
          batchId: batchId.toString(),
        }),
      ]);

      let newStatus = "pending"; // Default status remains pending

      if (deliveredCount === overAllBatchCount) {
        newStatus = "completed";
      } else if (createdAt <= thirtyMinutesAgo) {
        // If 30 minutes have passed and deliveredCount !== overAllBatchCount, mark as failed
        newStatus = "failed";
      }

      return {
        updateOne: {
          filter: { _id: batchId },
          update: { status: newStatus },
        },
      };
    });

    await Batch.bulkWrite(await Promise.all(updates));

    res.status(200).send({ message: "Batch statuses updated successfully" });
  } catch (error) {
    console.error("Error updating batch statuses:", error);
    res
      .status(500)
      .send({ error: "An error occurred while updating batch statuses" });
  }
};

const updateBatchSendQueue = async (req, res) => {
  try {
    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");
    // Start of yesterday in PST
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    // End of yesterday in PST (start of today)
    const endOfYesterday = yesterdayInPST.clone().endOf("day").toDate();

    // // Get 'the day before yesterday' in PST timezone
    const twoDaysAgoInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(2, "days");

    // Start of 'the day before yesterday' in PST
    const previousYesterday = twoDaysAgoInPST.clone().startOf("day").toDate();

    // End of 'the day before yesterday' in PST (start of yesterday)
    const endOfPreviousYesterday = twoDaysAgoInPST.clone().endOf("day").toDate();
    
    console.log("previousYesterday",previousYesterday);
    console.log("endOfPreviousYesterday",endOfPreviousYesterday);

    let queryPromise = [
      CsvData.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [
                  {
                    msgDate: {
                      $gte: startOfYesterday,
                      $lte: endOfYesterday,
                    },
                  },
                  { status2: 0 },
                  { phone2: { $ne: "" } },
                ],
              },
            ],
          },
        },
        {
          $match: {
            $nor: [
              { isPhone1Verified: true },
              { isPhone2Verified: true },
              { isPhone3Verified: true },
            ],
          },
        },
        {
          $group: {
            _id: "$batchId", // Group by batchId
            total: { $sum: 1 }, // Count of messages per batchId
          },
        },
      ]),
      CsvData.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [
                  {
                    msgDate: {
                      $gte: previousYesterday,
                      $lte: endOfPreviousYesterday,
                    },
                  },
                  { status3: 0 },
                  { phone3: { $ne: "" } },
                ],
              },
            ],
          },
        },
        {
          $match: {
            $nor: [
              { isPhone1Verified: true },
              { isPhone2Verified: true },
              { isPhone3Verified: true },
            ],
          },
        },
        {
          $group: {
            _id: "$batchId", // Group by batchId
            total: { $sum: 1 }, // Count of messages per batchId
          },
        },
      ]),
    ];
    let [phone2Queue, phone3Queue] = await Promise.all(queryPromise);

    console.log("phone2Queue",phone2Queue);
    console.log("phone3Queue",phone3Queue);


    const bulkUpdates = [];

    if (phone2Queue?.length > 0) {
      phone2Queue.forEach(({ _id, total }) => {
        bulkUpdates.push({
          updateOne: {
            filter: { _id },
            update: { $set: { totalMessagesInQueue: total } },
          },
        });
      });
    }

    if (phone3Queue?.length > 0) {
      phone3Queue.forEach(({ _id, total }) => {
        bulkUpdates.push({
          updateOne: {
            filter: { _id },
            update: { $set: { totalMessagesInQueue: total } },
          },
        });
      });
    }

    if (bulkUpdates.length > 0) {
      await Batch.bulkWrite(bulkUpdates);
    }
    res.status(200).send({ message: "Batch count updated successfully" });
  } catch (error) {
    console.error("Error", error);
    res.status(500).send(error);
  }
};

const reverseBackBatchSendQueue = async (req, res) => {
  try {
    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");
    // Start of yesterday in PST
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    // End of yesterday in PST (start of today)
    const endOfYesterday = yesterdayInPST.clone().endOf("day").toDate();

    let queryPromise = [
      CsvData.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [
                  {
                    msgDate: {
                      $gte: startOfYesterday,
                      $lte: endOfYesterday,
                    },
                  },
                  { status2: 1 },
                  { phone2: { $ne: "" } },
                ],
              },
            ],
          },
        },
        {
          $match: {
            $nor: [
              { isPhone1Verified: true },
              { isPhone2Verified: true },
              { isPhone3Verified: true },
            ],
          },
        },
        {
          $group: {
            _id: "$batchId", // Group by batchId
            total: { $sum: 1 }, // Count of messages per batchId
          },
        },
      ]),
      CsvData.aggregate([
        {
          $match: {
            $or: [
              {
                $and: [
                  {
                    msgDate: {
                      $gte: startOfYesterday,
                      $lte: endOfYesterday,
                    },
                  },
                  { status3: 1 },
                  { phone3: { $ne: "" } },
                ],
              },
            ],
          },
        },
        {
          $match: {
            $nor: [
              { isPhone1Verified: true },
              { isPhone2Verified: true },
              { isPhone3Verified: true },
            ],
          },
        },
        {
          $group: {
            _id: "$batchId", // Group by batchId
            total: { $sum: 1 }, // Count of messages per batchId
          },
        },
      ]),
    ];
    let [phone2Queue, phone3Queue] = await Promise.all(queryPromise);

    if (phone2Queue?.length > 0) {
      const bulkOperations = phone2Queue.map((item) => ({
        updateOne: {
          filter: { _id: item?._id, totalMessagesInQueue: { $gt: 0 } },
          update: {
            $inc: { totalMessagesInQueue: -Math.abs(item?.total || 0) },
          },
        },
      }));

      await Batch.bulkWrite(bulkOperations);
    }

    if (phone3Queue?.length > 0) {
      const bulkOperations = phone3Queue.map((item) => ({
        updateOne: {
          filter: { _id: item?._id, totalMessagesInQueue: { $gt: 0 } },
          update: {
            $inc: { totalMessagesInQueue: -Math.abs(item?.total || 0) },
          },
        },
      }));

      await Batch.bulkWrite(bulkOperations);
    }

    res.status(200).send({ message: "Batch count updated successfully" });
  } catch (error) {
    console.error("Error", error);
    res.status(500).send(error);
  }
};

module.exports = {
  getAllPreviousDayBatches,
  getAllFourtyEightHourPreviousBatches,
  sendAutoReminder,
  resetAutoTemplate,
  setCampaignStats,
  updateVerifiedUnVerifidField,
  updateCountOfPhoneTwoAndPhoneThree,
  updateBatchStatus,
  updateBatchSendQueue,
  reverseBackBatchSendQueue,
};
