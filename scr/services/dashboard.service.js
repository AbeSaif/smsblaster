const httpStatus = require("http-status");
const {
  Inbox,
  Batch,
  Reminder,
  Flag,
  CsvData,
  InboxDripAutomation,
  DashStats,
} = require("../models");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const moment = require("moment-timezone");

/**
 * Create
 * @param {Object}
 * @returns {Promise<User>}
 */

const getTotalLeadsBreakDown = async (filter, totalFilter) => {
  try {
    const totalRecords = await Inbox.countDocuments(totalFilter);
    const result = await Inbox.aggregate([
      { $match: filter },
      { $group: { _id: "$status", value: { $sum: 1 } } },
      {
        $lookup: {
          from: "status",
          localField: "_id",
          foreignField: "_id",
          as: "status",
        },
      },
      {
        $match: {
          "status.name": {
            $nin: ["Wrong Number", "Not Interested"],
          },
        },
      },
      { $project: { _id: 0, value: 1, status: "$status.name" } },
    ]);
    let finalResult = { totalRecords, result };
    return finalResult;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getTopThreeCampaigns = async (filter) => {
  try {
    return await Inbox.aggregate([
      {
        $match: filter,
      },
      {
        $match: {
          status: {
            $in: [
              new mongoose.Types.ObjectId("651ebe268042b1b3f4674e9b"),
              new mongoose.Types.ObjectId("651ebe4e8042b1b3f4674e9d"),
              new mongoose.Types.ObjectId("651ebe5b8042b1b3f4674ea0"),
              new mongoose.Types.ObjectId("651ebe648042b1b3f4674ea2"),
            ],
          },
        },
      },
      {
        $group: {
          _id: { campagin: "$campagin", status: "$status" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.campagin",
          statuses: {
            $push: { status: "$_id.status", count: "$count" },
          },
          total: { $sum: "$count" },
        },
      },
      {
        $lookup: {
          from: "compaigns",
          localField: "_id",
          foreignField: "_id",
          as: "campaignDetails",
        },
      },
      {
        $unwind: "$statuses",
      },
      {
        $lookup: {
          from: "status",
          localField: "statuses.status",
          foreignField: "_id",
          as: "statusDetails",
        },
      },
      {
        $group: {
          _id: "$_id",
          campaignDetails: { $first: "$campaignDetails" },
          statuses: {
            $push: {
              status: { $arrayElemAt: ["$statusDetails.name", 0] },
              count: "$statuses.count",
            },
          },
          total: { $first: "$total" },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 3,
      },
      {
        $project: {
          campaign: { $arrayElemAt: ["$campaignDetails.name", 0] },
          campaignId: { $arrayElemAt: ["$campaignDetails._id", 0] },
          statuses: 1,
          total: 1,
          _id: 0,
        },
      },
    ]);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCountOfMessages = async (startDate, endDate) => {
  try {
    return await Inbox.aggregate([
      {
        $match: {
          $or: [
            {
              "messages.creationDate": {
                $gte: startDate,
                $lt: endDate,
              },
            },
            {
              "messagesPhone2.creationDate": {
                $gte: startDate,
                $lt: endDate,
              },
            },
            {
              "messagesPhone3.creationDate": {
                $gte: startDate,
                $lt: endDate,
              },
            },
          ],
        },
      },
      {
        $project: {
          allMessages: {
            $concatArrays: ["$messages", "$messagesPhone2", "$messagesPhone3"],
          },
        },
      },
      {
        $unwind: "$allMessages",
      },
      {
        $match: {
          "allMessages.creationDate": {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          sent: {
            $sum: {
              $cond: [{ $eq: ["$allMessages.isIncoming", false] }, 1, 0],
            },
          },
          received: {
            $sum: {
              $cond: [{ $eq: ["$allMessages.isIncoming", true] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          sent: 1,
          received: 1,
        },
      },
    ]);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCountOfMessagesForWeek = async (startOfWeekPST, endOfWeekPST) => {
  try {
    return await Inbox.aggregate([
      {
        $match: {
          $or: [
            {
              "messages.creationDate": {
                $gte: startOfWeekPST,
                $lt: endOfWeekPST,
              },
            },
            {
              "messagesPhone2.creationDate": {
                $gte: startOfWeekPST,
                $lt: endOfWeekPST,
              },
            },
            {
              "messagesPhone3.creationDate": {
                $gte: startOfWeekPST,
                $lt: endOfWeekPST,
              },
            },
          ],
        },
      },
      {
        $project: {
          messages: {
            $filter: {
              input: "$messages",
              as: "msg",
              cond: {
                $and: [
                  { $gte: ["$$msg.creationDate", startOfWeekPST] },
                  { $lte: ["$$msg.creationDate", endOfWeekPST] },
                ],
              },
            },
          },
          messagesPhone2: {
            $filter: {
              input: "$messagesPhone2",
              as: "msg",
              cond: {
                $and: [
                  { $gte: ["$$msg.creationDate", startOfWeekPST] },
                  { $lte: ["$$msg.creationDate", endOfWeekPST] },
                ],
              },
            },
          },
          messagesPhone3: {
            $filter: {
              input: "$messagesPhone3",
              as: "msg",
              cond: {
                $and: [
                  { $gte: ["$$msg.creationDate", startOfWeekPST] },
                  { $lte: ["$$msg.creationDate", endOfWeekPST] },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          allMessages: {
            $setUnion: ["$messages", "$messagesPhone2", "$messagesPhone3"],
          },
        },
      },
      {
        $unwind: "$allMessages",
      },
      {
        $group: {
          _id: {
            $mod: [
              {
                $add: [
                  {
                    $dayOfWeek: {
                      $subtract: [
                        "$allMessages.creationDate",
                        8 * 60 * 60 * 1000,
                      ],
                    },
                  },
                  6,
                ],
              },
              7,
            ],
          },
          sent: {
            $sum: {
              $cond: [{ $eq: ["$allMessages.isIncoming", false] }, 1, 0],
            },
          },
          received: {
            $sum: {
              $cond: [{ $eq: ["$allMessages.isIncoming", true] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          sent: 1,
          received: 1,
          day: {
            $switch: {
              branches: [
                { case: { $eq: ["$_id", 0] }, then: "Sunday" },
                { case: { $eq: ["$_id", 1] }, then: "Monday" },
                { case: { $eq: ["$_id", 2] }, then: "Tuesday" },
                { case: { $eq: ["$_id", 3] }, then: "Wednesday" },
                { case: { $eq: ["$_id", 4] }, then: "Thursday" },
                { case: { $eq: ["$_id", 5] }, then: "Friday" },
                { case: { $eq: ["$_id", 6] }, then: "Saturday" },
              ],
              default: "Unknown",
            },
          },
        },
      },
    ]);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCountOfMessagesForMonth = async (startOfMonth, endOfMonth) => {
  try {
    return await Inbox.aggregate([
      {
        $match: {
          $or: [
            {
              "messages.creationDate": {
                $gte: startOfMonth,
                $lte: endOfMonth,
              },
            },
            {
              "messagesPhone2.creationDate": {
                $gte: startOfMonth,
                $lte: endOfMonth,
              },
            },
            {
              "messagesPhone3.creationDate": {
                $gte: startOfMonth,
                $lte: endOfMonth,
              },
            },
          ],
        },
      },
      {
        $project: {
          allMessages: {
            $setUnion: ["$messages", "$messagesPhone2", "$messagesPhone3"],
          },
        },
      },
      {
        $unwind: "$allMessages",
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $subtract: ["$allMessages.creationDate", 8 * 60 * 60 * 1000], // Adjusting for PST
              },
            },
          },
          sent: {
            $sum: {
              $cond: [{ $eq: ["$allMessages.isIncoming", false] }, 1, 0],
            },
          },
          received: {
            $sum: {
              $cond: [{ $eq: ["$allMessages.isIncoming", true] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field if you want
          sent: 1,
          received: 1,
          date: "$_id", // Use the date from the grouping key
        },
      },
    ]);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCountOfMessagesForCustomDateRange = async (startDate, endDate) => {
  try {
    return await Inbox.aggregate([
      {
        $project: {
          allMessages: {
            $setUnion: ["$messages", "$messagesPhone2", "$messagesPhone3"],
          },
        },
      },
      {
        $unwind: "$allMessages",
      },
      {
        $match: {
          "allMessages.creationDate": {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: {
                $subtract: ["$allMessages.creationDate", 8 * 60 * 60 * 1000], // Adjusting for PST
              },
            },
          },
          sent: {
            $sum: {
              $cond: [{ $eq: ["$allMessages.isIncoming", false] }, 1, 0],
            },
          },
          received: {
            $sum: {
              $cond: [{ $eq: ["$allMessages.isIncoming", true] }, 1, 0],
            },
          },
        },
      },
      {
        $sort: { _id: 1 }, // Sorting by date in ascending order
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          sent: 1,
          received: 1,
        },
      },
    ]);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

// const getCountOfTags = async (filter) => {
//   try {
//     return await Inbox.aggregate([
//       {
//         $match: filter,
//       },
//       {
//         $unwind: "$tags",
//       },
//       {
//         $lookup: {
//           from: "tags",
//           localField: "tags",
//           foreignField: "_id",
//           as: "tagDetails",
//         },
//       },
//       {
//         $unwind: "$tagDetails",
//       },
//       {
//         $group: {
//           _id: "$tagDetails.name",
//           color: { $addToSet: "$tagDetails.color" },
//           count: { $sum: 1 },
//         },
//       },
//     ]);
//   } catch (error) {
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
//   }
// };

const getCountOfTags = async (filter) => {
  try {
    return await Inbox.aggregate([
      {
        $match: filter,
      },
      {
        $unwind: "$tagDateArray",
      },
      {
        $match: filter,
      },
      {
        $group: {
          _id: {
            tag: "$tagDateArray.tag",
          },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "tags",
          localField: "_id.tag",
          foreignField: "_id",
          as: "tagDetails",
        },
      },
      {
        $unwind: "$tagDetails",
      },
      {
        $group: {
          _id: "$tagDetails.name",
          color: { $addToSet: "$tagDetails.color" },
          count: { $sum: "$count" },
        },
      },
    ]);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getCountOfMessagesInLastThirtyMinutes = async (
  filter,
  thirtyMinutesAgo
) => {
  try {
    return await Inbox.aggregate([
      {
        $match: filter,
      },
      {
        $project: {
          allMessages: {
            $concatArrays: ["$messages", "$messagesPhone2", "$messagesPhone3"],
          },
        },
      },
      {
        $unwind: "$allMessages",
      },
      {
        $match: {
          $or: [{ "allMessages.creationDate": { $gte: thirtyMinutesAgo } }],
        },
      },
      {
        $group: {
          _id: { $dayOfWeek: "$allMessages.creationDate" },
          sent: {
            $sum: {
              $cond: [
                {
                  $eq: ["$allMessages.isIncoming", false],
                },
                1,
                0,
              ],
            },
          },
          received: {
            $sum: {
              $cond: [
                {
                  $eq: ["$allMessages.isIncoming", true],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

// function formatTimeDifference(timeDifference) {
//   const seconds = Math.floor(timeDifference / 1000);
//   const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
//   const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
//   return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
// }

// function findMaxTimeDifferenceForMessages(
//   phoneMessage,
//   entry,
//   startOfDay,
//   endOfDay
// ) {
//   let messages;
//   messages = entry;
//   // if (phoneMessage === "message1") {
//   //   messages = entry.messages;
//   // } else if (phoneMessage === "message2") {
//   //   messages = entry.messagesPhone2;
//   // } else if (phoneMessage === "message3") {
//   //   messages = entry.messagesPhone3;
//   // }
//   const incomingMessages = messages.filter(
//     (message) =>
//       message.isIncoming &&
//       message.creationDate >= startOfDay &&
//       message.creationDate <= endOfDay
//   );
//   const outgoingMessages = messages.filter(
//     (message) =>
//       message.isOutgoing &&
//       message.creationDate >= startOfDay &&
//       message.creationDate <= endOfDay
//   );

//   let maxTimeDifference = 0;
//   console.log("i am running");
//   // incomingMessages.forEach((incomingMessage) => {
//   //   console.log("i am running outside");
//   //   outgoingMessages.forEach((outgoingMessage) => {
//   //     console.log("i am running inside");
//   //     if (outgoingMessage.creationDate > incomingMessage.creationDate) {
//   //       const timeDifference =
//   //         outgoingMessage.creationDate - incomingMessage.creationDate;
//   //       if (timeDifference > maxTimeDifference) {
//   //         maxTimeDifference = timeDifference;
//   //       }
//   //     }
//   //   });
//   // });
//   for (let i = 0; i < incomingMessages.length; i++) {
//     const incomingMessage = incomingMessages[i];

//     for (let j = 0; j < outgoingMessages.length; j++) {
//       const outgoingMessage = outgoingMessages[j];

//       if (outgoingMessage.creationDate > incomingMessage.creationDate) {
//         const timeDifference =
//           outgoingMessage.creationDate - incomingMessage.creationDate;

//         if (timeDifference > maxTimeDifference) {
//           maxTimeDifference = timeDifference;
//         }

//         // Since we've found a valid pair, break out of the inner loop
//         break;
//       }
//     }
//   }

//   console.log("maxTimeDifference is", maxTimeDifference);
//   return formatTimeDifference(maxTimeDifference);
// }

// const getAverageReplyTime = async (startOfDay, endOfDay) => {
//   try {
//     let resultMessage1 = await Inbox.find({
//       $and: [
//         { "messages.isIncoming": true },
//         {
//           "messages.creationDate": {
//             $gte: startOfDay,
//             $lte: endOfDay,
//           },
//         },
//       ],
//     });
//     let resultMessage2 = await Inbox.find({
//       $and: [
//         { "messagesPhone2.isIncoming": true },
//         {
//           "messagesPhone2.creationDate": {
//             $gte: startOfDay,
//             $lte: endOfDay,
//           },
//         },
//       ],
//     });
//     let resultMessage3 = await Inbox.find({
//       $and: [
//         { "messagesPhone3.isIncoming": true },
//         {
//           "messagesPhone3.creationDate": {
//             $gte: startOfDay,
//             $lte: endOfDay,
//           },
//         },
//       ],
//     });
//     let totalHours = 0;
//     let totalMinutes = 0;
//     let totalSeconds = 0;
//     let message1Array = [];
//     if (resultMessage1.length > 0) {
//       resultMessage1.forEach((message1) => {
//         message1Array.push(message1?.messages);
//       });
//     }

//     const maxTimeDifference = findMaxTimeDifferenceForMessages(
//       "message1",
//       message1Array.flat(),
//       startOfDay,
//       endOfDay
//     );
//     const [hours, minutes, seconds] = maxTimeDifference
//       .split(", ")
//       .map((part) => parseInt(part.replace(/\D/g, ""), 10));
//     console.log("hours is", hours);
//     console.log("minutes is", minutes);
//     console.log("seconds is", seconds);
//     totalHours += hours;
//     totalMinutes += minutes;
//     totalSeconds += seconds;
//     // if (resultMessage2.length > 0) {
//     //   resultMessage2.forEach((entry) => {
//     //     const maxTimeDifference = findMaxTimeDifferenceForMessages(
//     //       "message2",
//     //       entry,
//     //       startOfDay,
//     //       endOfDay
//     //     );
//     //     const [hours, minutes, seconds] = maxTimeDifference
//     //       .split(", ")
//     //       .map((part) => parseInt(part.replace(/\D/g, ""), 10));
//     //     totalHours += hours;
//     //     totalMinutes += minutes;
//     //     totalSeconds += seconds;
//     //   });
//     // }
//     // if (resultMessage3.length > 0) {
//     //   resultMessage3.forEach((entry) => {
//     //     const maxTimeDifference = findMaxTimeDifferenceForMessages(
//     //       "message3",
//     //       entry,
//     //       startOfDay,
//     //       endOfDay
//     //     );
//     //     const [hours, minutes, seconds] = maxTimeDifference
//     //       .split(", ")
//     //       .map((part) => parseInt(part.replace(/\D/g, ""), 10));
//     //     totalHours += hours;
//     //     totalMinutes += minutes;
//     //     totalSeconds += seconds;
//     //   });
//     // }
//     totalMinutes += Math.floor(totalSeconds / 60);
//     totalSeconds %= 60;
//     totalHours += Math.floor(totalMinutes / 60);
//     totalMinutes %= 60;
//     console.log("totalSeconds is", totalSeconds);
//     console.log("totalMinutes is", totalMinutes);
//     console.log("totalHours is", totalHours);

//     if (isNaN(totalHours) || isNaN(totalMinutes) || isNaN(totalSeconds)) {
//       return `0 hours, 0 minutes, 0 seconds`;
//     } else {
//       return `${totalHours} hours, ${totalMinutes} minutes, ${totalSeconds} seconds`;
//     }
//   } catch (error) {
//     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
//   }
// };

function formatTimeDifference(timeDifference) {
  const seconds = Math.floor((timeDifference / 1000) % 60);
  const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
  const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
  return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
}

// Your existing functions remain the same

async function getResultMessages(phoneField, startOfDay, endOfDay) {
  const resultMessages = await Inbox.find({
    $and: [
      { [`${phoneField}.isIncoming`]: true },
      {
        [`${phoneField}.creationDate`]: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
      },
    ],
  });

  return resultMessages;
}

function getMessagesBetweenDates(messages, startDate, endDate) {
  return messages.filter((message) => {
    return message.creationDate >= startDate && message.creationDate <= endDate;
  });
}

const findAverageTimeDifferenceForMessages = async (
  messages,
  startDate,
  endDate
) => {
  let totalResponseTime = 0;
  let totalPairs = 0;
  messages = getMessagesBetweenDates(messages, startDate, endDate);

  let lastIncomingMessage;
  let foundOutgoingAfterIncoming = false;

  // Find the last incoming message
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];

    if (
      lastIncomingMessage &&
      (lastIncomingMessage.content === "Do not call".toLowerCase() ||
        lastIncomingMessage.content === "Stop".toLowerCase() ||
        lastIncomingMessage.content === "Wrong Number".toLowerCase())
    ) {
      // Skip processing the incoming message and its corresponding outgoing message
      lastIncomingMessage = undefined;
      foundOutgoingAfterIncoming = false;
      continue;
    }

    if (message?.isIncoming) {
      lastIncomingMessage = message;
      foundOutgoingAfterIncoming = false;
      break; // Stop iteration when last incoming message is found
    }
  }

  // Check if there are outgoing messages after the last incoming message
  if (lastIncomingMessage) {
    const index = messages.indexOf(lastIncomingMessage);
    if (index !== -1 && index < messages.length - 1) {
      const remainingMessages = messages.slice(index + 1);
      if (remainingMessages.some((message) => message.isOutgoing)) {
        foundOutgoingAfterIncoming = true;
      } else {
        lastIncomingMessage = undefined;
      }
    }
  }

  // Process messages from the last incoming message onwards
  for (
    let i = messages.indexOf(lastIncomingMessage);
    i < messages.length;
    i++
  ) {
    const message = messages[i];

    if (
      lastIncomingMessage &&
      (lastIncomingMessage.content === "Do not call".toLowerCase() ||
        lastIncomingMessage.content === "Stop".toLowerCase() ||
        lastIncomingMessage.content === "Wrong Number".toLowerCase())
    ) {
      // Skip processing the incoming message and its corresponding outgoing message
      lastIncomingMessage = undefined;
      foundOutgoingAfterIncoming = false;
      continue;
    }

    if (message?.isIncoming) {
      lastIncomingMessage = message;
      foundOutgoingAfterIncoming = false;
    } else if (
      message?.isOutgoing &&
      lastIncomingMessage &&
      !foundOutgoingAfterIncoming
    ) {
      const incomingTime = lastIncomingMessage.creationDate.getTime();
      const outgoingTime = message.creationDate.getTime();
      if (outgoingTime >= incomingTime) {
        const timeDifference = outgoingTime - incomingTime;
        totalResponseTime += timeDifference;
        totalPairs++;
        foundOutgoingAfterIncoming = true;
      } else {
        console.log("Warning: Outgoing message precedes incoming message.");
      }
    }
  }

  // const averageResponseTime =
  //   totalPairs > 0 ? totalResponseTime / totalPairs : 0;
  return { pairs: totalPairs, responseTime: totalResponseTime };
};

const getAverageReplyTime = async (startOfDay, endOfDay) => {
  try {
    const message1Array = await getResultMessages(
      "messages",
      startOfDay,
      endOfDay
    );

    const message2Array = await getResultMessages(
      "messagesPhone2",
      startOfDay,
      endOfDay
    );
    const message3Array = await getResultMessages(
      "messagesPhone3",
      startOfDay,
      endOfDay
    );

    let averageTimeForPhone1 = 0;
    let averageTimeForPhone2 = 0;
    let averageTimeForPhone3 = 0;

    if (message1Array.length > 0) {
      let totalPairsMain = 0;
      let totalResponsetimeMain = 0;
      for (const message of message1Array) {
        if (
          message &&
          message?.messages?.length > 0 &&
          !message.isWrongNumber &&
          !message.isAddedToDNC
        ) {
          let { pairs, responseTime } =
            await findAverageTimeDifferenceForMessages(
              message.messages,
              startOfDay,
              endOfDay
            );

          totalPairsMain = totalPairsMain + pairs;
          averageTimeForPhone1 = averageTimeForPhone1 + responseTime;
        }
      }
      averageTimeForPhone1 = averageTimeForPhone1 / totalPairsMain;
    }

    if (message2Array.length > 0) {
      let totalPairsMain = 0;
      for (const message of message2Array) {
        if (
          message &&
          message?.messagesPhone2?.length > 0 &&
          !message.isWrongNumberPhone2 &&
          !message.isAddedToDNCPhone2
        ) {
          let { pairs, responseTime } =
            await findAverageTimeDifferenceForMessages(
              message.messagesPhone2,
              startOfDay,
              endOfDay
            );

          totalPairsMain = totalPairsMain + pairs;
          averageTimeForPhone2 = averageTimeForPhone2 + responseTime;
        }
      }

      averageTimeForPhone2 = averageTimeForPhone2 / totalPairsMain;
    }

    if (message3Array.length > 0) {
      let totalPairsMain = 0;
      for (const message of message3Array) {
        if (
          message &&
          message?.messagesPhone3?.length > 0 &&
          !message.isWrongNumberPhone3 &&
          !message.isAddedToDNCPhone3
        ) {
          let { pairs, responseTime } =
            await findAverageTimeDifferenceForMessages(
              message.messagesPhone3,
              startOfDay,
              endOfDay
            );

          totalPairsMain = totalPairsMain + pairs;
          averageTimeForPhone3 = averageTimeForPhone3 + responseTime;
        }
      }
      averageTimeForPhone3 = averageTimeForPhone3 / totalPairsMain;
    }

    const totalCombinedTime =
      (averageTimeForPhone1 || 0) +
      (averageTimeForPhone2 || 0) +
      (averageTimeForPhone3 || 0);

    const combinedHours = Math.floor(totalCombinedTime / 3600000);
    const combinedMinutes = Math.floor((totalCombinedTime % 3600000) / 60000);
    const combinedSeconds = Math.floor((totalCombinedTime % 60000) / 1000);

    const formattedCombinedTime = formatAverageTimeDifference(
      combinedHours,
      combinedMinutes,
      combinedSeconds
    );
    return formattedCombinedTime;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

function formatAverageTimeDifference(hours, minutes) {
  return { hours: hours, minutes: minutes };
}

const reportOfSendAndQueMessages = async (filter, filter1) => {
  try {
    const result = await Batch.aggregate([
      {
        $match: filter,
      },
      {
        $project: {
          batchTotalProspects: 1,
          batchSendMessage: 1,
          messagesInQueue: {
            $subtract: ["$batchTotalProspects", "$batchSendMessage"],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMessagesSent: { $sum: "$batchSendMessage" },
          totalMessagesInQueue: { $sum: "$messagesInQueue" },
        },
      },
    ]);
    let result1 = await Batch.find(filter1).select("batchSendMessage");
    let totalProspectContacted = 0;
    // if (result1.length > 0) {
    //   result1.forEach((item) => {
    //     totalProspectContacted = totalProspectContacted + item.batchSendMessage;
    //   });
    // }
    if (result.length > 0) {
      result[0].totalMessagesSent =
        result[0].totalMessagesSent + totalProspectContacted;
      return result;
    } else {
      let resultArray = [];
      resultArray.push({ totalMessagesSent: totalProspectContacted });
      return resultArray;
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfBasicStats = async (
  userBatchIdArray,
  userId,
  checkReminderUserId
) => {
  try {
    if (userId) {
      let unReadfilter = {
        $and: [
          {
            isRead: false,
          },
          {
            status: {
              $in: [
                "651ebe268042b1b3f4674e9b",
                "651ebe4e8042b1b3f4674e9d",
                "651ebe5b8042b1b3f4674ea0",
                "651ebe648042b1b3f4674ea2",
                "651ebe828042b1b3f4674ea8",
              ],
            },
          },
          { batch: { $in: userBatchIdArray } },
        ],
      };
      let statusFilter = {
        $and: [
          // {
          //   $or: [
          //     { "messages.isIncoming": true },
          //     { "messagesPhone2.isIncoming": true },
          //     { "messagesPhone3.isIncoming": true },
          //   ],
          // },
          { isIncoming: true },
          {
            status: {
              $in: [new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8")],
            },
          },
          { batch: { $in: userBatchIdArray } },
        ],
      };
      // let unReadCount = await Inbox.countDocuments(unReadfilter);
      let queryFilter = {
        $and: [
          {
            $or: [
              {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messages.isOutgoing",
                            { $subtract: [{ $size: "$messages" }, 1] },
                          ],
                        },
                        false,
                      ],
                    },
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messages.isIncoming",
                            { $subtract: [{ $size: "$messages" }, 1] },
                          ],
                        },
                        true,
                      ],
                    },
                    {
                      $ne: ["$isAddedToDnc", true],
                    },
                  ],
                },
              },
              {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messagesPhone2.isOutgoing",
                            {
                              $subtract: [{ $size: "$messagesPhone2" }, 1],
                            },
                          ],
                        },
                        false,
                      ],
                    },
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messagesPhone2.isIncoming",
                            {
                              $subtract: [{ $size: "$messagesPhone2" }, 1],
                            },
                          ],
                        },
                        true,
                      ],
                    },
                    {
                      $ne: ["$isAddedToDNCPhone2", true],
                    },
                  ],
                },
              },
              {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messagesPhone3.isOutgoing",
                            {
                              $subtract: [{ $size: "$messagesPhone3" }, 1],
                            },
                          ],
                        },
                        false,
                      ],
                    },
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messagesPhone3.isIncoming",
                            {
                              $subtract: [{ $size: "$messagesPhone3" }, 1],
                            },
                          ],
                        },
                        true,
                      ],
                    },
                    {
                      $ne: ["$isAddedToDNCPhone3", true],
                    },
                  ],
                },
              },
            ],
          },
          {
            status: {
              $in: [
                new mongoose.Types.ObjectId("651ebe268042b1b3f4674e9b"),
                new mongoose.Types.ObjectId("651ebe4e8042b1b3f4674e9d"),
                new mongoose.Types.ObjectId("651ebe5b8042b1b3f4674ea0"),
                new mongoose.Types.ObjectId("651ebe648042b1b3f4674ea2"),
                new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8"),
              ],
            },
          },
          { batch: { $in: userBatchIdArray } },
        ],
      };
      // const unAnsweredCount = await Inbox.find(queryFilter).lean();
      // let statusCount = await Inbox.countDocuments(statusFilter);
      const promises = [
        Inbox.countDocuments(unReadfilter),
        Inbox.find(queryFilter).lean(),
        Inbox.countDocuments(statusFilter),
      ];
      const [unReadCount, unAnsweredCount, statusCount] = await Promise.all(
        promises
      );
      function filterMessages(messages, isIncomingFlag, isAddedToDNCFlag) {
        return messages.filter((message, index, array) => {
          const lastMessageIsIncoming =
            index === array.length - 1 &&
            message.isIncoming === isIncomingFlag &&
            isAddedToDNCFlag !== true;
          if (lastMessageIsIncoming) {
            return lastMessageIsIncoming;
          }
        });
      }
      const filteredResults = unAnsweredCount.map((item) => {
        item.messages = filterMessages(item.messages, true, item.isAddedToDNC);
        item.messagesPhone2 = filterMessages(
          item.messagesPhone2,
          true,
          item.isAddedToDNCPhone2
        );
        item.messagesPhone3 = filterMessages(
          item.messagesPhone3,
          true,
          item.isAddedToDNCPhone3
        );
        return item;
      });
      const finalResultsOfUnAnsweredCount = filteredResults.filter(
        (item) =>
          item.messages.length > 0 ||
          item.messagesPhone2.length > 0 ||
          item.messagesPhone3.length > 0
      );
      let reminderCount;
      if (checkReminderUserId) {
        reminderCount = await Reminder.countDocuments({ user: userId });
      } else {
        reminderCount = await Reminder.countDocuments({});
      }
      let finalResult = {
        unRead: unReadCount,
        unAnswered: finalResultsOfUnAnsweredCount.length,
        status: statusCount,
        reminder: reminderCount,
      };
      return finalResult;
    } else {
      let unReadfilter = {
        $and: [
          {
            $or: [
              {
                messages: { $elemMatch: { isViewed: false, isIncoming: true } },
              },
              {
                messagesPhone2: {
                  $elemMatch: { isViewed: false, isIncoming: true },
                },
              },
              {
                messagesPhone3: {
                  $elemMatch: { isViewed: false, isIncoming: true },
                },
              },
            ],
          },
          {
            status: {
              $in: [
                new mongoose.Types.ObjectId("651ebe268042b1b3f4674e9b"),
                new mongoose.Types.ObjectId("651ebe4e8042b1b3f4674e9d"),
                new mongoose.Types.ObjectId("651ebe5b8042b1b3f4674ea0"),
                new mongoose.Types.ObjectId("651ebe648042b1b3f4674ea2"),
                new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8"),
              ],
            },
          },
        ],
      };

      let statusFilter = {
        $and: [
          {
            $or: [
              { "messages.isIncoming": true },
              { "messagesPhone2.isIncoming": true },
              { "messagesPhone3.isIncoming": true },
            ],
          },
          {
            status: {
              $in: [new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8")],
            },
          },
        ],
      };
      // let unReadCount = await Inbox.countDocuments(unReadfilter);
      let queryFilter = {
        $and: [
          {
            $or: [
              {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messages.isOutgoing",
                            { $subtract: [{ $size: "$messages" }, 1] },
                          ],
                        },
                        false,
                      ],
                    },
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messages.isIncoming",
                            { $subtract: [{ $size: "$messages" }, 1] },
                          ],
                        },
                        true,
                      ],
                    },
                    {
                      $ne: ["$isAddedToDnc", true],
                    },
                  ],
                },
              },
              {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messagesPhone2.isOutgoing",
                            {
                              $subtract: [{ $size: "$messagesPhone2" }, 1],
                            },
                          ],
                        },
                        false,
                      ],
                    },
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messagesPhone2.isIncoming",
                            {
                              $subtract: [{ $size: "$messagesPhone2" }, 1],
                            },
                          ],
                        },
                        true,
                      ],
                    },
                    {
                      $ne: ["$isAddedToDNCPhone2", true],
                    },
                  ],
                },
              },
              {
                $expr: {
                  $and: [
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messagesPhone3.isOutgoing",
                            {
                              $subtract: [{ $size: "$messagesPhone3" }, 1],
                            },
                          ],
                        },
                        false,
                      ],
                    },
                    {
                      $eq: [
                        {
                          $arrayElemAt: [
                            "$messagesPhone3.isIncoming",
                            {
                              $subtract: [{ $size: "$messagesPhone3" }, 1],
                            },
                          ],
                        },
                        true,
                      ],
                    },
                    {
                      $ne: ["$isAddedToDNCPhone3", true],
                    },
                  ],
                },
              },
            ],
          },
          {
            status: {
              $in: [
                new mongoose.Types.ObjectId("651ebe268042b1b3f4674e9b"),
                new mongoose.Types.ObjectId("651ebe4e8042b1b3f4674e9d"),
                new mongoose.Types.ObjectId("651ebe5b8042b1b3f4674ea0"),
                new mongoose.Types.ObjectId("651ebe648042b1b3f4674ea2"),
                new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8"),
              ],
            },
          },
        ],
      };
      // const unAnsweredCount = await Inbox.find(queryFilter).lean();
      // let statusCount = await Inbox.countDocuments(statusFilter);
      const promises = [
        Inbox.countDocuments(unReadfilter),
        //Inbox.find(queryFilter).lean(),
        Inbox.countDocuments(queryFilter),
        Inbox.countDocuments(statusFilter),
      ];
      const [unReadCount, unAnsweredCount, statusCount] = await Promise.all(
        promises
      );

      // function filterMessages(messages, isIncomingFlag, isAddedToDNCFlag) {
      //   return messages.filter((message, index, array) => {
      //     const lastMessageIsIncoming =
      //       index === array.length - 1 &&
      //       message.isIncoming === isIncomingFlag &&
      //       isAddedToDNCFlag !== true;
      //     if (lastMessageIsIncoming) {
      //       return lastMessageIsIncoming;
      //     }
      //   });
      // }
      // const filteredResults = unAnsweredCount.map((item) => {
      //   item.messages = filterMessages(item.messages, true, item.isAddedToDNC);
      //   item.messagesPhone2 = filterMessages(
      //     item.messagesPhone2,
      //     true,
      //     item.isAddedToDNCPhone2
      //   );
      //   item.messagesPhone3 = filterMessages(
      //     item.messagesPhone3,
      //     true,
      //     item.isAddedToDNCPhone3
      //   );
      //   return item;
      // });
      // const finalResultsOfUnAnsweredCount = filteredResults.filter(
      //   (item) =>
      //     item.messages.length > 0 ||
      //     item.messagesPhone2.length > 0 ||
      //     item.messagesPhone3.length > 0
      // );
      let reminderCount;
      if (checkReminderUserId) {
        reminderCount = await Reminder.countDocuments({ user: userId });
      } else {
        reminderCount = await Reminder.countDocuments({});
      }
      let finalResult = {
        unRead: unReadCount,
        unAnswered: unAnsweredCount,
        status: statusCount,
        reminder: reminderCount,
      };
      return finalResult;
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfProspectLeads = async (filter, startDate, endDate) => {
  try {
    let queryForInboxState = [
      Inbox.aggregate([
        {
          $match: {
            "messages.type": "inbox",
            "messages.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $unwind: "$messages",
        },
        {
          $match: {
            "messages.type": "inbox",
            "messages.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            sent: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messages.isOutgoing", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
            received: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messages.isIncoming", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalMessages: 1,
            sent: 1,
            received: 1,
            sentPercentage: {
              $multiply: [{ $divide: ["$sent", "$totalMessages"] }, 100],
            },
            receivedPercentage: {
              $multiply: [{ $divide: ["$received", "$totalMessages"] }, 100],
            },
          },
        },
      ]),
      Inbox.aggregate([
        {
          $match: {
            "messagesPhone2.type": "inbox",
            "messagesPhone2.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $unwind: "$messagesPhone2",
        },
        {
          $match: {
            "messagesPhone2.type": "inbox",
            "messagesPhone2.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            sent: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messagesPhone2.isOutgoing", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
            received: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messagesPhone2.isIncoming", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalMessages: 1,
            sent: 1,
            received: 1,
            sentPercentage: {
              $multiply: [{ $divide: ["$sent", "$totalMessages"] }, 100],
            },
            receivedPercentage: {
              $multiply: [{ $divide: ["$received", "$totalMessages"] }, 100],
            },
          },
        },
      ]),
      Inbox.aggregate([
        {
          $match: {
            "messagesPhone3.type": "inbox",
            "messagesPhone3.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $unwind: "$messagesPhone3",
        },
        {
          $match: {
            "messagesPhone3.type": "inbox",
            "messagesPhone3.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalMessages: { $sum: 1 },
            sent: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messagesPhone3.isOutgoing", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
            received: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messagesPhone3.isIncoming", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalMessages: 1,
            sent: 1,
            received: 1,
            sentPercentage: {
              $multiply: [{ $divide: ["$sent", "$totalMessages"] }, 100],
            },
            receivedPercentage: {
              $multiply: [{ $divide: ["$received", "$totalMessages"] }, 100],
            },
          },
        },
      ]),
      Inbox.aggregate([
        {
          $match: {
            "messages.type": "drip",
            "messages.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $unwind: "$messages",
        },
        {
          $match: {
            "messages.type": "drip",
            "messages.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDripMessages: { $sum: 1 },
            sentDripCount: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messages.isDripOutgoingMessage", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
            receivedDripCount: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messages.isDripIncomingMessage", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalDripMessages: 1,
            sentDripCount: 1,
            receivedDripCount: 1,
            sentDripPercentage: {
              $multiply: [
                { $divide: ["$sentDripCount", "$totalDripMessages"] },
                100,
              ],
            },
            receivedDripPercentage: {
              $multiply: [
                { $divide: ["$receivedDripCount", "$totalDripMessages"] },
                100,
              ],
            },
          },
        },
      ]),
      Inbox.aggregate([
        {
          $match: {
            "messagesPhone2.type": "drip",
            "messagesPhone2.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $unwind: "$messagesPhone2",
        },
        {
          $match: {
            "messagesPhone2.type": "drip",
            "messagesPhone2.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDripMessages: { $sum: 1 },
            sentDripCount: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messagesPhone2.isDripOutgoingMessage", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
            receivedDripCount: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messagesPhone2.isDripIncomingMessage", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalDripMessages: 1,
            sentDripCount: 1,
            receivedDripCount: 1,
            sentDripPercentage: {
              $multiply: [
                { $divide: ["$sentDripCount", "$totalDripMessages"] },
                100,
              ],
            },
            receivedDripPercentage: {
              $multiply: [
                { $divide: ["$receivedDripCount", "$totalDripMessages"] },
                100,
              ],
            },
          },
        },
      ]),
      Inbox.aggregate([
        {
          $match: {
            "messagesPhone3.type": "drip",
            "messagesPhone3.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $unwind: "$messagesPhone3",
        },
        {
          $match: {
            "messagesPhone3.type": "drip",
            "messagesPhone3.creationDate": {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDripMessages: { $sum: 1 },
            sentDripCount: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messagesPhone3.isDripOutgoingMessage", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
            receivedDripCount: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messagesPhone3.isDripIncomingMessage", true] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalDripMessages: 1,
            sentDripCount: 1,
            receivedDripCount: 1,
            sentDripPercentage: {
              $multiply: [
                { $divide: ["$sentDripCount", "$totalDripMessages"] },
                100,
              ],
            },
            receivedDripPercentage: {
              $multiply: [
                { $divide: ["$receivedDripCount", "$totalDripMessages"] },
                100,
              ],
            },
          },
        },
      ]),
    ];
    let [result1, result2, result3, dripResult1, dripResult2, dripResult3] =
      await Promise.all(queryForInboxState);

    const mergedArray = [...result1, ...result2, ...result3];
    const mergedDripArray = [...dripResult1, ...dripResult2, ...dripResult3];
    let totalInboxMessages = 0;
    let sentCount = 0;
    let receivedCount = 0;
    mergedArray.forEach((item) => {
      sentCount = sentCount + item.sent;
      receivedCount = receivedCount + item.received;
      totalInboxMessages = totalInboxMessages + item.totalMessages;
    });
    let totalDripsMessages = 0;
    let sentDripCount = 0;
    let receivedDripCount = 0;
    mergedDripArray.forEach((item) => {
      sentDripCount = sentDripCount + item.sentDripCount;
      receivedDripCount = receivedDripCount + item.receivedDripCount;
      totalDripsMessages = totalDripsMessages + item.totalDripMessages;
    });
    let sentPercentage = (sentCount / sentCount) * 100;
    let receivedPercentage = (receivedCount / sentCount) * 100;
    const sentDripPercentage = (sentDripCount / sentDripCount) * 100;
    const receivedDripPercentage = (receivedDripCount / sentDripCount) * 100;
    let finalObject = {
      _id: "null",
      totalMessages: totalInboxMessages,
      sent: sentCount,
      received: receivedCount,
      sentPercentage: sentPercentage,
      receivedPercentage: receivedPercentage,
      totalDripMessages: totalDripsMessages,
      sentDripCount,
      receivedDripCount,
      sentDripPercentage,
      receivedDripPercentage,
    };
    return [finalObject];
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfFlagStatus = async (filter) => {
  try {
    const totalRecords = await Flag.countDocuments(filter);
    const errorPercentages = await Flag.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$errorCode",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          errorCode: "$_id",
          count: 1,
          percentage: {
            $multiply: [{ $divide: ["$count", totalRecords] }, 100],
          },
        },
      },
    ]);

    let result = { totalRecords, errorPercentages };
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
async function aggregatedDataForReportFlags(startOfDay, endOfDay, phone) {
  let filter;
  if (phone === "all") {
    filter = {
      $or: [
        { msgDate: { $gte: startOfDay, $lte: endOfDay }, status: 1 },
        { msgDate2: { $gte: startOfDay, $lte: endOfDay }, status2: 1 },
        { msgDate3: { $gte: startOfDay, $lte: endOfDay }, status3: 1 },
      ],
    };
  } else {
    filter = {
      marketSenderNumber: phone,
      $or: [
        { msgDate: { $gte: startOfDay, $lte: endOfDay }, status: 1 },
        { msgDate2: { $gte: startOfDay, $lte: endOfDay }, status2: 1 },
        { msgDate3: { $gte: startOfDay, $lte: endOfDay }, status3: 1 },
      ],
    };
  }
  const sentCountPipeline = [
    {
      $match: filter,
    },
    {
      $addFields: {
        statusSum: {
          $sum: [
            {
              $cond: [
                {
                  $and: [
                    { $gte: ["$msgDate", startOfDay] },
                    { $lte: ["$msgDate", endOfDay] },
                    { $eq: ["$status", 1] },
                  ],
                },
                1,
                0,
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $gte: ["$msgDate2", startOfDay] },
                    { $lte: ["$msgDate2", endOfDay] },
                    { $eq: ["$status2", 1] },
                  ],
                },
                1,
                0,
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $gte: ["$msgDate3", startOfDay] },
                    { $lte: ["$msgDate3", endOfDay] },
                    { $eq: ["$status3", 1] },
                  ],
                },
                1,
                0,
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalSentCount: { $sum: "$statusSum" },
      },
    },
  ];
  const deliveredCountPipeline = [
    {
      $match: filter,
    },
    {
      $addFields: {
        deliveredSum: {
          $sum: [
            {
              $cond: [
                {
                  $and: [
                    { $gte: ["$msgDate", startOfDay] },
                    { $lte: ["$msgDate", endOfDay] },
                    { $eq: ["$delivered", 1] },
                  ],
                },
                1,
                0,
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $gte: ["$msgDate2", startOfDay] },
                    { $lte: ["$msgDate2", endOfDay] },
                    { $eq: ["$delivered2", 1] },
                  ],
                },
                1,
                0,
              ],
            },
            {
              $cond: [
                {
                  $and: [
                    { $gte: ["$msgDate3", startOfDay] },
                    { $lte: ["$msgDate3", endOfDay] },
                    { $eq: ["$delivered3", 1] },
                  ],
                },
                1,
                0,
              ],
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        totalDeliveredCount: { $sum: "$deliveredSum" },
      },
    },
  ];
  let queryPromises = [
    CsvData.aggregate(sentCountPipeline),
    CsvData.aggregate(deliveredCountPipeline),
  ];
  let [sentCountData, deliveredCountData] = await Promise.all(queryPromises);

  const totalSentCount = sentCountData[0]?.totalSentCount
    ? sentCountData[0].totalSentCount
    : 0;
  const totalDeliveredCount = deliveredCountData[0]?.totalDeliveredCount
    ? deliveredCountData[0]?.totalDeliveredCount
    : 0;
  return { totalSentCount, totalDeliveredCount };
}

const reportOfFlagStatusByNumber = async (
  filter,
  page,
  skip,
  limit,
  startDate,
  endDate,
  phone
) => {
  try {
    const countPromise = Flag.countDocuments(filter).exec(); // Execute countDocuments once

    let deliveredReport = {
      sentCount: 0,
      deliveredCount: 0,
      deliveredPercentage: 0,
    };
    const data = await aggregatedDataForReportFlags(startDate, endDate, phone);
    if (data?.totalSentCount != 0 || data?.totalDeliveredCount != 0) {
      let percentageOfDelivered =
        (data?.totalDeliveredCount / data?.totalSentCount) * 100;
      deliveredReport = {
        sentCount: data?.totalSentCount,
        deliveredCount: data?.totalDeliveredCount,
        deliveredPercentage: percentageOfDelivered,
      };
    }

    const errorPercentagesPromise = Flag.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$errorCode",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          errorCode: "$_id",
          count: 1,
          percentage: {
            $multiply: [
              {
                $divide: ["$count", { $toDouble: data?.totalSentCount }],
              },
              100,
            ],
          },
        },
      },
      { $sort: { percentage: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]).exec();

    const errorPercentagesTotalForPaginationPromise = Flag.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$errorCode",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          errorCode: "$_id",
          count: 1,
          percentage: {
            $multiply: [
              {
                $divide: ["$count", { $toDouble: data?.totalSentCount }],
              },
              100,
            ],
          },
        },
      },
    ]).exec();

    const [errorPercentages, errorPercentagesTotalForPagination, totalRecords] =
      await Promise.all([
        errorPercentagesPromise,
        errorPercentagesTotalForPaginationPromise,
        countPromise,
      ]);

    const totalPages = Math.ceil(
      errorPercentagesTotalForPagination.length / limit
    );

    const result = {
      totalRecords,
      errorPercentages,
      deliveredReport,
      page,
      limit,
      totalPages,
      totalResult: errorPercentagesTotalForPagination.length,
    };

    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const listOfNumberByFlagStatus = async (
  inboxFilter,
  inboxSentFilter,
  startOfDay,
  endOfDay
) => {
  try {
    let csvResult = await CsvData.aggregate([
      {
        $match: inboxFilter,
      },
      {
        $group: {
          _id: "$marketSenderNumber",
          deliveredCount: {
            $sum: {
              $add: [
                {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$msgDate", startOfDay] },
                        { $lte: ["$msgDate", endOfDay] },
                        { $eq: ["$delivered", 1] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$msgDate2", startOfDay] },
                        { $lte: ["$msgDate2", endOfDay] },
                        { $eq: ["$delivered2", 1] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$msgDate3", startOfDay] },
                        { $lte: ["$msgDate3", endOfDay] },
                        { $eq: ["$delivered3", 1] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          deliveredCount: 1,
        },
      },
    ]);

    let csvSentResult = await CsvData.aggregate([
      {
        $match: inboxSentFilter,
      },
      {
        $group: {
          _id: "$marketSenderNumber",
          sentCount: {
            $sum: {
              $add: [
                {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$msgDate", startOfDay] },
                        { $lte: ["$msgDate", endOfDay] },
                        { $eq: ["$status", 1] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$msgDate2", startOfDay] },
                        { $lte: ["$msgDate2", endOfDay] },
                        { $eq: ["$status2", 1] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$msgDate3", startOfDay] },
                        { $lte: ["$msgDate3", endOfDay] },
                        { $eq: ["$status3", 1] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          sentCount: 1,
        },
      },
    ]);

    // Filter out entries with null _id
    csvResult = csvResult.filter((item) => item._id != null);
    csvSentResult = csvSentResult.filter((item) => item._id != null);

    for (let i = 0; i < csvSentResult.length; i++) {
      const filteredData = csvResult.filter(
        (item) => item._id === csvSentResult[i]._id
      );

      csvSentResult[i].deliveredCount = filteredData[0].deliveredCount;
      csvSentResult[i].deliveredPercentage =
        (parseInt(filteredData[0].deliveredCount) /
          parseInt(csvSentResult[i].sentCount)) *
        100;
    }
    return csvSentResult;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfDripSchedule = async (filter) => {
  try {
    return await InboxDripAutomation.countDocuments(filter);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfDripScheduleMessageSend = async (filter) => {
  try {
    return await InboxDripAutomation.countDocuments(filter);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfTopDrip = async () => {
  try {
    return await InboxDripAutomation.aggregate([
      {
        $match: {
          dripId: { $exists: true },
        },
      },
      {
        $group: {
          _id: { dripId: "$dripId", inboxId: "$inboxId" },
          dripName: { $first: "$dripName" },
        },
      },
      {
        $group: {
          _id: "$dripName",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 3,
      },
    ]);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfNoStatus = async (userId) => {
  try {
    // const startOfMonth = moment().startOf("month").startOf("day").toDate();
    // const endOfMonth = moment().endOf("month").endOf("day").toDate();
    // { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
    if (userId) {
      let statusFilter = {
        $and: [
          { isIncoming: true },
          {
            status: {
              $in: [new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8")],
            },
          },
          { user: userId },
        ],
      };
      let statusCount = await Inbox.countDocuments(statusFilter);
      return { status: statusCount };
    } else {
      let statusFilter = {
        $and: [
          { isIncoming: true },
          {
            status: {
              $in: [new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8")],
            },
          },
        ],
      };
      let statusCount = await Inbox.countDocuments(statusFilter);
      return { status: statusCount };
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfReminder = async (userId) => {
  try {
    if (userId) {
      reminderCount = await Reminder.countDocuments({ user: userId });
    } else {
      reminderCount = await Reminder.countDocuments({});
    }
    return { reminder: reminderCount };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfUnRead = async (userId) => {
  try {
    const startOfMonth = moment().startOf("month").startOf("day").toDate();
    const endOfMonth = moment().endOf("month").endOf("day").toDate();
    if (userId) {
      let unReadfilter = {
        $and: [
          { isUnRead: true },
          { updatedAt: { $gte: startOfMonth, $lte: endOfMonth } },
          {
            status: {
              $in: [
                "651ebe268042b1b3f4674e9b",
                "651ebe4e8042b1b3f4674e9d",
                "651ebe5b8042b1b3f4674ea0",
                "651ebe648042b1b3f4674ea2",
                "651ebe828042b1b3f4674ea8",
              ],
            },
          },
          { user: userId },
        ],
      };
      let unReadCount = await Inbox.countDocuments(unReadfilter);
      return { unRead: unReadCount };
    } else {
      let unReadfilter = {
        $and: [
          { isUnRead: true },
          { updatedAt: { $gte: startOfMonth, $lte: endOfMonth } },
          {
            status: {
              $in: [
                new mongoose.Types.ObjectId("651ebe268042b1b3f4674e9b"),
                new mongoose.Types.ObjectId("651ebe4e8042b1b3f4674e9d"),
                new mongoose.Types.ObjectId("651ebe5b8042b1b3f4674ea0"),
                new mongoose.Types.ObjectId("651ebe648042b1b3f4674ea2"),
                new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8"),
              ],
            },
          },
        ],
      };
      let unReadCount = await Inbox.countDocuments(unReadfilter);
      return { unRead: unReadCount };
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reportOfUnAnswered = async (userId) => {
  try {
    const startOfMonth = moment().startOf("month").startOf("day").toDate();
    const endOfMonth = moment().endOf("month").endOf("day").toDate();
    if (userId) {
      let queryFilter = {
        $and: [
          { isUnAnswered: true },
          { updatedAt: { $gte: startOfMonth, $lte: endOfMonth } },
          {
            status: {
              $in: [
                new mongoose.Types.ObjectId("651ebe268042b1b3f4674e9b"),
                new mongoose.Types.ObjectId("651ebe4e8042b1b3f4674e9d"),
                new mongoose.Types.ObjectId("651ebe5b8042b1b3f4674ea0"),
                new mongoose.Types.ObjectId("651ebe648042b1b3f4674ea2"),
                new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8"),
              ],
            },
          },
          { user: userId },
        ],
      };
      let unAnsweredCount = await Inbox.countDocuments(queryFilter);
      return { unAnswered: unAnsweredCount };
    } else {
      let queryFilter = {
        $and: [
          { isUnAnswered: true },
          { updatedAt: { $gte: startOfMonth, $lte: endOfMonth } },
          {
            status: {
              $in: [
                new mongoose.Types.ObjectId("651ebe268042b1b3f4674e9b"),
                new mongoose.Types.ObjectId("651ebe4e8042b1b3f4674e9d"),
                new mongoose.Types.ObjectId("651ebe5b8042b1b3f4674ea0"),
                new mongoose.Types.ObjectId("651ebe648042b1b3f4674ea2"),
                new mongoose.Types.ObjectId("651ebe828042b1b3f4674ea8"),
              ],
            },
          },
        ],
      };
      let unAnsweredCount = await Inbox.countDocuments(queryFilter);
      return { unAnswered: unAnsweredCount };
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const reoprtOfUnReadUnAnswered = async (userId) => {
  try {
    const startOfMonth = moment().startOf("month").startOf("day").toDate();
    const endOfMonth = moment().endOf("month").endOf("day").toDate();

    const matchConditions = {
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      $or: [{ unRead: { $gt: 0 } }, { unAnswered: { $gt: 0 } }],
    };

    if (userId) {
      matchConditions.userId = new mongoose.Types.ObjectId(userId);
    }

    const [result] = await DashStats.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: null,
          totalUnRead: { $sum: "$unRead" },
          totalUnAnswered: { $sum: "$unAnswered" },
        },
      },
    ]);

    return {
      unRead: result?.totalUnRead || 0,
      unAnswered: result?.totalUnAnswered || 0,
    };
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
};

module.exports = {
  getTotalLeadsBreakDown,
  getTopThreeCampaigns,
  getCountOfMessages,
  getCountOfMessagesForWeek,
  getCountOfMessagesForMonth,
  getCountOfTags,
  getCountOfMessagesInLastThirtyMinutes,
  getAverageReplyTime,
  reportOfSendAndQueMessages,
  reportOfBasicStats,
  reportOfProspectLeads,
  getCountOfMessagesForCustomDateRange,
  reportOfFlagStatus,
  reportOfFlagStatusByNumber,
  reportOfDripSchedule,
  reportOfDripScheduleMessageSend,
  reportOfTopDrip,
  listOfNumberByFlagStatus,
  reportOfNoStatus,
  reportOfReminder,
  reportOfUnRead,
  reportOfUnAnswered,
  reoprtOfUnReadUnAnswered,
};
