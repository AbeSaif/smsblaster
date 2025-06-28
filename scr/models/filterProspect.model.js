const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const filterProspectSchema = mongoose.Schema(
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
      }
  }
);
 
filterProspectSchema.index({
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
  phone1: 1,
  phone2: 1,
  phone3: 1
});
filterProspectSchema.plugin(toJSON);
filterProspectSchema.plugin(paginate);

const filterProspect = mongoose.model("filterProspect", filterProspectSchema);

module.exports = filterProspect;