const httpStatus = require("http-status");
const { Admin, User, Token, LoginAttempt } = require("../models");
const ApiError = require("../utils/ApiError");
const generateJwtToken = require("./../config/generateToken");
const config = require("./../config/config");
const jwt = require("jsonwebtoken");

/**
 * Create a user
 * @param {Object} adminBody
 * @returns {Promise<User>}
 */
const register = async (adminBody) => {
  try {
    return await Admin.create(adminBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const login = async (body) => {
  try {
    let admin = await Admin.findOne({ email: body.email });
    if (!admin) {
      let user = await User.findOne({ email: body.email }).populate("role");
      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Credentials invalid");
      }
      if (user.active === false) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "Account has been suspended kindly contact the admin"
        );
      }
      const checkPassword = await user.isPasswordMatch(body.password);
      if (!checkPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Credentials invalid");
      }
      const { accessToken, refreshToken } = generateJwtToken(
        user._id,
        user.role
      );
      // user?.avatar = config.rootPath+"/"+user.avatar
      const existToken = await Token.findOne({ user: user._id });
      if (!existToken) {
        await Token.create({ refreshToken, user: user._id });
      } else {
        await Token.findOneAndUpdate({ user }, { $set: { refreshToken } });
      }
      if (body.ip && body.browser) {
        await LoginAttempt.create({
          ip: body.ip,
          browser: body.browser,
          user: user._id,
        });
      }
      const result = { accessToken, refreshToken, type: "other", user };
      return result;
    }
    if (admin.active === false) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Account has been suspended kindly contact the admin"
      );
    }
    const checkPassword = await admin.isPasswordMatch(body.password);
    if (!checkPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Credentials invalid");
    }
    const { accessToken, refreshToken } = generateJwtToken(
      admin._id,
      admin.role
    );
    if (body.ip && body.browser) {
      await LoginAttempt.create({
        ip: body.ip,
        browser: body.browser,
        admin: admin._id,
      });
    }
    const result = { accessToken, refreshToken, type: "admin", user: admin };
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllAdmin = async (filter, options) => {
  try {
    return await Admin.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
const getAdminById = async (id) => {
  try {
    const user = await Admin.findById(id);
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
    }
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteAdminById = async (id) => {
  try {
    const user = await Admin.findByIdAndRemove(id);
    if (user === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
    }
    return "Deleted successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const listOfLoginAttempt = async (filter, options) => {
  try {
    return await LoginAttempt.paginate(filter, options);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const verifyPassword = async (body) => {
  try {
    let admin = await Admin.findOne({ email: body.email });
    if (!admin) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Credentials invalid");
    }

    const checkPassword = await admin.isPasswordMatch(body.password);
    if (!checkPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Credentials invalid");
    }
    return admin;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  register,
  login,
  getAllAdmin,
  getAdminById,
  deleteAdminById,
  listOfLoginAttempt,
  verifyPassword,
};
