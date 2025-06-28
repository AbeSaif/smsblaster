const httpStatus = require("http-status");
const { InitialAndFollowTemplate } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Create a InitialAndFollowTemplate
 * @param {Object} InitialAndFollowTemplateBody
 * @returns {Promise<Compaign>}
 */
const createInitialAndFollowTemplate = async (InitialAndFollowTemplateBody) => {
  try {
    return await InitialAndFollowTemplate.create(InitialAndFollowTemplateBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllInitialAndFollowTemplate = async (filter, options) => {
  try {
    return await InitialAndFollowTemplate.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllInitialAndFollowTemplateForDropDown = async (filter, options) => {
  try {
    return await InitialAndFollowTemplate.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
const getInitialAndFollowTemplateById = async (id) => {
  try {
    const template = await InitialAndFollowTemplate.findById(id);
    if (!template) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
    }
    return template;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateInitialAndFollowTemplateById = async (id, updateBody) => {
  try {
    const template = await InitialAndFollowTemplate.findById(id);
    if (!template) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
    }
    Object.assign(template, updateBody);
    await template.save();
    return template;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteInitialAndFollowTemplateById = async (id) => {
  try {
    const template = await InitialAndFollowTemplate.findByIdAndRemove(id);
    if (!template) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No template found");
    }
    return "Delete successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getTemplateWithCount = async (mode) => {
  try {
    const countWithType = await InitialAndFollowTemplate.aggregate([
      {
        $match: { mode: mode },
      },
      {
        $group: {
          _id: "$type", // Group by the 'type' field
          totalCount: { $sum: 1 }, // Count the documents in each group
        },
      },
    ]);

    const totalCount = await InitialAndFollowTemplate.countDocuments({
      mode: mode,
    });
    let finalResult = { countWithType, totalCount };
    return finalResult;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
module.exports = {
  createInitialAndFollowTemplate,
  getAllInitialAndFollowTemplate,
  updateInitialAndFollowTemplateById,
  deleteInitialAndFollowTemplateById,
  getTemplateWithCount,
  getInitialAndFollowTemplateById,
  getAllInitialAndFollowTemplateForDropDown,
};
