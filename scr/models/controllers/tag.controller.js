const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { tagService } = require("../services");
const pick = require("../utils/pick");

const createTag = catchAsync(async (req, res) => {
  let body = req.body;
  const tag = await tagService.createTag(body);
  res.status(httpStatus.CREATED).send(tag);
});

const getAllTag = catchAsync(async (req, res) => {
  let filter = {};
  let options = {};
  let { inbox } = req.query;
  if (!req.query.search) {
    options = pick(req.query, ["limit", "page"]);
  }
  options.sortBy = "createdAt:asec";
  const tag = await tagService.getAllTag(filter, options, inbox);
  res.status(httpStatus.CREATED).send(tag);
});

const getTagById = catchAsync(async (req, res) => {
  let id = req.params.tagId;
  const tag = await tagService.getTagById(id);
  res.status(httpStatus.CREATED).send(tag);
});
const updateTagById = catchAsync(async (req, res) => {
  let id = req.params.tagId;
  let body = req.body;
  const tag = await tagService.updateTagById(id, body);
  res.status(httpStatus.CREATED).send(tag);
});

const deleteTagById = catchAsync(async (req, res) => {
  let id = req.params.tagId;
  const tag = await tagService.deleteTagById(id);
  res.status(httpStatus.CREATED).send(tag);
});
module.exports = {
  createTag,
  getAllTag,
  getTagById,
  updateTagById,
  deleteTagById,
};
