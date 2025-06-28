const httpStatus = require("http-status");
const { FollowCompaign, Compaign, CsvData } = require("../models");
const ApiError = require("../utils/ApiError");
const moment = require("moment");

/**
 * Create a followCompaign
 * @param {Object} followCompaignBody
 * @returns {Promise<Compaign>}
 */
const createFollowCompaign = async (followCompaignBody) => {
  try {
    let body = followCompaignBody;

    let camPaignCreated;
    const months = body.months.map(() => "?").join(",");
    const sevenDaysAgo = moment().subtract(7, "days").toDate();

    await CsvData.updateMany(
      { "msgDate": { "$type": "string" } },
      [{ $set: { "msgDate": { $toDate: "$msgDate" } } }]
    );
    
    if (body.permission === "compaign") {
      camPaignCreated = await Compaign.create(followCompaignBody);
      body.permission = "followCompaign";
      console.log(sevenDaysAgo);
      const queryResult = await CsvData.aggregate([
        {
          $match: {
            $expr: {
              $in: [{ $month: "$msgDate" },  body.months],
            },
            msgDate: { $lt: sevenDaysAgo },
            campaignId: body.compaign,
            status: 1,
            response: 0,
            response2: 0,
            response3: 0,
          },
        },
      ]);
      console.log("queryResult",queryResult.length);
      const idsArray = queryResult.map((item) => item._id);

      // // MongoDB update operation
      const updateResult = await CsvData.updateMany(
        { _id: { $in: idsArray } },
        {
          $set: {
            campaignId1: camPaignCreated._id,
            compaignPermission : "followcampaign",
            campaignId: null,
            status: 0,
            status2:0,
            status3:0,
            delivered: 0,
            delivered2: 0,
            delivered3: 0,
            undelivered:0,
            msgDate : null,
            msgDate2: null,
            msgDate3: null,
            respDate: null,
            respDate2: null,
            respDate3: null,
            bandwithsendid1: null,
            bandwithsendid2: null,
            bandwithsendid3: null,
            batchId: null,
          },
        }
      );

      const processedResults = {
        totalProspects: queryResult.length,
        permission: body.permission,
        remaning: queryResult.length,
        totalProspectsRemaining: queryResult.length,
      };
      // // Updating the Compaign collection
      const updatedCampaign = await Compaign.findByIdAndUpdate(
        { _id: camPaignCreated._id },
        processedResults,
        { new: true }
      );

      // Assuming this is where the commit would happen in a transactional context
      // MongoDB transactions can be used if necessary
    } 
    else if (body.permission === "followCompaign") {
      camPaignCreated = await Compaign.create(followCompaignBody);
      body.permission = "followCompaign2";
      const queryResult = await CsvData.aggregate([
        {
          $match: {
            $expr: {
              $in: [{ $month: "$msgDate" }, body.months],
            },
            msgDate: { $lt: sevenDaysAgo },
            campaignId1: body.compaign,
            status: 1,
            response: 0,
            response2: 0,
            response3: 0,
          },
        },
      ]);

      const idsArray = queryResult.map((item) => item._id);

      // // MongoDB update operation
      const updateResult = await CsvData.updateMany(
        { _id: { $in: idsArray } },
        {
          $set: {
            campaignId1: null,
            campaignId2: camPaignCreated._id,
            campaignId: null,
            compaignPermission : "followcampaign",
            status: 0,
            status2:0,
            status3:0,
            delivered: 0,
            delivered2: 0,
            delivered3: 0,
            undelivered:0,
            msgDate : null,
            msgDate2: null,
            msgDate3: null,
            respDate: null,
            respDate2: null,
            respDate3: null,
            bandwithsendid1: null,
            bandwithsendid2: null,
            bandwithsendid3: null,
            batchId: null,
          },
        }
      );

      const processedResults = {
        totalProspects: queryResult.length,
        permission: body.permission,
        remaning: queryResult.length,
        totalProspectsRemaining: queryResult.length,
      };

      // // Updating the Compaign collection
      const updatedCampaign = await Compaign.findByIdAndUpdate(
        camPaignCreated._id,
        processedResults,
        { new: true }
      );
    } else if (body.permission === "followCompaign2") {
      camPaignCreated = await Compaign.create(followCompaignBody);
      body.permission = "followCompaign3";
      const queryResult = await CsvData.aggregate([
        {
          $match: {
            $expr: {
              $in: [{ $month: "$msgDate" }, body.months],
            },
            msgDate: { $lt: sevenDaysAgo },
            campaignId2: body.compaign,
            status: 1,
            response: 0,
            response2: 0,
            response3: 0,
          },
        },
      ]);

      const idsArray = queryResult.map((item) => item._id);

      // // MongoDB update operation
      const updateResult = await CsvData.updateMany(
        { _id: { $in: idsArray } },
        {
          $set: {
            campaignId1: null,
            campaignId2: null,
            campaignId3: camPaignCreated._id,
            campaignId: null,
            compaignPermission : "followcampaign",
            status: 0,
            status2:0,
            status3:0,
            delivered: 0,
            delivered2: 0,
            delivered3: 0,
            undelivered:0,
            msgDate : null,
            msgDate2: null,
            msgDate3: null,
            respDate: null,
            respDate2: null,
            respDate3: null,
            bandwithsendid1: null,
            bandwithsendid2: null,
            bandwithsendid3: null,
            batchId: null,
          },
        }
      );

      const processedResults = {
        totalProspects: queryResult.length,
        permission: body.permission,
        remaning: queryResult.length,
        totalProspectsRemaining: queryResult.length,
      };

      // // Updating the Compaign collection
      const updatedCampaign = await Compaign.findByIdAndUpdate(
        camPaignCreated._id,
        processedResults,
        { new: true }
      );
    } else {
      camPaignCreated = "Cant Create More than 3 follow ups";
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Can't Create More than 3 follow ups"
      );
    }

    return camPaignCreated;
  } catch (error) {
    console.error("Error inserting data:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllFollowCompaign = async (filter, options) => {
  try {
    return await Compaign.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getFollowCompaignById = async (id) => {
  try {
    const followCompaign = await Compaign.findById(id)
      .populate("followMarket")
      .populate("compaign");
    if (!followCompaign) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No followCompaign found");
    }
    return followCompaign;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateFollowCompaignById = async (id, updateBody) => {
  try {
    const followCompaign = await Compaign.findById(id);
    if (!followCompaign) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No followCompaign found");
    }
    Object.assign(followCompaign, updateBody);
    await followCompaign.save();
    return followCompaign;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteFollowCompaignById = async (id) => {
  try {
    const followCompaign = await Compaign.findByIdAndRemove(id);
    if (!followCompaign) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No followCompaign found");
    }
    return "Delete successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  createFollowCompaign,
  getAllFollowCompaign,
  getFollowCompaignById,
  updateFollowCompaignById,
  deleteFollowCompaignById,
};
