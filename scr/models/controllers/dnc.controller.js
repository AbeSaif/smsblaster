const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { dncService } = require("../services");
const pick = require("../utils/pick");
const { DNC, Inbox, CsvData } = require("../models");
const fs = require("fs");
const Json2csvParser = require("json2csv").Parser;
const csvParser = require("csv-parser");

const cleanPhoneNumber = (number) => {
  if (!number) return "";
  let cleanedNumber = number.replace(/[^0-9]/g, "");
  if (
    (number.startsWith("1") || number.startsWith("+1")) &&
    cleanedNumber.startsWith("1")
  ) {
    cleanedNumber = cleanedNumber.substring(1);
  }
  return cleanedNumber;
};

const createDNC = catchAsync(async (req, res) => {
  let body = req.body;
  body.number = cleanPhoneNumber(body.number);
  const dnc = await dncService.createDNC(body);
  res.status(httpStatus.CREATED).send(dnc);
});

const getAllDNC = catchAsync(async (req, res) => {
  let filter = {};
  let options = {};
  if (!req.query.search) {
    options = pick(req.query, ["limit", "page"]);
  }
  options.sortBy = "createdAt:desc";
  if (req.query.search) {
    filter = {
      $or: [
        { number: { $regex: req.query.search.trim(), $options: "i" } },
        { firstName: { $regex: req.query.search.trim(), $options: "i" } },
        { lastName: { $regex: req.query.search.trim(), $options: "i" } },
        {
          $and: [
            { firstName: { $regex: req.query.search.trim(), $options: "i" } },
            { lastName: { $regex: req.query.search.trim(), $options: "i" } },
          ],
        },
      ],
    };
  }
  const dnc = await dncService.getAllDNC(filter, options);
  res.status(httpStatus.CREATED).send(dnc);
});

const updateDNC = catchAsync(async (req, res) => {
  let { dncId } = req.params;
  let body = req.body;
  if (body.number) {
    body.number = cleanPhoneNumber(body.number);
  }
  const dnc = await dncService.updateDNC(dncId, body);
  res.status(httpStatus.CREATED).send(dnc);
});

const deleteDNC = catchAsync(async (req, res) => {
  let { dncId } = req.params;
  const dnc = await dncService.deleteDNC(dncId);
  res.status(httpStatus.CREATED).send(dnc);
});

const getDNCById = catchAsync(async (req, res) => {
  let { dncId } = req.params;
  const dnc = await dncService.getDNCById(dncId);
  res.status(httpStatus.CREATED).send(dnc);
});

const exportDnc = catchAsync(async (req, res) => {
  const csvFields = [
    {
      label: "PhoneNumber",
      value: `number`,
    },
    {
      label: "FirstName",
      value: `firstName`,
    },
    {
      label: "LastName",
      value: `lastName`,
    },
    {
      label: "Permanent",
      value: `permanent`,
    },
  ];
  const json2csvParser = new Json2csvParser({
    fields: csvFields,
  });
  let finalArray = [];
  const csvDataResult = await DNC.find({}).sort({ createdAt: -1 });
  if (csvDataResult.length > 0) {
    csvDataResult.forEach((data) => {
      finalArray.push({
        firstName: data?.firstName ? data.firstName : "",
        lastName: data?.lastName ? data.lastName : "",
        number: data?.number ? data.number : "",
        permanent: data?.permanent && data.permanent === true ? "Yes" : "No",
      });
    });
    const csvData = json2csvParser.parse(finalArray);
    const filePath = `dnc_${new Date().getTime()}.csv`;
    fs.writeFile(`public/uploads/${filePath}`, csvData, function (error) {
      if (error)
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Something went wrong while downloading..."
        );
      return res.download(`public/uploads/${filePath}`);
    });
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "No record found");
  }
});

