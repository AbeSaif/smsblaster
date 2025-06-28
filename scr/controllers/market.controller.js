const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { marketService } = require("../services");
const pick = require("../utils/pick");

const createMarket = catchAsync(async (req, res) => {
  let body = req.body;
  const market = await marketService.createMarket(body);
  res.status(httpStatus.CREATED).send(market);
});

const getAllMarket = catchAsync(async (req, res) => {
  let filter = {};
  let options = {};
  if (!req.query.search) {
    options = pick(req.query, ["limit", "page"]);
  }
  options.sortBy = "createdAt:desc";
  if (req.query.search) {
    const containsAlphabets = /[a-zA-Z]/.test(req.query.search);
    if (containsAlphabets) {
      filter = {
        $or: [
          {
            name: req.query.search,
          },
          {
            timeZone: req.query.search,
          },
        ],
      };
    } else {
      filter = {
        $or: [
          {
            areaCode: Number(req.query.search),
          },
          {
            phone: req.query.search,
          },
          {
            callForwardingNumber: req.query.search,
          },
        ],
      };
    }
  }
  const market = await marketService.getAllMarket(filter, options);
  res.status(httpStatus.CREATED).send(market);
});

const getMarketById = catchAsync(async (req, res) => {
  let id = req.params.marketId;
  const market = await marketService.getMarketById(id);
  res.status(httpStatus.CREATED).send(market);
});
const updateMarketById = catchAsync(async (req, res) => {
  let id = req.params.marketId;
  let body = req.body;
  if (body.phone && (!body.newPhoneNumber || !body.oldPhoneNumber)) {
    return res.status(httpStatus.BAD_REQUEST).send("Number is required");
  }
  const market = await marketService.updateMarketById(id, body);
  res.status(httpStatus.CREATED).send(market);
});

const deleteMarketById = catchAsync(async (req, res) => {
  let id = req.params.marketId;
  const market = await marketService.deleteMarketById(id);
  res.status(httpStatus.CREATED).send(market);
});

const increaseMarketLimitById = catchAsync(async (req, res) => {
  let id = req.params.marketId;
  let body = req.body;
  const market = await marketService.increaseMarketLimitById(id, body);
  res.status(httpStatus.CREATED).send(market);
});

const updateMarketStatus = catchAsync(async (req, res) => {
  let { phone } = req.query;
  let body = req.body;
  const market = await marketService.updateMarketStatus(phone, body);
  res.status(httpStatus.CREATED).send(market);
});

const excistingMarketEnhanceWithNewNumber = catchAsync(async (req, res) => {
  let { marketId } = req.query;
  let { number } = req.body;
  const market = await marketService.excistingMarketEnhanceWithNewNumber(
    marketId,
    number
  );
  res.status(httpStatus.CREATED).send(market);
});

const updateCallForwardNumber = catchAsync(async (req, res) => {
  let id = req.params.marketId;
  let body = req.body;
  const market = await marketService.updateCallForwardNumber(id, body);
  res.status(httpStatus.CREATED).send(market);
});

// const removeOutBoundNumberAndRelatedOutBoundData = catchAsync(
//   async (req, res) => {
//     let { number } = req.params;
//     const market =
//       await marketService.removeOutBoundNumberAndRelatedOutBoundData(number);
//     res.status(httpStatus.CREATED).send(market);
//   }
// );

const removeOutBoundNumberAndRelatedOutBoundData = catchAsync(async (req, res) => {
  let { number } = req.params;

  // Send immediate response to client
  res.status(httpStatus.CREATED).send({ message: "Processing request in the background" });

  // Background processing
  setImmediate(async () => {
    try {
      const market = await marketService.removeOutBoundNumberAndRelatedOutBoundData(number);
      console.log("Background processing complete:", market);
    } catch (error) {
      console.error("Error processing background task:", error);
    }
  });
});

module.exports = {
  createMarket,
  getAllMarket,
  getMarketById,
  updateMarketById,
  deleteMarketById,
  increaseMarketLimitById,
  updateMarketStatus,
  excistingMarketEnhanceWithNewNumber,
  updateCallForwardNumber,
  removeOutBoundNumberAndRelatedOutBoundData,
};
