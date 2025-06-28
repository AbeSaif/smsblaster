const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { DirectImport, CsvData } = require("../models");
const ApiError = require("../utils/ApiError");
const fs = require("fs");
const csvParser = require("csv-parser");
const { directImportService } = require("../services");
const pick = require("../utils/pick");
const { uploadToS3 } = require("./../utils/fileUpload");
const Json2csvParser = require("json2csv").Parser;
const path = require("path");
const EventEmitter = require("events");
const { func } = require("joi");

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
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Csv or excel file is required");
  }

  if (req.file.mimetype != "text/csv") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Only csv files are allowed!");
  }
  const results = [];
  let rowCount = 0;
  let paused = false;
  const queue = [];
  let end = false;
  let RemoveEmpty = [];

  console.log("req.file.path", req.file.path);
  const stream = fs
    .createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", async (data) => {
      rowCount++;
      console.log("rowCount", rowCount);
      queue.push(data);
      if (!paused) {
        stream.pause();
        paused = true;
        while (queue.length) {
          try {
            await processRow(queue.shift());
          } catch (e) {
            // decide what to do here if you get an error processing a row
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
        // Check if any of the required fields are empty
        if (
          row?.firstName &&
          row?.lastName &&
          row?.propertyAddress &&
          row?.propertyCity &&
          row?.propertyState &&
          row?.propertyZip &&
          (row.phone1 || row.phone2 || row.phone3)
        ) {
          results.push({
            firstName: row?.firstName ? row.firstName : "",
            lastName: row?.lastName ? row.lastName : "",
            mailingAddress: row?.mailingAddress ? row.mailingAddress : "",
            mailingCity: row?.mailingCity ? row.mailingCity : "",
            mailingState: row?.mailingState ? row.mailingState : "",
            mailingZip: row?.mailingZip ? row?.mailingZip : "",
            propertyAddress: data?.propertyAddress
              ? data?.propertyAddress
              : "",
            propertyCity: data?.propertyCity ? data.propertyCity : "",
            propertyState: data?.propertyState ? data.propertyState : "",
            propertyZip: data?.propertyZip ? data.propertyZip : "",
            phone1: cleanPhoneNumber(row?.phone1),
            phone2: cleanPhoneNumber(row?.phone2),
            phone3: cleanPhoneNumber(row?.phone3),
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
    .on("finalEnd", () => {
      const filteredArray = results.filter(
        (item) =>
          !(
            item.firstName === "N/A" &&
            item.lastName === "N/A" &&
            item.propertyAddress === "N/A" &&
            item.propertyCity === "N/A" &&
            item.propertyState === "N/A" &&
            item.propertyZip === "N/A" &&
            item.phone1 === "N/A" &&
            item.phone2 === "N/A" &&
            item.phone3 === "N/A"
          )
      );
      if (results.length === 0) {
        res.status(httpStatus.BAD_REQUEST).send({ message: "File is empty" });
      }

      processFileUploadapi(filteredArray, req, res, rowCount);
    });
});

async function processFileUploadapi(filteredArray, req, res, rowCount) {
  const headers = Object.keys(filteredArray[0]);

  // Create a CSV file from the array
  const csvData = [];

  // Add the header row
  csvData.push(headers.join(","));

  // Convert each object into a CSV row
  filteredArray.forEach((item) => {
    const csvRow = headers
      .map((key) => {
        const value = item[key];
        return typeof value === "string" ? value : JSON.stringify(value);
      })
      .join(",");
    csvData.push(csvRow);
  });
  // Define the upload folder path
  const uploadFolderPath = path.join(process.cwd(), "public", "uploads");

  // Create the uploads folder if it doesn't exist
  if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath, { recursive: true });
  }

  // Define the file path
  const filePath = path.join(
    uploadFolderPath,
    req.file.fieldname + "-" + Date.now() + path.extname(req.file.originalname)
  );

  // Write the CSV data to the file
  fs.writeFileSync(filePath, csvData.join("\n"));

  const fileContent = fs.readFileSync(req.file.path);
  let s3FilePath;
  await uploadToS3(
    fileContent,
    req.file.fieldname + "-" + Date.now() + path.extname(req.file.originalname)
  )
    .then(async (result) => {
      s3FilePath = result.Location;
    })
    .catch((error) => {
      throw new ApiError(httpStatus.BAD_REQUEST, error);
    });

  let finalMongoQueryData = {
    totalRows: rowCount - 1,
    csvData: filePath,
    csvDownloadFile: s3FilePath,
    listName: req.file.originalname,
    status: "pending",
  };

  const finalResult = await DirectImport.create(finalMongoQueryData);
  if (!finalResult) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Something went wrong while saving file data"
    );
  }
  res.status(httpStatus.CREATED).send(finalResult);
}


