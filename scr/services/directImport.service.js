const httpStatus = require("http-status");
const { DirectImport, Compaign } = require("../models");
const ApiError = require("../utils/ApiError");
const { Client } = require("@elastic/elasticsearch");
const elasticClient = new Client({
  node: "http://13.57.234.239:9200",
  // auth: {
  //   username: 'anjum',
  //   password: 'anjum1232',
  // },
});

const getAllFileData = async (filter, options) => {
  try {
    return await DirectImport.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteFileById = async (id) => {
  try {
    const fileData = await DirectImport.findByIdAndRemove(id);
    if (!fileData) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No file record found");
    }
    return "Deleted successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateCSVFile = async (id) => {
  try {
    const response = await elasticClient.get({
      index: "search-launchimport", // The index where your document is stored
      id: id, // The ID of the document you want to retrieve
    });

    if (response.found) {
      const results = response._source.csvData;
      const batchSize = 500; // Adjust the batch size as needed
      const totalQueries = results.length;
      let currentIndex = 0;
      let searchResponses = [];

      // Process the queries in batches
      while (currentIndex < totalQueries) {
        const endIndex = Math.min(
          currentIndex + batchSize - 1,
          totalQueries - 1
        );
        const batchSearchQuery = [];

        for (let j = currentIndex; j <= endIndex; j++) {
          batchSearchQuery.push(
            { index: "search-launchimport" },
            {
              query: {
                bool: {
                  must: [
                    { match: { "csvData.firstName": results[j].firstName } },
                    { match: { "csvData.lastName": results[j].lastName } },
                    {
                      match: {
                        "csvData.mailingAddress": results[j].mailingAddress,
                      },
                    },
                    {
                      match: { "csvData.mailingCity": results[j].mailingCity },
                    },
                    {
                      match: {
                        "csvData.mailingState": results[j].mailingState,
                      },
                    },
                    { match: { "csvData.mailingZip": results[j].mailingZip } },
                    {
                      match: {
                        "csvData.propertyAddress": results[j].propertyAddress,
                      },
                    },
                    {
                      match: {
                        "csvData.propertyCity": results[j].propertyCity,
                      },
                    },
                    {
                      match: {
                        "csvData.propertyState": results[j].propertyState,
                      },
                    },
                    {
                      match: { "csvData.propertyZip": results[j].propertyZip },
                    },
                    { match: { "csvData.phone1": results[j].phone1 } },
                    { match: { "csvData.phone2": results[j].phone2 } },
                    // Add other match queries as needed
                  ],
                },
              },
              _source: {
                includes: ["csvData.matchedArray"],
              },
            }
          );
        }
        const batchResponse = await elasticClient.msearch({
          searches: batchSearchQuery,
        });
        searchResponses = searchResponses.concat(batchResponse);

        currentIndex = endIndex + 1;
      }
      let matchedRecords = 0;
      searchResponses[0].responses.forEach((data) => {
        if (data.hits.hits.length > 0) {
          matchedRecords = matchedRecords + 1;
        }
      });

      let finalResult = await DirectImport.findOneAndUpdate(
        { elastickSearchId: id },
        {
          $set: {
            excistingMatches: matchedRecords,
            totalPropspects: results.length - 1 - matchedRecords,
            status: "complete",
          },
        }
      );

      return finalResult;
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const assignCampaignToDirectImport = async (id, body) => {
  try {
    const fileData = await DirectImport.findById(id);
    if (!fileData) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No record found");
    }
    if (body.campaign) {
      fileData.assignCampaign = body.campaign;
      fileData.isCampaignAssigned = true;
      fileData.assignedCompaignCount += 1;
      await fileData.save();
      let directImport = await DirectImport.find({
        assignCampaign: body.campaign,
      });
      let totalProspects = 0;
      directImport.forEach((data) => {
        totalProspects = totalProspects + data.totalPropspects;
      });
      let compaign = await Compaign.findById(body.campaign);
      const CmpaignProspects = compaign.totalProspects;
      compaign.totalProspects = totalProspects;
      compaign.remaning = totalProspects - compaign.sent;
      let newCountOfprospects = totalProspects - CmpaignProspects;
      const newRemainingProspects =
        compaign.totalProspectsRemaining + newCountOfprospects;
      compaign.totalProspectsRemaining = newRemainingProspects;
      await compaign.save();
      fileData.compaign = compaign;
      return fileData;
    } else if (body.followCampaign) {
      fileData.assignFollowUpCampaign = body.followCampaign;
      fileData.isFollowCampaignAssigned = true;
      fileData.assignedFollowCompaignCount += 1;
      await fileData.save();
      return fileData;
    } else {
      return fileData;
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteCampaignToDirectImport = async (id) => {
  try {
    const fileData = await DirectImport.findById(id);
    if (!fileData) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No record found");
    } else {
      let directImport = await DirectImport.find({
        assignCampaign: fileData.assignCampaign,
        _id: { $ne: id },
      });
      console.log("directImport",directImport);
      if (directImport.length > 0) {
        let totalProspects = 0;
        directImport.forEach((data) => {
          totalProspects += data.totalPropspects;
        });
        let compaign = await Compaign.findById(fileData.assignCampaign);
        compaign.totalProspects = totalProspects;
        compaign.remaning = totalProspects - compaign.sent;
        compaign.totalProspectsRemaining = totalProspects - compaign.sent;
        await compaign.save();
      } else {
        await Compaign.findByIdAndUpdate(fileData.assignCampaign, {
          $set: { totalProspects: 0 },
        });
      }
      fileData.assignCampaign = undefined;
      fileData.isCampaignAssigned = false;
      await fileData.save();
      return fileData;
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  getAllFileData,
  deleteFileById,
  updateCSVFile,
  assignCampaignToDirectImport,
  deleteCampaignToDirectImport,
};
