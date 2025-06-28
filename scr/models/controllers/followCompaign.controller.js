const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { followCompaignService } = require("../services");
const pick = require("../utils/pick");

const createFollowCompaign = catchAsync(async (req, res) => {
  let body = req.body;
  const followRegex = /follow(-up)?/i;

  if (!followRegex.test(body.title)) {
    body.title += " Follow-up";
  } else {
    body.title = body.title;
  }
  if (!followRegex.test(body.title)) {
    body.name += " Follow-up";
  } else {
    body.name = body.title;
  }
  const followCompaign = await followCompaignService.createFollowCompaign(body);
  res.status(httpStatus.CREATED).send(followCompaign);
});

const getAllFollowCompaign = catchAsync(async (req, res) => {
  let filter = {
    $or: [
      { permission: "followCompaign" },
      { permission: "followCompaign2" },
      { permission: "followCompaign3" },
    ],
  };
  let options = pick(req.query, ["limit", "page"]);
  options.populate = "followMarket,compaign";

  if (req.query.search) {
    filter = {
      $or: [
        {
          title: { $regex: req.query.search, $options: "i" },
          permission: "followCompaign",
        },
        {
          title: { $regex: req.query.search, $options: "i" },
          permission: "followCompaign2",
        },
        {
          title: { $regex: req.query.search, $options: "i" },
          permission: "followCompaign3",
        },
      ],
    };
  }

  if (req.query.sortByDate) {
    options.sortBy = `createdAt:${req.query.sortByDate}`;
  } else if (req.query.sortByName) {
    options.sortBy = `title:${req.query.sortByName}`;
  } else {
    options.sortBy = "createdAt:desc";
  }
  const followCompaign = await followCompaignService.getAllFollowCompaign(
    filter,
    options
  );

  res.status(httpStatus.CREATED).send(followCompaign);
});

const getFollowCompaignById = catchAsync(async (req, res) => {
  let id = req.params.followCompaignId;
  const followCompaign = await followCompaignService.getFollowCompaignById(id);
  res.status(httpStatus.CREATED).send(followCompaign);
});

const updateFollowCompaignById = catchAsync(async (req, res) => {
  let id = req.params.followCompaignId;
  let body = req.body;
  body.name = req.body.title;
  console.log("body", body);
  const followCompaign = await followCompaignService.updateFollowCompaignById(
    id,
    body
  );
  res.status(httpStatus.CREATED).send(followCompaign);
});

const deleteFollowCompaignById = catchAsync(async (req, res) => {
  let id = req.params.followCompaignId;
  const followCompaign = await followCompaignService.deleteFollowCompaignById(
    id
  );
  res.status(httpStatus.CREATED).send(followCompaign);
});

module.exports = {
  createFollowCompaign,
  getAllFollowCompaign,
  getFollowCompaignById,
  updateFollowCompaignById,
  deleteFollowCompaignById,
};
