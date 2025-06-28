const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { compaignService } = require("../services");
const pick = require("../utils/pick");
const { Compaign, CsvData, Market } = require("../models");
const moment = require("moment");
const momenT = require("moment-timezone");
const ApiError = require("../utils/ApiError");
const { Client, ApiController } = require("@bandwidth/messaging");

const BW_USERNAME = "ZeitBlast_API";
const BW_PASSWORD = "AnjumAPI2024!";
const BW_ACCOUNT_ID = "5009813";
const BW_MESSAGING_APPLICATION_ID = process.env.dev_bw_id;
const BW_NUMBER = "+14702897382";
const USER_NUMBER = "+14702897382";
const messageId = "16946869536982njl2igxirrbzqvw";

const client = new Client({
  basicAuthUserName: BW_USERNAME,
  basicAuthPassword: BW_PASSWORD,
});

const controller = new ApiController(client);

const accountId = BW_ACCOUNT_ID;

const sendMessage = catchAsync(async (req, res) => {
  try {
    const response = await controller.createMessage(accountId, {
      applicationId: BW_MESSAGING_APPLICATION_ID,
      to: [USER_NUMBER],
      from: BW_NUMBER,
      text: "The quick brown fox jumps over the lazy dog.",
    });
    res.status(httpStatus.CREATED).send(response.body);
  } catch (error) {
    console.error(error);
  }
});

const getMessage = catchAsync(async (req, res) => {
  try {
    const response = await controller.getMessages(BW_ACCOUNT_ID, messageId);
    res.status(httpStatus.CREATED).send(response.body);
  } catch (error) {
    console.error(error);
  }
});
const createCompaign = catchAsync(async (req, res) => {
  let body = req.body;
  const compaign = await compaignService.createCompaign(body);
  res.status(httpStatus.CREATED).send(compaign);
});

