const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const { mainBatchesService } = require("../services");
const AWS = require("aws-sdk");
const pick = require("../utils/pick");
const {
  User,
  Batch,
  Admin,
  DirectImport,
  Market,
  InitialAndFollowTemplate,
  DNC,
} = require("../models");
const { Inbox, Compaign, CsvData } = require("../models");
const { compaignService } = require("../services");
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
AWS.config.update({
  accessKeyId: process.env.accessKeyId, // Load from .env
  secretAccessKey: process.env.secretAccessKey, // Load from .env
  region: "us-east-1", // Load from .env
});
const sqs = new AWS.SQS();
const client = new Client({
  basicAuthUserName: BW_USERNAME,
  basicAuthPassword: BW_PASSWORD,
});

const controller = new ApiController(client);

const accountId = BW_ACCOUNT_ID;

const sendMessageQueue = new Queue("send-message", {
  redis: {
    host: process.env.redis_host,
    port: process.env.redis_port,
    username: process.env.redis_user,
    password: process.env.redis_pass,
  },
});

// Process jobs from queue in the background
sendMessageQueue.process(async (job, done) => {
  try {
    console.log("Processing job:", job.id);
    // Ensure that both 'messages' and 'batchId' are passed to the processing function
    await processSendMessage(job.data); // job.data contains both messages and batchId
    done();
  } catch (error) {
    console.error("Error processing job:", error);
  }
});

// sendMessageQueue.on("completed", function (job, result) {
//   console.error(`Job completed with ID ${job.id}:`, result);
// });

sendMessageQueue.on("failed", (job, error) => {
  console.error(`Job failed with ID ${job.id}:`, error);
  // Implement your error alerting mechanism here (e.g., email, logging service)
});

sendMessageQueue.on("stalled", (job) => {
  console.error(`Job stalled with ID ${job.id}`);
  // Implement your stalled job alerting mechanism here
});

