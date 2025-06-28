const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { dashboardService } = require("../services");
const { User, Batch, Inbox, CsvData } = require("../models");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const mysql = require("mysql2/promise");
const { getCountOfMessagesForWeek } = require("../services/dashboard.service");

const getTotalLeadsBreakDown = catchAsync(async (req, res) => {
  let filter = {};
  let totalFilter = {};
  const nowInPST = moment().tz("America/Los_Angeles");
  if (Object.keys(req.query).length === 0) {
    return res.status(400).send({
      message:
        "Query today, yesterday, week, month,startDate or endDate is required",
    });
  }
  if (req.query.today) {
    let nowInPST = moment.tz("America/Los_Angeles");

    // Start of the day in PST
    let startOfDayPST = nowInPST.clone().startOf("day");

    // End of the day in PST
    let endOfDayPST = nowInPST.clone().endOf("day");

    // Convert startOfDay and endOfDay to UTC
    let startOfDay = startOfDayPST.clone().utc().toDate();
    let endOfDay = endOfDayPST.clone().utc().toDate();
    totalFilter = {
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
          statusDate: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
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
    filter = {
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
          statusDate: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      ],
    };
  }
  if (req.query.yesterday) {
    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    let startOfDay = startOfYesterday;
    startOfDay = moment.utc(startOfYesterday);

    startOfDay.set({
      hour: Number("00"),
      minute: Number("00"),
      second: Number("00"),
      millisecond: Number("00"),
    });
    let endOfDay = moment.utc(startOfYesterday);
    endOfDay.set({
      hour: 23,
      minute: 59,
      second: Number("00"),
      millisecond: Number("00"),
    });
    startOfDay = startOfDay.toDate();
    endOfDay = endOfDay.toDate();

    totalFilter = {
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
          statusDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
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
    filter = {
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
          statusDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      ],
    };
  }
  if (req.query.week) {
    const nowInPST = moment.tz("America/Los_Angeles");
    const startOfWeek = nowInPST.clone().startOf("isoWeek").toDate();
    const endOfWeek = nowInPST.clone().endOf("isoWeek").toDate();

    totalFilter = {
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
          statusDate: {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
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
    filter = {
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
          statusDate: {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
        },
      ],
    };
  }
  if (req.query.month) {
    const startOfMonth = nowInPST.clone().startOf("month").toDate();
    const endOfMonth = nowInPST.clone().endOf("month").add(1, "day").toDate();
    totalFilter = {
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
          statusDate: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
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
    filter = {
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
          statusDate: {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        },
      ],
    };
  }
  if (req.query.startDate && req.query.endDate) {
    totalFilter = {
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
          statusDate: {
            $gte: req.query.startDate,
            $lt: req.query.endDate,
          },
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
    filter = {
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
          statusDate: {
            $gte: req.query.startDate,
            $lt: req.query.endDate,
          },
        },
      ],
    };
  }
  const inbox = await dashboardService.getTotalLeadsBreakDown(
    filter,
    totalFilter
  );
  res.status(httpStatus.CREATED).send(inbox);
});

const getTopThreeCampaigns = catchAsync(async (req, res) => {
  if (Object.keys(req.query).length === 0) {
    return res.status(400).send({
      message:
        "Query today, yesterday, week, month,startDate or endDate is required",
    });
  }
  let filter = {
    // $or: [
    //   { "messages.isIncoming": true },
    //   { "messagesPhone2.isIncoming": true },
    //   { "messagesPhone3.isIncoming": true },
    // ],
    isIncoming: true,
  };
  const inbox = await dashboardService.getTopThreeCampaigns(filter);
  res.status(httpStatus.CREATED).send(inbox);
});

const getCountOfMessages = catchAsync(async (req, res) => {
  let filter = {};
  let inbox;
  const nowInPST = moment().tz("America/Los_Angeles");
  if (Object.keys(req.query).length === 0) {
    return res.status(400).send({
      message:
        "Query today, yesterday, week, month,startDate or endDate is required",
    });
  }
  if (req.query.today) {
    let nowInPST = moment.tz("America/Los_Angeles");

    // Start of the day in PST
    let startOfDayPST = nowInPST.clone().startOf("day");

    // End of the day in PST
    let endOfDayPST = nowInPST.clone().endOf("day");

    // Convert startOfDay and endOfDay to UTC
    let startOfDay = startOfDayPST.clone().utc().toDate();
    let endOfDay = endOfDayPST.clone().utc().toDate();
    inbox = await dashboardService.getCountOfMessages(startOfDay, endOfDay);
  }
  if (req.query.yesterday) {
    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    startOfDay = startOfYesterday;
    startOfDay = moment.utc(startOfYesterday);

    startOfDay.set({
      hour: Number("00"),
      minute: Number("00"),
      second: Number("00"),
      millisecond: Number("00"),
    });
    endOfDay = moment.utc(startOfYesterday);
    endOfDay.set({
      hour: 23,
      minute: 59,
      second: Number("00"),
      millisecond: Number("00"),
    });
    startOfDay = startOfDay.toDate();
    endOfDay = endOfDay.toDate();
    inbox = await dashboardService.getCountOfMessages(startOfDay, endOfDay);
  }
  if (req.query.week) {
    const nowInPST = moment.tz("America/Los_Angeles");
    const startOfWeek = nowInPST.clone().startOf("isoWeek").toDate();
    const endOfWeek = nowInPST.clone().endOf("isoWeek").toDate();

    inbox = await dashboardService.getCountOfMessagesForWeek(
      startOfWeek,
      endOfWeek
    );
  }
  if (req.query.month) {
    const startOfMonth = nowInPST.clone().startOf("month").toDate();
    const endOfMonth = nowInPST.clone().endOf("month").add(1, "day").toDate();
    filter = {
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
    };
    inbox = await dashboardService.getCountOfMessagesForMonth(
      startOfMonth,
      endOfMonth
    );
  }
  if (req.query.startDate && req.query.endDate) {
    const startDatePST = moment
      .tz(req.query.startDate, "America/Los_Angeles")
      .startOf("day");

    // Parse endDate in PST timezone and set to end of the day
    const endDatePST = moment
      .tz(req.query.endDate, "America/Los_Angeles")
      .endOf("day");

    // Convert to JavaScript Date objects, if needed
    const startDate = startDatePST.toDate();
    const endDate = endDatePST.toDate();
    inbox = await dashboardService.getCountOfMessagesForCustomDateRange(
      startDate,
      endDate
    );
  }
  res.status(httpStatus.CREATED).send(inbox);
});