const getAllCompaign = catchAsync(async (req, res) => {
  try {
    // Define the filter and options for querying campaigns
    let filter = {};
    let options = pick(req.query, ["limit", "page"]);
    options.populate = "market";

    if (req.query.search) {
      filter = {
        name: {
          $regex: req.query.search,
          $options: "i",
          permission: "compaign",
        },
      };
    }
    if (req.query.directImport) {
      filter = { permission: "compaign" };
    }
    if (req.query.sortByDate) {
      options.sortBy = `createdAt:${req.query.sortByDate}`;
    } else if (req.query.sortByName) {
      options.sortBy = `name:${req.query.sortByName}`;
    } else {
      options.sortBy = `createdAt:desc`;
    }
    // Fetch campaigns from MongoDB
    const campaigns = await compaignService.getAllCompaign(filter, options);

    // if (campaigns?.results?.length > 0) {
    //   const updatePromises = campaigns.results.map(async (campaign) => {
    //     let totalDelivered = 0;
    //     let totalResponses = 0;

    //     const directImportIds = campaign.directImport.map((di) =>
    //       String(di._id)
    //     );
    //     const directImportData = await CsvData.find(
    //       { directImportId: { $in: directImportIds } },
    //       { delivered: 1, response: 1 }
    //     );

    //     directImportData.forEach((data) => {
    //       totalDelivered += data.delivered;
    //       totalResponses += data.response;
    //     });

    //     const totalProspects = campaign.totalProspects;
    //     const campaignDeliverabilityPercentage =
    //       (totalDelivered / totalProspects) * 100;
    //     const campaignResponsePercentage =
    //       (totalResponses / totalProspects) * 100;

    //     return compaignService.updateCampaignDeliverabilityAndResponse(
    //       campaign._id,
    //       campaignDeliverabilityPercentage,
    //       campaignResponsePercentage
    //     );
    //   });

    //   await Promise.all(updatePromises);
    // }

    res.status(httpStatus.CREATED).send(campaigns);
  } catch (error) {
    console.error("Error inserting data:", error);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const getCampaignForFollowUp = catchAsync(async (req, res) => {
  try {
    // Define the filter and options for querying campaigns
    let filter;
    let yesterday = moment.utc().subtract(7, "days").startOf("day");
    let endOfYesterday = moment(yesterday).endOf("day");

    filter = {};
    let options = pick(req.query, ["limit", "page"]);
    options.populate = "market";
    // Fetch campaigns from MongoDB
    const campaigns = await compaignService.getCampaignForFollowUp(
      filter,
      options
    );

    res.status(httpStatus.CREATED).send(campaigns);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const getCompaignById = catchAsync(async (req, res) => {
  let id = req.params.compaignId;
  const compaign = await compaignService.getCompaignById(id);
  res.status(httpStatus.CREATED).send(compaign);
});
const updateCompaignById = catchAsync(async (req, res) => {
  let id = req.params.compaignId;
  let body = req.body;
  const compaign = await compaignService.updateCompaignById(id, body);
  res.status(httpStatus.CREATED).send(compaign);
});

const deleteCompaignById = catchAsync(async (req, res) => {
  let id = req.params.compaignId;
  const compaign = await compaignService.deleteCompaignById(id);
  res.status(httpStatus.CREATED).send(compaign);
});

const getAllFollowAndSimpleCampaignData = catchAsync(async (req, res) => {
  try {
    let filter = {};
    let options = {};
    if (!req.query.search) {
      options = pick(req.query, ["limit", "page"]);
    }
    options.populate = "market,compaign,followMarket";
    if (req.query.search) {
      filter = {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { title: { $regex: req.query.search, $options: "i" } },
        ],
      };
    }
    if (req.query.sortByDate) {
      options.sortBy = `createdAt:${req.query.sortByDate}`;
    } else if (req.query.sortByName) {
      options.sortBy = `name:${req.query.sortByName}`;
    } else {
      options.sortBy = `createdAt:desc`;
    }

    const compaign = await compaignService.getAllFollowAndSimpleCampaignData(
      filter,
      options
    );
    res.status(httpStatus.CREATED).send(compaign);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const getAllCompaignForInbox = catchAsync(async (req, res) => {
  try {
    let filter = {};
    if (req.query.search) {
      filter = {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { title: { $regex: req.query.search, $options: "i" } },
        ],
      };
    }
    const compaign = await compaignService.getAllCompaignForInbox(filter);
    res.status(httpStatus.CREATED).send(compaign);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});
const CampaignsCronStatsUpdate = catchAsync(async (req, res) => {
  try {
    const compaign = await compaignService.CampaignsCronStatsUpdate();
    res.status(httpStatus.CREATED).send(compaign);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const checkCompaignWorkingHour = catchAsync(async (req, res) => {
  try {
    let body = req.body;
    let market = await Compaign.findById(body.campagin)
      .populate("market")
      .populate("followMarket");
    if (!market) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "No market found",
      });
    }
    let idsToFind = [];
    if (market.market) {
      idsToFind.push(market.market._id);
    } else if (market?.followMarket) {
      idsToFind.push(market.followMarket._id);
    }

    let marketData = await Market.findOne({
      _id: { $in: idsToFind },
    });
    if (marketData?.phoneNumber?.length === 0) {
      return res.status(httpStatus.BAD_REQUEST).send({
        message: "No outbound numbers available for selected campaign market",
      });
    }
    const activePhoneNumbers = marketData?.phoneNumber?.filter(
      (item) => item.active === true
    );
    if (activePhoneNumbers?.length <= 0) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Selected Campaign market is currently Deactivated" });
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
      return res.sendStatus(200);
    } else {
      res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "Office Timeout you can't create batch right now" });
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});
module.exports = {
  createCompaign,
  getAllCompaign,
  getCompaignById,
  updateCompaignById,
  deleteCompaignById,
  getAllFollowAndSimpleCampaignData,
  sendMessage,
  getMessage,
  getCampaignForFollowUp,
  CampaignsCronStatsUpdate,
  checkCompaignWorkingHour,
  getAllCompaignForInbox,
};
