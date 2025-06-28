const httpStatus = require("http-status");
const {
  Compaign,
  DirectImport,
  Inbox,
  CsvData,
  CampaignStats,
} = require("../models");
const { directImportController } = require("../controllers");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const moment = require("moment");
const { json } = require("express");

/**
 * Create a compaign
 * @param {Object} compaignBody
 * @returns {Promise<Compaign>}
 */
const createCompaign = async (compaignBody) => {
  try {
    return await Compaign.create(compaignBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllCompaign = async (filter, options) => {
  try {
    const result = await Compaign.paginate(filter, options);
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCampaignForFollowUp = async (filter, options) => {
  try {
    const result = await Compaign.paginate(filter, options);
    let directImportIds = [];
    const getQueryResult = async (column, campaignIdValue) => {
      const sevenDaysAgo = moment().subtract(7, "days").toDate();

      // First query (GROUP BY year, month)
      const groupByYearMonth = await CsvData.aggregate([
        {
          $match: {
            status: 1,
            response: 0,
            response2: 0,
            response3: 0,
            [column]: campaignIdValue,
            msgDate: {
              $lt: new Date(new Date().setDate(new Date().getDate() - 7)),
            },
          },
        },
        {
          $group: {
            _id: { $month: "$msgDate" },
            monthwise_count: { $sum: 1 },
          },
        },
        {
          $project: {
            month: "$_id",
            monthwise_count: 1,
            _id: 0,
          },
        },
        {
          $sort: { month: 1 },
        },
      ]);

      // Second query (total count)
      const totalCountResult = await CsvData.aggregate([
        {
          $match: {
            response: 0,
            response2: 0,
            response3: 0,
            status: 1,
            [column]: campaignIdValue,
            msgDate: { $lt: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            monthwise_count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            monthwise_count: 1,
          },
        },
      ]);
      // Format groupByYearMonth results
      const formattedGroupByYearMonth = groupByYearMonth.map((item) => ({
        month: item.month,
        monthwise_count: item.monthwise_count,
      }));

      // Format totalCount result
      const formattedTotalCount =
        totalCountResult.length > 0
          ? [
              {
                month: null,
                monthwise_count: totalCountResult[0].monthwise_count,
              },
            ]
          : [{ month: null, monthwise_count: 0 }];

      // Combine both arrays
      const combinedResult = [
        ...formattedGroupByYearMonth,
        ...formattedTotalCount,
      ];
      return combinedResult;
    };

    for (let i = result.results.length - 1; i >= 0; i--) {
      const campaign = result.results[i];
      const campaignIdValue = String(campaign._id);
      result.results[i].name =
        result.results[i].name || result.results[i].title;
      let Queryresult;
      if (campaign.permission === "compaign") {
        Queryresult = await getQueryResult("campaignId", campaignIdValue);
      } else if (campaign.permission === "followCompaign") {
        Queryresult = await getQueryResult("campaignId1", campaignIdValue);
      } else if (campaign.permission === "followCompaign2") {
        Queryresult = await getQueryResult("campaignId2", campaignIdValue);
      } else if (campaign.permission === "followCompaign3") {
        Queryresult = await getQueryResult("campaignId3", campaignIdValue);
      }

      const getLastIndex = Queryresult.length - 1;
      const toalProspectsWithoutResponse =
        Queryresult[getLastIndex].monthwise_count;

      if (toalProspectsWithoutResponse >= 1) {
        // Instead of assigning to campaign, assign to the result's results array
        let currentResult = result.results[i].toObject();
        currentResult.monthsData = Queryresult;
        result.results[i] = currentResult; // Reassign to the array
      } else {
        result.results.splice(i, 1);
      }
    }

    return { result, directImportIds };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCompaignById = async (id) => {
  let connection;
  try {
    // let [compaign, directImport] = await Promise.all([
    //   Compaign.findById(id).populate("market").exec(),
    //   DirectImport.find({ assignCampaign: id,assignCampaign: { $exists: true } }),
    // ]);

    let compaign = await Compaign.findById(id).populate("market");
    //let directImport = await DirectImport.find({ assignCampaign: id,assignCampaign: { $exists: true } });
    let filter = { assignCampaign: id };
    let directImport = await directImportStatsCron(filter);

    var campaignArray = {
      results: [],
    };
    campaignArray.results.push(compaign);

    const getCampaignDetails = await GetCampaignStats(campaignArray);
    if (!compaign) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No compaign found");
    }
    let totalLeads = { total: 0 };

    if (directImport.length > 0 && compaign.permission === "compaign") {
      //const campaignStats = await CampaignStats.findOne({ campagin: id });
      compaign.sent = getCampaignDetails
        ? getCampaignDetails.results[0].sent
        : 0;
      compaign.remaning = getCampaignDetails
        ? getCampaignDetails.results[0].remaning
        : 0;
      compaign.delivered = getCampaignDetails
        ? getCampaignDetails.results[0].delivered
        : 0;
      compaign.totalDelivered = getCampaignDetails
        ? getCampaignDetails.results[0].totalDelivered
        : 0;
      compaign.response = getCampaignDetails
        ? getCampaignDetails.results[0].response
        : 0;
      compaign.totalResponse = getCampaignDetails
        ? getCampaignDetails.results[0].totalResponse
        : 0;
      compaign.sentALL = getCampaignDetails
        ? getCampaignDetails.results[0].sentALL
        : 0;
      compaign.remaning = getCampaignDetails
        ? getCampaignDetails.results[0].remaning
        : 0;
      totalLeads.total = getCampaignDetails
        ? getCampaignDetails.results[0].totalLead
        : 0;
      compaign.hot = getCampaignDetails
        ? getCampaignDetails.results[0].totalHotLeads
        : 0;
      compaign.drip = getCampaignDetails
        ? getCampaignDetails.results[0].totalDripLeads
        : 0;
    } else {
      //const campaignStats = await CampaignStats.findOne({ campagin: id });
      compaign.sent = getCampaignDetails
        ? getCampaignDetails.results[0].sent
        : 0;
      compaign.remaning = getCampaignDetails
        ? getCampaignDetails.results[0].remaning
        : 0;
      compaign.delivered = getCampaignDetails
        ? getCampaignDetails.results[0].delivered
        : 0;
      compaign.totalDelivered = getCampaignDetails
        ? getCampaignDetails.results[0].totalDelivered
        : 0;
      compaign.response = getCampaignDetails
        ? getCampaignDetails.results[0].response
        : 0;
      compaign.totalResponse = getCampaignDetails
        ? getCampaignDetails.results[0].totalResponse
        : 0;
      compaign.sentALL = getCampaignDetails
        ? getCampaignDetails.results[0].sentALL
        : 0;
      compaign.remaning = getCampaignDetails
        ? getCampaignDetails.results[0].remaning
        : 0;
      totalLeads.total = getCampaignDetails
        ? getCampaignDetails.results[0].totalLead
        : 0;
      compaign.hot = getCampaignDetails
        ? getCampaignDetails.results[0].totalHotLeads
        : 0;
      compaign.drip = getCampaignDetails
        ? getCampaignDetails.results[0].totalDripLeads
        : 0;
    }

    const statusFilter = {
      $and: [
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
        { campagin: new mongoose.Types.ObjectId(id) },
      ],
    };

    const statuses = await Inbox.aggregate([
      { $match: statusFilter },
      { $group: { _id: "$status", value: { $sum: 1 } } },
      {
        $lookup: {
          from: "status",
          localField: "_id",
          foreignField: "_id",
          as: "status",
        },
      },
      { $project: { _id: 0, value: 1, status: "$status.name" } },
    ]);

    return { compaign, directImport, statuses, totalLeads };
  } catch (error) {
    if (connection) await connection.rollback();
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  } finally {
    if (connection) connection.release();
  }
};
 
async function directImportStatsCron(filter) {

  let nowInPST = moment.tz("America/Los_Angeles");

  // Start of the day in PST
  let startOfDayPST = nowInPST.clone().startOf("day");

  // End of the day in PST
  let endOfDayPST = nowInPST.clone().endOf("day");

  // Convert startOfDay and endOfDay to UTC
  let startOfDay = startOfDayPST.clone().utc().toDate();
  let endOfDay = endOfDayPST.clone().utc().toDate();

  let allImports = await DirectImport.find(filter).sort({ createdAt: -1 });
  console.log("allImports",allImports);
  // for (let i = 0; i < allImports.length; i++) {
  //   let sentPhone1 = await sentCountPhone(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );
  //   console.log("sentphone1", sentPhone1);
  //   let sentPhone2 = await sentCountPhone2(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );
  //   let sentPhone3 = await sentCountPhone3(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );

  //   const totalSent = sentPhone1 + sentPhone2 + sentPhone3;

  //   let deliverPhone1 = await deliverCountPhone(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );
  //   let deliverPhone2 = await deliverCountPhone2(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );
  //   let deliverPhone3 = await deliverCountPhone3(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );

  //   const totalDelivered = deliverPhone1 + deliverPhone2 + deliverPhone3;

  //   let respPhone1 = await respCountPhone(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );
  //   let respPhone2 = await respCountPhone2(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );
  //   let respPhone3 = await respCountPhone3(
  //     String(allImports[i]._id),
  //     startOfDay,
  //     endOfDay
  //   );

  //   const totalResponse = respPhone1 + respPhone2 + respPhone3;

  //   allImports[i].sentCount = allImports[i].sentCount + totalSent;
  //   allImports[i].delivered = allImports[i].delivered + totalDelivered;
  //   allImports[i].response = allImports[i].response + totalResponse;
  // }
  return allImports;
}

async function sentCountPhone(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status: 1,
          directImportId: importId,
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

async function sentCountPhone2(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate2: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status2: 1,
          directImportId: importId,
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

async function sentCountPhone3(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate3: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status3: 1,
          directImportId: importId,
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

async function deliverCountPhone(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          delivered: 1,
          directImportId: importId,
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

async function deliverCountPhone2(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate2: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          delivered2: 1,
          directImportId: importId,
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

async function deliverCountPhone3(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate3: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          delivered3: 1,
          directImportId: importId,
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

async function respCountPhone(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          respDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          response: 1,
          directImportId: importId,
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

async function respCountPhone2(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          respDate2: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          response2: 1,
          directImportId: importId,
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

async function respCountPhone3(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          respDate3: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          response3: 1,
          directImportId: importId,
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

const updateCompaignById = async (id, updateBody) => {
  try {
    const compaign = await Compaign.findById(id);
    if (!compaign) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No compaign found");
    }
    Object.assign(compaign, updateBody);
    await compaign.save();
    return compaign;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteCompaignById = async (id) => {
  try {
    const compaign = await Compaign.findByIdAndRemove(id);
    if (!compaign) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No compaign found");
    }
    return "Delete successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllFollowAndSimpleCampaignData = async (filter, options) => {
  try {
    let compaigns = await Compaign.paginate(filter, options);
    let campaignArray = await GetCampaignStats(compaigns);
    return campaignArray;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

async function GetCampaignStats1(campaignArray) {
  try {
    if (campaignArray.results.length > 0) {
      await Promise.all(
        campaignArray.results.map(async (campaign, i) => {
          const campaignId = String(campaign._id);
          console.log("campaignId", campaignId);

          const statusFilter = {
            $and: [
              {
                $or: [
                  { "messages.isIncoming": true },
                  { "messagesPhone2.isIncoming": true },
                  { "messagesPhone3.isIncoming": true },
                ],
              },
              {
                campagin: new mongoose.Types.ObjectId(campaignId),
              },
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
          let remaining =
            parseInt(campaign.totalProspects) - parseInt(campaign.sent);
          if (campaign.sent > 0) {
            let leads = parseInt(
              totalLeads.length > 0 ? totalLeads[0]?.total : 0
            );
            let totalHot = parseInt(
              totalLeads.length > 0 ? totalLeads[0].hot : 0
            );
            let totalDrip = parseInt(
              totalLeads.length > 0 ? totalLeads[0].drip : 0
            );
            let totalwarm = parseInt(
              totalLeads.length > 0 ? totalLeads[0].warm : 0
            );
            let totalnurture = parseInt(
              totalLeads.length > 0 ? totalLeads[0].nurture : 0
            );

            let delivered =
              campaign.sentALL > 0
                ? (parseInt(campaign.totalDelivered) /
                    parseInt(campaign.sentALL)) *
                  100
                : 0;
            let response =
              campaign.totalDelivered > 0
                ? (parseInt(campaign.totalResponse) /
                    parseInt(campaign.totalDelivered)) *
                  100
                : 0;

            let updateDocument = {
              totalLead: leads ? leads : 0,
              hot: totalHot,
              drip: totalDrip,
              warm: totalwarm,
              nurture: totalnurture,
              delivered: delivered.toFixed(2),
              response: response.toFixed(2),
              remaning: remaining,
            };

            await Compaign.findOneAndUpdate(
              { _id: campaign._id },
              updateDocument,
              { new: true }
            );

            campaignArray.results[i].remaning = remaining;
            campaignArray.results[i].hot = totalHot;
            campaignArray.results[i].drip = totalDrip;
            campaignArray.results[i].totalLead = leads;
            campaignArray.results[i].delivered = delivered.toFixed(2);
            campaignArray.results[i].response = response.toFixed(2);
          } else {
            let updateDocument = {
              totalLead: 0,
              hot: campaign.hot,
              drip: campaign.drip,
              warm: campaign.warm,
              nurture: campaign.nurture,
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
    console.log(error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
}

async function GetCampaignStats(campaignArray) {
  try {
    const { startOfDay, endOfDay } = getPSTBoundaries();
    const campaignMap = {
      compaign: "campaignId",
      followCompaign: "campaignId1",
      followCompaign2: "campaignId2",
      followCompaign3: "campaignId3",
    };

    if (campaignArray.results.length > 0) {
      await Promise.all(
        campaignArray.results.map(async (campaign) => {
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

const getAllCompaignForInbox = async (filter) => {
  try {
    let campaignArray = await Compaign.find(filter).select("name title");
    return campaignArray;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

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

const CampaignsCronStatsUpdate = async () => {
  // maximum number of retries

  try {
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateCampaignDeliverabilityAndResponse = async (
  campaignId,
  deliverabilityPercentage,
  responsePercentage
) => {
  try {
    const campaign = await Compaign.findById(campaignId);
    if (
      campaign &&
      !isNaN(deliverabilityPercentage) &&
      !isNaN(responsePercentage)
    ) {
      campaign.delivered = deliverabilityPercentage;
      campaign.response = responsePercentage;
      const updatedCampaign = await campaign.save();
      return updatedCampaign;
    }
    return {};
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  createCompaign,
  getAllCompaign,
  getCompaignById,
  updateCompaignById,
  deleteCompaignById,
  getAllFollowAndSimpleCampaignData,
  updateCampaignDeliverabilityAndResponse,
  getCampaignForFollowUp,
  CampaignsCronStatsUpdate,
  getAllCompaignForInbox,
  getPSTBoundaries,
};