const createBatch = catchAsync(async (req, res) => {
  let connection;
  try {
    let body = req.body;
    if (req.user.role === "admin") {
      let { _id } = req.user;
      body.admin = _id;
    } else {
      let { _id } = req.user;
      body.user = _id;
    }
    let market = await Compaign.findById(body.campagin)
      .populate("market")
      .populate("followMarket");
    if (!market) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "No market found",
      });
    }
    if (market?.market) {
      body.market = market.market._id;
    } else {
      body.market = market.followMarket._id;
    }
    let idsToFind = [];
    if (market.market) {
      idsToFind.push(market.market._id);
    } else {
      idsToFind.push(market.followMarket._id);
    }

    let marketData = await Market.findOne({
      _id: { $in: idsToFind },
    });
    const activePhoneNumbers = marketData?.phoneNumber?.filter(
      (item) => item.active === true
    );
    if (activePhoneNumbers?.length <= 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Selected Campaign market is currently Deactivated" });
    }
    let batchNotCompletedNumber = marketData?.phoneNumber?.filter(
      (item) =>
        item?.isBatchCreated === false &&
        item?.active === true &&
        item?.sendDailyMessageCount < 1250
    );
    if (
      batchNotCompletedNumber?.length <= 0 &&
      activePhoneNumbers?.length > 0
    ) {
      batchNotCompletedNumber = await Market.findOneAndUpdate(
        { _id: marketData._id },
        {
          $set: {
            "phoneNumber.$[elem].isBatchCreated": false,
          },
        },
        {
          arrayFilters: [
            { "elem.active": true, "elem.isBatchCreated": { $ne: false } },
          ],
          new: true,
        }
      );
      if (batchNotCompletedNumber) {
        batchNotCompletedNumber = batchNotCompletedNumber?.phoneNumber?.filter(
          (item) => item.active === true
        );
      }
    }
    if (batchNotCompletedNumber?.length > 0) {
      batchNotCompletedNumber = batchNotCompletedNumber?.filter(
        (item) =>
          item?.sendDailyMessageCount < 1250 &&
          item?.isBatchCreated === false &&
          item?.active === true
      );
    }

    if (
      batchNotCompletedNumber?.length <= 0 &&
      activePhoneNumbers?.length <= 0
    ) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "No sender number found" });
    }
    let queryCount =
      batchNotCompletedNumber[0]?.phone2QueryCount +
      batchNotCompletedNumber[0]?.phone3QueryCount;
    if (batchNotCompletedNumber?.length <= 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Market sender number limit has been reached" });
    } else if (batchNotCompletedNumber?.[0]?.sendDailyMessageCount >= 1250) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Market sender number limit has been reached" });
    } else if (queryCount >= 1250) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Batch number already in queue" });
    }

    const marketTimeZone =
      market.market?.timeZone || market.followMarket?.timeZone || "UTC";

    const currentTime = moment().tz(marketTimeZone);
    if (!currentTime.isValid()) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "Invalid date",
      });
    }
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
    if (currentTime.isBetween(startTime, endTime)) {
      const batch = await createmainBatchesService(
        body,
        batchNotCompletedNumber
      );
      const idsArray = batch.directImport.map((item) => item._id);
      const updateResult = await CsvData.updateMany(
        { _id: { $in: idsArray } },
        { $set: { batchId: String(batch.batch._id) } }
      );

      //let campaginData = await compaignService.getCompaignById(body.campagin);

      // let totalprevpros = 0;
      // const ProspectsRemainingCount =
      //   campaginData.compaign.totalProspectsRemaining - Number(idsArray.length);

      // const updateDocument = {
      //   totalProspectsRemaining: ProspectsRemainingCount,
      // };
      // await Compaign.findOneAndUpdate({ _id: body.campagin }, updateDocument, {
      //   new: true,
      // });

      if (batch?.batch?.user) {
        let finalUser = await User.findById(batch?.batch?.user);
        batch.batch.user = finalUser;
      } else {
        let finalUser = await Admin.findById(batch?.batch?.admin);
        batch.batch.admin = finalUser;
      }
      let finalBatch = batch.batch;
      let finalCampaign = batch.backCampaign;
      let finalTemplate = batch.template;
      let finalDirectImportData = batch.campagin;
      let directImport = batch.directImport;
      let dbTemplate = await InitialAndFollowTemplate.findById(body.template);
      if (dbTemplate) {
        dbTemplate.quantity = dbTemplate.quantity + directImport.length;
        await dbTemplate.save();
      }
      let finalResult = {
        directImport,
        finalBatch,
        finalCampaign,
        finalTemplate,
        finalDirectImportData,
      };
      res.status(httpStatus.CREATED).send(finalResult);
    } else {
      res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Office Timeout you can't create batch right now" });
    }
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

const createSQSQUE = catchAsync(async (req, res) => {
  const params = {
    QueueName: "prod-sqs-queue", // Name of the queue
    Attributes: {
      DelaySeconds: "0", // Optional: delay before messages are available
      MessageRetentionPeriod: "86400", // Optional: 1 day retention
    },
  };

  try {
    // Create the SQS queue
    const createQueueResponse = await sqs.createQueue(params).promise();
    console.log("Queue URL:", createQueueResponse.QueueUrl);

    return createQueueResponse.QueueUrl; // Return or use the queue URL
  } catch (error) {
    console.error("Error creating SQS queue:", error);
    throw error;
  }
});

