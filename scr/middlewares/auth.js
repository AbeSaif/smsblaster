const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");
const ApiError = require("./../utils/ApiError");
const config = require("./../config/config");
const mongoose = require("mongoose");
const { Role, User } = require("./../models");

const requireSignin = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const user = jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET);
    req.user = user;
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Authorization required");
  }
  next();
};

const authMiddleware = (requiredPermission) => async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(401).send({ error: "Not authorized" });
    }
    const role = await Role.findOne({ role: user.role });
    if (!role.permissions.includes(requiredPermission)) {
      return res.status(403).send({ error: "Forbidden" });
    }

    next();
  } catch (err) {
    res.status(500).send(err);
  }
};

const adminMiddleware = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      throw new ApiError(httpStatus.BAD_REQUEST, "Only admin can access");
    }
  } catch (err) {
    res.status(400).json({
      status: httpStatus.BAD_REQUEST,
      message: "Only admin can access",
    });
  }
  next();
};

const requireCronAuthentication = (req, res, next) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization;
    console.log("token is", token);
    if (token === process.env.secret_key_token) {
      next();
    } else {
      next(new ApiError(httpStatus.BAD_REQUEST, "Invalid Token"));
    }
  } else {
    next(new ApiError(httpStatus.BAD_REQUEST, "Authorization required"));
  }
};

module.exports = {
  requireSignin,
  authMiddleware,
  adminMiddleware,
  requireCronAuthentication,
};