const getCountOfTags = catchAsync(async (req, res) => {
  let filter = {};
  const nowInPST = moment().tz("America/Los_Angeles");
  if (Object.keys(req.query).length === 0) {
    return res.status(400).send({
      message:
        "Query today, yesterday, week, month,startDate or endDate is required",
    });
  }

  if (req.query.today) {
    let nowInPST = moment.tz("America/Los_Angeles");

    // Start of the day in PST
    let startOfDayPST = nowInPST.clone().startOf("day");

    // End of the day in PST
    let endOfDayPST = nowInPST.clone().endOf("day");

    // Convert startOfDay and endOfDay to UTC
    let startOfDay = startOfDayPST.clone().utc().toDate();
    let endOfDay = endOfDayPST.clone().utc().toDate();
    filter = {
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
          "tagDateArray.date": {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
      ],
    };
  }
  if (req.query.yesterday) {
    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    let startOfDay = startOfYesterday;
    startOfDay = moment.utc(startOfYesterday);

    startOfDay.set({
      hour: Number("00"),
      minute: Number("00"),
      second: Number("00"),
      millisecond: Number("00"),
    });
    let endOfDay = moment.utc(startOfYesterday);
    endOfDay.set({
      hour: 23,
      minute: 59,
      second: Number("00"),
      millisecond: Number("00"),
    });
    startOfDay = startOfDay.toDate();
    endOfDay = endOfDay.toDate();
    filter = {
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
          "tagDateArray.date": {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      ],
    };
  }
  if (req.query.week) {
    const nowInPST = moment.tz("America/Los_Angeles");
    const startOfWeek = nowInPST.clone().startOf("isoWeek").toDate();
    const endOfWeek = nowInPST.clone().endOf("isoWeek").toDate();
    filter = {
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
          "tagDateArray.date": {
            $gte: startOfWeek,
            $lt: endOfWeek,
          },
        },
      ],
    };
  }
  if (req.query.month) {
    const startOfMonth = nowInPST.clone().startOf("month").toDate();
    const endOfMonth = nowInPST.clone().endOf("month").add(1, "day").toDate();

    filter = {
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
          "tagDateArray.date": {
            $gte: startOfMonth,
            $lt: endOfMonth,
          },
        },
      ],
    };
  }
  if (req.query.startDate && req.query.endDate) {
    filter = {
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
          "tagDateArray.date": {
            $gte: req.query.startDate,
            $lt: req.query.endDate,
          },
        },
      ],
    };
  }
  const inbox = await dashboardService.getCountOfTags(filter);
  res.status(httpStatus.CREATED).send(inbox);
});

const getCountOfMessagesInLastThirtyMinutes = catchAsync(async (req, res) => {
  // Get the current time in PST timezone
  const currentTimeInPST = moment().tz("America/Los_Angeles");

  // Calculate thirty minutes before the current time in PST
  const thirtyMinutesAgo = currentTimeInPST
    .clone()
    .subtract(30, "minutes")
    .toDate();

  let filter = {
    $or: [
      { "messages.creationDate": { $gte: thirtyMinutesAgo } },
      {
        "messagesPhone2.creationDate": {
          $gte: thirtyMinutesAgo,
        },
      },
      {
        "messagesPhone3.creationDate": {
          $gte: thirtyMinutesAgo,
        },
      },
    ],
  };
  const inbox = await dashboardService.getCountOfMessagesInLastThirtyMinutes(
    filter,
    thirtyMinutesAgo
  );
  res.status(httpStatus.CREATED).send(inbox);
});

const getAverageReplyTime = catchAsync(async (req, res) => {
  let startDate;
  let endDate;
  const nowInPST = moment().tz("America/Los_Angeles");
  if (Object.keys(req.query).length === 0) {
    return res.status(400).send({
      message:
        "Query today, yesterday, week, month,startDate or endDate is required",
    });
  }
  if (req.query.date) {
    const inputDate = new Date(req.query.date);

    // Set startDate to 6:30 AM PST (13:30 PM UTC)
    startDate = new Date(inputDate);
    startDate.setUTCHours(13, 30, 0, 0); // 6:30 AM PST is 13:30 PM UTC

    // Set endDate to 6:30 PM PST (1:30 AM UTC the next day)
    endDate = new Date(inputDate);
    endDate.setUTCHours(1, 30, 0, 0);
    endDate.setUTCDate(endDate.getUTCDate() + 1); // 6:30 PM PST is 1:30 AM UTC the next day
  } else if (req.query.today) {
    let nowInPST = moment.tz("America/Los_Angeles");

    // Start of the day in PST
    let startOfDayPST = nowInPST.clone().startOf("day");

    // End of the day in PST
    let endOfDayPST = nowInPST.clone().endOf("day");

    // Convert startOfDay and endOfDay to UTC
    let startOfDay = startOfDayPST.clone().utc().toDate();
    let endOfDay = endOfDayPST.clone().utc().toDate();
    startDate = startOfDay;
    endDate = endOfDay;
  } else if (req.query.yesterday) {
    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    let startOfDay = startOfYesterday;
    startOfDay = moment.utc(startOfYesterday);

    startOfDay.set({
      hour: Number("00"),
      minute: Number("00"),
      second: Number("00"),
      millisecond: Number("00"),
    });
    let endOfDay = moment.utc(startOfYesterday);
    endOfDay.set({
      hour: 23,
      minute: 59,
      second: Number("00"),
      millisecond: Number("00"),
    });
    startOfDay = startOfDay.toDate();
    endOfDay = endOfDay.toDate();
    startDate = startOfDay;
    endDate = endOfDay;
  } else if (req.query.week) {
    const startOfWeek = nowInPST.clone().startOf("isoWeek").toDate();
    const endOfWeek = nowInPST.clone().endOf("isoWeek").toDate();
    startDate = startOfWeek;
    endDate = endOfWeek;
  } else if (req.query.month) {
    startDate = nowInPST.clone().startOf("month").toDate();
    endDate = nowInPST.clone().endOf("month").add(1, "day").toDate();
  } else if (req.query.startDate && req.query.endDate) {
    endDate = req.query.endDate;
    startDate = req.query.startDate;
  }
  const inbox = await dashboardService.getAverageReplyTime(startDate, endDate);
  res.status(httpStatus.CREATED).send(inbox);
});

function getStartOfWeek(date) {
  const dayOfWeek = date.getDay();
  const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust if Sunday is the start of the week
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + diff);
}

