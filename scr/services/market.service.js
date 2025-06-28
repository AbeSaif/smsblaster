const httpStatus = require("http-status");
const { Market, CsvData, Inbox, DNC, Flag, Compaign } = require("../models");
const ApiError = require("../utils/ApiError");
const moment = require("moment-timezone");
const mongoose = require("mongoose");
const compaignService = require("./compaign.service");
const Queue = require("bull");
/**
 * Create a market
 * @param {Object} marketBody
 * @returns {Promise<Market>}
 */
const createMarket = async (marketBody) => {
  try {
    return await Market.create(marketBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllMarket = async (filter, options) => {
  try {
    let markets = await Market.paginate(filter, options);
    if (markets.results.length > 0) {
      await Promise.all(
        markets.results.map(async (market) => {
          let todayStartOfDay = moment.tz(market?.timeZone).startOf("day");

          startOfDay = moment.utc(todayStartOfDay);
          startOfDay.set({
            hour: Number("00"),
            minute: Number("00"),
            second: Number("00"),
            millisecond: Number("00"),
          });
          let endOfDay = moment.utc(todayStartOfDay);
          endOfDay.set({
            hour: 23,
            minute: 59,
            second: Number("00"),
            millisecond: Number("00"),
          });

          todayStartOfDay = startOfDay.toDate();
          todayEndOfDay = endOfDay.toDate();

          const pipeline = [
            {
              $match: {
                from: { $in: market?.phone },
                createdAt: {
                  $gte: todayStartOfDay,
                  $lte: todayEndOfDay,
                },
              },
            },
            {
              $group: {
                _id: "$from",
                count: { $sum: 1 },
              },
            },
          ];
          const results = await Inbox.aggregate(pipeline);
          if (results?.length <= 0) {
            const updateResult = await Market.findByIdAndUpdate(
              market._id,
              {
                $set: { "phoneNumber.$[].sendMessageCount": 0 },
              },
              { new: true }
            );
            if (updateResult) {
              const updatedMarketIndex = markets.results.findIndex(
                (m) => m._id === market._id
              );
              if (updatedMarketIndex !== -1) {
                markets.results[updatedMarketIndex] = await Market.findById(
                  market._id
                );
              }
            }
          } else {
            const phoneNumbers = market.phoneNumber.map(
              (phone) => phone.number
            );
            phoneNumbers.forEach((number) => {
              if (!results.some((item) => item._id === number)) {
                results.push({ _id: number, count: 0 });
              }
            });
            const updates = results.map((item) => ({
              updateOne: {
                filter: { "phoneNumber.number": item._id },
                update: {
                  $set: {
                    "phoneNumber.$.sendMessageCount": item.count,
                  },
                },
              },
            }));
            await Market.bulkWrite(updates);
            const updatedMarketIndex = markets.results.findIndex(
              (m) => m._id === market._id
            );
            if (updatedMarketIndex !== -1) {
              markets.results[updatedMarketIndex] = await Market.findById(
                market._id
              );
            }
          }
        }),
        markets.results.map(async (market) => {
          let startOfMonth = moment.tz(market?.timeZone).startOf("month");
          let endOfMonth = moment.tz(market?.timeZone).endOf("month");
          startOfMonth = startOfMonth.toDate();
          endOfMonth = endOfMonth.toDate();
          const pipeline = [
            {
              $match: {
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
                from: { $in: market?.phone },
              },
            },
            {
              $group: {
                _id: "$from",
                count: { $sum: 1 },
              },
            },
          ];
          const results = await Inbox.aggregate(pipeline);
          if (results?.length <= 0) {
            const updateResult = await Market.findByIdAndUpdate(market._id, {
              $set: { "phoneNumber.$[].sendMonthlyMessageCount": 0 },
            });
            if (updateResult) {
              const updatedMarketIndex = markets.results.findIndex(
                (m) => m._id === market._id
              );
              if (updatedMarketIndex !== -1) {
                markets.results[updatedMarketIndex] = await Market.findById(
                  market._id
                );
              }
            }
          } else {
            const phoneNumbers = market.phoneNumber.map(
              (phone) => phone.number
            );
            phoneNumbers.forEach((number) => {
              if (!results.some((item) => item._id === number)) {
                results.push({ _id: number, count: 0 });
              }
            });
            const updates = results.map((item) => ({
              updateOne: {
                filter: { "phoneNumber.number": item._id },
                update: {
                  $set: {
                    "phoneNumber.$.sendMonthlyMessageCount": item.count,
                  },
                },
              },
            }));
            await Market.bulkWrite(updates);
            const updatedMarketIndex = markets.results.findIndex(
              (m) => m._id === market._id
            );
            if (updatedMarketIndex !== -1) {
              markets.results[updatedMarketIndex] = await Market.findById(
                market._id
              );
            }
          }
        })
      );
    }
    return markets;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getMarketById = async (id) => {
  try {
    const market = await Market.findById(id);
    if (!market) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
    }
    return market;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateMarketById = async (id, updateBody) => {
  try {
    let phoneExist = await Market.findOne({ phone: updateBody.newPhoneNumber });
    if (phoneExist) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Number already exist");
    }
    const market = await Market.findById(id);
    if (!market) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
    }
    if (
      updateBody?.phone &&
      updateBody?.newPhoneNumber &&
      updateBody?.oldPhoneNumber
    ) {
      let result = await Market.findOneAndUpdate(
        {
          phoneNumber: {
            $elemMatch: {
              number: updateBody.oldPhoneNumber,
            },
          },
        },
        { $set: { "phoneNumber.$.number": String(updateBody.newPhoneNumber) } },
        { new: true }
      );
      if (!result) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
      }
    }
    Object.assign(market, updateBody);
    await market.save();
    return market;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteMarketById = async (id) => {
  try {
    const market = await Market.findByIdAndRemove(id);
    if (!market) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
    }
    return "Delete successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const increaseMarketLimitById = async (id, body) => {
  try {
    let phoneExist = await Market.findOne({
      phone: String(body.phoneNumber[0]?.number),
    });
    if (phoneExist) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Number already exist");
    }
    const market = await Market.findByIdAndUpdate(
      id,
      {
        $push: body,
      },
      { new: true }
    );
    if (!market) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
    }
    return market;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateMarketStatus = async (phone, body) => {
  try {
    let market = await Market.findOneAndUpdate(
      {
        phoneNumber: {
          $elemMatch: {
            number: phone,
          },
        },
      },
      {
        $set: {
          "phoneNumber.$.active": body.active,
          "phoneNumber.$.date": new Date(),
        },
      },
      { new: true }
    );
    if (!market) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
    }
    return market;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const excistingMarketEnhanceWithNewNumber = async (id, number) => {
  try {
    let market = await Market.findByIdAndUpdate(
      id,
      { $addToSet: { phoneNumber: [{ number: number }] } },
      { new: true }
    );
    if (!market) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
    }
    return market;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateCallForwardNumber = async (id, body) => {
  try {
    // let queryPromises = [
    //   Market.findOne({
    //     callForwardingNumber: String(body.callForwardingNumber),
    //   }),
    //   Market.findById(id),
    // ];
    // let [phoneExist, oldMarket] = await Promise.all(queryPromises);
    // if (phoneExist) {
    //   throw new ApiError(httpStatus.BAD_REQUEST, "Number already exist");
    // }
    // if (!body.callForwardingNumber.startsWith(oldMarket.areaCode)) {
    //   throw new ApiError(
    //     httpStatus.BAD_REQUEST,
    //     "Call forwarding number must start with the area code"
    //   );
    // }
    const market = await Market.findByIdAndUpdate(
      id,
      {
        $set: body,
      },
      { new: true }
    );
    if (!market) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
    }
    return market;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
const removeOutBoundQueue = new Queue("remove-outbound", {
  redis: {
    host: process.env.redis_host,
    port: process.env.redis_port,
    username: process.env.redis_user,
    password: process.env.redis_pass,
  },
});

// Process jobs from queue in the background
removeOutBoundQueue.process(async (job, done) => {
  try {
    console.log("Processing job:", job.id);
    // Ensure that both 'messages' and 'batchId' are passed to the processing function
    await GetCampaignStats(job.data); // job.data contains both messages and batchId
    done();
  } catch (error) {
    console.error("Error processing job:", error);
  }
});

const removeOutBoundNumberAndRelatedOutBoundData = async (number) => {
  try {
    let inboxes = await Inbox.find({ from: number });
    let phone1 = [];
    let phone2 = [];
    let phone3 = [];
    if (inboxes?.length > 0) {
      for (const item of inboxes) {
        if (item.to !== "") phone1.push(item.to);
        if (item.phone2 !== "") phone2.push(item.phone2);
        if (item.phone3 !== "") phone3.push(item.phone3);
      }
    }
    let numberForFlag = `+1${number}`;
    const campaignArray = await Compaign.find({});

    let queryPromises = [
      Market.findOneAndUpdate(
        { phone: number },
        {
          $pull: {
            phone: number,
            phoneNumber: {
              number: number,
            },
          },
        },
        {
          new: true,
        }
      ),
      CsvData.updateMany(
        {
          $or: [
            { phone1: { $in: phone1 } },
            { phone2: { $in: phone2 } },
            { phone3: { $in: phone3 } },
          ],
        },
        {
          $set: {
            status: 0,
            status2: 0,
            status3: 0,
            delivered: 0,
            delivered2: 0,
            delivered3: 0,
            response: 0,
            response2: 0,
            response3: 0,
            batchId: null,
            msgDate: null,
            msgDate2: null,
            msgDate3: null,
            respDate: null,
            respDate2: null,
            respDate3: null,
            isPhone1Verified: false,
            isPhone2Verified: false,
            isPhone3Verified: false,
            bandwithsendid1: null,
            bandwithsendid2: null,
            bandwithsendid3: null,
            marketSenderNumber: null,
            isPhone1Verified: false,
            isPhone2Verified: false,
            isPhone3Verified: false,
          },
        }
      ),
      DNC.deleteMany({
        $or: [
          {
            number: { $in: phone1 },
          },
          {
            number: { $in: phone2 },
          },
          {
            number: { $in: phone3 },
          },
        ],
      }),
      Inbox.deleteMany({ from: number }),
      Flag.deleteMany({ "message.from": numberForFlag }),
    ];
    const [market] = await Promise.all(queryPromises);
    // await removeOutBoundQueue.add({
    //   campaignArray: campaignArray,
    // });
    await GetCampaignStats(campaignArray);
    return market;
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

// const removeOutBoundNumberAndRelatedOutBoundData = async (number) => {
//   try {
//     let inboxes = await Inbox.find({ from: number });
//     let phone1 = [];
//     let phone2 = [];
//     let phone3 = [];
//     if (inboxes?.length > 0) {
//       for (const item of inboxes) {
//         if (item.to !== "") phone1.push(item.to);
//         if (item.phone2 !== "") phone2.push(item.phone2);
//         if (item.phone3 !== "") phone3.push(item.phone3);
//       }
//     }
//     let numberForFlag = `+1${number}`;
//     let queryPromises = [
//       Market.findOneAndUpdate(
//         { phone: number },
//         {
//           $pull: {
//             phone: number,
//             phoneNumber: {
//               number: number,
//             },
//           },
//         },
//         {
//           new: true,
//         }
//       ),
//       CsvData.updateMany(
//         {
//           $or: [
//             { phone1: { $in: phone1 } },
//             { phone2: { $in: phone2 } },
//             { phone3: { $in: phone3 } },
//           ],
//         },
//         {
//           $set: {
//             status: 0,
//             status2: 0,
//             status3: 0,
//             delivered: 0,
//             delivered2: 0,
//             delivered3: 0,
//             response: 0,
//             response2: 0,
//             response3: 0,
//             batchId: null,
//             msgDate: null,
//             msgDate2: null,
//             msgDate3: null,
//             respDate: null,
//             respDate2: null,
//             respDate3: null,
//             bandwithsendid1: null,
//             bandwithsendid2: null,
//             bandwithsendid3: null,
//             marketSenderNumber: null,
// isPhone1Verified:false,
// isPhone2Verified:false,
// isPhone3Verified:false
//           },
//         }
//       ),
//       DNC.deleteMany({
//         $or: [
//           {
//             number: { $in: phone1 },
//           },
//           {
//             number: { $in: phone2 },
//           },
//           {
//             number: { $in: phone3 },
//           },
//         ],
//       }),
//       Inbox.deleteMany({ from: number }),
//       Flag.deleteMany({ "message.from": numberForFlag }),
//     //   CsvData.find({
//     //     $or: [
//     //       { phone1: { $in: phone1 } },
//     //       { phone2: { $in: phone2 } },
//     //       { phone3: { $in: phone3 } },
//     //     ],
//     //   }).select("campaignId campaignId1 campaignId2 campaignId3"),
//     // ];
//     // let [, , , , , csvDataArray] = await Promise.all(queryPromises);
//     // let finalCampaignIdArray = new Set();

//     // csvDataArray.forEach((item) => {
//     //   if (item.campaignId != null) finalCampaignIdArray.add(item.campaignId);
//     //   if (item.campaignId1 != null) finalCampaignIdArray.add(item.campaignId1);
//     //   if (item.campaignId2 != null) finalCampaignIdArray.add(item.campaignId2);
//     //   if (item.campaignId3 != null) finalCampaignIdArray.add(item.campaignId3);
//     // });
//     // let finalCompaginArrayResult = [...finalCampaignIdArray];
//     // let options = { sortBy: "createdAt:desc" };
//     // let compaignQueryPromise = [
//     //   Compaign.updateMany(
//     //     {
//     //       _id: { $in: finalCompaginArrayResult },
//     //     },
//     //     { $pull: { phone: number } }
//     //   ),
//     //   Compaign.paginate(
//     //     {
//     //       _id: { $in: finalCompaginArrayResult },
//     //     },
//     //     options
//     //   ),
//     // ];
//     // let [, compaginResultArray] = await Promise.all(compaignQueryPromise);
//     // let result = await GetCampaignStats(compaginResultArray);
//     // return result;
//   } catch (error) {
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
//   }
// };

async function GetCampaignStats1({ campaignArray }) {
  console.log("campaignArray", campaignArray);
  try {
    const campaignMap = {
      compaign: "campaignId",
      followCompaign: "campaignId1",
      followCompaign2: "campaignId2",
      followCompaign3: "campaignId3",
    };

    if (campaignArray.length > 0) {
      await Promise.all(
        campaignArray.map(async (campaign) => {
          const campaignId = String(campaign._id);
          const column = campaignMap[campaign.permission];
          const statusFilter = {
            $and: [
              // {
              //   $or: [
              //     { "messages.isIncoming": true },
              //     { "messagesPhone2.isIncoming": true },
              //     { "messagesPhone3.isIncoming": true },
              //   ],
              // },
              { isIncoming: true },
              { campaign: campaignId },
            ],
          };

          const totalLeads = await Inbox.aggregate([
            { $match: statusFilter },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          {
                            $eq: [
                              "$status",
                              new mongoose.Types.ObjectId(
                                "651ebe268042b1b3f4674e9b"
                              ),
                            ],
                          }, // Hot
                          {
                            $eq: [
                              "$status",
                              new mongoose.Types.ObjectId(
                                "651ebe4e8042b1b3f4674e9d"
                              ),
                            ],
                          }, // Warm
                          {
                            $eq: [
                              "$status",
                              new mongoose.Types.ObjectId(
                                "651ebe5b8042b1b3f4674ea0"
                              ),
                            ],
                          }, // Nurture
                          {
                            $eq: [
                              "$status",
                              new mongoose.Types.ObjectId(
                                "651ebe648042b1b3f4674ea2"
                              ),
                            ],
                          }, // Drip
                          {
                            $eq: [
                              "$status",
                              new mongoose.Types.ObjectId(
                                "651ebe828042b1b3f4674ea8"
                              ),
                            ],
                          }, // No status
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                hot: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          new mongoose.Types.ObjectId(
                            "651ebe268042b1b3f4674e9b"
                          ),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                warm: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          new mongoose.Types.ObjectId(
                            "651ebe4e8042b1b3f4674e9d"
                          ),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                nurture: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          new mongoose.Types.ObjectId(
                            "651ebe5b8042b1b3f4674ea0"
                          ),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                drip: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          new mongoose.Types.ObjectId(
                            "651ebe648042b1b3f4674ea2"
                          ),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                noStatus: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          new mongoose.Types.ObjectId(
                            "651ebe828042b1b3f4674ea8"
                          ),
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ]);

          const [
            phone1Del,
            phone2Del,
            phone3Del,
            phone1Resp,
            phone2Resp,
            phone3Resp,
            phone1Sent,
            phone2Sent,
            phone3Sent,
          ] = await Promise.all([
            deliverCountPhoneCampaign(column, campaignId),
            deliverCountPhone2Campaign(column, campaignId),
            deliverCountPhone3Campaign(column, campaignId),
            respCountPhoneCampaign(column, campaignId),
            respCountPhone2Campaign(column, campaignId),
            respCountPhone3Campaign(column, campaignId),
            sentCountPhoneCampaign(column, campaignId),
            sentCountPhone2Campaign(column, campaignId),
            sentCountPhone3Campaign(column, campaignId),
          ]);
          const deliverResult = phone1Del + phone2Del + phone3Del;
          const responseResult = phone1Resp + phone2Resp + phone3Resp;
          const sentResult = phone1Sent + phone2Sent + phone3Sent;

          const sentResultPhone1 = await CsvData.aggregate([
            {
              $match: {
                [column]: campaignId,
                // msgDate: {
                //   $gte: startOfDay,
                //   $lte: endOfDay,
                // },
                status: { $gt: 0 },
              },
            },
            {
              $group: {
                _id: null,
                totalSent: { $sum: "$status" },
              },
            },
            {
              $project: {
                _id: 0,
                totalSent: 1,
              },
            },
            {
              $project: {
                sentCount: {
                  $add: ["$totalSent"],
                },
              },
            },
          ]);

          if (sentResult > 0 || campaign.sent > 0) {
            let sentCount = parseInt(
              sentResultPhone1.length > 0 ? sentResultPhone1[0].sentCount : 0
            );
            let deliveredCount = parseInt(deliverResult);
            let responseCount = parseInt(responseResult);
            let sentCountAll = parseInt(sentResult);
            let leads = parseInt(
              totalLeads.length > 0 ? totalLeads[0]?.total : 0
            );
            let totalHot = parseInt(
              totalLeads.length > 0 ? totalLeads[0].hot : 0
            );
            let totalDrip = parseInt(
              totalLeads.length > 0 ? totalLeads[0].drip : 0
            );

            let delivered =
              sentCountAll > 0 ? (deliveredCount / sentCountAll) * 100 : 0;
            delivered = parseFloat(delivered.toFixed(2)); // This will limit to 2 decimal places

            let response =
              deliveredCount > 0 ? (responseCount / deliveredCount) * 100 : 0;
            response = parseFloat(response.toFixed(2)); // This will limit to 2 decimal places

            let updateDocument = {
              sentALL: sentCountAll,
              sent: sentCount,
              delivered: delivered,
              totalDelivered: deliveredCount,
              response: response,
              totalResponse: responseCount,
              totalLead: leads ? leads : 0,
              hot: totalHot,
              drip: totalDrip,
              remaning: campaign.totalProspects
                ? parseInt(campaign.totalProspects) - parseInt(sentCount)
                : 0,
            };
            await Compaign.findOneAndUpdate(
              { _id: campaign._id },
              updateDocument,
              { new: true }
            );
          } else {
            let updateDocument = {
              sentALL: 0,
              sent: 0,
              delivered: 0,
              totalDelivered: 0,
              response: 0,
              totalResponse: 0,
              totalLead: 0,
              hot: campaign.hot,
              drip: campaign.drip,
            };
            await Compaign.findOneAndUpdate(
              { _id: campaign._id },
              updateDocument,
              { new: true }
            );
          }
        })
      );
    }
    return campaignArray;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
}
function getPSTBoundaries() {
  const nowInPST = moment().tz("America/Los_Angeles");

  let startOfDay = nowInPST.clone().startOf("day").toDate();
  startOfDay = moment.utc(startOfDay);
  startOfDay.set({
    hour: Number("00"),
    minute: Number("00"),
    second: Number("00"),
    millisecond: Number("00"),
  });
  let endOfDay = moment.utc(startOfDay);
  endOfDay.set({
    hour: 23,
    minute: 59,
    second: Number("00"),
    millisecond: Number("00"),
  });
  startOfDay = startOfDay.toDate();
  endOfDay = endOfDay.toDate();

  return { startOfDay, endOfDay };
}
async function GetCampaignStats(campaignArray ) {
  try {
    const { startOfDay, endOfDay } = getPSTBoundaries();
    const campaignMap = {
      compaign: "campaignId",
      followCompaign: "campaignId1",
      followCompaign2: "campaignId2",
      followCompaign3: "campaignId3",
    };
    
    if (campaignArray.length > 0) {
      await Promise.all(
        campaignArray.map(async (campaign) => {
          const campaignId = String(campaign._id);
          const column = campaignMap[campaign.permission];

          const [
            totalProspects,
            phone1Del,
            phone2Del,
            phone3Del,
            phone1Resp,
            phone2Resp,
            phone3Resp,
            phone1Sent,
            phone2Sent,
            phone3Sent,
          ] = await Promise.all([
            totalProspectsCampaign(column, campaignId, startOfDay, endOfDay),
            deliverCountPhoneCampaign(column, campaignId, startOfDay, endOfDay),
            deliverCountPhone2Campaign(
              column,
              campaignId,
              startOfDay,
              endOfDay
            ),
            deliverCountPhone3Campaign(
              column,
              campaignId,
              startOfDay,
              endOfDay
            ),
            respCountPhoneCampaign(column, campaignId, startOfDay, endOfDay),
            respCountPhone2Campaign(column, campaignId, startOfDay, endOfDay),
            respCountPhone3Campaign(column, campaignId, startOfDay, endOfDay),
            sentCountPhoneCampaign(column, campaignId, startOfDay, endOfDay),
            sentCountPhone2Campaign(column, campaignId, startOfDay, endOfDay),
            sentCountPhone3Campaign(column, campaignId, startOfDay, endOfDay),
          ]);

          const deliverResult = phone1Del + phone2Del + phone3Del;
          const responseResult = phone1Resp + phone2Resp + phone3Resp;
          const sentResult = phone1Sent + phone2Sent + phone3Sent;

          const sentResultPhone1 = await CsvData.aggregate([
            {
              $match: {
                [column]: campaignId,
                // msgDate: {
                //   $gte: startOfDay,
                //   $lte: endOfDay,
                // },
                status: { $gt: 0 },
              },
            },
            {
              $group: {
                _id: null,
                totalSent: { $sum: "$status" },
              },
            },
            {
              $project: {
                _id: 0,
                totalSent: 1,
              },
            },
            {
              $project: {
                sentCount: {
                  $add: ["$totalSent"],
                },
              },
            },
          ]);
          console.log("column",column);
          console.log("totalProspects",totalProspects);
          console.log("campid",campaignId);
          let sentCount = parseInt(
            sentResultPhone1.length > 0 ? sentResultPhone1[0].sentCount : 0
          );
          if (sentResult > 0 || campaign.sent > 0) {
            
            let deliveredCount = parseInt(deliverResult);
            let responseCount = parseInt(responseResult);
            let sentCountAll = parseInt(sentResult);

            let delivered =
              sentCountAll > 0 ? (deliveredCount / sentCountAll) * 100 : 0;
            delivered = parseFloat(delivered.toFixed(2)); // This will limit to 2 decimal places

            let response =
              deliveredCount > 0 ? (responseCount / deliveredCount) * 100 : 0;
            response = parseFloat(response.toFixed(2)); // This will limit to 2 decimal places

            let updateDocument = {
              sentALL: sentCountAll,
              sent: sentCount,
              delivered: delivered,
              totalDelivered: deliveredCount,
              response: response,
              totalResponse: responseCount,
              totalProspects: totalProspects,
              remaning: totalProspects
                ? parseInt(totalProspects) - parseInt(sentCount)
                : 0,
            };
            await Compaign.findOneAndUpdate(
                            { _id: campaign._id },
                            updateDocument,
                            { new: true }
                          );
            console.log("column",column);
            console.log("campaign._id ",campaign._id );
            console.log("name", campaign.name);
            console.log("updateDocument",updateDocument);

          } else {
            let updateDocument = {
              sentALL: 0,
              sent: 0,
              remaning: totalProspects
                ? parseInt(totalProspects) - parseInt(sentCount)
                : 0,
              delivered: 0,
              totalDelivered: 0,
              response: 0,
              totalResponse: 0,
              totalProspects: totalProspects,
            };
            await Compaign.findOneAndUpdate(
              { _id: campaign._id },
              updateDocument,
              { new: true }
            );
            console.log("updateDocument1",updateDocument);
          }
        })
      );
    }
    return campaignArray;
  } catch (error) {
    console.log("error",error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
}

async function totalProspectsCampaign(column, importId, startOfDay, endOfDay) {
  try {
    console.log("column", column);
    console.log("id", importId);
    const result = await CsvData.aggregate([
      {
        $match: {
          [column]: importId,
        },
      },
      {
        $count: "total",
      },
    ]);
    
    console.log(result);
    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function sentCountPhoneCampaign(column, importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // msgDate: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          status: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$status", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);
    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function sentCountPhone2Campaign(column, importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // msgDate2: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          status2: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$status2", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function sentCountPhone3Campaign(column, importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // msgDate3: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          status3: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$status3", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function deliverCountPhoneCampaign(
  column,
  importId,
  startOfDay,
  endOfDay
) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // msgDate: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          delivered: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$delivered", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function deliverCountPhone2Campaign(
  column,
  importId,
  startOfDay,
  endOfDay
) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // msgDate2: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          delivered2: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$delivered2", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function deliverCountPhone3Campaign(
  column,
  importId,
  startOfDay,
  endOfDay
) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // msgDate3: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          delivered3: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$delivered3", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function respCountPhoneCampaign(column, importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // respDate: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          response: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$response", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function respCountPhone2Campaign(column, importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // respDate2: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          response2: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$response2", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function respCountPhone3Campaign(column, importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          // respDate3: {
          //   $gte: startOfDay,
          //   $lte: endOfDay,
          // },
          response3: 1,
          [column]: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$response3", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}
module.exports = {
  createMarket,
  getAllMarket,
  getMarketById,
  updateMarketById,
  deleteMarketById,
  increaseMarketLimitById,
  updateMarketStatus,
  excistingMarketEnhanceWithNewNumber,
  updateCallForwardNumber,
  removeOutBoundNumberAndRelatedOutBoundData,
};
