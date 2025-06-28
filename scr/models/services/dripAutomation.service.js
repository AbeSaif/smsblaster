const httpStatus = require("http-status");
const {
  DripAutomation,
  Inbox,
  Activity,
  Status,
  Market,
  Compaign,
  InboxDripAutomation,
} = require("../models");
const ApiError = require("../utils/ApiError");
const moment = require("moment-timezone");

/**
 * Create a user
 * @param {Object} body
 * @returns {Promise<DripAutomation>}
 */
const createDripAutomation = async (body) => {
  try {
    return await DripAutomation.create(body);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllDripAutomation = async (filter, options) => {
  try {
    return await DripAutomation.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateDripAutomation = async (dripAutomationId, body) => {
  try {
    let inboxes = await Inbox.find({ dripAutomation: dripAutomationId });

    if (inboxes?.length > 0) {
      const inboxIds = inboxes.map((inbox) => inbox._id);
      const inboxDripAutomation = await InboxDripAutomation.find({
        inboxId: { $in: inboxIds },
      });

      const sentMessageIds = new Set();
      const filteredDripAutomation = [];

      inboxDripAutomation.forEach((inbox) => {
        if (inbox.isMessageSend) {
          sentMessageIds.add(inbox.dripContentId);
        } else {
          filteredDripAutomation.push(inbox);
        }
      });

      const filteredMessages = body.messages.filter(
        (message) => !sentMessageIds.has(message.id)
      );

      if (filteredMessages.length > 0) {
        const updatePromises = filteredMessages.map((message) => {
          const dripAutomation = filteredDripAutomation.find(
            (drip) => drip.dripContentId === message.id
          );

          if (dripAutomation) {
            const messageDate = moment(dripAutomation.dripAutomationDate)
              .clone()
              .add(message.day, "days")
              .format("YYYY-MM-DD HH:mm:ss");

            return InboxDripAutomation.findOneAndUpdate(
              { _id: dripAutomation._id },
              {
                $set: {
                  dripName: body?.name,
                  content: message.content,
                  day: message.day,
                  date: messageDate,
                },
              },
              { new: true }
            );
          }
        });

        await Promise.all(updatePromises);
      }
    }

    let result = await DripAutomation.findByIdAndUpdate(
      dripAutomationId,
      {
        $set: body,
      },
      { new: true }
    );
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No drip found");
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteDripAutomation = async (dripAutomationId) => {
  try {
    let result = await DripAutomation.findByIdAndRemove(dripAutomationId);
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No drip found");
    }
    let inboxes = await Inbox.find({ dripAutomation: dripAutomationId });
    const status = await Status.findOne({ name: "No Status" });
    if (!status) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No status found");
    }

    if (inboxes?.length > 0) {
      const inboxIds = inboxes?.map((inbox) => inbox._id);

      // Fetch all inboxes in a single query
      let inboxesToUpdate = await Inbox.find({ _id: { $in: inboxIds } });
      if (inboxesToUpdate.length > 0) {
        // Update inboxes in memory
        inboxesToUpdate = inboxesToUpdate.map((inbox) => {
          inbox.status = status._id;
          inbox.dripAutomation = undefined;
          inbox.dripAutomationSchedule = [];
          return inbox;
        });
        let inboxDripAutomationQuery = [
          Inbox.bulkWrite(
            inboxesToUpdate.map((inbox) => ({
              updateOne: {
                filter: { _id: inbox._id },
                update: {
                  $set: {
                    status: inbox.status,
                    dripAutomation: inbox.dripAutomation,
                    dripAutomationSchedule: inbox.dripAutomationSchedule,
                  },
                },
              },
            }))
          ),
          InboxDripAutomation.deleteMany({
            inboxId: { $in: inboxIds },
          }),
        ];
        await Promise.all(inboxDripAutomationQuery);
      }
    }

    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const assignDripAutomationToInbox = async (inboxId, body) => {
  try {
    const inbox = await Inbox.findById(inboxId).populate("tags campagin batch");
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    const market = await Market.findOne({ phone: inbox.from });
    if (!market) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No market found");
    }
    let dripAutomation = await DripAutomation.findById(body.dripAutomationId);
    if (!dripAutomation) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No drip found");
    }
    const status = await Status.findOne({ name: "Drip" });
    if (!status) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No status found");
    }
    inbox.dripAutomation = body.dripAutomationId;
    let currentDate = moment();

    const inboxDripAutomationData = dripAutomation?.messages?.map((message) => {
      const { day, content, _id } = message;
      const messageDate = currentDate
        .clone()
        .add(message.day, "days")
        .format("YYYY-MM-DD HH:mm:ss");

      return {
        dripName: dripAutomation?.name,
        dripId: dripAutomation?._id,
        inboxId: inbox?._id,
        dripAutomationDate: currentDate,
        dripTimeZone: market?.timeZone,
        date: messageDate,
        content,
        day,
        dripContentId: _id,
      };
    });
    inbox.dripAutomationDate = currentDate;
    inbox.status = status._id;
    inbox.statusDate = new Date();
    inbox.dripTimeZone = market?.timeZone;
    let inboxDripPromise = [
      InboxDripAutomation.insertMany(inboxDripAutomationData),
      inbox.save(),
    ];
    await Promise.all(inboxDripPromise);
    let dripAdded = dripAutomation.name;
    let activity = "Added to" + " " + dripAdded + " " + "Drip Automation";
    let queryPromise = [
      Inbox.findById(inboxId).populate("tags campagin batch dripAutomation"),
      Activity.create({
        name: activity,
        inbox: inboxId,
        type: `addStatus${status.name}`,
      }),
    ];
    let [newInbox] = await Promise.all(queryPromise);
    return newInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const unAssignDripAutomationToInbox = async (inboxId) => {
  try {
    const inbox = await Inbox.findById(inboxId).populate("tags campagin batch");
    if (!inbox) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No inbox found");
    }
    const status = await Status.findOne({ name: "No Status" });
    if (!status) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No status found");
    }
    inbox.dripAutomation = undefined;
    inbox.dripAutomationSchedule = [];
    inbox.status = status._id;
    let newInbox = await inbox.save();
    let activity = "Status was changed to No Status";
    if (newInbox) {
      let queryPromise = [
        InboxDripAutomation.deleteMany({
          inboxId: inboxId,
        }),
        Activity.create({
          name: activity,
          inbox: inboxId,
          type: `addStatusNo Status`,
        }),
      ];
      await Promise.all(queryPromise);
    }
    return newInbox;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getSingleDripAutomation = async (dripAutomationId) => {
  try {
    let result = await DripAutomation.findById(dripAutomationId);
    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No drip found");
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateSingleMessage = async (messageId, body) => {
  try {
    let result = await DripAutomation.findOneAndUpdate(
      { _id: body.dripAutomationId, "messages._id": messageId },
      { $set: { "messages.$.content": body.content } },
      { new: true }
    );

    if (!result) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No drip found");
    }
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const dripFilterForSpecificInbox = async (inboxId) => {
  try {
    return await InboxDripAutomation.find({ inboxId: inboxId }).sort({
      date: 1,
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createDripAutomation,
  getAllDripAutomation,
  updateDripAutomation,
  deleteDripAutomation,
  assignDripAutomationToInbox,
  unAssignDripAutomationToInbox,
  getSingleDripAutomation,
  updateSingleMessage,
  dripFilterForSpecificInbox,
};
