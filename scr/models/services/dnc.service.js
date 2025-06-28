const httpStatus = require("http-status");
const { DNC, Inbox, CsvData } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Create a dnc
 * @param {Object} body
 * @returns {Promise<DNC>}
 */
const createDNC = async (body) => {
  try {
    let result = await DNC.create(body);
    let csvResult = await CsvData.findOne({
      $or: [
        { phone1: body?.number },
        { phone2: body?.number },
        { phone3: body?.number },
      ],
    });
    if (csvResult && csvResult?.phone1 === body?.number) {
      csvResult.dncPhone1 = true;
      await csvResult.save();
    } else if (csvResult && csvResult?.phone2 === body?.number) {
      csvResult.dncPhone2 = true;
      await csvResult.save();
    } else if (csvResult && csvResult?.phone3 === body?.number) {
      csvResult.dncPhone3 = true;
      await csvResult.save();
    }
    let inboxResult = await Inbox.findOne({
      $or: [
        { to: body?.number },
        { phone2: body?.number },
        { phone3: body?.number },
      ],
    });
    if (inboxResult) {
      if (inboxResult.to === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNC: true },
          },
          { new: true }
        );
      } else if (inboxResult.phone2 === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNCPhone2: true },
          },
          { new: true }
        );
      } else if (inboxResult.phone3 === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNCPhone3: true },
          },
          { new: true }
        );
      }
    }
    let updatedInbox = await Inbox.findOne({
      $or: [
        { to: body?.number },
        { phone2: body?.number },
        { phone3: body?.number },
      ],
    });
    let messageHasIncomingMessage;
    let messagePhone2HasIncomingMessage;
    let messagePhone3HasIncomingMessage;
    if (
      updatedInbox?.messages?.length > 0 ||
      updatedInbox?.messagesPhone2?.length > 0 ||
      updatedInbox?.messagesPhone3?.length > 0
    ) {
      messageHasIncomingMessage = updatedInbox.messages.filter(
        (item) => item.isIncoming
      );
      messagePhone2HasIncomingMessage = updatedInbox.messagesPhone2.filter(
        (item) => item.isIncoming
      );
      messagePhone3HasIncomingMessage = updatedInbox.messagesPhone3.filter(
        (item) => item.isIncoming
      );
    }
    if (
      updatedInbox?.messages?.length > 0 &&
      updatedInbox?.messagesPhone2?.length > 0 &&
      updatedInbox?.messagesPhone3?.length > 0
    ) {
      if (
        updatedInbox.isAddedToDNC === true &&
        updatedInbox.isAddedToDNCPhone2 === true &&
        updatedInbox.isAddedToDNCPhone3 === true
      ) {
        updatedInbox.status = "65ba97b6ae9753518b56d3d4";
        await updatedInbox.save({ timestamps: false });
      } else if (
        (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
          updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
          updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
          updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
          messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length <= 0)
      ) {
        if (
          (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
            updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
            updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
            updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
            updatedInbox.isAddedToDNC === true) ||
          updatedInbox.isAddedToDNCPhone2 === true ||
          updatedInbox.isAddedToDNCPhone3 === true
        ) {
          updatedInbox.status = "65ba97b6ae9753518b56d3d4";
          await updatedInbox.save({ timestamps: false });
        }
      }
    } else if (
      updatedInbox?.messages?.length > 0 &&
      updatedInbox?.messagesPhone2?.length > 0
    ) {
      if (
        updatedInbox.isAddedToDNC === true &&
        updatedInbox.isAddedToDNCPhone2 === true
      ) {
        updatedInbox.status = "65ba97b6ae9753518b56d3d4";
        await updatedInbox.save({ timestamps: false });
      } else if (
        (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
          updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
          updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
          updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
          messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length > 0)
      ) {
        if (
          (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
            updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
            updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
            updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
            // updatedInbox.isVerifiedNumber !== true &&
            // updatedInbox.isVerifiedNumberPhone2 !== true &&
            updatedInbox.isAddedToDNC === true) ||
          updatedInbox.isAddedToDNCPhone2 === true
        ) {
          updatedInbox.status = "65ba97b6ae9753518b56d3d4";
          await updatedInbox.save({ timestamps: false });
        }
      }
    } else {
      if (updatedInbox?.isAddedToDNC === true) {
        updatedInbox.status = "65ba97b6ae9753518b56d3d4";
        await updatedInbox.save({ timestamps: false });
      } else if (
        messageHasIncomingMessage?.length > 0 &&
        updatedInbox?.status?.toString() !== "651ebe648042b1b3f4674ea2" &&
        updatedInbox?.status?.toString() !== "651ebe5b8042b1b3f4674ea0" &&
        updatedInbox?.status?.toString() !== "651ebe268042b1b3f4674e9b" &&
        updatedInbox?.status?.toString() !== "651ebe4e8042b1b3f4674e9d"
      ) {
        if (
          updatedInbox?.status?.toString() !== "651ebe648042b1b3f4674ea2" &&
          updatedInbox?.status?.toString() !== "651ebe5b8042b1b3f4674ea0" &&
          updatedInbox?.status?.toString() !== "651ebe268042b1b3f4674e9b" &&
          updatedInbox?.status?.toString() !== "651ebe4e8042b1b3f4674e9d" &&
          updatedInbox?.isAddedToDNC === true
        ) {
          updatedInbox.status = "65ba97b6ae9753518b56d3d4";
          await updatedInbox.save({ timestamps: false });
        }
      }
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllDNC = async (filter, options) => {
  try {
    return await DNC.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateDNC = async (dncId, body) => {
  try {
    let oldDnc = await DNC.findById(dncId);
    let result = await DNC.findByIdAndUpdate(
      dncId,
      {
        $set: body,
      },
      { new: true }
    );
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No dnc found");
    }
    let oldQueryPromise = [
      Inbox.findOne({
        $or: [
          { to: oldDnc.number },
          { phone2: oldDnc.number },
          { phone3: oldDnc.number },
        ],
      }),
      CsvData.findOne({
        $or: [
          { phone1: oldDnc.number },
          { phone2: oldDnc.number },
          { phone3: oldDnc.number },
        ],
      }),
    ];
    let [oldInboxResult, csvResult] = await Promise.all(oldQueryPromise);
    if (oldInboxResult) {
      if (oldInboxResult.to === oldDnc.number) {
        await Inbox.findByIdAndUpdate(
          oldInboxResult._id,
          {
            $set: { isAddedToDNC: false },
          },
          { new: true }
        );
      } else if (oldInboxResult.phone2 === oldDnc.number) {
        await Inbox.findByIdAndUpdate(
          oldInboxResult._id,
          {
            $set: { isAddedToDNCPhone2: false },
          },
          { new: true }
        );
      } else if (oldInboxResult.phone3 === oldDnc.number) {
        await Inbox.findByIdAndUpdate(
          oldInboxResult._id,
          {
            $set: { isAddedToDNCPhone3: false },
          },
          { new: true }
        );
      }
    }
    if (csvResult && csvResult?.phone1 === oldDnc?.number) {
      csvResult.dncPhone1 = false;
      await csvResult.save();
    } else if (csvResult && csvResult?.phone2 === oldDnc?.number) {
      csvResult.dncPhone2 = false;
      await csvResult.save();
    } else if (csvResult && csvResult?.phone3 === oldDnc?.number) {
      csvResult.dncPhone3 = false;
      await csvResult.save();
    }
    let newQueryPromie = [
      Inbox.findOne({
        $or: [
          { to: result.number },
          { phone2: result.number },
          { phone3: result.number },
        ],
      }),
      CsvData.findOne({
        $or: [
          { phone1: result?.number },
          { phone2: result?.number },
          { phone3: result?.number },
        ],
      }),
    ];
    let [inboxResult, newCsvResult] = await Promise.all(newQueryPromie);
    if (inboxResult) {
      if (inboxResult.to === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNC: true },
          },
          { new: true }
        );
      } else if (inboxResult.phone2 === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNCPhone2: true },
          },
          { new: true }
        );
      } else if (inboxResult.phone3 === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNCPhone3: true },
          },
          { new: true }
        );
      }
    }
    if (newCsvResult && newCsvResult?.phone1 === result?.number) {
      newCsvResult.dncPhone1 = true;
      await newCsvResult.save();
    } else if (newCsvResult && newCsvResult?.phone2 === result?.number) {
      newCsvResult.dncPhone2 = true;
      await newCsvResult.save();
    } else if (newCsvResult && newCsvResult?.phone3 === result?.number) {
      newCsvResult.dncPhone3 = true;
      await newCsvResult.save();
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteDNC = async (dncId) => {
  try {
    let result = await DNC.findById(dncId);
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No dnc found");
    }
    if (result.permanent) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Dnc added permanetly can't be delete"
      );
    }
    let inboxResult = await Inbox.findOne({
      $or: [
        { to: result.number },
        { phone2: result.number },
        { phone3: result.number },
      ],
    });
    if (inboxResult) {
      if (inboxResult.to === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNC: false },
          },
          { new: true }
        );
      } else if (inboxResult.phone2 === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNCPhone2: false },
          },
          { new: true }
        );
      } else if (inboxResult.phone3 === result.number) {
        await Inbox.findByIdAndUpdate(
          inboxResult._id,
          {
            $set: { isAddedToDNCPhone3: false },
          },
          { new: true }
        );
      }
      let updatedInbox = await Inbox.findById(inboxResult._id);
      let messageHasIncomingMessage = updatedInbox.messages.filter(
        (item) => item.isIncoming
      );
      let messagePhone2HasIncomingMessage = updatedInbox.messagesPhone2.filter(
        (item) => item.isIncoming
      );
      let messagePhone3HasIncomingMessage = updatedInbox.messagesPhone3.filter(
        (item) => item.isIncoming
      );
      if (
        (updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
          updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
          updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
          updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
          messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length <= 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length <= 0 &&
          messagePhone3HasIncomingMessage.length > 0) ||
        (messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length <= 0) ||
        (messageHasIncomingMessage.length > 0 &&
          messagePhone2HasIncomingMessage.length > 0 &&
          messagePhone3HasIncomingMessage.length > 0)
      ) {
        if (
          updatedInbox.status.toString() !== "651ebe648042b1b3f4674ea2" &&
          updatedInbox.status.toString() !== "651ebe5b8042b1b3f4674ea0" &&
          updatedInbox.status.toString() !== "651ebe268042b1b3f4674e9b" &&
          updatedInbox.status.toString() !== "651ebe4e8042b1b3f4674e9d" &&
          (updatedInbox.isAddedToDNC === false ||
            updatedInbox.isAddedToDNCPhone2 === false ||
            updatedInbox.isAddedToDNCPhone3 === false)
        ) {
          updatedInbox.status = "651ebe828042b1b3f4674ea8";
          await updatedInbox.save();
        }
      }
    }
    let csvResult = await CsvData.findOne({
      $or: [
        { phone1: result?.number },
        { phone2: result?.number },
        { phone3: result?.number },
      ],
    });
    if (csvResult && csvResult?.phone1 === result?.number) {
      csvResult.dncPhone1 = false;
      await csvResult.save();
    } else if (csvResult && csvResult?.phone2 === result?.number) {
      csvResult.dncPhone2 = false;
      await csvResult.save();
    } else if (csvResult && csvResult?.phone3 === result?.number) {
      csvResult.dncPhone3 = false;
      await csvResult.save();
    }
    return await DNC.findByIdAndRemove(dncId);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getDNCById = async (dncId) => {
  try {
    let result = await DNC.findById(dncId);
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No dnc found");
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  createDNC,
  getAllDNC,
  updateDNC,
  deleteDNC,
  getDNCById,
};
