const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const {
  DirectImport,
  CsvData,
  filterProspect,
  DNC,
  MobileVerification,
} = require("../models");
const ApiError = require("../utils/ApiError");
const fs = require("fs");
const csvParser = require("csv-parser");
const { directImportService } = require("../services");
const pick = require("../utils/pick");
const { uploadToS3 } = require("./../utils/fileUpload");
const Json2csvParser = require("json2csv").Parser;
const path = require("path");
const Queue = require("bull");
const moment = require("moment-timezone");

async function checkPhoneType(req, res) {
  let phoneNumber = "+14077485290";
  let cleanedNumber = phoneNumber.replace("+1", "");
  let firstThreeDigits = cleanedNumber.substring(0, 3);
  let nextThreeDigits = cleanedNumber.substring(3, 6);
  let mobileVerResult = await MobileVerification.findOne({
    $and: [
      { npa: firstThreeDigits },
      {
        npxx: nextThreeDigits,
      },
    ],
  });
  res.status(200).json({ mobileVerResult });
}

// const directImportQueue = new Queue("direct-import", {
//   redis: {
//     host: process.env.redis_host,
//     port: process.env.redis_port,
//     password: process.env.redis_pass,
//   },
// });

const cleanPhoneNumber = (number) => {
  if (!number) return "";

  // Remove all non-numeric characters
  let cleanedNumber = number.replace(/[^0-9]/g, "");

  // Remove leading 1 if the original number starts with 1 or +1
  if (
    (number.startsWith("1") || number.startsWith("+1")) &&
    cleanedNumber.startsWith("1")
  ) {
    cleanedNumber = cleanedNumber.substring(1);
  }

  return cleanedNumber;
};

const readAndWriteFile = catchAsync(async (req, res) => {
  const mappedFile = req.files["file"] ? req.files["file"][0] : null;
  const originalFile = req.files["originalFile"]
    ? req.files["originalFile"][0]
    : null;
  if (!mappedFile) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Csv or excel file is required");
  }

  // if (mappedFile.mimetype != "text/csv") {
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Only csv files are allowed!");
  // }

  const results = [];
  const emptyNumbers = [];
  let rowCount = 0;
  let paused = false;
  const queue = [];
  let end = false;

  const stream = fs
    .createReadStream(mappedFile.path)
    .pipe(csvParser())
    .on("data", async (data) => {
      rowCount++;

      queue.push(data);
      if (!paused) {
        stream.pause();
        paused = true;
        while (queue.length) {
          try {
            await processRow(queue.shift());
          } catch (e) {
            console.log(e);
          }
        }
        paused = false;
        stream.resume();
        if (end) {
          stream.emit("finalEnd");
        }
      }

      async function processRow(row) {
        if (
          row?.firstName &&
          row?.lastName &&
          row?.propertyAddress &&
          row?.propertyCity &&
          row?.propertyState &&
          row?.propertyZip &&
          row?.phone1
        ) {
          results.push({
            firstName: row?.firstName ? row.firstName.replace(/,/g, "") : "",
            lastName: row?.lastName ? row.lastName.replace(/,/g, "") : "",
            mailingAddress: row?.mailingAddress ? row.mailingAddress.replace(/,/g, "") : "",
            mailingCity: row?.mailingCity ? row.mailingCity.replace(/,/g, "") : "",
            mailingState: row?.mailingState ? row.mailingState.replace(/,/g, "") : "",
            mailingZip: row?.mailingZip ? row.mailingZip.replace(/,/g, "") : "",
            propertyAddress: row?.propertyAddress ? row.propertyAddress.replace(/,/g, "") : "",
            propertyCity: row?.propertyCity ? row.propertyCity.replace(/,/g, "") : "",
            propertyState: row?.propertyState ? row.propertyState.replace(/,/g, "") : "",
            propertyZip: row?.propertyZip ? row.propertyZip.replace(/,/g, "") : "",
            phone1: cleanPhoneNumber(row?.phone1),
            phone2: cleanPhoneNumber(row?.phone2),
            phone3: cleanPhoneNumber(row?.phone3),
            apn: row?.apn ? row.apn.replace(/,/g, "") : "",
            propertyCounty: row?.propertyCounty ? row.propertyCounty.replace(/,/g, "") : "",
            acreage: row?.acreage ? row.acreage.replace(/,/g, "") : "",

         });
        } else {
          emptyNumbers.push({
            firstName: row?.firstName ? row.firstName : "",
            lastName: row?.lastName ? row.lastName : "",
            mailingAddress: row?.mailingAddress ? row.mailingAddress : "",
            mailingCity: row?.mailingCity ? row.mailingCity : "",
            mailingState: row?.mailingState ? row.mailingState : "",
            mailingZip: row?.mailingZip ? row?.mailingZip : "",
            propertyAddress: row?.propertyAddress ? row?.propertyAddress : "",
            propertyCity: row?.propertyCity ? row.propertyCity : "",
            propertyState: row?.propertyState ? row.propertyState : "",
            propertyZip: row?.propertyZip ? row.propertyZip : "",
            phone1: cleanPhoneNumber(row?.phone1),
            phone2: cleanPhoneNumber(row?.phone2),
            phone3: cleanPhoneNumber(row?.phone3),
            apn: row?.apn ? row.apn : "",
            propertyCounty: row?.propertyCounty ? row.propertyCounty : "",
            acreage: row?.acreage ? row.acreage : "",
          });
        }
      }
    })
    .on("end", async () => {
      end = true;
      if (!queue.length && !paused) {
        stream.emit("finalEnd");
      }
    })
    .on("finalEnd", async () => {
      const filteredArray = results.filter(
        (item) =>
          !(
            item.firstName === "N/A" &&
            item.lastName === "N/A" &&
            item.propertyAddress === "N/A" &&
            item.propertyCity === "N/A" &&
            item.propertyState === "N/A" &&
            item.propertyZip === "N/A" &&
            item.phone1 === "N/A"
          )
      );

      if (results.length === 0) {
        res.status(httpStatus.BAD_REQUEST).send({ message: "File is empty" });
        return;
      }

      const orginialFile = await uploadOriginal(originalFile);

      await processFileUploadapi(
        filteredArray,
        mappedFile,
        req,
        res,
        rowCount,
        emptyNumbers,
        orginialFile
      );
    });
});

// const readAndWriteFile = catchAsync(async (req, res) => {
//   if (!req.file) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Csv or excel file is required");
//   }

//   if (req.file.mimetype != "text/csv") {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Only csv files are allowed!");
//   }
//   const results = [];
//   const emptyNumbers = [];
//   let rowCount = 0;
//   let paused = false;
//   const queue = [];
//   let end = false;
//   let RemoveEmpty = [];
//   const stream = fs
//     .createReadStream(req.file.path)
//     .pipe(csvParser())
//     .on("data", async (data) => {
//       rowCount++;

//       queue.push(data);
//       if (!paused) {
//         stream.pause();
//         paused = true;
//         while (queue.length) {
//           try {
//             await processRow(queue.shift());
//           } catch (e) {
//             // decide what to do here if you get an error processing a row
//             //console.log(e);
//           }
//         }
//         paused = false;
//         stream.resume();
//         if (end) {
//           stream.emit("finalEnd");
//         }
//       }