const createmainBatchesService = async (batchBody, batchNotCompletedNumber) => {
  try {
    let template = await InitialAndFollowTemplate.findById(batchBody.template);
    template = template.messages;

    if (!template) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
    }

    let backCampaign = await Compaign.findById(batchBody.campagin)
      .populate("market")
      .populate("followMarket");

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

    let marketData = await Market.findOne({
      _id: { $in: idsToFind },
    });
    const activePhoneNumbers = marketData?.phoneNumber?.filter(
      (item) => item.active === true
    );
    backCampaign.phone =
      activePhoneNumbers?.length > 0
        ? activePhoneNumbers.map((item) => item.number)
        : [];

    // if(backCampaign.totalProspectsRemaining === 0){
    //   throw new ApiError(httpStatus.BAD_REQUEST, "No prospects available");
    // }
    let campaignField;
    switch (backCampaign.permission) {
      case "compaign":
        campaignField = "campaignId";
        break;
      case "followCompaign":
        campaignField = "campaignId1";
        break;
      case "followCompaign2":
        campaignField = "campaignId2";
        break;
      case "followCompaign3":
        campaignField = "campaignId3";
        break;
      default:
        // Handle unknown permission type
        console.error("Unknown permission type");
        return;
    }
    console.log("backCampaign",backCampaign);
    let query = {
      $and: [
        { [campaignField]: String(backCampaign._id) },
        { status: 0 },
        { batchId: { $eq: null } },
        { response: 0 },
        { response2: 0 },
        { response3: 0 },
      ],
    };

    let batchProspects = await CsvData.find(query)
      .limit(batchBody.batchSize) // Limiting results to batchSize
      .lean(); // Converts the Mongoose documents to plain JavaScript objects

    // Now you should be able to modify the objects directly
    for (let i = 0; i < batchProspects.length; i++) {
      batchProspects[i].id = String(batchProspects[i]._id);
    }
    const directImport = batchProspects;

    if (batchProspects.length <= 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No campaign found");
    }

    let totalProspects = batchProspects.length;
    let doctoUpdate = { remaning: backCampaign.remaning - totalProspects };
    let datac = await Compaign.findOneAndUpdate(
      { _id: backCampaign._id },
      doctoUpdate,
      {
        new: true,
      }
    );
    batchBody.totalProspects = totalProspects;
    batchBody.batchTotalProspects = totalProspects;
    batchBody.batchSenderNumber = batchNotCompletedNumber[0]?.number;
    let batch = await Batch.create(batchBody);
    if (batch) {
      await Market.findOneAndUpdate(
        {
          "phoneNumber.number": batchNotCompletedNumber[0]?.number,
        },
        {
          $set: {
            "phoneNumber.$[elem].isBatchCreated": true,
          },
        },
        {
          arrayFilters: [{ "elem.number": batchNotCompletedNumber[0]?.number }],
          new: true,
        }
      );
    }
    // backCampaign.remaning = totalProspects;
    await backCampaign.save();
    let finalResult = { directImport, batch, template, backCampaign };
    return finalResult;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
const getAllBatch = catchAsync(async (req, res) => {
  let connection;

  try {
    let filter;
    let options = pick(req.query, ["limit", "page"]);
    options.sortBy = "createdAt:desc";
    options.populate = "market,user,admin,campagin,template";

    if (req.query.user && req.query.status) {
      filter = {
        $and: [{ user: req.query.user }, { status: "paused" }],
      };
    } else if (req.query.admin && req.query.status) {
      filter = {
        $and: [{ admin: req.query.admin }, { status: "paused" }],
      };
    } else if (req.query.search) {
      filter = { name: req.query.search };
    } else if (req.query.status) {
      filter = { status: "paused" };
    } else if (req.query.user) {
      filter = {
        $and: [{ user: req.query.user }, { status: "paused" }],
      };
    } else if (req.query.admin) {
      filter = {
        $and: [{ admin: req.query.admin }, { status: "paused" }],
      };
    } else {
      filter = { status: "paused" };
    }

    const batch = await mainBatchesService.getAllBatch(filter, options);
    if (batch?.results?.length > 0) {
      const batchIds = batch.results.map((result) => String(result._id));
      const aggregationPipeline = [
        {
          $match: {
            batchId: {
              $in: batchIds,
            },
          },
        },
        {
          $group: {
            _id: "$batchId",
            totalSentCount: {
              $sum: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$status", "$status2", "$status3"],
                          },
                          3,
                        ],
                      },
                      then: 3,
                    },
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$status", "$status2", "$status3"],
                          },
                          2,
                        ],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$status", "$status2", "$status3"],
                          },
                          1,
                        ],
                      },
                      then: 1,
                    },
                  ],
                  default: 0,
                },
              },
            },
            totalDeliveredCount: {
              $sum: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$delivered", "$delivered2", "$delivered3"],
                          },
                          3,
                        ],
                      },
                      then: 3,
                    },
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$delivered", "$delivered2", "$delivered3"],
                          },
                          2,
                        ],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$delivered", "$delivereds2", "$delivered3"],
                          },
                          1,
                        ],
                      },
                      then: 1,
                    },
                  ],
                  default: 0,
                },
              },
            },
            totalResponseCount: {
              $sum: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$response", "$response2", "$response3"],
                          },
                          3,
                        ],
                      },
                      then: 3,
                    },
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$response", "$response2", "$response3"],
                          },
                          2,
                        ],
                      },
                      then: 2,
                    },
                    {
                      case: {
                        $eq: [
                          {
                            $sum: ["$response", "$response2", "$response3"],
                          },
                          1,
                        ],
                      },
                      then: 1,
                    },
                  ],
                  default: 0,
                },
              },
            },
          },
        },
      ];
      const aggregatedData = await CsvData.aggregate(aggregationPipeline);
      let i = 0;
      const updatePromises = batch.results.map(async (result) => {
        if (result?.batchSendMessage >= result?.batchTotalProspects) {
          let queryPromise = [
            Batch.findByIdAndUpdate(result._id, {
              $set: {
                status: "completed",
              },
            }),
          ];
          await Promise.all(queryPromise);
        }
        const finalData = aggregatedData.find(
          (data) => data._id === String(result._id)
        );
        if (finalData) {
          let batchPercentageDelivered = 0;
          if (finalData.totalSentCount > 0) {
            batchPercentageDelivered =
              (finalData.totalDeliveredCount / finalData.totalSentCount) * 100;
          }

          let batchPercentageResponse = 0;
          if (
            batchPercentageDelivered > 0 &&
            finalData.totalResponseCount > 0
          ) {
            batchPercentageResponse =
              finalData.totalDeliveredCount > 0
                ? (finalData.totalResponseCount /
                    finalData.totalDeliveredCount) *
                  100
                : 0;
          }
          batch.results[i].response = batchPercentageResponse;
          batch.results[i].delivered = batchPercentageDelivered;
          if (
            batch.results[i]?.campagin?.name ||
            batch.results[i]?.campagin?.title
          ) {
            batch.results[i].campagin.name =
              batch.results[i]?.campagin?.name ||
              batch.results[i]?.campagin?.title;
          }
          i = i + 1;
          return Batch.findByIdAndUpdate(
            result._id,
            {
              $set: {
                delivered: batchPercentageDelivered,
                response: batchPercentageResponse,
                batchSendMessage: finalData.totalSentCount,
              },
            },
            { new: true }
          );
        }
      });

      await Promise.all(updatePromises);
    }

    res.status(httpStatus.CREATED).send(batch);
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
});