const reportOfSendAndQueMessages = catchAsync(async (req, res) => {
  try {
    let nowInPST = moment.tz("America/Los_Angeles");

    // Start of the day in PST
    let startOfDayPST = nowInPST.clone().startOf("day");

    // End of the day in PST
    let endOfDayPST = nowInPST.clone().endOf("day");

    // Convert startOfDay and endOfDay to UTC
    let startOfDay = startOfDayPST.clone().utc().toDate();
    let endOfDay = endOfDayPST.clone().utc().toDate();

    let inbox = [
      {
        totalMessagesSent: 0,
        totalMessagesInQueue: 0,
      },
    ];

    const sentCountPhone1 = await sentCountPhone(
      "msgDate",
      "status",
      startOfDay,
      endOfDay
    );
    const sentPhone2 = await sentCountPhone2(
      "msgDate2",
      "status2",
      startOfDay,
      endOfDay
    );
    const sentPhone3 = await sentCountPhone3(
      "msgDate3",
      "status3",
      startOfDay,
      endOfDay
    );
    inbox[0].totalMessagesSent = sentCountPhone1 + sentPhone2 + sentPhone3;

    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");

    // Start of yesterday in PST
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    // End of yesterday in PST (start of today)
    const endOfYesterday = yesterdayInPST.clone().endOf("day").toDate();
    
    console.log("startOfYesterday",startOfYesterday);
    console.log("endOfYesterday", endOfYesterday);

    let phone2Que = await getPhone2Que(startOfYesterday, endOfYesterday);
    const phone2QueValue = phone2Que.length > 0 ? phone2Que[0].total : 0;
    console.log("phone2Que",phone2Que);
    // Get 'the day before yesterday' in PST timezone
    const twoDaysAgoInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(2, "days");

    // Start of 'the day before yesterday' in PST
    const previousYesterday = twoDaysAgoInPST.clone().startOf("day").toDate();

    // End of 'the day before yesterday' in PST (start of yesterday)
    const endOfPreviousYesterday = twoDaysAgoInPST
      .clone()
      .endOf("day")
      .toDate();

    console.log("previousYesterday",previousYesterday);
    console.log("endOfPreviousYesterday", endOfPreviousYesterday);

    let phone3Que = await getPhone3Que(
      previousYesterday,
      endOfPreviousYesterday
    );

    const phone3QueValue = phone3Que.length > 0 ? phone3Que[0].total : 0;
    console.log("phone3Que",phone3Que);
    inbox[0].totalMessagesInQueue = phone2QueValue + phone3QueValue;
    res.status(httpStatus.CREATED).send(inbox);
  } catch (error) {
    console.error("Error inserting data:", error);
    // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
});

async function sentCountPhone(msgDateField, statusField, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status: 1,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$status", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function sentCountPhone2(
  msgDateField,
  statusField,
  startOfDay,
  endOfDay
) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate2: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status2: 1,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$status2", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}

async function sentCountPhone3(
  msgDateField,
  statusField,
  startOfDay,
  endOfDay
) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate3: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status3: 1,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$status3", 1] }, then: 1, else: 0 },
            },
          },
        },
      },
    ]);

    if (result && result.length > 0) {
      return result[0].total;
    } else {
      return 0; // Return 0 if no documents match the criteria
    }
  } catch (error) {
    console.error("Error in sentCount:", error);
    throw error; // Handle or rethrow the error as needed
  }
}
async function getPhone2Que(startOfDay, endOfDay) {
  let phone2Que = await CsvData.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [
              {
                msgDate: {
                  $gte: startOfDay,
                  $lte: endOfDay,
                },
              },
              { status2: 0 },
              { phone2: { $ne: "" } },
            ],
          },
        ],
      },
    },
    {
      $match: {
        $nor: [
          { isPhone1Verified: true },
          { isPhone2Verified: true },
          { isPhone3Verified: true },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1,
        },
      },
    },
  ]);

  return phone2Que;
}

async function getPhone3Que(startOfDay, endOfDay) {
  let phone3Que = await CsvData.aggregate([
    {
      $match: {
        $or: [
          {
            $and: [
              {
                msgDate: {
                  $gte: startOfDay,
                  $lte: endOfDay,
                },
              },
              { status3: 0 },
              { phone3: { $ne: "" } },
            ],
          },
        ],
      },
    },
    {
      $match: {
        $nor: [
          { isPhone1Verified: true },
          { isPhone2Verified: true },
          { isPhone3Verified: true },
        ],
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: 1,
        },
      },
    },
  ]);

  return phone3Que;
}

const reportOfBasicStats = catchAsync(async (req, res) => {
  let userId;
  let checkReminderUserId;
  let userBatchIdArray = [];
  if (req.user.role) {
    if (req.user.role.name) {
      if (req.user.role.name !== "admin") {
        userId = req.user._id;
        checkReminderUserId = req.user._id;
      }
    }
  }
  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      const batch = await Batch.find({ user: user._id });
      if (batch.length > 0) {
        batch.forEach((item) => {
          userBatchIdArray.push(item._id);
        });
      }
    }
  }
  const inbox = await dashboardService.reportOfBasicStats(
    userBatchIdArray,
    userId,
    checkReminderUserId
  );
  res.status(httpStatus.CREATED).send(inbox);
});

