const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { initialAndFollowTemplateService } = require("../services");
const pick = require("../utils/pick");
const { Batch, InitialAndFollowTemplate } = require("../models");

const createInitialAndFollowTemplate = catchAsync(async (req, res) => {
  let body = req.body;
  const InitialAndFollowTemplate =
    await initialAndFollowTemplateService.createInitialAndFollowTemplate(body);
  res.status(httpStatus.CREATED).send(InitialAndFollowTemplate);
});

const getAllInitialAndFollowTemplate = catchAsync(async (req, res) => {
  let filter = { mode: "initial" };
  let options = {};
  if (!req.query.search) {
    options = pick(req.query, ["limit", "page"]);
  }

  if (req.query.mode) {
    filter = {
      $and: [{ quantity: { $lt: 300 } }, { mode: req.query.mode }],
    };
  }

  if (req.query.type && req.query.mode) {
    if (req.query.type === "all") {
      filter = {
        $and: [
          {
            type: {
              $in: [
                "Residential",
                "Commercial",
                "Land",
                "Multi Family",
                "Pre-Foreclosure / Liens / Auction",
                "Probate / Bankruptcy",
                "Vacant / Absentee",
              ],
            },
          },
          { mode: req.query.mode },
        ],
      };
    } else {
      filter = {
        $and: [{ type: req.query.type }, { mode: req.query.mode }],
      };
    }
  }
  if (req.query.search && req.query.mode) {
    filter = {
      mode: req.query.mode,
      $or: [
        { name: { $regex: req.query.search, $options: "i" } },
        { "messages.message1": { $regex: req.query.search, $options: "i" } },
        { "messages.message2": { $regex: req.query.search, $options: "i" } },
        { "messages.message3": { $regex: req.query.search, $options: "i" } },
        { "messages.message4": { $regex: req.query.search, $options: "i" } },
        { "messages.message4": { $regex: req.query.search, $options: "i" } },
        { type: { $regex: req.query.search, $options: "i" } },
      ],
    };
  }

  if (req.query.sortByDate && req.query.mode) {
    options.sortBy = `createdAt:${req.query.sortByDate}`;
    filter = { mode: req.query.mode };
  } else if (req.query.sortByName && req.query.mode) {
    options.sortBy = `name:${req.query.sortByName}`;
    filter = { mode: req.query.mode };
  } else if (req.query.sortByMessage && req.query.mode) {
    options.sortBy = `messages.message1:${req.query.sortByMessage}`;
    filter = { mode: req.query.mode };
  } else if (req.query.sortByType && req.query.mode) {
    options.sortBy = `type:${req.query.sortByType}`;
    filter = { mode: req.query.mode };
  } else {
    options.sortBy = `createdAt:desc`;
  }

  const InitialAndFollowTemplate =
    await initialAndFollowTemplateService.getAllInitialAndFollowTemplate(
      filter,
      options
    );

  for (let i = 0; i < InitialAndFollowTemplate.results.length; i++) {
    const tempalteData = InitialAndFollowTemplate.results[i];
    const batches = await Batch.find({
      template: tempalteData._id,
      status: "completed",
    });
    let templateDeliveredper = 0;
    let templateRespper = 0;
    let delivered = 0;
    let response = 0;
    if (batches.length > 0) {
      batches.map((data, index) => {
        delivered = delivered + data.delivered;
        response = response + data.response;
      });
      templateDeliveredper = delivered / batches.length;
      templateRespper = response / batches.length;
    }
    InitialAndFollowTemplate.results[i].deliveredPercentage =
      templateDeliveredper;
    InitialAndFollowTemplate.results[i].responsePercentage = templateRespper;
  }
  res.status(httpStatus.CREATED).send(InitialAndFollowTemplate);
});

const getAllInitialAndFollowTemplateForDropDown = catchAsync(
  async (req, res) => {
    let filter = { mode: "initial" };
    let options = pick(req.query, ["limit", "page"]);
    options.sortBy = `createdAt:desc`;
    if (req.query.search && req.query.mode) {
      filter = {
        $and: [
          { quantity: { $lt: 300 } },
          { mode: req.query.mode },
          { name: { $regex: req.query.search, $options: "i" } },
        ],
      };
    } else if (req.query.mode) {
      filter = {
        $and: [{ quantity: { $lt: 300 } }, { mode: req.query.mode }],
      };
    } else if (req.query.type && req.query.mode) {
      if (req.query.type === "all") {
        filter = {
          $and: [
            {
              type: {
                $in: [
                  "All",
                  "Residential",
                  "Commercial",
                  "Land",
                  "Multi Family",
                  "Pre-Foreclosure / Liens / Auction",
                  "Probate / Bankruptcy",
                  "Vacant / Absentee",
                ],
              },
            },
            { mode: req.query.mode },
          ],
        };
      } else {
        filter = {
          $and: [{ type: req.query.type }, { mode: req.query.mode }],
        };
      }
    } else {
      filter = { mode: "initial" };
    }
    const InitialAndFollowTemplate =
      await initialAndFollowTemplateService.getAllInitialAndFollowTemplateForDropDown(
        filter,
        options
      );
    res.status(httpStatus.CREATED).send(InitialAndFollowTemplate);
  }
);
const getInitialAndFollowTemplateById = catchAsync(async (req, res) => {
  let id = req.params.initialAndFollowTemplateId;
  let body = req.body;
  const template =
    await initialAndFollowTemplateService.getInitialAndFollowTemplateById(
      id,
      body
    );
  res.status(httpStatus.CREATED).send(template);
});

const updateInitialAndFollowTemplateById = catchAsync(async (req, res) => {
  let id = req.params.initialAndFollowTemplateId;
  let body = req.body;
  const template =
    await initialAndFollowTemplateService.updateInitialAndFollowTemplateById(
      id,
      body
    );
  res.status(httpStatus.CREATED).send(template);
});

const deleteInitialAndFollowTemplateById = catchAsync(async (req, res) => {
  let id = req.params.initialAndFollowTemplateId;
  const template =
    await initialAndFollowTemplateService.deleteInitialAndFollowTemplateById(
      id
    );
  res.status(httpStatus.CREATED).send(template);
});

const getTemplateWithCount = catchAsync(async (req, res) => {
  let mode = req.params.mode;
  const template = await initialAndFollowTemplateService.getTemplateWithCount(
    mode
  );
  res.status(httpStatus.CREATED).send(template);
});
module.exports = {
  createInitialAndFollowTemplate,
  getAllInitialAndFollowTemplate,
  updateInitialAndFollowTemplateById,
  deleteInitialAndFollowTemplateById,
  getTemplateWithCount,
  getInitialAndFollowTemplateById,
  getAllInitialAndFollowTemplateForDropDown,
};