const getCombineBatches = catchAsync(async (req, res) => {
  try {
    let filter = {};
    let options = pick(req.query, ["limit", "page"]);
    options.populate = "user,admin,campagin,template";
    options.sortBy = "createdAt:desc";
    const batch = await mainBatchesService.getAllBatch(filter, options);

    if (batch?.results?.length > 0) {
      const seen = new Set();
      batch.results = batch.results.filter((item) => {
        const identifier = item.user
          ? item.user.firstName
          : item.admin.fullName;
        if (!seen.has(identifier)) {
          seen.add(identifier);
          return true;
        }
        return false;
      });
    }

    res.status(httpStatus.CREATED).send(batch);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const getBatchByStatusCompleted = catchAsync(async (req, res) => {
  try {
    let filter;
    let options = pick(req.query, ["limit", "page"]);
    options.sortBy = "createdAt:desc";
    options.populate = "user,admin,campagin,template";

    // Constructing the filter based on query parameters
    if (req.query.user && req.query.status) {
      filter = {
        $and: [
          { user: req.query.user },
          { status: { $in: ["completed", "pending", "cancelled", "failed"] } },
        ],
      };
    } else if (req.query.admin && req.query.status) {
      filter = {
        $and: [
          { admin: req.query.admin },
          { status: { $in: ["completed", "pending", "cancelled", "failed"] } },
        ],
      };
    } else if (req.query.search) {
      filter = { name: req.query.search };
    } else if (req.query.status) {
      filter = {
        status: { $in: ["completed", "pending", "cancelled", "failed"] },
      };
    } else if (req.query.user) {
      filter = {
        $and: [
          { user: req.query.user },
          { status: { $in: ["completed", "pending", "cancelled", "failed"] } },
        ],
      };
    } else if (req.query.admin) {
      filter = {
        $and: [
          { admin: req.query.admin },
          { status: { $in: ["completed", "pending", "cancelled", "failed"] } },
        ],
      };
    } else {
      filter = {
        status: { $in: ["completed", "pending", "cancelled", "failed"] },
      };
    }

    // Fetching batch data
    const batch = await mainBatchesService.getBatchByStatusCompleted(
      filter,
      options
    );

    if (batch?.results?.length > 0) {
      const batchIds = batch.results.map((result) => String(result._id));
      const aggregationPipeline = [
        {
          $match: {
            batchId: {
              $in: batchIds,
            },
          },
        },
        {
          $group: {
            _id: "$batchId",
            totalSentCount: {
              $sum: {
                $sum: [
                  { $cond: [{ $gt: ["$status", 0] }, 1, 0] },
                  { $cond: [{ $gt: ["$status2", 0] }, 1, 0] },
                  { $cond: [{ $gt: ["$status3", 0] }, 1, 0] },
                ],
              },
            },
            totalDeliveredCount: {
              $sum: {
                $sum: [
                  { $cond: [{ $gt: ["$delivered", 0] }, 1, 0] },
                  { $cond: [{ $gt: ["$delivered2", 0] }, 1, 0] },
                  { $cond: [{ $gt: ["$delivered3", 0] }, 1, 0] },
                ],
              },
            },
            totalResponseCount: {
              $sum: {
                $sum: [
                  { $cond: [{ $gt: ["$response", 0] }, 1, 0] },
                  { $cond: [{ $gt: ["$response2", 0] }, 1, 0] },
                  { $cond: [{ $gt: ["$response3", 0] }, 1, 0] },
                ],
              },
            },
          },
        },
      ];

      const aggregatedData = await CsvData.aggregate(aggregationPipeline);
      let i = 0;
      const updatePromises = batch.results.map(async (result) => {
        const finalData = aggregatedData.find(
          (data) => data._id === String(result._id)
        );

        if (finalData) {
          let batchPercentageDelivered = 0;
          if (finalData.totalSentCount > 0) {
            batchPercentageDelivered =
              (finalData.totalDeliveredCount / finalData.totalSentCount) * 100;
          }
          let batchPercentageResponse = 0;
          if (
            batchPercentageDelivered > 0 &&
            finalData.totalResponseCount > 0
          ) {
            batchPercentageResponse =
              finalData.totalDeliveredCount > 0
                ? (finalData.totalResponseCount /
                    finalData.totalDeliveredCount) *
                  100
                : 0;
          }
          batch.results[i].response = batchPercentageResponse;
          batch.results[i].delivered = batchPercentageDelivered;
          i = i + 1;
          let updateEnteries;
          if (result.batchSendMessage > finalData.totalSentCount) {
          } else {
            return Batch.findByIdAndUpdate(
              result._id,
              {
                $set: {
                  delivered: batchPercentageDelivered,
                  response: batchPercentageResponse,
                  batchSendMessage: finalData.totalSentCount,
                },
              },
              { new: true }
            );
          }
        }
      });

      await Promise.all(updatePromises);
    }
    res.status(httpStatus.CREATED).send(batch);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const getBatchById = catchAsync(async (req, res) => {
  let connection;
  try {
    let id = req.params.batchId;
    const batch = await mainBatchesService.getBatchById(id);
    let batchId = String(id);

    const batchIdValue = batchId ? batchId : 0;
    const directImportFinalData = await CsvData.find({
      batchId: batchIdValue,
    }).lean();
    for (let i = 0; i < directImportFinalData.length; i++) {
      directImportFinalData[i].id = String(directImportFinalData[i]._id);
    }
    let finalBatch = batch.batch;
    let finalCampaign = batch.backCampaign;
    let finalTemplate = batch.template;
    let finalResult = {
      directImport: directImportFinalData,
      finalBatch,
      finalCampaign,
      finalTemplate,
    };
    res.status(httpStatus.CREATED).send(finalResult);
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
});

const updateBatchById = catchAsync(async (req, res) => {
  let id = req.params.batchId;
  let body = req.body;
  const batch = await mainBatchesService.updateBatchById(id, body);
  res.status(httpStatus.CREATED).send(batch);
});

const deleteBatchById = catchAsync(async (req, res) => {
  let id = req.params.batchId;
  const batch = await mainBatchesService.deleteBatchById(id);
  res.status(httpStatus.CREATED).send(batch);
});

const sendMessage = catchAsync(async (req, res) => {
  try {
    let body = req.body;
     let messageBatch = []; // Local batch array

       messageBatch.push(body);

      let added = await sendMessageQueue.add({
        messages: messageBatch,
        batchId: body.batchId,
      });
      // console.log(added);
      

    if (body.completed) {
      let updatedBatch = await Batch.findByIdAndUpdate(
        body.batchId,
        { $set: { status: "completed" } },
        { new: true }
      );
      return res.status(httpStatus.OK).send(updatedBatch);
    } else {
      return res.status(httpStatus.OK).send("Message will be sent shortly");
    }
  } catch (error) {
    console.log(error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
});

let number = 0;

async function processSendMessage({ messages, batchId }) {
  try {
    // Process each message
    for (const message of messages) {
      const resultsMsg = await sendMessageServis(message, batchId);
      if (resultsMsg) {
        console.log("Message processed:", message);
      } else {
        console.log("Issue processing message:", message);
      }
    }
  } catch (error) {
    throw error; // Re-throwing the error is important to ensure that the calling function knows something went wrong.
  }
}

const sendMessageServis = async (body, batchId) => {
  try {
    const batch = await Batch.findById(batchId);

    let campagin = await Compaign.findById(batch.campagin);
    if (!campagin) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No campagin found");
    }
    if (!batch?.batchSenderNumber) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "No batch sender number found"
      );
    }
    body.senderPhoneNumber = batch?.batchSenderNumber;
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
    let checkDncNumber = await DNC.findOne({ number: body.phone });
    if (!checkDncNumber) {
      const idToUpdate = body.phoneId;
      const newStatus = 1;
      const promises = [
        CsvData.updateOne(
          { _id: idToUpdate },
          { $set: { status: newStatus, msgDate: new Date() } }
        ),
        Batch.findByIdAndUpdate(
          batchId,
          {
            $set: { batchSendMessage: body.batchSendMessage },
          },
          { new: true }
        ),
        CsvData.updateMany(
          {
            $or: [
              { phone1: body.phone },
              { phone2: body.phone },
              { phone3: body.phone },
            ],
          },
          { $set: { marketSenderNumber: body.senderPhoneNumber } }
        ),
        Compaign.findByIdAndUpdate(
          { _id: batch.campagin },
          { $inc: { sent: 1, sentALL: 1 } }
        ),
        DirectImport.findOneAndUpdate(
          { assignCampaign: batch.campagin }, // Find by assignedCampaign
          { $inc: { sentCount: 1 } }, // Increment delivered by 1
          { new: true } // Return the updated document
        ),
        Market.findOneAndUpdate(
          { "phoneNumber.number": body?.senderPhoneNumber },
          { $inc: { "phoneNumber.$.sendDailyMessageCount": 1 } }
        ),
      ];

      await Promise.all(promises);

      const response = await mainBatchesService.sendSMS(
        messageTemplate,
        recipients,
        "+1" + body.phone,
        "+1" + body.senderPhoneNumber,
        body.message,
        body.phoneId
      );
      console.log(response);
      // let updateSql;
      if (response) {
        let processedResults = {
          bandwithsendid1: response.id,
        };
        const updatedCsvData = await CsvData.findOneAndUpdate(
          { _id: idToUpdate },
          processedResults,
          { new: true }
        );
        let inboxExist;
        if (campagin.permission === "compaign") {
          messageBody.type = "initial";
          inboxExist = await Inbox.findOneAndUpdate(
            {
              $and: [{ from: body.senderPhoneNumber }, { to: body.phone }],
            },
            {
              $push: { messages: messageBody },
              $set: {
                campagin: batch.campagin,
                batch: batchId,
                lastMessageSendDate: new Date(),
                companyName: body.companyName,
                aliasName: body.aliasName,
                propertyAddress: updatedCsvData?.propertyAddress,
                propertyCity: updatedCsvData?.propertyCity,
                propertyState: updatedCsvData?.propertyState,
                propertyZip: updatedCsvData?.propertyZip,
                phone2: updatedCsvData?.phone2,
                phone3: updatedCsvData?.phone3,
                ...(body?.user
                  ? { user: body.user }
                  : body?.admin
                  ? { admin: body.admin }
                  : { user: null }), // Defaults to null if neither exists
              },
            },
            { new: true },
            {
              timestamps: false,
            }
          );
        } else {
          messageBody.type = "follow";
          inboxExist = await Inbox.findOneAndUpdate(
            {
              $and: [{ to: body.phone }],
            },
            {
              $push: { messages: messageBody },
              $set: {
                campagin: batch.campagin,
                batch: batchId,
                lastMessageSendDate: new Date(),
                companyName: body.companyName,
                aliasName: body.aliasName,
                propertyAddress: updatedCsvData?.propertyAddress,
                propertyCity: updatedCsvData?.propertyCity,
                propertyState: updatedCsvData?.propertyState,
                propertyZip: updatedCsvData?.propertyZip,
                phone2: updatedCsvData?.phone2,
                phone3: updatedCsvData?.phone3,
                ...(body?.user
                  ? { user: body.user }
                  : body?.admin
                  ? { admin: body.admin }
                  : { user: null }), // Defaults to null if neither exists
                from: body?.senderPhoneNumber,
              },
            },
            { new: true },
            {
              timestamps: false,
            }
          );
        }
        if (!inboxExist) {
          messageBody.type = "initial";
          let newInboxCreated = await Inbox.create({
            campagin: campagin._id,
            batch: batchId,
            from: body.senderPhoneNumber,
            to: body.phone,
            messages: messageBody,
            userName: body.userName,
            companyName: body.companyName,
            aliasName: body.aliasName,
            lastMessageSendDate: new Date(),
            type: "initial",
            propertyAddress: updatedCsvData?.propertyAddress,
            propertyCity: updatedCsvData?.propertyCity,
            propertyState: updatedCsvData?.propertyState,
            propertyZip: updatedCsvData?.propertyZip,
            phone2: updatedCsvData?.phone2,
            phone3: updatedCsvData?.phone3,
            ...(body?.user
              ? { user: body.user }
              : body?.admin
              ? { admin: body.admin }
              : { user: null }), // Defaults to null if neither exists
          });
        }

        batch.sentMessage = campagin.sent;

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

        return response;
      } else {
        // batch.batchSendMessage += 1;
        // await batch.save();
        return "Something went wrong while sending message";
      }
    }
    // }
    return true;
  } catch (error) {
    throw error; // Re-throwing the error is important to ensure that the calling function knows something went wrong.
  }
};

const getCampagin = catchAsync(async (req, res) => {
  let filter = {
    // assignCampaign: { $exists: true },
    // assignCamapingCompleted: false,
  };
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:desc";
  //options.populate = "assignCampaign";
  const response = await mainBatchesService.getCampagin(filter, options);
  let newArray = {
    results: [],
  };
  try {
    if (!response.results.length) {
      return response;
    }
    let data = response.results;

    for (let i = data.length - 1; i >= 0; i--) {
      let campaignField;
      switch (data[i].permission) {
        case "compaign":
          campaignField = "campaignId";
          break;
        case "followCompaign":
          campaignField = "campaignId1";
          break;
        case "followCompaign2":
          campaignField = "campaignId2";
          break;
        case "followCompaign3":
          campaignField = "campaignId3";
          break;
        default:
          continue; // Skip unknown permission type
      }

      let query = {
        $and: [
          { [campaignField]: String(data[i]._id) },
          { batchId: { $eq: null } },
          { status: 0 },
          { response: 0 },
          { response2: 0 },
          { response3: 0 },
        ],
      };

      let campResult = await CsvData.find(query).explain("executionStats");

      if (campResult.executionStats.nReturned > 0) {
        data[i].totalProspectsRemaining = campResult.executionStats.nReturned;
        data[i].name = data[i]?.name || data[i].title;
        newArray.results.push(data[i]);
      }
    }

    res.status(httpStatus.CREATED).send(newArray);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const changeTemplate = catchAsync(async (req, res) => {
  let { batchId } = req.params;
  let body = req.body;
  const batch = await mainBatchesService.changeTemplate(body, batchId);
  res.status(httpStatus.CREATED).send(batch);
});

module.exports = {
  createBatch,
  getAllBatch,
  getBatchById,
  updateBatchById,
  deleteBatchById,
  sendMessage,
  getBatchByStatusCompleted,
  getCampagin,
  changeTemplate,
  getCombineBatches,
  createSQSQUE,
};