const getAllFileData = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page"]);
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
  const data = await directImportService.deleteFileById(id);
  res.status(httpStatus.CREATED).send(data);
});

const updateCSVFile = catchAsync(async (req, res) => {
  try {
    let id = req.params.id;
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
              console.log(e);
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
          if (!processedRows.has(key)) {
            processedRows.add(key); // Add the key to the set

            // Find if there's an existing entry with matching fields
            const isDuplicate = results.some(
              (existingRow) =>
                existingRow.firstName === row.firstName &&
                existingRow.lastName === row.lastName &&
                existingRow.propertyAddress === row.propertyAddress &&
                existingRow.propertyCity === row.propertyCity &&
                existingRow.propertyState === row.propertyState &&
                existingRow.propertyZip === row.propertyZip &&
                existingRow.phone1 === row.phone1 &&
                existingRow.phone2 === row.phone2 &&
                existingRow.phone3 === row.phone3
            );

            if (!isDuplicate) {
              results.push({
                id: rowCount,
                directImportId: id,
                firstName: row?.firstName ? row.firstName : "N/A",
                lastName: row?.lastName ? row.lastName : "N/A",
                mailingAddress: row?.mailingAddress
                  ? row.mailingAddress
                  : "N/A",
                mailingCity: row?.mailingCity ? row.mailingCity : "N/A",
                mailingState: row?.mailingState ? row.mailingState : "N/A",
                mailingZip: row?.mailingZip ? row?.mailingZip : "N/A",
                propertyAddress: row?.propertyAddress
                  ? row?.propertyAddress
                  : "N/A",
                propertyCity: row?.propertyCity ? row.propertyCity : "N/A",
                propertyState: row?.propertyState ? row.propertyState : "N/A",
                propertyZip: row?.propertyZip ? row.propertyZip : "N/A",
                phone1: row?.phone1 ? row.phone1 : "",
                phone2: row?.phone2 ? row.phone2 : "",
                phone3: row?.phone3 ? row.phone3 : "",
              });
            } else {
              duplicatesCount.push(isDuplicate);
            }
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
              (item.phone1 === "N/A" ||
                item.phone2 === "N/A" ||
                item.phone3 === "N/A")
            )
        );
        // Call processFileUploaded and wait for it to complete
        const processedResults = await processFileUploaded(filteredArray, id);
        console.log("processedResults", processedResults);
        const updaeDirectImportTable = await DirectImport.findOneAndUpdate(
          { _id: id },
          processedResults,
          { new: true }
        );
        if (!updaeDirectImportTable) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Something went wrong while saving file data"
          );
        }
        res.status(httpStatus.CREATED).send(updaeDirectImportTable);
        // You can access the processedResults here
      });
  } catch (error) {
    console.error("Error update csv:", error);
  }
});

const processFileUploaded = async (results, directImportId) => {
  try {
    let matchedArray = [];
    let unmatchedArray = [];
    const concurrency = 10; // Adjust as needed
    let currentBatch = [];

    for (let i = 0; i < results.length; i++) {
      currentBatch.push(findDocument(results[i]));
      if (currentBatch.length === concurrency || i === results.length - 1) {
        // Wait for the current batch to complete
        const batchResults = await Promise.all(currentBatch);
        batchResults.forEach((matching) => {
          if (matching == 1) {
            matchedArray.push(matching);
          } else {
            unmatchedArray.push(matching);
          }
        });
        currentBatch = []; // Reset for the next batch
      }
    }
    const documentsToInsert = unmatchedArray.map((item) => {
      // Create a shallow copy of the item
      let newItem = { ...item };

      // Delete the 'id' property from the new item
      delete newItem.id;

      // Add the 'directImportId' property
      newItem.directImportId = directImportId;

      return newItem;
    });

    // Now you can proceed with the bulk insert or any other operation with documentsToInsert

    // Bulk insert the documents
    await CsvData.insertMany(documentsToInsert);

    return {
      excistingMatches: matchedArray.length,
      totalPropspects: unmatchedArray.length,
      status: "complete",
    };
  } catch (error) {
    console.error("Error in bulk insert:", error);
    throw error; // Rethrow the error for further handling if needed
  }
};