const reportOfProspectLeads = catchAsync(async (req, res) => {
  let filter = {};
  let inbox;
  const nowInPST = moment().tz("America/Los_Angeles");
  try {
    if (Object.keys(req.query).length === 0) {
      return res.status(400).send({
        message:
          "Query today, yesterday, week, month,startDate or endDate is required",
      });
    }
    if (req.query.today) {
      let nowInPST = moment.tz("America/Los_Angeles");

      // Start of the day in PST
      let startOfDayPST = nowInPST.clone().startOf("day");

      // End of the day in PST
      let endOfDayPST = nowInPST.clone().endOf("day");

      // Convert startOfDay and endOfDay to UTC
      let startOfDay = startOfDayPST.clone().utc().toDate();
      let endOfDay = endOfDayPST.clone().utc().toDate();
      filter = {
        // $or: [
        //   { "messages.isIncoming": true },
        //   { "messagesPhone2.isIncoming": true },
        //   { "messagesPhone3.isIncoming": true },
        // ],
        isIncoming: true,
      };
      inbox = await dashboardService.reportOfProspectLeads(
        filter,
        startOfDay,
        endOfDay
      );

      if (inbox.length > 0) {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );

        // const aggregatedData = await CsvData.aggregate(aggregationPipeline);
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        inbox[0].deliveredInitialCount = deliveredCount;
        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        inbox[0].sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        inbox[0].deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        inbox[0].respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }
        // inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        // inbox[0].received = Math.abs(
        //   inbox[0].respInitialCount - inbox[0].received
        // );
        // inbox[0].totalMessages = Math.abs(
        //   inbox[0].respInitialCount +
        //     inbox[0].respInitialCount -
        //     inbox[0].totalMessages
        // );
        // inbox[0].sentPercentage = Math.abs(
        //   (inbox[0].sent / inbox[0].totalMessages) * 100
        // );
        // inbox[0].receivedPercentage = Math.abs(
        //   (inbox[0].received / inbox[0].totalMessages) * 100
        // );
        inbox[0].respInitialCountPer = respPer * 100;
        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        inbox[0].followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        inbox[0].followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        inbox[0].deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        inbox[0].respfollowCount = respfollowCount;

        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        inbox[0].followrespPer = followresp * 100;
      } else {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        let deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        let sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        let deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        let respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }

        let respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        let deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        let followrespPer = followresp * 100;

        const inboxData = {
          deliveredInitialCount: deliveredInitialCount,
          sentInitialCount: sentInitialCount,
          deliveredInitialCountPer: deliveredInitialCountPer,
          respInitialCount: respInitialCount,
          respInitialCountPer: respInitialCountPer,
          followSentCount: followSentCount,
          followDeliveryCount: followDeliveryCount,
          deliveredfollowCountPer: deliveredfollowCountPer,
          respfollowCount: respfollowCount,
          followrespPer: followrespPer,
        };
        inbox.push(inboxData);
      }
    }
    if (req.query.yesterday) {
      // Calculate 'yesterday' in PST time zone
      const yesterdayInPST = moment()
        .tz("America/Los_Angeles")
        .subtract(1, "days");

      // Get the start of 'yesterday' in PST, which is 00:00:00 of yesterday in PST
      const startOfYesterdayInPST = yesterdayInPST.clone().startOf("day");

      // Calculate the end of 'yesterday' in PST, which is 23:59:59 of yesterday in PST
      const endOfYesterdayInPST = yesterdayInPST.clone().endOf("day");

      // For clarity, if you need to keep the original PST times as JavaScript Date objects for any reason:
      const startOfDay = startOfYesterdayInPST.toDate();
      const endOfDay = endOfYesterdayInPST.toDate();

      filter = {
        // $or: [
        //   { "messages.isIncoming": true },
        //   { "messagesPhone2.isIncoming": true },
        //   { "messagesPhone3.isIncoming": true },
        // ],
        isIncoming: true,
      };
      inbox = await dashboardService.reportOfProspectLeads(
        filter,
        startOfDay,
        endOfDay
      );
      if (inbox.length > 0) {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        inbox[0].deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        inbox[0].sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        inbox[0].deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        inbox[0].respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }

        // inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        // inbox[0].received = Math.abs(
        //   inbox[0].respInitialCount - inbox[0].received
        // );
        // inbox[0].totalMessages = Math.abs(
        //   inbox[0].respInitialCount +
        //     inbox[0].respInitialCount -
        //     inbox[0].totalMessages
        // );
        // inbox[0].sentPercentage = Math.abs(
        //   (inbox[0].sent / inbox[0].totalMessages) * 100
        // );
        // inbox[0].receivedPercentage = Math.abs(
        //   (inbox[0].received / inbox[0].totalMessages) * 100
        // );
        inbox[0].respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        inbox[0].followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        inbox[0].followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        inbox[0].deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        inbox[0].respfollowCount = respfollowCount;

        let followresp = 0;
        if (followDeliveryCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        inbox[0].followrespPer = followresp * 100;
      } else {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        let deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        let sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        let deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        let respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }

        let respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        let deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        let followrespPer = followresp * 100;

        const inboxData = {
          deliveredInitialCount: deliveredInitialCount,
          sentInitialCount: sentInitialCount,
          deliveredInitialCountPer: deliveredInitialCountPer,
          respInitialCount: respInitialCount,
          respInitialCountPer: respInitialCountPer,
          followSentCount: followSentCount,
          followDeliveryCount: followDeliveryCount,
          deliveredfollowCountPer: deliveredfollowCountPer,
          respfollowCount: respfollowCount,
          followrespPer: followrespPer,
        };
        inbox.push(inboxData);
      }
    }
    if (req.query.week) {
      const nowInPST = moment.tz("America/Los_Angeles");
      const startOfWeek = nowInPST.clone().startOf("isoWeek").toDate();
      const endOfWeek = nowInPST.clone().endOf("isoWeek").toDate();
      let startOfDay = startOfWeek;
      let endOfDay = endOfWeek;
      filter = {
        // $or: [
        //   { "messages.isIncoming": true },
        //   { "messagesPhone2.isIncoming": true },
        //   { "messagesPhone3.isIncoming": true },
        // ],
        isIncoming: true,
      };
      inbox = await dashboardService.reportOfProspectLeads(
        filter,
        startOfDay,
        endOfDay
      );
      if (inbox.length > 0) {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        inbox[0].deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        inbox[0].sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        inbox[0].deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        inbox[0].respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }
        // inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        // inbox[0].received = Math.abs(
        //   inbox[0].respInitialCount - inbox[0].received
        // );
        // inbox[0].totalMessages = Math.abs(
        //   inbox[0].respInitialCount +
        //     inbox[0].respInitialCount -
        //     inbox[0].totalMessages
        // );
        // inbox[0].sentPercentage = Math.abs(
        //   (inbox[0].sent / inbox[0].totalMessages) * 100
        // );
        // inbox[0].receivedPercentage = Math.abs(
        //   (inbox[0].received / inbox[0].totalMessages) * 100
        // );
        inbox[0].respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: null,
              totalSentCount: {
                $sum: {
                  $add: ["$status", "$status2", "$status3"],
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $add: ["$delivered", "$delivered2", "$delivered3"],
                },
              },
              totalResponseCount: {
                $sum: {
                  $add: ["$response", "$response2", "$response3"],
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        inbox[0].followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        inbox[0].followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        inbox[0].deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        inbox[0].respfollowCount = respfollowCount;

        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        inbox[0].followrespPer = followresp * 100;
      } else {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        let deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        let sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        let deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        let respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }

        let respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        let deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        let followrespPer = followresp * 100;

        const inboxData = {
          deliveredInitialCount: deliveredInitialCount,
          sentInitialCount: sentInitialCount,
          deliveredInitialCountPer: deliveredInitialCountPer,
          respInitialCount: respInitialCount,
          respInitialCountPer: respInitialCountPer,
          followSentCount: followSentCount,
          followDeliveryCount: followDeliveryCount,
          deliveredfollowCountPer: deliveredfollowCountPer,
          respfollowCount: respfollowCount,
          followrespPer: followrespPer,
        };
        inbox.push(inboxData);
      }
    }

    if (req.query.month) {
      const startOfDay = nowInPST.clone().startOf("month").toDate();
      const endOfDay = nowInPST.clone().endOf("month").add(1, "day").toDate();
      filter = {
        // $or: [
        //   { "messages.isIncoming": true },
        //   { "messagesPhone2.isIncoming": true },
        //   { "messagesPhone3.isIncoming": true },
        // ],
        isIncoming: true,
      };
      inbox = await dashboardService.reportOfProspectLeads(
        filter,
        startOfDay,
        endOfDay
      );
      if (inbox.length > 0) {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );

        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        inbox[0].deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        inbox[0].sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        inbox[0].deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        inbox[0].respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }
        // inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        // inbox[0].received = Math.abs(
        //   inbox[0].respInitialCount - inbox[0].received
        // );
        // inbox[0].totalMessages = Math.abs(
        //   inbox[0].respInitialCount +
        //     inbox[0].respInitialCount -
        //     inbox[0].totalMessages
        // );
        // inbox[0].sentPercentage = Math.abs(
        //   (inbox[0].sent / inbox[0].totalMessages) * 100
        // );
        // inbox[0].receivedPercentage = Math.abs(
        //   (inbox[0].received / inbox[0].totalMessages) * 100
        // );
        inbox[0].respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        inbox[0].followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        inbox[0].followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        inbox[0].deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        inbox[0].respfollowCount = respfollowCount;

        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        inbox[0].followrespPer = followresp * 100;
      } else {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        let deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        let sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        let deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        let respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }

        let respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        let deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        let followrespPer = followresp * 100;

        const inboxData = {
          deliveredInitialCount: deliveredInitialCount,
          sentInitialCount: sentInitialCount,
          deliveredInitialCountPer: deliveredInitialCountPer,
          respInitialCount: respInitialCount,
          respInitialCountPer: respInitialCountPer,
          followSentCount: followSentCount,
          followDeliveryCount: followDeliveryCount,
          deliveredfollowCountPer: deliveredfollowCountPer,
          respfollowCount: respfollowCount,
          followrespPer: followrespPer,
        };
        inbox.push(inboxData);
      }
    }
    if (req.query.startDate && req.query.endDate) {
      filter = {
        // $or: [
        //   { "messages.isIncoming": true },
        //   { "messagesPhone2.isIncoming": true },
        //   { "messagesPhone3.isIncoming": true },
        // ],
        isIncoming: true,
      };
      inbox = await dashboardService.reportOfProspectLeads(
        filter,
        req.query.startDate,
        req.query.endDate
      );
      const startOfDay = req.query.startDate;
      const endOfDay = req.query.endDate;
      if (inbox.length > 0) {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        inbox[0].deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        inbox[0].sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        inbox[0].deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        inbox[0].respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }
        // inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        // inbox[0].received = Math.abs(
        //   inbox[0].respInitialCount - inbox[0].received
        // );
        // inbox[0].totalMessages = Math.abs(
        //   inbox[0].respInitialCount +
        //     inbox[0].respInitialCount -
        //     inbox[0].totalMessages
        // );
        // inbox[0].sentPercentage = Math.abs(
        //   (inbox[0].sent / inbox[0].totalMessages) * 100
        // );
        // inbox[0].receivedPercentage = Math.abs(
        //   (inbox[0].received / inbox[0].totalMessages) * 100
        // );
        inbox[0].respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        inbox[0].followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        inbox[0].followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        inbox[0].deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        inbox[0].respfollowCount = respfollowCount;

        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        inbox[0].followrespPer = followresp * 100;
      } else {
        let aggregatedData = await aggregatedDataForprospectLeads(
          startOfDay,
          endOfDay
        );
        const deliveredCount = aggregatedData?.totalDeliveredCount
          ? aggregatedData.totalDeliveredCount
          : 0;
        let deliveredInitialCount = deliveredCount;

        //totalSentMessages
        const sentCount = aggregatedData?.totalSentCount
          ? aggregatedData.totalSentCount
          : 0;
        let sentInitialCount = sentCount;

        const delivPer = deliveredCount / sentCount;
        let deliveredInitialCountPer = delivPer * 100;
        //totalresponsecount
        const RespCount = aggregatedData?.totalResponseCount
          ? aggregatedData.totalResponseCount
          : 0;
        let respInitialCount = RespCount;
        let respPer = 0;
        if (deliveredCount > 0) {
          respPer = RespCount / deliveredCount;
        }

        let respInitialCountPer = respPer * 100;

        const aggregationPipelineFollow = [
          {
            $match: {
              msgDate: { $gte: startOfDay, $lte: endOfDay },
              $or: [{ status: 1 }, { status2: 1 }, { status3: 1 }],
              $or: [
                { campaignId1: { $ne: null } }, // campaignId1 is NOT NULL
                { campaignId2: { $ne: null } }, // campaignId2 is NOT NULL
                { campaignId3: { $ne: null } }, // campaignId3 is NOT NULL
              ],
            },
          },
          {
            $group: {
              _id: "$batchId",
              totalSentCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$status", "$status2", "$status3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalDeliveredCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivered2",
                                "$delivered3",
                              ],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: [
                                "$delivered",
                                "$delivereds2",
                                "$delivered3",
                              ],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
              totalResponseCount: {
                $sum: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            3,
                          ],
                        },
                        then: 3,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            2,
                          ],
                        },
                        then: 2,
                      },
                      {
                        case: {
                          $eq: [
                            {
                              $sum: ["$response", "$response2", "$response3"],
                            },
                            1,
                          ],
                        },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
          },
        ];
        const aggregatedDataFollow = await CsvData.aggregate(
          aggregationPipelineFollow
        );
        let followSentCount = aggregatedDataFollow[0]?.totalSentCount
          ? aggregatedDataFollow[0]?.totalSentCount
          : 0;
        followSentCount = followSentCount;

        let followDeliveryCount = aggregatedDataFollow[0]?.totalDeliveredCount
          ? aggregatedDataFollow[0].totalDeliveredCount
          : 0;
        followDeliveryCount = followDeliveryCount;

        let followdelivPer = followDeliveryCount / followSentCount;
        let deliveredfollowCountPer = followdelivPer * 100;

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        let followresp = 0;
        if (followDeliveryCount > 0 && respfollowCount > 0) {
          followresp = respfollowCount / followDeliveryCount;
        }
        let followrespPer = followresp * 100;

        const inboxData = {
          deliveredInitialCount: deliveredInitialCount,
          sentInitialCount: sentInitialCount,
          deliveredInitialCountPer: deliveredInitialCountPer,
          respInitialCount: respInitialCount,
          respInitialCountPer: respInitialCountPer,
          followSentCount: followSentCount,
          followDeliveryCount: followDeliveryCount,
          deliveredfollowCountPer: deliveredfollowCountPer,
          respfollowCount: respfollowCount,
          followrespPer: followrespPer,
        };
        inbox.push(inboxData);
      }
    }

    res.status(httpStatus.CREATED).send(inbox);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

