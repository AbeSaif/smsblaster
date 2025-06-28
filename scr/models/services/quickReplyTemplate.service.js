const httpStatus = require("http-status");
const { QuickReplyTemplate, QuickReplyCategory } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Create a quickReplyTemplate
 * @param {Object} quickReplyTemplateBody
 * @returns {Promise<QuickReplyTemplate>}
 */

const createQuickReplyTemplateCategory = async (body) => {
  try {
    return await QuickReplyCategory.create(body);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const createQuickReplyTemplate = async (quickReplyTemplateBody) => {
  try {
    let queryPromise = [
      QuickReplyTemplate.findOne({
        $and: [
          { category: quickReplyTemplateBody.category },
          { title: quickReplyTemplateBody.title },
        ],
      }),
      QuickReplyTemplate.findOne({
        $and: [
          { category: quickReplyTemplateBody.category },
          { reply: quickReplyTemplateBody.reply },
        ],
      }),
    ];
    let [categoryAndTitleExist, categoryAndReplyExist] = await Promise.all(
      queryPromise
    );
    if (categoryAndTitleExist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Title with selected category already exist"
      );
    } else if (categoryAndReplyExist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Reply with selected category already exist"
      );
    }
    let result = await QuickReplyTemplate.create(quickReplyTemplateBody);
    if (result) {
      await QuickReplyCategory.findByIdAndUpdate(
        quickReplyTemplateBody.category,
        { $set: { status: "hard" } },
        { new: true }
      );
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllQuickReplyTemplate = async (filter, options) => {
  try {
    const result = await QuickReplyTemplate.paginate(filter, options);
    await QuickReplyCategory.deleteMany({ status: "soft" });
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllQuickReplyTemplateCategory = async (filter, options) => {
  try {
    return await QuickReplyCategory.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getQuickReplyTemplateById = async (id) => {
  try {
    const quickReplyTemplate = await QuickReplyTemplate.findById(id).populate(
      "category"
    );
    if (!quickReplyTemplate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No quickReplyTemplate found");
    }
    return quickReplyTemplate;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateQuickReplyTemplateById = async (id, updateBody) => {
  try {
    const quickReplyTemplate = await QuickReplyTemplate.findById(id);
    if (!quickReplyTemplate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No quickReplyTemplate found");
    }
    let queryPromise = [
      QuickReplyTemplate.findOne({
        $and: [
          { category: updateBody.category },
          { title: updateBody.title },
          { _id: { $ne: id } },
        ],
      }),
      QuickReplyTemplate.findOne({
        $and: [
          { category: updateBody.category },
          { reply: updateBody.reply },
          { _id: { $ne: id } },
        ],
      }),
    ];
    let [categoryAndTitleExist, categoryAndReplyExist] = await Promise.all(
      queryPromise
    );
    if (categoryAndTitleExist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Title with selected category already exist"
      );
    }
    if (categoryAndReplyExist) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Reply with selected category already exist"
      );
    }
    await QuickReplyCategory.findByIdAndUpdate(updateBody.category, {
      $set: { status: "hard" },
    });
    let quickCategory = await QuickReplyTemplate.find({
      category: quickReplyTemplate.category,
    });
    if (
      updateBody?.category.toString() != quickReplyTemplate.category.toString()
    ) {
      if (quickCategory.length <= 1) {
        await QuickReplyCategory.findByIdAndUpdate(
          quickReplyTemplate.category,
          {
            $set: { status: "soft" },
          }
        );
      }
    }
    // Object.assign(quickReplyTemplate, updateBody);
    // await quickReplyTemplate.save();
    await QuickReplyTemplate.findByIdAndUpdate(
      id,
      { $set: updateBody },
      { new: true }
    );
    return quickReplyTemplate;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteQuickReplyTemplateById = async (id) => {
  try {
    const quickReplyTemplate = await QuickReplyTemplate.findByIdAndRemove(id);
    if (!quickReplyTemplate) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No quickReplyTemplate found");
    }
    const templatesWithSameCategory = await QuickReplyTemplate.find({
      category: quickReplyTemplate.category,
    });
    if (templatesWithSameCategory.length === 0) {
      await QuickReplyCategory.findByIdAndRemove(quickReplyTemplate.category);
    }
    return "Delete successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateTemplatePosition = async (updateBody) => {
  try {
    if (!updateBody || updateBody.length === 0) {
      return "No updates provided";
    }

    const bulkUpdateOperations = updateBody.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { $set: { position: item.position } },
      },
    }));

    await QuickReplyTemplate.bulkWrite(bulkUpdateOperations);

    return "UPDATED SUCCESSFULLY";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

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
