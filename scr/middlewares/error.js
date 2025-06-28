const mongoose = require("mongoose");
const httpStatus = require("http-status");
const config = require("../config/config");
const logger = require("../config/logger");
const ApiError = require("../utils/ApiError");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  // console.log("message is", message);
  if (config.env === "production" && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    // message = "five hundred error";
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  };

  if (config.env === "development") {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

const wrongJwtToken = (err, req, res, next) => {
  if (err.message === "invalid signature") {
    const message = `Json Web Token is invalid, Try again `;
    err = new ApiError(400, message);
  }
  if (err.message === "jwt malformed") {
    const message = `Jwt is invalid`;
    err = new ApiError(400, message);
  }
  next(err);
};

const expireJwtToken = (err, req, res, next) => {
  if (err.message === "jwt expired") {
    const message = `Json web token has been expired `;
    err = new ApiError(400, message);
  }
  if (err.message === "Error") {
    err = new ApiError(400, "Something went wrong");
  }
  next(err);
};

const singleImageRequired = (err, req, res, next) => {
  if (err.message === "Unexpected field") {
    const message = `Only one allowed`;
    err = new ApiError(400, message);
  }
  if (err.message === "Only video files are allowed!") {
    const message = `Only video allowed`;
    err = new ApiError(400, message);
  }
  if (err.message === "Only one image allowed") {
    const message = `Only one image allowed`;
    err = new ApiError(400, message);
  }
  next(err);
};

module.exports = {
  errorConverter,
  errorHandler,
  wrongJwtToken,
  singleImageRequired,
  expireJwtToken,
};