async function aggregatedDataForprospectLeads(startOfDay, endOfDay) {
  const sentCountPipeline = [
    {
      $match: {
        $and: [
          {
            $or: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay }, status: 1 },
              { msgDate2: { $gte: startOfDay, $lte: endOfDay }, status2: 1 },
              { msgDate3: { $gte: startOfDay, $lte: endOfDay }, status3: 1 },
            ],
          },
          { compaignPermission: "campaign" },
        ],
      },
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

  const sentCountData = await CsvData.aggregate(sentCountPipeline);
  const totalSentCount = sentCountData[0]?.totalSentCount
    ? sentCountData[0].totalSentCount
    : 0;

  const deliveredCountPipeline = [
    {
      $match: {
        $and: [
          {
            $or: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay }, delivered: 1 },
              { msgDate2: { $gte: startOfDay, $lte: endOfDay }, delivered2: 1 },
              { msgDate3: { $gte: startOfDay, $lte: endOfDay }, delivered3: 1 },
            ],
          },
          { compaignPermission: "campaign" },
        ],
      },
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

  const deliveredCountData = await CsvData.aggregate(deliveredCountPipeline);
  const totalDeliveredCount = deliveredCountData[0]?.totalDeliveredCount
    ? deliveredCountData[0]?.totalDeliveredCount
    : 0;

  const responseCountPipeline = [
    {
      $match: {
        $and: [
          {
            $or: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay }, response: 1 },
              { msgDate2: { $gte: startOfDay, $lte: endOfDay }, response2: 1 },
              { msgDate3: { $gte: startOfDay, $lte: endOfDay }, response3: 1 },
            ],
          },
          { compaignPermission: "campaign" },
        ],
      },
    },
    {
      $addFields: {
        responseSum: {
          $sum: [
            {
              $cond: [
                {
                  $and: [
                    { $gte: ["$msgDate", startOfDay] },
                    { $lte: ["$msgDate", endOfDay] },
                    { $eq: ["$response", 1] },
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
                    { $eq: ["$response2", 1] },
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
                    { $eq: ["$response3", 1] },
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
        totalResponseCount: { $sum: "$responseSum" },
      },
    },
  ];

  const responseCountdData = await CsvData.aggregate(responseCountPipeline);
  const totalResponseCount = responseCountdData[0]?.totalResponseCount
    ? responseCountdData[0]?.totalResponseCount
    : 0;

  return { totalSentCount, totalDeliveredCount, totalResponseCount };
}

const reportOfFlagStatus = catchAsync(async (req, res) => {
  let filter;

  if (req.query.today) {
    let nowInPST = moment.tz("America/Los_Angeles");

    // Start of the day in PST
    let startOfDayPST = nowInPST.clone().startOf("day");

    // End of the day in PST
    let endOfDayPST = nowInPST.clone().endOf("day");

    // Convert startOfDay and endOfDay to UTC
    let startOfDay = startOfDayPST.clone().utc().toDate();
    let endOfDay = endOfDayPST.clone().utc().toDate();

    filter = {
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    };
  } else if (req.query.yesterday) {
    const yesterdayPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days")
      .startOf("day");
    const endOfYesterdayPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days")
      .endOf("day");

    filter = {
      createdAt: {
        $gte: yesterdayPST.toDate(),
        $lt: endOfYesterdayPST.toDate(),
      },
    };
  } else if (req.query.week) {
    const startOfWeekPST = moment()
      .tz("America/Los_Angeles")
      .startOf("isoWeek");
    const endOfWeekPST = startOfWeekPST
      .clone()
      // .add(1, "week")
      .startOf("isoWeek");

    filter = {
      createdAt: {
        $gte: startOfWeekPST.toDate(),
        $lt: endOfWeekPST.toDate(),
      },
    };
  } else if (req.query.month) {
    const startOfMonthPST = moment().tz("America/Los_Angeles").startOf("month");
    const endOfMonthPST = startOfMonthPST
      .clone()
      .add(1, "month")
      .startOf("month");

    filter = {
      createdAt: {
        $gte: startOfMonthPST.toDate(),
        $lt: endOfMonthPST.toDate(),
      },
    };
  } else if (req.query.startDate && req.query.endDate) {
    filter = {
      createdAt: {
        $gte: req.query.startDate,
        $lt: req.query.endDate,
      },
    };
  } else {
    filter = {};
  }
  const flag = await dashboardService.reportOfFlagStatus(filter);
  res.status(httpStatus.CREATED).send(flag);
});

const reportOfFlagStatusByNumber = catchAsync(async (req, res) => {
  let filter, startDate, endDate;
  let { phone } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;
  let cleanedPhoneNumber = phone.replace(/^\+1/, "");
  if (req.query.today) {
    let nowInPST = moment.tz("America/Los_Angeles");

    // Start of the day in PST
    let startOfDayPST = nowInPST.clone().startOf("day");

    // End of the day in PST
    let endOfDayPST = nowInPST.clone().endOf("day");

    // Convert startOfDay and endOfDay to UTC
    let startOfDay = startOfDayPST.clone().utc().toDate();
    let endOfDay = endOfDayPST.clone().utc().toDate();

    filter =
      phone === "all"
        ? {
            createdAt: {
              $gte: startOfDay,
              $lt: endOfDay,
            },
          }
        : {
            $and: [
              {
                createdAt: {
                  $gte: startOfDay,
                  $lt: endOfDay,
                },
              },
              { "message.from": phone },
            ],
          };
    startDate = startOfDay;
    endDate = endOfDay;
  } else if (req.query.yesterday) {
    const yesterdayPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days")
      .startOf("day");
    const endOfYesterdayPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days")
      .endOf("day");

    filter =
      phone === "all"
        ? {
            createdAt: {
              $gte: yesterdayPST.toDate(),
              $lt: endOfYesterdayPST.toDate(),
            },
          }
        : {
            $and: [
              {
                createdAt: {
                  $gte: yesterdayPST.toDate(),
                  $lte: endOfYesterdayPST.toDate(),
                },
              },
              { "message.from": phone },
            ],
          };
    startDate = yesterdayPST.toDate();
    endDate = endOfYesterdayPST.toDate();
  } else if (req.query.week) {
    const startOfWeekPST = moment()
      .tz("America/Los_Angeles")
      .startOf("isoWeek");
    const endOfWeekPST = moment().tz("America/Los_Angeles").endOf("isoWeek");
    filter =
      phone === "all"
        ? {
            createdAt: {
              $gte: startOfWeekPST.toDate(),
              $lte: endOfWeekPST.toDate(),
            },
          }
        : {
            $and: [
              {
                createdAt: {
                  $gte: startOfWeekPST.toDate(),
                  $lte: endOfWeekPST.toDate(),
                },
              },
              { "message.from": phone },
            ],
          };
    startDate = startOfWeekPST.toDate();
    endDate = endOfWeekPST.toDate();
  } else if (req.query.month) {
    const startOfMonthPST = moment().tz("America/Los_Angeles").startOf("month");
    const endOfMonthPST = moment().tz("America/Los_Angeles").endOf("month");

    filter =
      phone === "all"
        ? {
            createdAt: {
              $gte: startOfMonthPST.toDate(),
              $lt: endOfMonthPST.toDate(),
            },
          }
        : {
            $and: [
              {
                createdAt: {
                  $gte: startOfMonthPST.toDate(),
                  $lt: endOfMonthPST.toDate(),
                },
              },
              { "message.from": phone },
            ],
          };
    startDate = startOfMonthPST.toDate();
    endDate = endOfMonthPST.toDate();
  } else if (req.query.startDate && req.query.endDate) {
    if (phone === "all") {
      filter = {
        createdAt: {
          $gte: req.query.startDate,
          $lte: req.query.endDate,
        },
      };
      startDate = req.query.startDate;
      endDate = req.query.endDate;
    } else {
      filter = {
        $and: [
          {
            createdAt: {
              $gte: req.query.startDate,
              $lte: req.query.endDate,
            },
          },
          { "message.from": phone },
        ],
      };
      startDate = req.query.startDate;
      endDate = req.query.endDate;
    }
  } else {
    filter = { "message.from": phone };
  }
  const flag = await dashboardService.reportOfFlagStatusByNumber(
    filter,
    page,
    skip,
    limit,
    startDate,
    endDate,
    cleanedPhoneNumber
  );
  res.status(httpStatus.CREATED).send(flag);
});

const listOfNumberByFlagStatus = catchAsync(async (req, res) => {
  let inboxFilter;
  let inboxSentFilter;
  let { phone } = req.params;
  let cleanedPhoneNumber = phone.replace(/^\+1/, "");
  let flag;
  if (req.query.today) {
    let nowInPST = moment.tz("America/Los_Angeles");

    // Start of the day in PST
    let startOfDayPST = nowInPST.clone().startOf("day");

    // End of the day in PST
    let endOfDayPST = nowInPST.clone().endOf("day");

    // Convert startOfDay and endOfDay to UTC
    let startOfDay = startOfDayPST.clone().utc().toDate();
    let endOfDay = endOfDayPST.clone().utc().toDate();

    if (phone === "all") {
      inboxFilter = {
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { delivered: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { delivered2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { delivered3: 1 },
            ],
          },
        ],
      };

      inboxSentFilter = {
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { status: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { status2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { status3: 1 },
            ],
          },
        ],
      };
    } else {
      inboxFilter = {
        marketSenderNumber: cleanedPhoneNumber,
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { delivered: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { delivered2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { delivered3: 1 },
            ],
          },
        ],
      };

      inboxSentFilter = {
        marketSenderNumber: cleanedPhoneNumber,
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { status: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { status2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { status3: 1 },
            ],
          },
        ],
      };
    }

    flag = await dashboardService.listOfNumberByFlagStatus(
      inboxFilter,
      inboxSentFilter,
      startOfDay,
      endOfDay
    );
  } else if (req.query.yesterday) {
    const yesterdayPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days")
      .startOf("day");
    const endOfYesterdayPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days")
      .endOf("day");

    const startOfDay = yesterdayPST.toDate();
    const endOfDay = endOfYesterdayPST.toDate();
    if (phone === "all") {
      inboxFilter = {
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { delivered: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { delivered2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { delivered3: 1 },
            ],
          },
        ],
      };

      inboxSentFilter = {
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { status: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { status2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { status3: 1 },
            ],
          },
        ],
      };
    } else {
      inboxFilter = {
        marketSenderNumber: cleanedPhoneNumber,
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { delivered: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { delivered2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { delivered3: 1 },
            ],
          },
        ],
      };

      inboxSentFilter = {
        marketSenderNumber: cleanedPhoneNumber,
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { status: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { status2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { status3: 1 },
            ],
          },
        ],
      };
    }
    flag = await dashboardService.listOfNumberByFlagStatus(
      inboxFilter,
      inboxSentFilter,
      yesterdayPST.toDate(),
      endOfYesterdayPST.toDate()
    );
  } else if (req.query.week) {
    const startOfWeekPST = moment()
      .tz("America/Los_Angeles")
      .startOf("isoWeek");
    const endOfWeekPST = moment().tz("America/Los_Angeles").endOf("isoWeek");
    let startOfDay = startOfWeekPST.toDate();
    let endOfDay = endOfWeekPST.toDate();
    if (phone === "all") {
      inboxFilter = {
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { delivered: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { delivered2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { delivered3: 1 },
            ],
          },
        ],
      };

      inboxSentFilter = {
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { status: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { status2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { status3: 1 },
            ],
          },
        ],
      };
    } else {
      inboxFilter = {
        marketSenderNumber: cleanedPhoneNumber,
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { delivered: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { delivered2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { delivered3: 1 },
            ],
          },
        ],
      };

      inboxSentFilter = {
        marketSenderNumber: cleanedPhoneNumber,
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { status: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { status2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { status3: 1 },
            ],
          },
        ],
      };
    }
    flag = await dashboardService.listOfNumberByFlagStatus(
      inboxFilter,
      inboxSentFilter,
      startOfDay,
      endOfDay
    );
  } else if (req.query.month) {
    const startOfMonthPST = moment().tz("America/Los_Angeles").startOf("month");
    const endOfMonthPST = moment().tz("America/Los_Angeles").endOf("month");
    const startOfDay = startOfMonthPST.toDate();
    const endOfDay = endOfMonthPST.toDate();

    if (phone === "all") {
      inboxFilter = {
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { delivered: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { delivered2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { delivered3: 1 },
            ],
          },
        ],
      };
    } else {
      inboxFilter = {
        marketSenderNumber: cleanedPhoneNumber,
        $or: [
          {
            $and: [
              { msgDate: { $gte: startOfDay, $lte: endOfDay } },
              { delivered: 1 },
            ],
          },
          {
            $and: [
              { msgDate2: { $gte: startOfDay, $lte: endOfDay } },
              { delivered2: 1 },
            ],
          },
          {
            $and: [
              { msgDate3: { $gte: startOfDay, $lte: endOfDay } },
              { delivered3: 1 },
            ],
          },
        ],
      };
    }
    flag = await dashboardService.listOfNumberByFlagStatus(
      inboxFilter,
      startOfMonthPST.toDate(),
      endOfMonthPST.toDate()
    );
  } else if (req.query.startDate && req.query.endDate) {
    if (phone === "all") {
      inboxFilter = {
        $or: [
          {
            msgDate: {
              $gte: req.query.startDate,
              $lte: req.query.endDate,
            },
          },
          {
            msgDate2: {
              $gte: req.query.startDate,
              $lte: req.query.endDate,
            },
          },
          {
            msgDate3: {
              $gte: req.query.startDate,
              $lte: req.query.endDate,
            },
          },
        ],
      };
    } else {
      inboxFilter = {
        marketSenderNumber: cleanedPhoneNumber,
        $or: [
          {
            msgDate: {
              $gte: req.query.startDate,
              $lte: req.query.endDate,
            },
          },
          {
            msgDate2: {
              $gte: req.query.startDate,
              $lte: req.query.endDate,
            },
          },
          {
            msgDate3: {
              $gte: req.query.startDate,
              $lte: req.query.endDate,
            },
          },
        ],
      };
    }
    flag = await dashboardService.listOfNumberByFlagStatus(
      inboxFilter,
      req.query.startDate,
      req.query.endDate
    );
  } else {
    inboxFilter = { from: cleanedPhoneNumber };
  }
  // const flag = await dashboardService.listOfNumberByFlagStatus(inboxFilter);
  res.status(httpStatus.CREATED).send(flag);
});

