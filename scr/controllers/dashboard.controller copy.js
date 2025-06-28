const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { dashboardService } = require("../services");
const { User, Batch, Inbox, CsvData } = require("../models");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const mysql = require("mysql2/promise");
const { start } = require("pm2");
const pool = mysql.createPool({
  host: process.env.dbWriteHost,
  user: process.env.dbUser,
  database: "launchsms",
  password: process.env.dbPassword,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 3600000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

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
    const startOfDay = nowInPST.clone().startOf("day").toDate();
    const endOfDay = nowInPST.clone().add(1, "days").startOf("day").toDate();
    totalFilter = {
      $and: [
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
    $or: [
      { "messages.isIncoming": true },
      { "messagesPhone2.isIncoming": true },
      { "messagesPhone3.isIncoming": true },
    ],
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
    let startOfDay = nowInPST.clone().startOf("day").toDate();
    startOfDay = moment.utc(startOfDay);
    startOfDay.set({
      hour: Number("00"),
      minute: Number("00"),
      second: Number("00"),
      millisecond: Number("00"),
    });
    let endOfDay = moment.utc(startOfDay);
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
    const startOfDay = nowInPST.clone().startOf("day").toDate();
    const endOfDay = nowInPST.clone().add(1, "days").startOf("day").toDate();
    filter = {
      $and: [
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
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
  if (req.query.today) {
    let startOfDay = nowInPST.clone().startOf("day").toDate();
    startOfDay = moment.utc(startOfDay);
    startOfDay.set({
      hour: Number("00"),
      minute: Number("00"),
      second: Number("00"),
      millisecond: Number("00"),
    });
    let endOfDay = moment.utc(startOfDay);
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
    startDate = startOfDay;
    endDate = endOfDay;
  }
  if (req.query.week) {
    const startOfWeek = nowInPST.clone().startOf("isoWeek").toDate();
    const endOfWeek = nowInPST.clone().endOf("isoWeek").toDate();
    startDate = startOfWeek;
    endDate = endOfWeek;
  }
  if (req.query.month) {
    startDate = nowInPST.clone().startOf("month").toDate();
    endDate = nowInPST.clone().endOf("month").add(1, "day").toDate();
  }
  if (req.query.startDate && req.query.endDate) {
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
    const nowInPST = moment().tz("America/Los_Angeles");
    const startOfDay = nowInPST.clone().startOf("day").toDate();
    const endOfDay = nowInPST.clone().add(1, "days").startOf("day").toDate();
    console.log(startOfDay);
    console.log(endOfDay);
    let inboxFilter = {
      $and: [
        {
          updatedAt: {
            $gte: startOfDay,
            $lt: endOfDay,
          },
        },
        {
          $or: [
            { "messages.isIncoming": true },
            { "messagesPhone2.isIncoming": true },
            { "messagesPhone3.isIncoming": true },
          ],
        },
        {
          $or: [{ isVerifiedNumber: true }, { isVerifiedNumberPhone2: true }],
        },
      ],
    };
    let inboxResult = await Inbox.find(inboxFilter).select("to");
    console.log("inboxResult", inboxResult);
    const yesterdayInPST = moment()
      .tz("America/Los_Angeles")
      .subtract(1, "days");

    // Start of yesterday in PST
    const startOfYesterday = yesterdayInPST.clone().startOf("day").toDate();

    // End of yesterday in PST (start of today)
    const endOfYesterday = yesterdayInPST.clone().endOf("day").toDate();

    let previousDayFilter = {
      createdAt: {
        $gte: startOfYesterday,
        $lt: endOfYesterday,
      },
    };
    let todayFilter = {
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    };

    let todayBatchesArray = await Batch.find(todayFilter);

    const todayBatchestoValues = todayBatchesArray.map((item) =>
      String(item._id)
    );

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

    fourthyEightHourFilter = {
      createdAt: {
        $gte: previousYesterday,
        $lt: endOfPreviousYesterday,
      },
    };

    let previousDayBatchesArray = await Batch.find(previousDayFilter);
    let previousFourtyEightBatchesArray = await Batch.find(
      fourthyEightHourFilter
    );
    const prevbatchestoValues = previousDayBatchesArray.map((item) =>
      String(item._id)
    );
    const FourtybatchestoValues = previousFourtyEightBatchesArray.map((item) =>
      String(item._id)
    );

    let inbox = [
      {
        totalMessagesSent: 0,
        totalMessagesInQueue: 0,
      },
    ];
    const toValues = inboxResult.map((item) => `${item.to}`);
    //sendcounttoal
    if (
      todayBatchestoValues.length > 0 ||
      prevbatchestoValues.length > 0 ||
      FourtybatchestoValues.length > 0
    ) {
      let matchCondition = {
        batchId: { $ne: null },
        msgDate: { $ne: null },
      };
      let groupCondition = {
        _id: null,
        TotalCount: {
          $sum: {
            $cond: [
              {
                $or: [
                  {
                    $and: [
                      { $ne: ["$phone1", ""] },
                      { $eq: ["$status", 1] },
                      todayBatchestoValues.length > 0
                        ? { $in: ["$batchId", todayBatchestoValues] }
                        : { $in: ["$batchId", []] },
                    ],
                  },
                  {
                    $and: [
                      { $ne: ["$phone2", ""] },
                      { $eq: ["$status2", 1] },
                      prevbatchestoValues.length > 0
                        ? { $in: ["$batchId", prevbatchestoValues] }
                        : { $in: ["$batchId", []] },
                    ],
                  },
                  {
                    $and: [
                      { $ne: ["$phone3", ""] },
                      { $eq: ["$status3", 1] },
                      FourtybatchestoValues.length > 0
                        ? { $in: ["$batchId", FourtybatchestoValues] }
                        : { $in: ["$batchId", []] },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      };

      let pipeline = [{ $match: matchCondition }, { $group: groupCondition }];

      // Execute the aggregation pipeline
      let Statusdata = await CsvData.aggregate(pipeline);
      console.log("Statusdata", Statusdata);
      inbox[0].totalMessagesSent = Statusdata[0].TotalCount;
    } else {
      inbox[0].totalMessagesSent = 0;
    }
    //quecount
    if (prevbatchestoValues.length > 0 || FourtybatchestoValues.length > 0) {
      let matchCondition = {
        batchId: { $ne: null },
        msgDate: { $ne: null },
      };

      // Add 'NOT IN' condition only if toValues is not empty
      if (toValues.length > 0) {
        matchCondition.phone1 = { $nin: toValues };
      }

      let groupCondition = {
        _id: null,
        TotalCount: {
          $sum: {
            $cond: [
              {
                $or: [
                  {
                    $and: [
                      { $ne: ["$phone2", ""] },
                      { $eq: ["$status2", 0] },
                      prevbatchestoValues.length > 0
                        ? { $in: ["$batchId", prevbatchestoValues] }
                        : { $in: ["$batchId", []] },
                    ],
                  },
                  {
                    $and: [
                      { $ne: ["$phone3", ""] },
                      { $eq: ["$status3", 0] },
                      FourtybatchestoValues.length > 0
                        ? { $in: ["$batchId", FourtybatchestoValues] }
                        : { $in: ["$batchId", []] },
                    ],
                  },
                ],
              },
              1,
              0,
            ],
          },
        },
      };

      let pipeline = [{ $match: matchCondition }, { $group: groupCondition }];

      // Execute the aggregation pipeline
      let Statusdata = await CsvData.aggregate(pipeline);
      console.log("Statusdata", Statusdata);
      inbox[0].totalMessagesInQueue = Statusdata[0].TotalCount;
    } else {
      inbox[0].totalMessagesInQueue = 0;
    }

    res.status(httpStatus.CREATED).send(inbox);
  } catch (error) {
    console.error("Error inserting data:", error);
    // throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
});

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
      let startOfDay = nowInPST.clone().startOf("day").toDate();
      startOfDay = moment.utc(startOfDay);
      startOfDay.set({
        hour: Number("00"),
        minute: Number("00"),
        second: Number("00"),
        millisecond: Number("00"),
      });
      let endOfDay = moment.utc(startOfDay);
      endOfDay.set({
        hour: 23,
        minute: 59,
        second: Number("00"),
        millisecond: Number("00"),
      });
      startOfDay = startOfDay.toDate();
      endOfDay = endOfDay.toDate();
      filter = {
        $or: [
          { "messages.isIncoming": true },
          { "messagesPhone2.isIncoming": true },
          { "messagesPhone3.isIncoming": true },
        ],
      };
      inbox = await dashboardService.reportOfProspectLeads(
        filter,
        startOfDay,
        endOfDay
      );
        console.log("start",startOfDay);
        console.log("end", endOfDay);
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
        inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        inbox[0].received = Math.abs(
          inbox[0].respInitialCount - inbox[0].received
        );
        inbox[0].totalMessages = Math.abs(
          inbox[0].respInitialCount +
            inbox[0].respInitialCount -
            inbox[0].totalMessages
        );
        inbox[0].sentPercentage = Math.abs(
          (inbox[0].sent / inbox[0].totalMessages) * 100
        );
        inbox[0].receivedPercentage = Math.abs(
          (inbox[0].received / inbox[0].totalMessages) * 100
        );
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
        //console.log("followMessage", followDelivery);

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        inbox[0].respfollowCount = respfollowCount;

        let followresp = 0;
        // if (followDeliveryCount > 0) {
        //   followresp = followResp[0].totalCount / followDeliveryCount;
        // }
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
        //console.log("followMessage", followDelivery);

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        let followresp = 0;
        if (followDeliveryCount > 0) {
          followresp = followResp[0].totalCount / followDeliveryCount;
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
        $or: [
          { "messages.isIncoming": true },
          { "messagesPhone2.isIncoming": true },
          { "messagesPhone3.isIncoming": true },
        ],
      };
      inbox = await dashboardService.reportOfProspectLeads(
        filter,
        startOfDay,
        endOfDay
      );
      console.log("startOfDay", startOfDay);
      console.log("endofday", endOfDay);
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

        inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        inbox[0].received = Math.abs(
          inbox[0].respInitialCount - inbox[0].received
        );
        inbox[0].totalMessages = Math.abs(
          inbox[0].respInitialCount +
            inbox[0].respInitialCount -
            inbox[0].totalMessages
        );
        inbox[0].sentPercentage = Math.abs(
          (inbox[0].sent / inbox[0].totalMessages) * 100
        );
        inbox[0].receivedPercentage = Math.abs(
          (inbox[0].received / inbox[0].totalMessages) * 100
        );
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
        //console.log("followMessage", followDelivery);

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        inbox[0].respfollowCount = respfollowCount;

        let followresp = 0;
        if (followDeliveryCount > 0) {
          followresp = followResp[0].totalCount / followDeliveryCount;
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
        //console.log("followMessage", followDelivery);

        let respfollowCount = aggregatedDataFollow[0]?.totalResponseCount
          ? aggregatedDataFollow[0].totalResponseCount
          : 0;
        let followresp = 0;
        if (followDeliveryCount > 0) {
          followresp = followResp[0].totalCount / followDeliveryCount;
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
        $or: [
          { "messages.isIncoming": true },
          { "messagesPhone2.isIncoming": true },
          { "messagesPhone3.isIncoming": true },
        ],
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
        inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        inbox[0].received = Math.abs(
          inbox[0].respInitialCount - inbox[0].received
        );
        inbox[0].totalMessages = Math.abs(
          inbox[0].respInitialCount +
            inbox[0].respInitialCount -
            inbox[0].totalMessages
        );
        inbox[0].sentPercentage = Math.abs(
          (inbox[0].sent / inbox[0].totalMessages) * 100
        );
        inbox[0].receivedPercentage = Math.abs(
          (inbox[0].received / inbox[0].totalMessages) * 100
        );
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
        // if (followDeliveryCount > 0) {
        //   followresp = followResp[0].totalCount / followDeliveryCount;
        // }
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
        if (followDeliveryCount > 0) {
          followresp = followResp[0].totalCount / followDeliveryCount;
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
        $or: [
          { "messages.isIncoming": true },
          { "messagesPhone2.isIncoming": true },
          { "messagesPhone3.isIncoming": true },
        ],
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
        inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        inbox[0].received = Math.abs(
          inbox[0].respInitialCount - inbox[0].received
        );
        inbox[0].totalMessages = Math.abs(
          inbox[0].respInitialCount +
            inbox[0].respInitialCount -
            inbox[0].totalMessages
        );
        inbox[0].sentPercentage = Math.abs(
          (inbox[0].sent / inbox[0].totalMessages) * 100
        );
        inbox[0].receivedPercentage = Math.abs(
          (inbox[0].received / inbox[0].totalMessages) * 100
        );
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
          followresp = followResp[0].totalCount / followDeliveryCount;
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
        if (followDeliveryCount > 0) {
          followresp = followResp[0].totalCount / followDeliveryCount;
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
        $or: [
          { "messages.isIncoming": true },
          { "messagesPhone2.isIncoming": true },
          { "messagesPhone3.isIncoming": true },
        ],
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
        inbox[0].sent = Math.abs(inbox[0].respInitialCount - inbox[0].sent);
        inbox[0].received = Math.abs(
          inbox[0].respInitialCount - inbox[0].received
        );
        inbox[0].totalMessages = Math.abs(
          inbox[0].respInitialCount +
            inbox[0].respInitialCount -
            inbox[0].totalMessages
        );
        inbox[0].sentPercentage = Math.abs(
          (inbox[0].sent / inbox[0].totalMessages) * 100
        );
        inbox[0].receivedPercentage = Math.abs(
          (inbox[0].received / inbox[0].totalMessages) * 100
        );
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
          followresp = followResp[0].totalCount / followDeliveryCount;
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
        if (followDeliveryCount > 0) {
          followresp = followResp[0].totalCount / followDeliveryCount;
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
    console.log(error);
    res.status(500).send({ message: error.message });
  }
});

async function aggregatedDataForprospectLeads(startOfDay, endOfDay) {
  console.log(startOfDay);
  console.log(endOfDay);
  const sentCountPipeline = [
    {
      $match: {
        $or: [
          { msgDate: { $gte: startOfDay, $lte: endOfDay }, status: 1 },
          { msgDate2: { $gte: startOfDay, $lte: endOfDay }, status2: 1 },
          { msgDate3: { $gte: startOfDay, $lte: endOfDay }, status3: 1 },
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
  console.log("totalSentCount", totalSentCount);
  const deliveredCountPipeline = [
    {
      $match: {
        $or: [
          { msgDate: { $gte: startOfDay, $lte: endOfDay }, delivered: 1 },
          { msgDate2: { $gte: startOfDay, $lte: endOfDay }, delivered2: 1 },
          { msgDate3: { $gte: startOfDay, $lte: endOfDay }, delivered3: 1 },
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
  console.log("totalDeliveredCount", totalDeliveredCount);
  const responseCountPipeline = [
    {
      $match: {
        $or: [
          { msgDate: { $gte: startOfDay, $lte: endOfDay }, response: 1 },
          { msgDate2: { $gte: startOfDay, $lte: endOfDay }, response2: 1 },
          { msgDate3: { $gte: startOfDay, $lte: endOfDay }, response3: 1 },
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
  console.log("totalResponseCount", totalResponseCount);
  return { totalSentCount, totalDeliveredCount, totalResponseCount };
}
const reportOfFlagStatus = catchAsync(async (req, res) => {
  let filter;

  if (req.query.today) {
    const todayPST = moment().tz("America/Los_Angeles").startOf("day");
    const endOfTodayPST = moment().tz("America/Los_Angeles").endOf("day");

    filter = {
      createdAt: {
        $gte: todayPST.toDate(),
        $lt: endOfTodayPST.toDate(),
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
  let filter;
  let { phone } = req.params;
  if (req.query.today) {
    const todayPST = moment().tz("America/Los_Angeles").startOf("day");
    const endOfTodayPST = moment().tz("America/Los_Angeles").endOf("day");

    filter =
      phone === "all"
        ? {
            createdAt: {
              $gte: todayPST.toDate(),
              $lt: endOfTodayPST.toDate(),
            },
          }
        : {
            $and: [
              {
                createdAt: {
                  $gte: todayPST.toDate(),
                  $lt: endOfTodayPST.toDate(),
                },
              },
              { "message.from": phone },
            ],
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
                  $lt: endOfYesterdayPST.toDate(),
                },
              },
              { "message.from": phone },
            ],
          };
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
              $lt: endOfWeekPST.toDate(),
            },
          }
        : {
            $and: [
              {
                createdAt: {
                  $gte: startOfWeekPST.toDate(),
                  $lt: endOfWeekPST.toDate(),
                },
              },
              { "message.from": phone },
            ],
          };
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
  } else if (req.query.startDate && req.query.endDate) {
    if (phone === "all") {
      filter = {
        createdAt: {
          $gte: req.query.startDate,
          $lt: req.query.endDate,
        },
      };
    } else {
      filter = {
        $and: [
          {
            createdAt: {
              $gte: req.query.startDate,
              $lt: req.query.endDate,
            },
          },
          { "message.from": phone },
        ],
      };
    }
  } else {
    filter = { "message.from": phone };
  }
  const flag = await dashboardService.reportOfFlagStatusByNumber(filter);
  res.status(httpStatus.CREATED).send(flag);
});

const reportOfDripSchedule = catchAsync(async (req, res) => {
  const nowInPST = moment().tz("America/Los_Angeles");
  let startOfDay = nowInPST.clone().startOf("day").toDate();
  startOfDay = moment.utc(startOfDay);
  startOfDay.set({
    hour: Number("00"),
    minute: Number("00"),
    second: Number("00"),
    millisecond: Number("00"),
  });
  let endOfDay = moment.utc(startOfDay);
  endOfDay.set({
    hour: 23,
    minute: 59,
    second: Number("00"),
    millisecond: Number("00"),
  });
  startOfDay = startOfDay.toDate();
  endOfDay = endOfDay.toDate();
  let todayFilter = {
    dripAutomation: { $exists: true },
    "dripAutomationSchedule.isMessageSend": false,
    "dripAutomationSchedule.date": {
      $gte: startOfDay,
      $lt: endOfDay,
    },
  };
  const tomorrowInPST = moment().tz("America/Los_Angeles").add(1, "days");
  let startOfTomorrow = tomorrowInPST.clone().startOf("day").toDate();
  startOfTomorrow = moment.utc(startOfTomorrow);

  startOfTomorrow.set({
    hour: Number("00"),
    minute: Number("00"),
    second: Number("00"),
    millisecond: Number("00"),
  });
  let endOfTomorrow = moment.utc(startOfTomorrow);
  endOfTomorrow.set({
    hour: 23,
    minute: 59,
    second: Number("00"),
    millisecond: Number("00"),
  });
  startOfTomorrow = startOfTomorrow.toDate();
  endOfTomorrow = endOfTomorrow.toDate();
  let tomorrowFilter = {
    dripAutomation: { $exists: true },
    "dripAutomationSchedule.isMessageSend": false,
    "dripAutomationSchedule.date": {
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
    dripAutomation: { $exists: true },
    "dripAutomationSchedule.isMessageSend": false,
    "dripAutomationSchedule.date": {
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
    dripAutomation: { $exists: true },
    "dripAutomationSchedule.isMessageSend": false,
    "dripAutomationSchedule.date": {
      $gte: startOfNext30Days,
      $lt: endOfNext30Days,
    },
  };

  const promises = [
    dashboardService.reportOfDripScheduleMessageToday(
      todayFilter,
      startOfDay,
      endOfDay
    ),
    dashboardService.reportOfDripScheduleMessageSend(
      todayFilter,
      startOfDay,
      endOfDay
    ),
    dashboardService.reportOfDripSchedule(
      tomorrowFilter,
      startOfTomorrow,
      endOfTomorrow
    ),
    dashboardService.reportOfDripSchedule(
      next7DaysFilter,
      startOfNext7Days,
      endOfNext7Days
    ),
    dashboardService.reportOfDripSchedule(
      next30DaysFilter,
      startOfNext30Days,
      endOfNext30Days
    ),
  ];

  try {
    const [
      todayMessageCount,
      todaySendedMessageCount,
      tomorrowMessageCount,
      next7DaysMessageCount,
      next30DaysMessageCount,
    ] = await Promise.all(promises);
    const todayMessagepercentage =
      (todaySendedMessageCount / todayMessageCount) * 100;
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
  let filter = { dripAutomation: { $exists: true } };
  const inbox = await dashboardService.reportOfTopDrip(filter);
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
};