async function findDocument(results) {
  try {
    const query = {
      $and: [
        { firstName: results.firstName },
        { lastName: results.lastName },
        { propertyAddress: results.propertyAddress },
        { propertyCity: results.propertyCity },
        { propertyState: results.propertyState },
        { propertyZip: results.propertyZip },
        {
          $or: [
            {
              $and: [
                { phone1: { $eq: results.phone1, $ne: "N/A" } },
                { phone2: { $eq: results.phone2, $ne: "N/A" } },
                { phone3: { $eq: results.phone3, $ne: "N/A" } },
              ],
            },
            {
              $and: [
                { phone1: { $eq: results.phone1, $ne: "N/A" } },
                { phone2: { $eq: results.phone2, $ne: "N/A" } },
                {
                  phone3: {
                    $in: [results.phone1, results.phone2, results.phone3],
                    $ne: "N/A",
                  },
                },
              ],
            },
            {
              $and: [
                { phone1: { $eq: results.phone1, $ne: "N/A" } },
                {
                  phone2: {
                    $in: [results.phone1, results.phone2, results.phone3],
                    $ne: "N/A",
                  },
                },
                { phone3: { $eq: results.phone3, $ne: "N/A" } },
              ],
            },
            {
              $and: [
                {
                  phone1: {
                    $in: [results.phone1, results.phone2, results.phone3],
                    $ne: "N/A",
                  },
                },
                { phone2: { $eq: results.phone2, $ne: "N/A" } },
                { phone3: { $eq: results.phone3, $ne: "N/A" } },
              ],
            },
            {
              $and: [
                { phone1: { $eq: results.phone1 } },
                { phone2: { $eq: results.phone2 } },
                { phone3: { $eq: results.phone3 } },
              ],
            },
          ],
        },
      ],
    };

    //console.log(JSON.stringify(query));

    const document = await CsvData.findOne(query);
    //console.log("documentss", document)
    if (document) {
      //console.log('Document with similar phone number exists:', document);
      return 1; // Similar phone number exists
    } else {
      console.log("No similar phone number found, unique record");
      return results; // Unique record
    }
  } catch (err) {
    console.error("An error occurred:", err);
  } finally {
  }
}

// async function processFileUploaded(results, directImportId) {

//   try {

//     const batchSize = 500;
//     const promises = [];
//     let batchResults = [];
//     for (let i = 0; i < results.length; i += batchSize) {
//       const batch = results.slice(i, i + batchSize);
//       promises.push(processBatch(batch));
//     }
//     batchResults = await Promise.all(promises);
//     // console.log("batchResults",batchResults)
//     const matched = [];
//     const unmatched = [];

//     for (const batchResult of batchResults) {
//       matched.push(...batchResult.matchedBatch);
//       unmatched.push(...batchResult.unmatchedBatch);
//     }
//     //console.log("unmatched",unmatched);
//     if (unmatched.length > 0) {
//       await bulkInsertData(unmatched, directImportId);
//     }

//     return {
//       excistingMatches: matched.length,
//       totalPropspects: unmatched.length,
//       status: "complete",
//     };
//   } catch (error) {
//     console.error("Error processFileUploaded csv:", error);
//   }
// }


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
    const directImport = await DirectImport.findById(id);
    if (directImport) {
      directImport.csvData.forEach((data) => {
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
  if (!body.campaign && !body.followCampaign) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Compaign or followCompaign is required"
    );
  }
  const data = await directImportService.assignCampaignToDirectImport(id, body);
  await CsvData.updateMany(
    { directImportId: id },
    { $set: { campaignId: String(data.assignCampaign) } }
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
      { $set: { campaignId: null } }
    );
    res.status(httpStatus.CREATED).send(data);
  }
});

module.exports = {
  readAndWriteFile,
  getAllFileData,
  deleteFileById,
  downloadCSVFile,
  assignCampaignToDirectImport,
  deleteCampaignToDirectImport,
  updateCSVFile,
};
