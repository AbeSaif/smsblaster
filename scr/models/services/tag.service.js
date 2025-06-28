const httpStatus = require("http-status");
const { Tag, Inbox } = require("../models");
const ApiError = require("../utils/ApiError");
const MAX_TAG_COUNT = 20;

/**
 * Create a tag
 * @param {Object} tagBody
 * @returns {Promise<Tag>}
 */
const createTag = async (tagBody) => {
  try {
    const tagsCount = await Tag.count();
    if (tagsCount >= MAX_TAG_COUNT) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Cannot add as Max Tags limit is ${MAX_TAG_COUNT}`
      );
    } else {
      const isColorAlreadyExist = await Tag.findOne({ color: tagBody.color });
      if (isColorAlreadyExist) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          `Color already exist.`
        );
      }
      return await Tag.create(tagBody);
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

// if (result.results.length > 0) {
//   for (let i = 0; i < result.results.length; i++) {
//     let count = await Inbox.countDocuments({ tags: result.results[i]._id });
//     result.results[i].prospect = count;
//   }
// }

const getAllTag = async (filter, options, inbox) => {
  try {
    // Fetch the paginated tags
    let result = await Tag.paginate(filter, options);
    if (result.results.length > 0 && !inbox) {
      const tagIds = result.results.map((tag) => tag._id);

      // Perform a single aggregation query to get the counts for all tags
      const counts = await Inbox.aggregate([
        { $match: { tags: { $in: tagIds } } }, // Match relevant tags
        { $unwind: "$tags" }, // Flatten the tags array
        { $group: { _id: "$tags", count: { $sum: 1 } } }, // Group by tag ID and count occurrences
        { $match: { _id: { $in: tagIds } } }, // Filter only relevant tag IDs
      ]);

      // Convert counts to a map for quick lookup
      const countMap = new Map(
        counts.map((item) => [item._id.toString(), item.count])
      );

      // Update the result with prospect counts
      result.results = result.results.map((tag) => ({
        ...tag.toObject(),
        prospect: countMap.get(tag._id.toString()) || 0,
      }));
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getTagById = async (id) => {
  try {
    const tag = await Tag.findById(id);
    if (!tag) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No tag found");
    }
    return tag;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateTagById = async (id, updateBody) => {
  try {
    const tag = await Tag.findById(id);
    if (tag && tag.color !== updateBody.color) {
      const isColorAlreadyExist = await Tag.findOne({
        color: updateBody.color,
      });
      if (isColorAlreadyExist) {
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          `Color already exist.`
        );
      }
    }
    if (!tag) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No tag found");
    }
    Object.assign(tag, updateBody);
    await tag.save();
    return tag;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteTagById = async (id) => {
  try {
    const tag = await Tag.findById(id);
    if (!tag) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No tag found");
    }
    if (tag?.name === "Expired") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Expired tag can't be deleted"
      );
    }
    await Tag.findByIdAndRemove(id);
    return tag;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
module.exports = {
  createTag,
  getAllTag,
  getTagById,
  updateTagById,
  deleteTagById,
};