//       async function processRow(row) {
//         // Check if any of the required fields are empty
//         //console.log("phone1", row.phone1);
//         if (
//           row?.firstName &&
//           row?.lastName &&
//           row?.propertyAddress &&
//           row?.propertyCity &&
//           row?.propertyState &&
//           row?.propertyZip &&
//           row?.phone1
//         ) {
//           results.push({
//             firstName: row?.firstName ? row.firstName : "",
//             lastName: row?.lastName ? row.lastName : "",
//             mailingAddress: row?.mailingAddress ? row.mailingAddress : "",
//             mailingCity: row?.mailingCity ? row.mailingCity : "",
//             mailingState: row?.mailingState ? row.mailingState : "",
//             mailingZip: row?.mailingZip ? row?.mailingZip : "",
//             propertyAddress: data?.propertyAddress ? data?.propertyAddress : "",
//             propertyCity: data?.propertyCity ? data.propertyCity : "",
//             propertyState: data?.propertyState ? data.propertyState : "",
//             propertyZip: data?.propertyZip ? data.propertyZip : "",
//             phone1: cleanPhoneNumber(row?.phone1),
//             phone2: cleanPhoneNumber(row?.phone2),
//             phone3: cleanPhoneNumber(row?.phone3),
//             apn: row?.apn ? row.apn : "",
//             propertyCounty: row?.propertyCounty ? row.propertyCounty : "",
//             acreage: row?.acreage ? row.acreage : "",
//           });
//         } else {
//           emptyNumbers.push({
//             firstName: row?.firstName ? row.firstName : "",
//             lastName: row?.lastName ? row.lastName : "",
//             mailingAddress: row?.mailingAddress ? row.mailingAddress : "",
//             mailingCity: row?.mailingCity ? row.mailingCity : "",
//             mailingState: row?.mailingState ? row.mailingState : "",
//             mailingZip: row?.mailingZip ? row?.mailingZip : "",
//             propertyAddress: data?.propertyAddress ? data?.propertyAddress : "",
//             propertyCity: data?.propertyCity ? data.propertyCity : "",
//             propertyState: data?.propertyState ? data.propertyState : "",
//             propertyZip: data?.propertyZip ? data.propertyZip : "",
//             phone1: cleanPhoneNumber(row?.phone1),
//             phone2: cleanPhoneNumber(row?.phone2),
//             phone3: cleanPhoneNumber(row?.phone3),
//             apn: row?.apn ? row.apn : "",
//             propertyCounty: row?.propertyCounty ? row.propertyCounty : "",
//             acreage: row?.acreage ? row.acreage : "",
//           });
//         }
//       }
//     })
//     .on("end", async () => {
//       end = true;
//       if (!queue.length && !paused) {
//         stream.emit("finalEnd");
//       }
//     })
//     .on("finalEnd", () => {
//       const filteredArray = results.filter(
//         (item) =>
//           !(
//             item.firstName === "N/A" &&
//             item.lastName === "N/A" &&
//             item.propertyAddress === "N/A" &&
//             item.propertyCity === "N/A" &&
//             item.propertyState === "N/A" &&
//             item.propertyZip === "N/A" &&
//             item.phone1 === "N/A"
//           )
//       );

//       if (results.length === 0) {
//         res.status(httpStatus.BAD_REQUEST).send({ message: "File is empty" });
//       }

//       //console.log("emptyNumbers", emptyNumbers);
//       const orginialFile = await uploadOriginal(req);

//       processFileUploadapi(filteredArray, req, res, rowCount, emptyNumbers,orginialFile);

//     });
// });

async function uploadOriginal(originalFile) {
  try {
    const fileContent = fs.readFileSync(originalFile.path);

    let s3FilePath;
    await uploadToS3(
      fileContent,
      originalFile.fieldname +
        "-original-" +
        Date.now() +
        path.extname(originalFile.originalname)
    )
      .then(async (result) => {
        s3FilePath = result.Location;
      })
      .catch((error) => {
        throw new ApiError(httpStatus.BAD_REQUEST, error);
      });

    return s3FilePath;
  } catch (error) {
    console.log(error);
    throw new ApiError(httpStatus.BAD_REQUEST, "File Upload Issue");
  }
}

async function processFileUploadapi(
  filteredArrayData,
  mappedFile,
  req,
  res,
  rowCount,
  emptyNumbers,
  orginialFile
) {
  ////console.log("filteredArray", filteredArray)

  let { updatedArray, existingMatches } = await processArray(filteredArrayData);

  const headers = Object.keys(updatedArray[0]);

  // Create a CSV file from the array
  const csvData = [];

  // Add the header row
  csvData.push(headers.join(","));

  // Convert each object into a CSV row
  updatedArray.forEach((item) => {
    const csvRow = headers
      .map((key) => {
        const value = item[key];
        return typeof value === "string" ? value : JSON.stringify(value);
      })
      .join(",");
    csvData.push(csvRow);
  });

  ////console.log("csvData", csvData);
  // Define the upload folder path
  const uploadFolderPath = path.join(process.cwd(), "public", "uploads");

  // Create the uploads folder if it doesn't exist
  if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath, { recursive: true });
  }

  // Define the file path
  const filePath = path.join(
    uploadFolderPath,
    mappedFile.fieldname +
      "-" +
      Date.now() +
      path.extname(mappedFile.originalname)
  );

  // Write the CSV data to the file
  fs.writeFileSync(filePath, csvData.join("\n"));

  const fileContent = fs.readFileSync(filePath);

  let s3FilePath;
  await uploadToS3(
    fileContent,
    mappedFile.fieldname +
      "-" +
      Date.now() +
      path.extname(mappedFile.originalname)
  )
    .then(async (result) => {
      s3FilePath = result.Location;
    })
    .catch((error) => {
      throw new ApiError(httpStatus.BAD_REQUEST, error);
    });
  let userId = "";
  let adminId = "";
  if (req.user.role === "admin") {
    let { _id } = req.user;
    adminId = _id;
  } else {
    let { _id } = req.user;
    userId = _id;
  }
  let finalMongoQueryData;
  if (userId) {
    finalMongoQueryData = {
      totalRows: rowCount - 1,
      csvData: filePath,
      orgFile: orginialFile,
      csvDownloadFile: s3FilePath,
      listName: mappedFile.originalname,
      status: "pending",
      user: userId,
      //excistingMatches: existingMatches,
    };
  } else {
    finalMongoQueryData = {
      totalRows: rowCount - 1,
      csvData: filePath,
      csvDownloadFile: s3FilePath,
      orgFile: orginialFile,
      listName: mappedFile.originalname,
      status: "pending",
      admin: adminId,
      //excistingMatches: existingMatches,
    };
  }
  const finalResult = await DirectImport.create(finalMongoQueryData);
  if (!finalResult) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Something went wrong while saving file data"
    );
  }

  updatedArray = updatedArray.concat(emptyNumbers);

  for (let i = 0; i < updatedArray.length; i++) {
    const item = updatedArray[i];

    // Check if all phone properties are empty strings
    if (item.phone1 === "") {
      console.log(item);
      // Call updateFilterProspect with the current item and finalResultId
      await updateFilterProspect(item, finalResult._id);
    }
  }

  //console.log("finalResult", finalResult);
  const redisres = await global.redisPublisher.publish(
    "file-process",
    String(finalResult._id)
  );

  res.status(httpStatus.CREATED).send(finalResult);
}

