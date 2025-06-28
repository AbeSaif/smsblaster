const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { quickReplyTemplateService } = require("../services");
const pick = require("../utils/pick");

const createQuickReplyTemplateCategory = catchAsync(async (req, res) => {
  let body = req.body;
  const quickReplyTemplate =
    await quickReplyTemplateService.createQuickReplyTemplateCategory(body);
  res.status(httpStatus.CREATED).send(quickReplyTemplate);
});

const createQuickReplyTemplate = catchAsync(async (req, res) => {
  let body = req.body;
  const quickReplyTemplate =
    await quickReplyTemplateService.createQuickReplyTemplate(body);
  res.status(httpStatus.CREATED).send(quickReplyTemplate);
});

const getAllQuickReplyTemplate = catchAsync(async (req, res) => {
  let filter = {};
  let options = {};
  if (!req.query.search) {
    options = pick(req.query, ["limit", "page"]);
  }
  options.populate = "category";

  if (req.query.searchByCategory) {
    if (req.query.searchByCategory === "all") {
      filter = {};
    } else {
      filter = { category: req.query.searchByCategory };
    }
  }
  // if (req.query.search && req.query.searchByCategory === "all") {
  //   filter = {
  //     $or: [
  //       { title: { $regex: req.query.search, $options: "i" } },
  //       { reply: { $regex: req.query.search, $options: "i" } },
  //     ],
  //   };
  // }

  if (req.query.search && req.query.searchByCategory) {
    filter = {
      // category: req.query.searchByCategory,
      $or: [
        { title: { $regex: req.query.search, $options: "i" } },
        { reply: { $regex: req.query.search, $options: "i" } },
      ],
    };
  }

  if (req.query.sortByTitle) {
    options.sortBy = `title:${req.query.sortByTitle}`;
  } else if (req.query.sortByCategory) {
    options.sortBy = `category:${req.query.sortByCategory}`;
  } else if (req.query.sortByReply) {
    options.sortBy = `reply:${req.query.sortByReply}`;
  } else {
    options.sortBy = `position:asec`;
  }

  const quickReplyTemplate =
    await quickReplyTemplateService.getAllQuickReplyTemplate(filter, options);
  res.status(httpStatus.CREATED).send(quickReplyTemplate);
});

const getAllQuickReplyTemplateCategory = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:desc";
  const quickReplyTemplate =
    await quickReplyTemplateService.getAllQuickReplyTemplateCategory(
      filter,
      options
    );
  res.status(httpStatus.CREATED).send(quickReplyTemplate);
});

const getQuickReplyTemplateById = catchAsync(async (req, res) => {
  let id = req.params.quickReplyTemplateId;
  const quickReplyTemplate =
    await quickReplyTemplateService.getQuickReplyTemplateById(id);
  res.status(httpStatus.CREATED).send(quickReplyTemplate);
});

const updateQuickReplyTemplateById = catchAsync(async (req, res) => {
  let id = req.params.quickReplyTemplateId;
  let body = req.body;
  const quickReplyTemplate =
    await quickReplyTemplateService.updateQuickReplyTemplateById(id, body);
  res.status(httpStatus.CREATED).send(quickReplyTemplate);
});

const deleteQuickReplyTemplateById = catchAsync(async (req, res) => {
  let id = req.params.quickReplyTemplateId;
  const quickReplyTemplate =
    await quickReplyTemplateService.deleteQuickReplyTemplateById(id);
  res.status(httpStatus.CREATED).send(quickReplyTemplate);
});

const updateTemplatePosition = catchAsync(async (req, res) => {
  let body = req.body;
  const quickReplyTemplate =
    await quickReplyTemplateService.updateTemplatePosition(body);
  res.status(httpStatus.CREATED).send(quickReplyTemplate);
});
module.exports = {
  createQuickReplyTemplateCategory,
  createQuickReplyTemplate,
  getAllQuickReplyTemplate,
  getQuickReplyTemplateById,
  updateQuickReplyTemplateById,
  deleteQuickReplyTemplateById,
  getAllQuickReplyTemplateCategory,
  updateTemplatePosition,
};
