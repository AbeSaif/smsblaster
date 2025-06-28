const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const csvDataSchema = mongoose.Schema(
  {
    directImportId: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    mailingAddress: {
      type: String,
    },
    mailingCity: {
      type: String,
    },
    mailingState: {
      type: String,
    },
    mailingZip: {
      type: String,
    },
    propertyAddress: {
      type: String,
    },
    propertyCity: {
      type: String,
    },
    propertyState: {
      type: String,
    },
    propertyZip: {
      type: String,
    },
    phone1: {
      type: String,
    },
    phone2: {
      type: String,
    },
    phone3: {
      type: String,
    },
    apn: {
      type: String,
      default: "",
    },
    propertyCounty: {
      type: String,
      default: "",
    },
    acreage: {
      type: String,
      default: "",
    },
    isPhone1Verified: {
      type: Boolean,
      default: false,
    },
    isPhone2Verified: {
      type: Boolean,
      default: false,
    },
    isPhone3Verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      default: 0,
      index: true,
    },
    delivered: { type: Number, default: 0 }, // Assuming tinyint translates to a Number
    response: { type: Number, default: 0 },
    undelivered: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    directImportId: { type: String, default: null },
    batchId: { type: String, default: null },
    isverified: { type: String, default: null },
    campaignId: { type: String, default: null },
    campaignId1: { type: String, default: null },
    campaignId2: { type: String, default: null },
    campaignId3: { type: String, default: null },
    status2: { type: Number, default: 0, index: true },
    status3: { type: Number, default: 0, index: true },
    delivered2: { type: Number, default: 0 },
    delivered3: { type: Number, default: 0 },
    response2: { type: Number, default: 0 },
    response3: { type: Number, default: 0 },
    msgDate: { type: Date, default: null, index: true },
    msgDate2: { type: Date, default: null, index: true },
    msgDate3: { type: Date, default: null, index: true },
    respDate: { type: Date, default: null, index: true },
    respDate2: { type: Date, default: null, index: true },
    respDate3: { type: Date, default: null, index: true },
    bandwithsendid1: {
      type: String,
      default: null,
    },
    bandwithsendid2: {
      type: String,
      default: null,
    },
    bandwithsendid3: {
      type: String,
      default: null,
    },
    marketSenderNumber: {
      type: String,
    },
    compaignPermission: {
      type: String,
    },
    dncPhone1: {
      type: Boolean,
      default: false,
    },
    dncPhone2: {
      type: Boolean,
      default: false,
    },
    dncPhone3: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

csvDataSchema.index({ msgDate: 1, status: 1, status2: 1, status3: 1 });
csvDataSchema.index({
  msgDate: 1,
  campaignId1: 1,
  campaignId2: 1,
  campaignId3: 1,
  status: 1,
  status2: 1,
  status3: 1,
});
// Create separate indexes for each campaignId field
csvDataSchema.index({
  campaignId: 1,
  status: 1,
  response: 1,
  response2: 1,
  response3: 1,
  batchId: 1,
});
csvDataSchema.index({
  campaignId1: 1,
  status: 1,
  response: 1,
  response2: 1,
  response3: 1,
  batchId: 1,
});
csvDataSchema.index({
  campaignId2: 1,
  status: 1,
  response: 1,
  response2: 1,
  response3: 1,
  batchId: 1,
});
csvDataSchema.index({
  campaignId3: 1,
  status: 1,
  response: 1,
  response2: 1,
  response3: 1,
  batchId: 1,
});

csvDataSchema.index({
  acreage: 1,
  apn: 1,
  firstName: 1,
  lastName: 1,
  mailingAddress: 1,
  mailingCity: 1,
  mailingState: 1,
  mailingZip: 1,
  propertyAddress: 1,
  propertyCity: 1,
  propertyCounty: 1,
  propertyState: 1,
  propertyZip: 1,
});

csvDataSchema.index({ delivered3: 1,status3: 1, undelivered: 1, msgDate3: 1 });
csvDataSchema.index({delivered2: 1, status2: 1,msgDate2: 1,bandwithsendid1: 1});

csvDataSchema.index({ phone1: 1, phone2: 1, phone3: 1 });
csvDataSchema.index({ directImportId: 1 });
csvDataSchema.index({
  directImportId: 1,
  msgDate: 1,
  msgDate2: 1,
  msgDate3: 1,
});
csvDataSchema.index({ marketSenderNumber: 1 });
csvDataSchema.index({ bandwithsendid1: 1 });
csvDataSchema.index({ bandwithsendid2: 1 });
csvDataSchema.index({ bandwithsendid3: 1 });
csvDataSchema.index({ phone2: 1 });
csvDataSchema.index({ phone3: 1 });
csvDataSchema.index({ batchId: 1, phone2: 1 });
csvDataSchema.index({ batchId: 1, phone3: 1 });
const collationOptions = {
  locale: "en", // Specify the locale (you can change this based on your requirements)
  strength: 2, // Set the collation strength to 2 for case-insensitive and accent-insensitive comparison
};
csvDataSchema.index({ propertyAddress: 1 }, { collation: collationOptions });
csvDataSchema.index({ propertyCity: 1 }, { collation: collationOptions });
csvDataSchema.index({ propertyState: 1 }, { collation: collationOptions });
csvDataSchema.index({ propertyZip: 1 }, { collation: collationOptions });
// add plugin that converts mongoose to json
csvDataSchema.plugin(toJSON);
csvDataSchema.plugin(paginate);

const csvData = mongoose.model("CsvData", csvDataSchema);

module.exports = csvData;
