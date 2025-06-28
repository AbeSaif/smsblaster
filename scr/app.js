const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const cors = require("cors");
const httpStatus = require("http-status");
const config = require("./config/config");
const morgan = require("./config/morgan");
const { authLimiter } = require("./middlewares/rateLimiter");
const logRequest = require("./middlewares/logRequest");
const routes = require("./routes");
const http = require("http");
const cron = require("node-cron");
const { Reminder, Inbox } = require("./models");
const { Batch } = require("./models");
const { Client, ApiController } = require("@bandwidth/messaging");
const { InitialAndFollowTemplate } = require("./models");
const {
  errorConverter,
  errorHandler,
  wrongJwtToken,
  singleImageRequired,
  expireJwtToken,
} = require("./middlewares/error");
const ApiError = require("./utils/ApiError");
const logger = require("./config/logger");
const { batchCronController } = require("./controllers");

const app = express();
const server = http.createServer(app);

// Increase the timeout duration (e.g., 60 seconds)
server.timeout = 6000000;
// const dir = "./public/uploads";
if (config.env !== "test") {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

const BW_USERNAME = "ZeitBlast_API";
const BW_PASSWORD = "AnjumAPI2024!";
const BW_ACCOUNT_ID = "5009813";
const BW_MESSAGING_APPLICATION_ID = process.env.dev_bw_id;
const client = new Client({
  basicAuthUserName: BW_USERNAME,
  basicAuthPassword: BW_PASSWORD,
});

const controller = new ApiController(client);
const accountId = BW_ACCOUNT_ID;

// cron.schedule("* * * * *", async () => {
//   batchCronController.getAllPreviousDayBatches();
//   console.log("exec")
// });
// if (process.env.REMINDER_ENV === "production") {
//   // check reminder after every 1 minute
//   cron.schedule("* * * * *", async () => {
//     // const now = new Date();
//     // try {
//     //   const dueReminders = await Reminder.find({ date: { $lte: now } });
//     //   if (dueReminders.length > 0) {
//     //     dueReminders.forEach(async (reminder) => {
//     //       console.log("reminder.isVerified", reminder.isVerified);
//     //       if (reminder.isVerified === true) {
//     //         await controller.createMessage(accountId, {
//     //           applicationId: BW_MESSAGING_APPLICATION_ID,
//     //           to: [reminder.to],
//     //           from: reminder.from,
//     //           text: reminder.message,
//     //         });
//     //       }
//     //       let messageBody = {
//     //         content: reminder.message,
//     //         phone: reminder.to,
//     //         creationDate: new Date(),
//     //         isIncoming: false,
//     //         isOutgoing: true,
//     //         isViewed: false,
//     //       };
//     //       let existingPhoneNumber = reminder.to;
//     //       const filter = {
//     //         $or: [
//     //           { to: existingPhoneNumber },
//     //           { phone2: existingPhoneNumber },
//     //           { phone3: existingPhoneNumber },
//     //         ],
//     //       };
//     //       const options = {
//     //         new: true,
//     //       };
//     //       const inbox = await Inbox.findOne(filter);
//     //       if (inbox) {
//     //         if (inbox.to === existingPhoneNumber) {
//     //           inbox.messages.push(messageBody);
//     //         } else if (inbox.phone2 === existingPhoneNumber) {
//     //           inbox.messagesPhone2.push(messageBody);
//     //         } else if (inbox.phone3 === existingPhoneNumber) {
//     //           inbox.messagesPhone3.push(messageBody);
//     //         }
//     //         let updatedInbox = false;
//     //         console.log("reminder.isVerified", reminder.isVerified);
//     //         if (reminder.isVerified === true) {
//     //           updatedInbox = await Inbox.findOneAndUpdate(
//     //             filter,
//     //             inbox,
//     //             options
//     //           );
//     //         }
//     //         if (updatedInbox) {
//     //           let responseBody = {
//     //             content: reminder.message,
//     //             phone: reminder.to,
//     //             creationDate: new Date(),
//     //             isIncoming: false,
//     //             isOutgoing: true,
//     //             inboxId: updatedInbox._id,
//     //             isViewed: false,
//     //             isReminderSet: false,
//     //           };
//     //           global.io.emit("new-message", responseBody);
//     //         } else {
//     //           let responseBody = {
//     //             isReminderSet: false,
//     //           };
//     //           global.io.emit("new-message", responseBody);
//     //         }
//     //       }
//     //       await Reminder.findByIdAndDelete(reminder._id);
//     //     });
//     //   }
//     // } catch (err) {
//     //   console.error("Error checking due reminders:", err);
//     // }

// cron job to run daily at midnight (12:00 AM)
// cron.schedule(
//   "0 0 * * *",
//   async () => {
//     try {
//       // Find and update templates with quantity equal to 300
//       const result = await InitialAndFollowTemplate.updateMany(
//         {},
//         { quantity: 0 }
//       );
//       console.log(`Updated ${result.nModified} templates.`);
//     } catch (error) {
//       console.error("Error updating templates:", error);
//     }
//   },
//   {
//     scheduled: true,
//     timezone: "UTC",
//   }
// );

//   // cron job to run daily at midnight (12:00 AM)
//   cron.schedule(
//     "0 0 * * *",
//     async () => {
//       // try {
//       //   // Find and update templates with quantity equal to 300
//       //   const result = await InitialAndFollowTemplate.updateMany(
//       //     { quantity: { $gte: 300 } },
//       //     { quantity: 0 }
//       //   );
//       //   console.log(`Updated ${result.nModified} templates.`);
//       // } catch (error) {
//       //   console.error("Error updating templates:", error);
//       // }
//       await batchCronController.resetAutoTemplate();
//     },
//     {
//       scheduled: true,
//       timezone: "UTC",
//     }
//   );

//cron job to run at 8 am UTC every day
// cron.schedule(
//   "0 8 * * *",
//   () => {
//     batchCronController.getAllPreviousDayBatches();
//     batchCronController.getAllFourtyEightHourPreviousBatches();
//     console.log("Cron job is running at 8 am UTC");
//   },
//   {
//     timezone: "UTC",
//   }
// );
// }

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());
app.use(express.urlencoded({ limit: "500mb", extended: true }));
// app.use(expressIP().getIpInfoMiddleware);
// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options("*", cors());

app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// limit repeated failed requests to auth endpoints
if (config.env === "production") {
  app.use("/auth", authLimiter);
}
app.use(express.static("public"));
app.use(logRequest);

app.get("/health", (req, res, next) => {
  res.sendStatus(200);
});

// v1 api routes
app.use(routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.BAD_REQUEST, "API Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);
app.use(wrongJwtToken);
app.use(expireJwtToken);
app.use(singleImageRequired);
// handle error
app.use(errorHandler);

module.exports = app;