async function updateFilterProspect(results, directImportId) {
  let prospectFilter = {
    directImportId: directImportId,
    firstName: results.firstName,
    lastName: results.lastName,
    mailingAddress: results.mailingAddress,
    mailingCity: results.mailingCity,
    mailingState: results.mailingState,
    mailingZip: results.mailingZip,
    propertyAddress: results.propertyAddress,
    propertyCity: results.propertyCity,
    propertyState: results.propertyState,
    propertyZip: results.propertyZip,
    phone1: results.phone1 ? results.phone1 : "Empty",
    phone2: results.phone2 ? results.phone2 : "Empty",
    phone3: results.phone3 ? results.phone3 : "Empty",
    apn: results.apn !== "" ? results.apn : "Empty",
    propertyCounty:
      results.propertyCounty !== "" ? results.propertyCounty : "Empty",
    acreage: results.acreage !== "" ? results.acreage : "Empty",
  };

  const findprospects = await filterProspect.find({
    $and: [
      { firstName: results.firstName },
      { lastName: results.lastName },
      { mailingAddress: results.mailingAddress },
      { mailingCity: results.mailingCity },
      { mailingState: results.mailingState },
      { mailingZip: results.mailingZip },
      { propertyAddress: results.propertyAddress },
      { propertyCity: results.propertyCity },
      { propertyState: results.propertyState },
      { propertyZip: results.propertyZip },
      { apn: results.apn !== "" ? results.apn : "Empty" },
      {
        propertyCounty:
          results.propertyCounty !== "" ? results.propertyCounty : "Empty",
      },
      { acreage: results.acreage !== "" ? results.acreage : "Empty" },
    ],
  });

  if (findprospects.length === 0 && results.firstName !== "") {
    let insertFilterProspect = await filterProspect.create(prospectFilter);
  }
}

async function processArray(array) {
  const phoneTracker = {};
  const firstOccurrenceTracker = {};
  let existingMatches = 0;
  let prospects = 0;

  // First pass to identify duplicates and track the first occurrence
  array.forEach((item) => {
    ["phone1", "phone2", "phone3"].forEach((phoneKey) => {
      const phone = item[phoneKey];
      if (phone !== "") {
        if (!phoneTracker[phone]) {
          // Mark the first occurrence
          phoneTracker[phone] = 1;
          firstOccurrenceTracker[phone] = true;
        } else {
          // It's a duplicate occurrence
          phoneTracker[phone]++;
        }
      }
    });
  });

  // Second pass to process the array and check for existing matches
  array.forEach((item) => {
    let isExistingMatch = false;

    // Process each phone number individually (duplicacy check)
    ["phone1", "phone2", "phone3"].forEach((phoneKey) => {
      if (
        item[phoneKey] !== "" &&
        phoneTracker[item[phoneKey]] > 1 &&
        !firstOccurrenceTracker[item[phoneKey]]
      ) {
        // It's a duplicate occurrence, not the first one
        item[phoneKey] = "";
      }
      // Remove the flag for first occurrence after processing it
      firstOccurrenceTracker[item[phoneKey]] = false;
    });

    // Check for existing matches after duplicacy checks
    const allPhonesEmpty = ["phone1", "phone2", "phone3"].every(
      (phoneKey) => item[phoneKey] === ""
    );
    if (allPhonesEmpty) {
      isExistingMatch = true;
    }

    // Count as existing match or prospect
    if (isExistingMatch) {
      existingMatches++;
      //console.log("Found existing match:", item);
    } else {
      prospects++;
    }
  });

  const wholeArray = await processWholeArray(array);

  return { existingMatches, prospects, updatedArray: wholeArray };
}

function processWholeArray(array) {
  array.forEach((item) => {
    if (
      item.phone1 !== "" &&
      item.phone1 === item.phone2 &&
      item.phone1 === item.phone3
    ) {
      // If phone1, phone2, and phone3 are all duplicates and not empty
      item.phone2 = "";
      item.phone3 = "";
    } else if (item.phone1 !== "" && item.phone1 === item.phone2) {
      // If phone1 and phone2 are duplicates and not empty
      item.phone2 = item.phone3;
      item.phone3 = "";
    } else if (item.phone1 !== "" && item.phone1 === item.phone3) {
      // If phone1 and phone3 are duplicates and not empty
      item.phone3 = "";
    } else if (item.phone2 !== "" && item.phone2 === item.phone3) {
      // If phone2 and phone3 are duplicates and not empty
      item.phone3 = "";
    }
    // Additional conditions for empty phone numbers
    if (item.phone1 === "" && item.phone2 !== "" && item.phone3 !== "") {
      // If phone1 is empty and phone2, phone3 are not empty
      item.phone1 = item.phone2;
      item.phone2 = item.phone3;
      item.phone3 = "";
    } else if (item.phone2 === "" && item.phone3 !== "" && item.phone1 !== "") {
      // If phone2 is empty and phone3 is not empty
      item.phone2 = item.phone3;
      item.phone3 = "";
    } else if (item.phone1 === "" && item.phone3 === "") {
      // If phone1 and phone3 are empty
      item.phone1 = item.phone2;
      item.phone2 = "";
    } else if (item.phone1 === "" && item.phone2 === "") {
      // If phone1 and phone2 are empty
      item.phone1 = item.phone3;
      item.phone3 = "";
    }
  });

  return array;
  // return array;
}

const getAllFileData = catchAsync(async (req, res) => {
  let filter = {};
  let userId = "";
  let adminId = "";
  if (req.user.role === "admin") {
    let { _id } = req.user;
    adminId = _id;
  } else {
    let { _id } = req.user;
    userId = _id;
  }
  if (userId) {
    filter = {
      $or: [
        {
          user: userId,
          status: "pending",
        },
        {
          status: "complete",
        },
      ],
    };
  } else {
    filter = {
      $or: [
        {
          admin: adminId,
          status: "pending",
        },
        {
          status: "complete",
        },
      ],
    };
  }
  let options = {};
  if (!req.query.search) {
    options = pick(req.query, ["limit", "page"]);
  }
  options.sortBy = "createdAt:desc";
  options.populate = "assignCampaign";
  if (req.query.search) {
    filter = { listName: { $regex: req.query.search, $options: "i" } };
  }
  const fileData = await directImportService.getAllFileData(filter, options);
  res.status(httpStatus.CREATED).send(fileData);
});

const deleteFileById = catchAsync(async (req, res) => {
  let id = req.params.fileId;
  let data = true;
  const csvCheck = await CsvData.find({ directImportId: id, status: 1 });

  if (csvCheck.length === 0) {
    await directImportService.deleteFileById(id);
    await CsvData.deleteMany({ directImportId: id });

    res.status(httpStatus.CREATED).send(data);
  } else {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Text messages have already sent from this file. You cant Delete it"
    );
  }
});

const updateCSVFile = catchAsync(async (req, res) => {
  try {
    let id = req.params.id;
    return id;
  } catch (error) {
    console.error("Error update csv:", error);
  }
});