const reportOfDripSchedule = catchAsync(async (req, res) => {
  let nowInPST = moment.tz("America/Los_Angeles");

  // Start of the day in PST
  let startOfDayPST = nowInPST.clone().startOf("day");

  // End of the day in PST
  let endOfDayPST = nowInPST.clone().endOf("day");

  // Convert startOfDay and endOfDay to UTC
  let startOfDay = startOfDayPST.clone().utc().toDate();
  let endOfDay = endOfDayPST.clone().utc().toDate();

  let todayFilter = {
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  };

  let todaySendMessageFilter = {
    isMessageSend: true,
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  };
  const tomorrow = nowInPST.clone().add(1, "days");

  // Start of tomorrow in PST
  const startOfDayPSTtom = tomorrow.clone().startOf("day");

  // End of tomorrow in PST
  const endOfDayPSTtom = tomorrow.clone().endOf("day");

  // Convert startOfDay and endOfDay to UTC
  const startOfTomorrow = startOfDayPSTtom.clone().utc().toDate();
  const endOfTomorrow = endOfDayPSTtom.clone().utc().toDate();

  let tomorrowFilter = {
    isMessageSend: false,
    date: {
      $gte: startOfTomorrow,
      $lt: endOfTomorrow,
    },
  };

  const startOfNext7Days = nowInPST.clone().startOf("day").toDate();
  const endOfNext7Days = moment
    .utc(startOfNext7Days)
    .add(7, "days")
    .endOf("day")
    .toDate();

  let next7DaysFilter = {
    isMessageSend: false,
    date: {
      $gte: startOfNext7Days,
      $lt: endOfNext7Days,
    },
  };

  const startOfNext30Days = nowInPST.clone().startOf("day").toDate();
  const endOfNext30Days = moment
    .utc(startOfNext30Days)
    .add(30, "days")
    .endOf("day")
    .toDate();

  let next30DaysFilter = {
    isMessageSend: false,
    date: {
      $gte: startOfNext30Days,
      $lt: endOfNext30Days,
    },
  };

  const promises = [
    dashboardService.reportOfDripSchedule(todayFilter),
    dashboardService.reportOfDripScheduleMessageSend(todaySendMessageFilter),
    dashboardService.reportOfDripSchedule(tomorrowFilter),
    dashboardService.reportOfDripSchedule(next7DaysFilter),
    dashboardService.reportOfDripSchedule(next30DaysFilter),
  ];

  try {
    const [
      todayMessageCount,
      todaySendedMessageCount,
      tomorrowMessageCount,
      next7DaysMessageCount,
      next30DaysMessageCount,
    ] = await Promise.all(promises);
    const todayMessagepercentage = Math.min(
      (todaySendedMessageCount / todayMessageCount) * 100,
      100
    );
    let report = {
      todayMessageCount: todayMessageCount,
      today: parseFloat(todayMessagepercentage).toFixed(2),
      tomorrow: tomorrowMessageCount,
      next7Days: next7DaysMessageCount,
      next30Days: next30DaysMessageCount,
    };
    res.status(httpStatus.CREATED).send(report);
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ error: error });
  }
});

