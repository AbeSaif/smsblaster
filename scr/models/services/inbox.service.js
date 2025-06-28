const httpStatus = require("http-status");
const { Inbox, CsvData, Integration } = require("../models");
const ApiError = require("../utils/ApiError");
const axios = require("axios");

/**
 * inbox
 * @param {Object} inboxBody
 * @returns {Promise<Inbox>}
 */

const getInboxList = async (filter, options) => {
  try {
    return await Inbox.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getInboxDetail = async (filter, options) => {
  try {
    return await Inbox.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

async function removeDuplicates(array) {
  const uniquePhones = new Set();
  const uniqueArray = array.filter((item) => {
    const phoneCombination = [item.phone1, item.phone2, item.phone3].join(",");
    if (!uniquePhones.has(phoneCombination)) {
      uniquePhones.add(phoneCombination);
      return true;
    }
    return false;
  });

  return uniqueArray;
}

const exportProspects = async (filter, NoResponse) => {
  try {
    let inboxResult = await Inbox.find(filter)
      .select(
        "to phone2 phone3 campagin messages messagesPhone2 messagesPhone3 tagDateArray status isPushedToCrm batch lastMessageSendDate isVerifiedNumber isVerifiedNumberPhone2 isVerifiedNumberPhone3 -_id"
      )
      .populate("campagin", { name: 1, _id: 0 })
      .populate("tagDateArray.tag", { name: 1, _id: 0 })
      .populate("status", { name: 1, _id: 0 })
      .lean();
    if (NoResponse === true) {
      inboxResult = inboxResult?.filter((inbox) => {
        const hasSingleMessage =
          inbox.messages &&
          inbox.messages.length <= 1 &&
          inbox.isVerifiedNumber === false;
        const hasSingleMessagePhone2 =
          inbox.messagesPhone2 &&
          inbox.messagesPhone2.length <= 1 &&
          inbox.isVerifiedNumberPhone2 === false;
        const hasSingleMessagePhone3 =
          inbox.messagesPhone3 &&
          inbox.messagesPhone3.length <= 1 &&
          inbox.isVerifiedNumberPhone3 === false;
        return (
          hasSingleMessage && hasSingleMessagePhone2 && hasSingleMessagePhone3
        );
      });
    }
    const csvFilter = {
      $or: [
        {
          phone1: {
            $in: inboxResult
              .map((item) => item.to)
              .filter((value) => value !== ""),
          },
        },
        {
          phone2: {
            $in: inboxResult
              .map((item) => item.phone2)
              .filter((value) => value !== ""),
          },
        },
        {
          phone3: {
            $in: inboxResult
              .map((item) => item.phone3)
              .filter((value) => value !== ""),
          },
        },
      ],
    };

    let csvResult = await CsvData.find(csvFilter).select("-status").lean();

    // Create a map of inbox items based on a unique identifier (assuming batchId is unique)
    let inboxMap = new Map();
    inboxResult.forEach((item) => {
      if (!inboxMap.has(item.to)) {
        inboxMap.set(item.to, {
          campagin: item?.campagin?.name,
          status: item?.status?.name,
          isPushedToCrm: item?.isPushedToCrm,
          batchId: item?.batch,
          lastMessageSendDate: item?.lastMessageSendDate,
          tags: item?.tagDateArray,
          isVerifiedNumberPhone1: item?.isVerifiedNumber,
          isVerifiedNumberPhone2: item?.isVerifiedNumberPhone2,
          isVerifiedNumberPhone3: item?.isVerifiedNumberPhone3,
        });
      }
    });

    let mergedResult = csvResult.map((csvItem) => {
      const inboxItem = inboxMap.get(csvItem.phone1);

      if (inboxItem) {
        csvItem.campagin = inboxItem.campagin;
        csvItem.status = inboxItem.status;
        csvItem.isPushedToCrm = inboxItem.isPushedToCrm;
        csvItem.batchId = inboxItem.batchId;
        csvItem.lastMessageSendDate = inboxItem.lastMessageSendDate;
        csvItem.tags = inboxItem.tags;
        csvItem.isVerifiedNumberPhone1 = inboxItem.isVerifiedNumberPhone1;
        csvItem.isVerifiedNumberPhone2 = inboxItem.isVerifiedNumberPhone2;
        csvItem.isVerifiedNumberPhone3 = inboxItem.isVerifiedNumberPhone3;
      }

      return csvItem;
    });

    let uniqueInboxResult = await removeDuplicatesByTo(mergedResult);
    return uniqueInboxResult;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

async function removeDuplicatesByTo(array) {
  const seen = new Set();
  return array.filter((item) => {
    const duplicate = seen.has(item.phone1);
    seen.add(item.phone1);
    return !duplicate;
  });
}
const connectCrm = async (body) => {
  try {
    let result = await Integration.find({});
    let integrationResult;
    if (result?.length > 0) {
      integrationResult = await Integration.findByIdAndUpdate(result[0]?._id, {
        $set: body,
      });
    } else {
      integrationResult = await Integration.create(body);
    }
    return integrationResult;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateCrm = async (body) => {
  try {
    let result = await Integration.findByIdAndUpdate(
      body?.integratedObjectId,
      {
        $set: { link: body?.link },
      },
      { new: true }
    );
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No integration found");
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getIntegratedCrm = async () => {
  try {
    let result = await Integration.find({});
    let finalResult;
    if (result?.length > 0) {
      finalResult = result[0];
    } else {
      finalResult = {};
    }
    return finalResult;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const verifyCrm = async (valueLink) => {
  let linkExist = await Integration.findOne({ link: valueLink });
  if (linkExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Link already exist");
  }
  if (!valueLink) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Link required");
  }

  try {
    new URL(valueLink);
  } catch (_) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid URL");
  }
  try {
    let result = await axios.get(valueLink);
    if (result.status === 200) {
      return "OK";
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, "Link is not valid");
    }
  } catch (error) {
    if (error.response) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Error: ${error.response.status} ${error.response.statusText}`
      );
    } else if (error.request) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `No response received from the server`
      );
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Error in setting up the request`
      );
    }
  }
};

const changeCrmStatus = async (body) => {
  try {
    let result = await Integration.findByIdAndUpdate(
      body?.integratedObjectId,
      {
        $set: { isCrmActive: body?.isCrmActive },
      },
      { new: true }
    );
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No integration found");
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  getInboxList,
  getInboxDetail,
  exportProspects,
  connectCrm,
  updateCrm,
  getIntegratedCrm,
  verifyCrm,
  changeCrmStatus,
};