const importDnc = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Csv or excel file is required");
  }
  if (req.file.mimetype != "text/csv") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only csv files are allowed!");
  }
  try {
    let dncArray = [];
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on("data", async (data) => {
        dncArray.push({
          number: data?.number ? cleanPhoneNumber(data.number) : "",
          firstName: data?.firstName ? data.firstName : "",
          lastName: data?.lastName ? data.lastName : "",
          permanent: data?.permanent ? data.permanent : "",
        });
      })

      .on("end", async () => {
        try {
          if (dncArray.length > 0) {
            const updateInboxPromises = dncArray.map(async (dncEntry) => {
              const { number } = dncEntry;
              const inboxResult = await Inbox.findOne({
                $or: [{ to: number }, { phone2: number }, { phone3: number }],
              });

              if (inboxResult) {
                const updateFields = {};
                if (inboxResult.to === number) {
                  updateFields.isAddedToDNC = true;
                } else if (inboxResult.phone2 === number) {
                  updateFields.isAddedToDNCPhone2 = true;
                } else if (inboxResult.phone3 === number) {
                  updateFields.isAddedToDNCPhone3 = true;
                }

                if (Object.keys(updateFields).length > 0) {
                  await Inbox.findByIdAndUpdate(
                    inboxResult._id,
                    { $set: updateFields },
                    { new: true }
                  );
                }
              }

              let updatedInbox = await Inbox.findOne({
                $or: [{ to: number }, { phone2: number }, { phone3: number }],
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
                messagePhone2HasIncomingMessage =
                  updatedInbox.messagesPhone2.filter((item) => item.isIncoming);
                messagePhone3HasIncomingMessage =
                  updatedInbox.messagesPhone3.filter((item) => item.isIncoming);
              }
              if (
                updatedInbox?.messages?.length > 0 &&
                updatedInbox?.messagesPhone2?.length > 0 &&
                updatedInbox?.messagesPhone3?.length > 0
              ) {
                if (
                  updatedInbox?.isAddedToDNC === true &&
                  updatedInbox?.isAddedToDNCPhone2 === true &&
                  updatedInbox?.isAddedToDNCPhone3 === true
                ) {
                  updatedInbox.status = "65ba97b6ae9753518b56d3d4";
                  await updatedInbox.save({ timestamps: false });
                } else if (
                  (updatedInbox.status.toString() !==
                    "651ebe648042b1b3f4674ea2" &&
                    updatedInbox.status.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInbox.status.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInbox.status.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
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
                    (updatedInbox.status.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                      updatedInbox.status.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInbox.status.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInbox.status.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
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
                  updatedInbox?.isAddedToDNC === true &&
                  updatedInbox?.isAddedToDNCPhone2 === true
                ) {
                  updatedInbox.status = "65ba97b6ae9753518b56d3d4";
                  await updatedInbox.save({ timestamps: false });
                } else if (
                  (updatedInbox?.status?.toString() !==
                    "651ebe648042b1b3f4674ea2" &&
                    updatedInbox?.status?.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInbox?.status?.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInbox?.status?.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    messageHasIncomingMessage?.length > 0 &&
                    messagePhone2HasIncomingMessage?.length <= 0) ||
                  (messageHasIncomingMessage?.length <= 0 &&
                    messagePhone2HasIncomingMessage?.length > 0)
                ) {
                  if (
                    (updatedInbox?.status?.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                      updatedInbox?.status?.toString() !==
                        "651ebe5b8042b1b3f4674ea0" &&
                      updatedInbox?.status?.toString() !==
                        "651ebe268042b1b3f4674e9b" &&
                      updatedInbox?.status?.toString() !==
                        "651ebe4e8042b1b3f4674e9d" &&
                      // updatedInbox.isVerifiedNumber !== true &&
                      // updatedInbox.isVerifiedNumberPhone2 !== true &&
                      updatedInbox?.isAddedToDNC === true) ||
                    updatedInbox?.isAddedToDNCPhone2 === true
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
                  updatedInbox?.status?.toString() !==
                    "651ebe648042b1b3f4674ea2" &&
                  updatedInbox?.status?.toString() !==
                    "651ebe5b8042b1b3f4674ea0" &&
                  updatedInbox?.status?.toString() !==
                    "651ebe268042b1b3f4674e9b" &&
                  updatedInbox?.status?.toString() !==
                    "651ebe4e8042b1b3f4674e9d"
                ) {
                  if (
                    updatedInbox?.status?.toString() !==
                      "651ebe648042b1b3f4674ea2" &&
                    updatedInbox?.status?.toString() !==
                      "651ebe5b8042b1b3f4674ea0" &&
                    updatedInbox?.status?.toString() !==
                      "651ebe268042b1b3f4674e9b" &&
                    updatedInbox?.status?.toString() !==
                      "651ebe4e8042b1b3f4674e9d" &&
                    updatedInbox?.isAddedToDNC === true
                  ) {
                    updatedInbox.status = "65ba97b6ae9753518b56d3d4";
                    await updatedInbox.save({ timestamps: false });
                  }
                }
              }

              const csvResult = await CsvData.findOne({
                $or: [
                  { phone1: number },
                  { phone2: number },
                  { phone3: number },
                ],
              });

              if (csvResult) {
                if (csvResult.phone1 === number) {
                  csvResult.dncPhone1 = true;
                } else if (csvResult.phone2 === number) {
                  csvResult.dncPhone2 = true;
                } else if (csvResult.phone3 === number) {
                  csvResult.dncPhone3 = true;
                }
                await csvResult.save();
              }

              const dncResult = await DNC.findOne({ number });

              if (!dncResult) {
                const finalResult = {};
                if (number) finalResult["number"] = number;
                if (dncEntry.firstName)
                  finalResult["firstName"] = dncEntry.firstName;
                if (dncEntry.lastName)
                  finalResult["lastName"] = dncEntry.lastName;

                if (Object.keys(finalResult).length > 0) {
                  await DNC.create(finalResult);
                }
              }
            });

            await Promise.all(updateInboxPromises);

            return res.sendStatus(200);
          } else {
            return res
              .status(httpStatus.BAD_REQUEST)
              .send({ message: "No record found" });
          }
        } catch (error) {
          console.error("Error processing DNC entries:", error);
          return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .send({ message: "Internal server error" });
        }
      });
  } catch (err) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
  }
});

module.exports = {
  createDNC,
  getAllDNC,
  updateDNC,
  deleteDNC,
  getDNCById,
  exportDnc,
  importDnc,
};