const reportOfTopDrip = catchAsync(async (req, res) => {
  const inbox = await dashboardService.reportOfTopDrip();
  res.status(httpStatus.CREATED).send(inbox);
});

const reportOfNoStatus = catchAsync(async (req, res) => {
  let userId;
  if (req.user.role) {
    if (req.user.role.name) {
      if (req.user.role.name !== "admin") {
        userId = req.user._id;
      }
    }
  }
  const inbox = await dashboardService.reportOfNoStatus(userId);
  res.status(httpStatus.CREATED).send(inbox);
});

const reportOfReminder = catchAsync(async (req, res) => {
  let userId;
  if (req.user.role) {
    if (req.user.role.name) {
      if (req.user.role.name !== "admin") {
        userId = req.user._id;
      }
    }
  }
  const inbox = await dashboardService.reportOfReminder(userId);
  res.status(httpStatus.CREATED).send(inbox);
});

const reportOfUnRead = catchAsync(async (req, res) => {
  let userId;
  if (req.user.role) {
    if (req.user.role.name) {
      if (req.user.role.name !== "admin") {
        userId = req.user._id;
      }
    }
  }
  const inbox = await dashboardService.reportOfUnRead(userId);
  res.status(httpStatus.CREATED).send(inbox);
});

const reportOfUnAnswered = catchAsync(async (req, res) => {
  let userId;
  if (req.user.role) {
    if (req.user.role.name) {
      if (req.user.role.name !== "admin") {
        userId = req.user._id;
      }
    }
  }
  const inbox = await dashboardService.reportOfUnAnswered(userId);
  res.status(httpStatus.CREATED).send(inbox);
});

const reoprtOfUnReadUnAnswered = catchAsync(async (req, res) => {
  let userId;
  if (req.user.role) {
    if (req.user.role.name) {
      if (req.user.role.name !== "admin") {
        userId = req.user._id;
      }
    }
  }
  const inbox = await dashboardService.reoprtOfUnReadUnAnswered(userId);
  res.status(httpStatus.CREATED).send(inbox);
});

module.exports = {
  getTotalLeadsBreakDown,
  getTopThreeCampaigns,
  getCountOfMessages,
  getCountOfTags,
  getCountOfMessagesInLastThirtyMinutes,
  getAverageReplyTime,
  reportOfSendAndQueMessages,
  reportOfBasicStats,
  reportOfProspectLeads,
  reportOfFlagStatus,
  reportOfFlagStatusByNumber,
  reportOfDripSchedule,
  reportOfTopDrip,
  listOfNumberByFlagStatus,
  reportOfNoStatus,
  reportOfReminder,
  reportOfUnRead,
  reportOfUnAnswered,
  reoprtOfUnReadUnAnswered,
};