const processFileQue = async (directImportId) => {
  try {
    console.log("directImportId", directImportId);
    const id = directImportId;
    let csvFile = await DirectImport.findById(id);
    const results = [];
    let rowCount = 0;
    let paused = false;
    const queue = [];
    let duplicatesCount = [];
    let end = false;
    const processedRows = new Set();
    const stream = fs
      .createReadStream(csvFile.csvData)
      .pipe(csvParser())
      .on("data", async (data) => {
        rowCount++;

        queue.push(data);
        if (!paused) {
          stream.pause();
          paused = true;
          while (queue.length) {
            try {
              await processRow(queue.shift());
            } catch (e) {
              // Decide what to do here if you get an error processing a row
              //console.log(e);
            }
          }
          paused = false;
          stream.resume();
          if (end) {
            stream.emit("finalEnd");
          }
        }
        // Declare processedRows outside of the event handler

        async function processRow(row) {
          const key = `${row.firstName}-${row.lastName}-${row.propertyAddress}-${row.propertyCity}-${row.propertyState}-${row.propertyZip}-${row.phone1}-${row.phone2}-${row.phone3}`;

          // Check if the row is unique by checking if its key is already in the set
          if (row.phone1 !== "") {
            results.push({
              id: rowCount,
              directImportId: id,
              firstName: row?.firstName ? row.firstName.replace(/,/g, "") : "N/A",
              lastName: row?.lastName ? row.lastName.replace(/,/g, "") : "N/A",
              mailingAddress: row?.mailingAddress ? row.mailingAddress.replace(/,/g, "") : "N/A",
              mailingCity: row?.mailingCity ? row.mailingCity.replace(/,/g, "") : "N/A",
              mailingState: row?.mailingState ? row.mailingState.replace(/,/g, "") : "N/A",
              mailingZip: row?.mailingZip ? row.mailingZip.replace(/,/g, "") : "N/A",
              propertyAddress: row?.propertyAddress ? row.propertyAddress.replace(/,/g, "") : "N/A",
              propertyCity: row?.propertyCity ? row.propertyCity.replace(/,/g, "") : "N/A",
              propertyState: row?.propertyState ? row.propertyState.replace(/,/g, "") : "N/A",
              propertyZip: row?.propertyZip ? row.propertyZip.replace(/,/g, "") : "N/A",
              phone1: row?.phone1 ? row.phone1.replace(/,/g, "") : "",
              phone2: row?.phone2 ? row.phone2.replace(/,/g, "") : "",
              phone3: row?.phone3 ? row.phone3.replace(/,/g, "") : "",
              apn: row?.apn ? row.apn.replace(/,/g, "") : "",
              propertyCounty: row?.propertyCounty ? row.propertyCounty.replace(/,/g, "") : "",
              acreage: row?.acreage ? row.acreage.replace(/,/g, "") : "",

      });
          }
        }
      })
      .on("end", async () => {
        end = true;
        if (!queue.length && !paused) {
          stream.emit("finalEnd");
        }
      });
    await new Promise((resolve, reject) => {
      stream.on("finalEnd", async () => {
        try {
          const processedResults = await processFileUploaded(results, id);

          const existingFileMatch = await DirectImport.findOne({ _id: id });
          processedResults.excistingMatches =
            existingFileMatch.excistingMatches +
            processedResults.excistingMatches;

          const updateDirectImportTable = await DirectImport.findOneAndUpdate(
            { _id: id },
            processedResults,
            { new: true }
          );

          if (!updateDirectImportTable) {
            throw new ApiError(
              httpStatus.BAD_REQUEST,
              "Something went wrong while saving file data"
            );
          }

          //console.log("updateDirectImportTable", updateDirectImportTable);
          await global.redisPublisher.publish(
            "file-complete",
            JSON.stringify(updateDirectImportTable)
          );

          resolve(updateDirectImportTable); // Here, resolve the promise with the table
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (error) {
    console.error("Error update csv:", error);
  }
};

const processFileUploaded = async (results, directImportId) => {
  try {
    let matchedArray = [];
    let unmatchedArray = [];
    const concurrency = 10; // Adjust as needed
    let currentBatch = [];
    let dnctotal = 0;
    let mobile = 0;
    let landline = 0;
    let voip = 0;
    for (let i = 0; i < results.length; i++) {
      const returnFindDoc = await findDocument(results[i]);
      console.log("result bstchresults", returnFindDoc);

      currentBatch.push(returnFindDoc);
      if (currentBatch.length === concurrency || i === results.length - 1) {
        // Wait for the current batch to complete
        const batchResults = await Promise.all(currentBatch);

        batchResults?.forEach((result) => {
          if (result.status === "existing match") {
            matchedArray.push(result); // If it's an existing match, push to matchedArray
          } else if (result.status === "prospect") {
            unmatchedArray.push(result.results);
          }
          dnctotal = dnctotal + result.dnc;
          mobile = mobile + result.mobilecount;
          landline = landline + result.landlinecount;
          voip = voip + result.voipCount;
        });
        currentBatch = []; // Reset for the next batch
      }
    }

    //console.log("voip", voip);
    const documentsToInsert = unmatchedArray.map((item) => {
      // Create a shallow copy of the item
      let newItem = { ...item };

      // Delete the 'id' property from the new item
      delete newItem.id;

      // Add the 'directImportId' property
      newItem.directImportId = directImportId;

      return newItem;
    });

    //console.log("documentsToInsert", documentsToInsert);
    // Now you can proceed with the bulk insert or any other operation with documentsToInsert

    //Bulk insert the documents
    await CsvData.insertMany(documentsToInsert);
    //console.log("matched", matchedArray);
    return {
      excistingMatches: matchedArray.length,
      totalPropspects: unmatchedArray.length,
      mobile: mobile,
      landlines: landline,
      litigators: voip,
      dnc: dnctotal,
      status: "complete",
    };
  } catch (error) {
    console.error("Error in bulk insert:", error);
    throw error; // Rethrow the error for further handling if needed
  }
};

async function isInDNC(phoneNumber) {
  let dnc = await DNC.find({ number: phoneNumber });

  return dnc.length > 0;
}

async function checkDNc(dataArray) {
  const insertDnc = { ...dataArray };
  let totalDNCOccurrences = 0; // Initialize counter for total DNC occurrences

  // Counter for DNC occurrences in current object
  let occurrencesInObject = 0;
  const checkPhone1 = await isInDNC(dataArray.phone1);
  const checkPhone2 = await isInDNC(dataArray.phone2);
  const checkPhone3 = await isInDNC(dataArray.phone3);
  // Check and handle phone1
  if (checkPhone1) {
    dataArray.phone1 = ""; // Remove phone1 if it's in DNC
    occurrencesInObject++; // Increment DNC occurrence counter for this object
  }

  // Check and handle phone2
  if (checkPhone2) {
    dataArray.phone2 = ""; // Remove phone2 if it's in DNC
    occurrencesInObject++; // Increment DNC occurrence counter for this object
  }

  // Check and handle phone3
  if (checkPhone3) {
    dataArray.phone3 = ""; // Remove phone3 if it's in DNC
    occurrencesInObject++; // Increment DNC occurrence counter for this object
  }

  // Add DNC occurrences in current object to total DNC occurrences counter
  totalDNCOccurrences += occurrencesInObject;

  if (totalDNCOccurrences === 3) {
    const results = insertDnc;

    let prospectFilter = {
      directImportId: results.directImportId,
      firstName: results.firstName,
      lastName: results.lastName,
      mailingAddress: results.mailingAddress,
      mailingCity: results.mailingCity,
      mailingState: results.mailingState,
      mailingZip: results.mailingZip,
      propertyAddress: results.propertyAddress,
      propertyCity: results.propertyCity,
      propertyState: results.propertyState,
      propertyZip: results.propertyZip,
      phone1: results.phone1 ? results.phone1 : "Empty",
      phone2: results.phone2 ? results.phone2 : "Empty",
      phone3: results.phone3 ? results.phone3 : "Empty",
      apn: results.apn !== "" ? results.apn : "Empty",
      propertyCounty:
        results.propertyCounty !== "" ? results.propertyCounty : "Empty",
      acreage: results.acreage !== "" ? results.acreage : "Empty",
    };

    const findprospects = await filterProspect.find({
      $and: [
        { firstName: results.firstName },
        { lastName: results.lastName },
        { mailingAddress: results.mailingAddress },
        { mailingCity: results.mailingCity },
        { mailingState: results.mailingState },
        { mailingZip: results.mailingZip },
        { propertyAddress: results.propertyAddress },
        { propertyCity: results.propertyCity },
        { propertyState: results.propertyState },
        { propertyZip: results.propertyZip },
        { phone1: results.phone1 },
        { phone2: results.phone2 },
        { phone3: results.phone3 },
        { apn: results.apn !== "" ? results.apn : "Empty" },
        {
          propertyCounty:
            results.propertyCounty !== "" ? results.propertyCounty : "Empty",
        },
        { acreage: results.acreage !== "" ? results.acreage : "Empty" },
      ],
    });

    if (findprospects.length === 0) {
      let insertFilterProspect = await filterProspect.create(prospectFilter);
      //console.log("insertFilterProspect", insertFilterProspect);
    }
  }

  // Log total DNC occurrences in dataArray
  // //console.log("Total DNC occurrences in dataArray:", totalDNCOccurrences);
  // Display modified dataArray after processing
  ////console.log("Modified dataArray:", dataArray);
  return { dnc: totalDNCOccurrences, updatedProspects: dataArray };
}

async function findDocument(results) {
  try {
    // This query checks if any of the results phone numbers are present in the database.
    const getDNC = await checkDNc(results);
    results = getDNC.updatedProspects;
    let numbersDetails = await checkNumberType(results);
    //phonesToReturn = numbersDetails.phonestoReturn;
    results = numbersDetails.results[0];

    if (numbersDetails.mobileCount > 0) {
      //console.log("phone1", results.phone1);
      //console.log("phone2", results.phone2);
      //console.log("phone3", results.phone3);
      const query = {
        $or: [
          { phone1: results?.phone1 !== "" ? results?.phone1 : undefined },
          { phone2: results?.phone2 !== "" ? results?.phone2 : undefined },
          { phone3: results?.phone3 !== "" ? results?.phone3 : undefined },

          { phone1: results?.phone2 !== "" ? results?.phone2 : undefined },
          { phone1: results?.phone3 !== "" ? results?.phone3 : undefined },

          { phone2: results?.phone1 !== "" ? results?.phone1 : undefined },
          { phone2: results?.phone3 !== "" ? results?.phone3 : undefined },

          { phone3: results?.phone1 !== "" ? results?.phone1 : undefined },
          { phone3: results?.phone2 !== "" ? results?.phone2 : undefined },
        ],
      };

      // Execute the query to find matching documents.
      const documents = await CsvData.find(query);
      //console.log("documents", documents)
      // Assuming that the phone numbers are unique across the phone1, phone2, and phone3 fields,
      // create an object to keep track of the phone numbers not found.
      let phonesNotFound = {
        phone1: results.phone1 !== "",
        phone2: results.phone2 !== "",
        phone3: results.phone3 !== "",
      };

      // If any document contains the phone numbers, mark them as found.
      documents.forEach((doc) => {
        if ([doc.phone1, doc.phone2, doc.phone3].includes(results.phone1)) {
          phonesNotFound.phone1 = false;
        }
        if ([doc.phone1, doc.phone2, doc.phone3].includes(results.phone2)) {
          phonesNotFound.phone2 = false;
        }
        if ([doc.phone1, doc.phone2, doc.phone3].includes(results.phone3)) {
          phonesNotFound.phone3 = false;
        }
      });

      // Create an array of keys for the phone numbers that were not found.
      let phonesToReturn = Object.keys(phonesNotFound).filter(
        (key) => phonesNotFound[key]
      );
      //console.log("phonesToReturn", phonesToReturn);
      if (phonesToReturn.length === 1 && phonesToReturn.includes("phone1")) {
        results.phone2 = "";
        results.phone3 = "";
      } else if (
        phonesToReturn.length === 1 &&
        phonesToReturn.includes("phone2")
      ) {
        results.phone1 = results.phone2;
        results.phone2 = "";
        results.phone3 = "";
      } else if (
        phonesToReturn.length === 1 &&
        phonesToReturn.includes("phone3")
      ) {
        results.phone1 = results.phone3;
        results.phone2 = "";
        results.phone3 = "";
      } else if (phonesToReturn.length === 2) {
        if (!phonesToReturn.includes("phone1")) {
          results.phone1 = results.phone2;
          results.phone2 = results.phone3;
        } else if (!phonesToReturn.includes("phone2")) {
          results.phone2 = results.phone3;
        }
        results.phone3 = "";
      }
      let prospectFilter = {
        directImportId: results.directImportId,
        firstName: results.firstName,
        lastName: results.lastName,
        mailingAddress: results.mailingAddress,
        mailingCity: results.mailingCity,
        mailingState: results.mailingState,
        mailingZip: results.mailingZip,
        propertyAddress: results.propertyAddress,
        propertyCity: results.propertyCity,
        propertyState: results.propertyState,
        propertyZip: results.propertyZip,
        phone1: results.phone1 ? results.phone1 : "Empty",
        phone2: results.phone2 ? results.phone2 : "Empty",
        phone3: results.phone3 ? results.phone3 : "Empty",
        apn: results.apn !== "" ? results.apn : "Empty",
        propertyCounty:
          results.propertyCounty !== "" ? results.propertyCounty : "Empty",
        acreage: results.acreage !== "" ? results.acreage : "Empty",
      };
      if (phonesToReturn.length === 0) {
        const findprospects = await filterProspect.find({
          $and: [
            { firstName: results.firstName },
            { lastName: results.lastName },
            { mailingAddress: results.mailingAddress },
            { mailingCity: results.mailingCity },
            { mailingState: results.mailingState },
            { mailingZip: results.mailingZip },
            { propertyAddress: results.propertyAddress },
            { propertyCity: results.propertyCity },
            { propertyState: results.propertyState },
            { propertyZip: results.propertyZip },
            { apn: results.apn !== "" ? results.apn : "Empty" },
            {
              propertyCounty:
                results.propertyCounty !== ""
                  ? results.propertyCounty
                  : "Empty",
            },
            { acreage: results.acreage !== "" ? results.acreage : "Empty" },
          ],
        });

        if (findprospects.length === 0) {
          let insertFilterProspect = await filterProspect.create(
            prospectFilter
          );
          //console.log("insertFilterProspect", insertFilterProspect);
        }
      }

      ////console.log("prospect", results);

      if (phonesToReturn.length > 0) {
        return {
          status: "prospect",
          numberType: "mobile",
          mobilecount: numbersDetails.mobileCount,
          landlinecount: numbersDetails.landlineCount,
          voipCount: numbersDetails.voipCount,
          results: results,
          dnc: getDNC.dnc,
        };
      } else {
        return {
          status: "existing match",
          results: results,
          mobilecount: numbersDetails.mobileCount,
          landlinecount: numbersDetails.landlineCount,
          voipCount: numbersDetails.voipCount,
          dnc: getDNC.dnc,
        };
      }
    } else {
      return {
        status: "ignore",
        mobilecount: numbersDetails.mobileCount,
        landlinecount: numbersDetails.landlineCount,
        voipCount: numbersDetails.voipCount,
        dnc: getDNC.dnc,
      };
    }
  } catch (err) {
    console.error("An error occurred:", err);
    throw err; // Rethrow the error to be handled by the caller
  }
}

const type_mapping = {
  WIRELESS: "Mobile",
  PCS: "Mobile",
  CLEC: "Landline",
  RBOC: "Landline",
  IPES: "VoIP",
  UNKNOWN: "Unknown",
};

async function checkNumberType(results) {
  try {
    let phoneResults = {
      phonestoReturn: [],
      mobileCount: 0,
      landlineCount: 0,
      othersCount: 0,
      voipCount: 0,
      results: [],
      phonestoReturnLandline: [],
    };
    console.log(results);
    const phone1Parts = await returnNumberParts(results.phone1);
    const phone2Parts = await returnNumberParts(results.phone2);
    const phone3Parts = await returnNumberParts(results.phone3);
    console.log("phone1Parts",phone1Parts);
    console.log("phone2Parts",phone2Parts);
    console.log("phone3Parts",phone3Parts);

    const mobileType1 = await MobileVerification.findOne({
      $and: [
        { npa: phone1Parts.firstThreeDigits },
        { npxx: phone1Parts.nextThreeDigits },
      ],
    });

    const mobileType2 = await MobileVerification.findOne({
      $and: [
        { npa: phone2Parts.firstThreeDigits },
        { npxx: phone2Parts.nextThreeDigits },
      ],
    });

    const mobileType3 = await MobileVerification.findOne({
      $and: [
        { npa: phone3Parts.firstThreeDigits },
        { npxx: phone3Parts.nextThreeDigits },
      ],
    });

    if (
      mobileType1?.companyType === "PCS" ||
      mobileType1?.companyType === "WIRELESS"
    ) {
      phoneResults.phonestoReturn.push("phone1");
      phoneResults.mobileCount = phoneResults.mobileCount + 1;
    }

    if (
      mobileType2?.companyType === "PCS" ||
      mobileType2?.companyType === "WIRELESS"
    ) {
      phoneResults.phonestoReturn.push("phone2");
      phoneResults.mobileCount = phoneResults.mobileCount + 1;
    }
    if (
      mobileType3?.companyType === "PCS" ||
      mobileType3?.companyType === "WIRELESS"
    ) {
      phoneResults.phonestoReturn.push("phone3");
      phoneResults.mobileCount = phoneResults.mobileCount + 1;
    }

    if (
      mobileType1?.companyType === "CLEC" ||
      mobileType1?.companyType === "RBOC"
    ) {
      phoneResults.phonestoReturnLandline.push("phone1");
      phoneResults.landlineCount = phoneResults.landlineCount + 1;
    }

    if (
      mobileType2?.companyType === "CLEC" ||
      mobileType2?.companyType === "RBOC"
    ) {
      phoneResults.phonestoReturnLandline.push("phone2");
      phoneResults.landlineCount = phoneResults.landlineCount + 1;
    }
    if (
      mobileType3?.companyType === "CLEC" ||
      mobileType3?.companyType === "RBOC"
    ) {
      phoneResults.phonestoReturnLandline.push("phone3");
      phoneResults.landlineCount = phoneResults.landlineCount + 1;
    }

    if ((mobileType1 && mobileType2 && mobileType3) === null) {
      phoneResults.othersCount = phoneResults.othersCount + 1;
    }

    if (mobileType1?.companyType === "IPES") {
      phoneResults.voipCount = phoneResults.voipCount + 1;
    }

    if (mobileType2?.companyType === "IPES") {
      phoneResults.voipCount = phoneResults.voipCount + 1;
    }
    if (mobileType3?.companyType === "IPES") {
      phoneResults.voipCount = phoneResults.voipCount + 1;
    }
    if (phoneResults.phonestoReturn.length > 0) {
      let newResults = await processPhones(
        JSON.parse(JSON.stringify(results)), // Pass a copy of results
        phoneResults.phonestoReturn
      );
      phoneResults.results.push(newResults);
    }

    if (phoneResults.phonestoReturnLandline.length > 0) {
      let newLandlineResults = await processPhones(
        results,
        phoneResults.phonestoReturnLandline
      );
      let prospectFilter = {
        directImportId: newLandlineResults.directImportId,
        firstName: newLandlineResults.firstName,
        lastName: newLandlineResults.lastName,
        mailingAddress: newLandlineResults.mailingAddress,
        mailingCity: newLandlineResults.mailingCity,
        mailingState: newLandlineResults.mailingState,
        mailingZip: newLandlineResults.mailingZip,
        propertyAddress: newLandlineResults.propertyAddress,
        propertyCity: newLandlineResults.propertyCity,
        propertyState: newLandlineResults.propertyState,
        propertyZip: newLandlineResults.propertyZip,
        phone1: newLandlineResults.phone1 ? newLandlineResults.phone1 : "Empty",
        phone2: newLandlineResults.phone2 ? newLandlineResults.phone2 : "Empty",
        phone3: newLandlineResults.phone3 ? newLandlineResults.phone3 : "Empty",
        apn: newLandlineResults.apn !== "" ? newLandlineResults.apn : "Empty",
        propertyCounty:
          newLandlineResults.propertyCounty !== ""
            ? newLandlineResults.propertyCounty
            : "Empty",
        acreage:
          newLandlineResults.acreage !== ""
            ? newLandlineResults.acreage
            : "Empty",
      };

      const findprospects = await filterProspect.find({
        $and: [
          { firstName: newLandlineResults.firstName },
          { lastName: newLandlineResults.lastName },
          { mailingAddress: newLandlineResults.mailingAddress },
          { mailingCity: newLandlineResults.mailingCity },
          { mailingState: newLandlineResults.mailingState },
          { mailingZip: newLandlineResults.mailingZip },
          { propertyAddress: newLandlineResults.propertyAddress },
          { propertyCity: newLandlineResults.propertyCity },
          { propertyState: newLandlineResults.propertyState },
          { propertyZip: newLandlineResults.propertyZip },
          {
            phone1:
              newLandlineResults.phone1 !== ""
                ? newLandlineResults.phone1
                : "Empty",
          },
          {
            phone2:
              newLandlineResults.phone2 !== ""
                ? newLandlineResults.phone2
                : "Empty",
          },
          {
            phone3:
              newLandlineResults.phone3 !== ""
                ? newLandlineResults.phone3
                : "Empty",
          },
          {
            apn:
              newLandlineResults.apn !== "" ? newLandlineResults.apn : "Empty",
          },
          {
            propertyCounty:
              newLandlineResults.propertyCounty !== ""
                ? newLandlineResults.propertyCounty
                : "Empty",
          },
          {
            acreage:
              newLandlineResults.acreage !== ""
                ? newLandlineResults.acreage
                : "Empty",
          },
        ],
      });

      if (findprospects.length === 0) {
        let insertFilterProspect = await filterProspect.create(prospectFilter);
        //console.log("insertFilterProspect", insertFilterProspect);
      }
      // console.log("newLandlineResults", newLandlineResults);
    }
    return phoneResults;
  } catch (error) {
    console.error("Error checking phone type:", error);
    throw new Error("Internal server error");
  }
}

async function processPhones(prospect, phonesToReturn) {
  // let phonesToReturn = ['phone1', 'phone2', 'phone3'].filter(phone => prospect[phone]);

  if (phonesToReturn.length === 3) {
    // Scenario: ['phone1', 'phone2', 'phone3']
    return prospect;
  } else if (phonesToReturn.length === 2) {
    // Scenarios: ['phone1', 'phone2'], ['phone1', 'phone3'], ['phone2', 'phone3']
    if (
      phonesToReturn.includes("phone1") &&
      phonesToReturn.includes("phone2")
    ) {
      return prospect;
    } else if (
      phonesToReturn.includes("phone1") &&
      phonesToReturn.includes("phone3")
    ) {
      prospect.phone2 = prospect.phone3;
      prospect.phone3 = "";
      return prospect;
    } else if (
      phonesToReturn.includes("phone2") &&
      phonesToReturn.includes("phone3")
    ) {
      prospect.phone1 = prospect.phone2;
      prospect.phone2 = prospect.phone3;
      prospect.phone3 = "";
      return prospect;
    }
  } else if (phonesToReturn.length === 1) {
    // Scenarios: ['phone1'], ['phone2'], ['phone3']
    if (phonesToReturn.includes("phone1")) {
      prospect.phone2 = "";
      prospect.phone3 = "";
      return prospect;
    } else if (phonesToReturn.includes("phone2")) {
      prospect.phone1 = prospect.phone2;
      prospect.phone2 = "";
      prospect.phone3 = "";
      return prospect;
    } else if (phonesToReturn.includes("phone3")) {
      prospect.phone1 = prospect.phone3;
      prospect.phone2 = "";
      prospect.phone3 = "";
      return prospect;
    }
  }
}

async function returnNumberParts(number) {
  const firstThreeDigits = number.substring(0, 3);
  const nextThreeDigits = number.substring(3, 6);

  return {
    firstThreeDigits: firstThreeDigits,
    nextThreeDigits: nextThreeDigits,
  };
}

const downloadCSVFile = catchAsync(async (req, res) => {
  try {
    let { id } = req.params;
    const csvFields = [
      {
        label: "FirstName",
        value: `First Name`,
      },
      {
        label: "LastName",
        value: `Last Name`,
      },
      {
        label: "MailingAddress",
        value: `Mailing Address`,
      },
      {
        label: "MailingCity",
        value: `Mailing City`,
      },
      {
        label: "MailingState",
        value: `Mailing State`,
      },
      {
        label: "MailingZip",
        value: `Mailing Zip`,
      },
      {
        label: "PropertyAddress",
        value: `Property Address`,
      },
      {
        label: "PropertyCity",
        value: `Property City`,
      },
      {
        label: "PropertyState",
        value: `Property State`,
      },
      {
        label: "PropertyZip",
        value: `Property Zip`,
      },
      {
        label: "Phone1",
        value: `Owner 2 First Name`,
      },
      {
        label: "Phone2",
        value: `Owner 2 Last Name`,
      },
      {
        label: "Phone3",
        value: `Mobile Phone 1`,
      },
    ];
    const json2csvParser = new Json2csvParser({
      fields: csvFields,
    });

    let finalArray = [];
    const csvDataResult = await CsvData.find({ directImportId: id });

    if (csvDataResult.length > 0) {
      csvDataResult.forEach((data) => {
        finalArray.push({
          "First Name": data?.firstName ? data.firstName : "",
          "Last Name": data?.lastName ? data.lastName : "",
          "Mailing Address": data?.mailingAddress ? data.mailingAddress : "",
          "Mailing City": data?.mailingCity ? data.mailingCity : "",
          "Mailing State": data?.mailingState ? data.mailingState : "",
          "Mailing Zip": data?.mailingZip ? data.mailingZip : "",
          "Property Address": data?.propertyAddress ? data.propertyAddress : "",
          "Property City": data?.propertyCity ? data.propertyCity : "",
          "Property State": data?.propertyState ? data.propertyState : "",
          "Property Zip": data?.propertyZip ? data.propertyZip : "",
          "Owner 2 First Name": data?.phone1 ? data.phone1 : "",
          "Owner 2 Last Name": data?.phone2 ? data.phone2 : "",
          "Mobile Phone 1": data?.phone3 ? data.phone3 : "",
        });
      });
      const csvData = json2csvParser.parse(finalArray);
      const filePath = `directImport_${new Date().getTime()}.csv`;
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
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
});

const assignCampaignToDirectImport = catchAsync(async (req, res) => {
  let id = req.params.id;
  let body = req.body;
  let compaignPermission = "";
  if (!body.campaign && !body.followCampaign) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Compaign or followCompaign is required"
    );
  }
  if (body.campaign) {
    compaignPermission = "campaign";
  } else if (body.followCampaign) {
    compaignPermission = "followcompaign";
  }
  const data = await directImportService.assignCampaignToDirectImport(id, body);
  await CsvData.updateMany(
    { directImportId: id },
    {
      $set: {
        campaignId: String(data.assignCampaign),
        compaignPermission: compaignPermission,
      },
    }
  );
  res.status(httpStatus.CREATED).send(data);
});

const deleteCampaignToDirectImport = catchAsync(async (req, res) => {
  let id = req.params.id;
  let directImport = await CsvData.find({
    $and: [{ directImportId: id }, { status: 1 }],
  });
  if (directImport.length > 0) {
    res.status(httpStatus.BAD_REQUEST).send("Can't delete this campaign");
  } else {
    const data = await directImportService.deleteCampaignToDirectImport(id);
    await CsvData.updateMany(
      { directImportId: id },
      { $set: { campaignId: null, compaignPermission: null } }
    );
    res.status(httpStatus.CREATED).send(data);
  }
});

const downloadFilterProspect = catchAsync(async (req, res) => {
  let { directImportId } = req.params;
  let filterProspects = await filterProspect.find({
    directImportId: String(directImportId),
  });
  if (filterProspects.length > 0) {
    const csvFields = [
      {
        label: "First Name",
        value: `firstName`,
      },
      {
        label: "Last Name",
        value: `lastName`,
      },
      {
        label: "Mailing Address",
        value: `mailingAddress`,
      },
      {
        label: "Mailing City",
        value: `mailingCity`,
      },
      {
        label: "Mailing State",
        value: `mailingState`,
      },
      {
        label: "Mailing Zip",
        value: `mailingZip`,
      },
      {
        label: "Property Address",
        value: `propertyAddress`,
      },
      {
        label: "Property City",
        value: `propertyCity`,
      },
      {
        label: "Property State",
        value: `propertyState`,
      },
      {
        label: "Property Zip",
        value: `propertyZip`,
      },
      {
        label: "Property County",
        value: `propertyCounty`,
      },
      {
        label: "APN",
        value: `apn`,
      },
      {
        label: "Acreage",
        value: `acreage`,
      },
      {
        label: "Phone 1",
        value: `phone1`,
      },
      {
        label: "Phone 2",
        value: `phone2`,
      },
      {
        label: "Phone 3",
        value: `phone3`,
      },
    ];
    const json2csvParser = new Json2csvParser({
      fields: csvFields,
    });
    let finalCsvDataArray = await filterProspects.map((item) => {
      return {
        firstName: item?.firstName ? item.firstName : "",
        lastName: item?.lastName ? item.lastName : "",
        mailingAddress: item?.mailingAddress ? item.mailingAddress : "",
        mailingCity: item?.mailingCity ? item.mailingCity : "",
        mailingState: item?.mailingState ? item.mailingState : "",
        mailingZip: item?.mailingZip ? item.mailingZip : "",
        propertyAddress: item?.propertyAddress ? item.propertyAddress : "",
        propertyCity: item?.propertyCity ? item.propertyCity : "",
        propertyState: item?.propertyState ? item.propertyState : "",
        propertyZip: item?.propertyZip ? item.propertyZip : "",
        propertyCounty: item?.propertyCounty ? item.propertyCounty : "",
        apn: item?.apn ? item.apn : "",
        acreage: item?.acreage ? item.acreage : "",
        phone1: item?.phone1 ? item.phone1 : "",
        phone2: item?.phone2 ? item.phone2 : "",
        phone3: item?.phone3 ? item.phone3 : "",
      };
    });
    const csvData = json2csvParser.parse(finalCsvDataArray);
    const filePath = `fileProspect_${new Date().getTime()}.csv`;
    fs.writeFile(`public/uploads/${filePath}`, csvData, function (error) {
      if (error)
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Something went wrong while downloading..."
        );
      return res.download(`public/uploads/${filePath}`, function (err) {
        if (err) {
          console.error("Error while sending file:", err);
        } else {
          fs.unlink(`public/uploads/${filePath}`, function (deleteErr) {
            if (deleteErr) {
              console.error("Error while deleting file:", deleteErr);
            } else {
              //console.log("File deleted successfully.");
            }
          });
        }
      });
    });
  } else {
    const csvFields = [
      {
        label: "First Name",
        value: `firstName`,
      },
      {
        label: "Last Name",
        value: `lastName`,
      },
      {
        label: "Mailing Address",
        value: `mailingAddress`,
      },
      {
        label: "Mailing City",
        value: `mailingCity`,
      },
      {
        label: "Mailing State",
        value: `mailingState`,
      },
      {
        label: "Mailing Zip",
        value: `mailingZip`,
      },
      {
        label: "Property Address",
        value: `propertyAddress`,
      },
      {
        label: "Property City",
        value: `propertyCity`,
      },
      {
        label: "Property State",
        value: `propertyState`,
      },
      {
        label: "Property Zip",
        value: `propertyZip`,
      },
      {
        label: "Property County",
        value: `propertyCounty`,
      },
      {
        label: "APN",
        value: `apn`,
      },
      {
        label: "Acreage",
        value: `acreage`,
      },
    ];
    const json2csvParser = new Json2csvParser({
      fields: csvFields,
    });
    let finalCsvDataArray = [
      {
        firstName: "",
        lastName: "",
        mailingAddress: "",
        mailingCity: "",
        mailingState: "",
        mailingZip: "",
        propertyAddress: "",
        propertyCity: "",
        propertyState: "",
        propertyZip: "",
        propertyCounty: "",
        apn: "",
        acreage: "",
      },
    ];
    const csvData = json2csvParser.parse(finalCsvDataArray);
    const filePath = `fileProspect_${new Date().getTime()}.csv`;
    fs.writeFile(`public/uploads/${filePath}`, csvData, function (error) {
      if (error)
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          "Something went wrong while downloading..."
        );
      return res.download(`public/uploads/${filePath}`, function (err) {
        if (err) {
          console.error("Error while sending file:", err);
        } else {
          fs.unlink(`public/uploads/${filePath}`, function (deleteErr) {
            if (deleteErr) {
              console.error("Error while deleting file:", deleteErr);
            } else {
              //console.log("File deleted successfully.");
            }
          });
        }
      });
    });
  }
});

const directImportStatsCron = catchAsync(async (req, res) => {
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
  let allImports = await DirectImport.find({});
  for (let i = 0; i < allImports.length; i++) {
    let sentPhone1 = await sentCountPhone(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );
    let sentPhone2 = await sentCountPhone2(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );
    let sentPhone3 = await sentCountPhone3(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );

    const totalSent = sentPhone1 + sentPhone2 + sentPhone3;

    let deliverPhone1 = await deliverCountPhone(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );
    let deliverPhone2 = await deliverCountPhone2(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );
    let deliverPhone3 = await deliverCountPhone3(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );

    const totalDelivered = deliverPhone1 + deliverPhone2 + deliverPhone3;

    let respPhone1 = await respCountPhone(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );
    let respPhone2 = await respCountPhone2(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );
    let respPhone3 = await respCountPhone3(
      String(allImports[i]._id),
      startOfDay,
      endOfDay
    );

    const totalResponse = respPhone1 + respPhone2 + respPhone3;

    const wholeSent = allImports[i].sentCount + totalSent;
    const wholeDeliver = allImports[i].delivered + totalDelivered;
    const wholeResponse = allImports[i].response + totalResponse;

    let updateDirectImport = await DirectImport.findOneAndUpdate(
      { _id: allImports[i]._id },
      {
        sentCount: wholeSent,
        delivered: wholeDeliver,
        response: wholeResponse,
      }
    );
  }
  res.status(httpStatus.CREATED).send(allImports);
});

async function sentCountPhone(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status: 1,
          directImportId: importId,
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

async function sentCountPhone2(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate2: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status2: 1,
          directImportId: importId,
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

async function sentCountPhone3(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate3: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          status3: 1,
          directImportId: importId,
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

async function deliverCountPhone(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          delivered: 1,
          directImportId: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$delivered", 1] }, then: 1, else: 0 },
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

async function deliverCountPhone2(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate2: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          delivered2: 1,
          directImportId: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$delivered2", 1] }, then: 1, else: 0 },
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

async function deliverCountPhone3(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          msgDate3: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          delivered3: 1,
          directImportId: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$delivered3", 1] }, then: 1, else: 0 },
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

async function respCountPhone(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          respDate: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          response: 1,
          directImportId: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$response", 1] }, then: 1, else: 0 },
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

async function respCountPhone2(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          respDate2: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          response2: 1,
          directImportId: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$response2", 1] }, then: 1, else: 0 },
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

async function respCountPhone3(importId, startOfDay, endOfDay) {
  try {
    const result = await CsvData.aggregate([
      {
        $match: {
          respDate3: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
          response3: 1,
          directImportId: importId,
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: { if: { $eq: ["$response3", 1] }, then: 1, else: 0 },
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

const insertMobileVerificationData = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "CSV or Excel file is required");
  }

  if (req.file.mimetype !== "text/csv") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only CSV files are allowed!");
  }

  let dataArray = [];

  const readStream = fs.createReadStream(req.file.path);
  const parser = csvParser();

  readStream.pipe(parser);

  parser.on("data", (data) => {
    dataArray.push({
      npa: data?.npa,
      npxx: data?.npxx,
      companyType: data?.companyType,
    });
  });

  parser.on("end", async () => {
    try {
      // if (dataArray.length > 0) {
      //   // Get all existing records that match the criteria in one query
      //   const existingRecords = await MobileVerification.find({
      //     $or: dataArray.map((data) => ({ npa: data.npa, npxx: data.npxx })),
      //   });
      //   console.log("existingRecords is",existingRecords)
      //   // Create a set for quick lookup of existing records
      //   const existingSet = new Set(
      //     existingRecords.map((record) => `${record.npa}-${record.npxx}`)
      //   );
      //   console.log("existingSet is", existingSet);
      //   // Filter out the data that already exists
      //   const newRecords = dataArray.filter(
      //     (data) => !existingSet.has(`${data.npa}-${data.npxx}`)
      //   );
      //   console.log("newRecord is", newRecords);
      //   // Bulk insert new records
      //   if (newRecords.length > 0) {
      //     await MobileVerification.insertMany(newRecords);
      //   }
      // }

      if (dataArray.length > 0) {
        for (let i = 0; i < dataArray.length; i++) {
          let alreadyExist = await MobileVerification.findOne({
            npa: dataArray[i].npa,
            npxx: dataArray[i].npxx,
          });
          if (!alreadyExist) {
            await MobileVerification.create(dataArray[i]);
          }
        }
      }
      res
        .status(httpStatus.CREATED)
        .json({ message: "Data has been inserted" });
    } catch (error) {
      console.error(
        "Error during CSV processing and database operations:",
        error
      );
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Error processing data"
      );
    }
  });

  parser.on("error", (error) => {
    console.error("Error during CSV parsing:", error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error parsing CSV file"
    );
  });

  readStream.on("error", (error) => {
    console.error("Error reading CSV file:", error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Error reading CSV file"
    );
  });
});

module.exports = {
  readAndWriteFile,
  getAllFileData,
  deleteFileById,
  downloadCSVFile,
  assignCampaignToDirectImport,
  deleteCampaignToDirectImport,
  updateCSVFile,
  processFileQue,
  downloadFilterProspect,
  directImportStatsCron,
  checkPhoneType,
  insertMobileVerificationData,
};
