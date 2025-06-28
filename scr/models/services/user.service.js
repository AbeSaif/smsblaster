const httpStatus = require("http-status");
const {
  User,
  Token,
  Admin,
  Batch,
  Inbox,
  DirectImport,
  LoginAttempt,
  Reminder,
} = require("../models");
const ApiError = require("../utils/ApiError");
const generateJwtToken = require("./../config/generateToken");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const register = async (userBody) => {
  try {
    return await User.create(userBody);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const login = async (userBody) => {
  try {
    let user = await User.findOne({ email: userBody.email }).populate("role");
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Credentials invalid");
    }
    if (user.active === false) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Account is not active yet kindly contact with admin"
      );
    }
    const checkPassword = await user.isPasswordMatch(userBody.password);
    if (!checkPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Credentials invalid");
    }

    const { accessToken, refreshToken } = generateJwtToken(user._id, user.role);
    const existToken = await Token.findOne({ user: user._id });
    if (!existToken) {
      await Token.create({ refreshToken, user: user._id });
    } else {
      await Token.findOneAndUpdate({ user }, { $set: { refreshToken } });
    }
    const result = { accessToken, refreshToken, user };
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const loginWithEmail = async (userBody) => {
  try {
    let user = await User.findOne({ email: userBody.email }).populate("role");
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Credentials invalid");
    }
    if (user.active === false) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Account is not active yet kindly contact with admin"
      );
    }

    const { accessToken, refreshToken } = generateJwtToken(user._id, user.role);
    const existToken = await Token.findOne({ user: user._id });
    if (!existToken) {
      await Token.create({ refreshToken, user: user._id });
    } else {
      await Token.findOneAndUpdate({ user }, { $set: { refreshToken } });
    }
    const result = { accessToken, refreshToken, user };
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const getAllUser = async (filter, options) => {
  try {
    const users = await User.paginate(filter, options);
    if (users.length <= 0) {
      return users;
    }
    return users;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};
const getUserById = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
    }
    return user;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const updateUserById = async (id, body) => {
  try {
    if (body.email) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Email can't update");
    }
    let user = await User.findById(id);
    if (user) {
      const updateUser = await User.findByIdAndUpdate(id, body, { new: true });
      let batchArray = await Batch.find({
        $or: [{ user: id }, { admin: id }],
      }).select("status");
      let uniqueBatchArray = batchArray.map((item) => item._id);
      uniqueBatchArray = [...new Set(uniqueBatchArray)];
      await Inbox.updateMany(
        { batch: { $in: uniqueBatchArray } },
        { $set: { aliasName: body.aliasName, companyName: body.companyName } }
      );
      return updateUser;
    } else {
      let admin = await Admin.findById(id);
      if (!admin) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
      }
      body.fullName = body.firstName + " " + body.lastName;
      const updateUser = await Admin.findByIdAndUpdate(id, body, { new: true });
      let batchArray = await Batch.find({
        $or: [{ user: id }, { admin: id }],
      }).select("status");
      let uniqueBatchArray = batchArray.map((item) => item._id);
      uniqueBatchArray = [...new Set(uniqueBatchArray)];
      await Inbox.updateMany(
        { batch: { $in: uniqueBatchArray } },
        { $set: { aliasName: body.aliasName, companyName: body.companyName } }
      );
      return updateUser;
    }
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const deleteUserById = async (id) => {
  try {
    const user = await User.findByIdAndRemove(id);
    if (user === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
    }
    return "Deleted successfully";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const createPassword = async (id, body) => {
  try {
    const updateUser = await User.findByIdAndUpdate(id, body, { new: true });
    if (!updateUser) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
    }
    return updateUser;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const verifyRefreshToken = async (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_TOKEN_SECRET);
};

const refreshToken = async (token) => {
  try {
    await verifyRefreshToken(token);
    const tokens = await Token.findOne({ token });
    if (tokens === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No token found");
    }
    const user = await User.findById(tokens.user);
    if (user === null) {
      throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
    }
    const { accessToken, refreshToken } = generateJwtToken(user._id, user.role);
    await Token.findOneAndUpdate({ user }, { $set: { refreshToken } });
    const result = { accessToken, refreshToken, user };
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const resetPassword = async (body, userId) => {
  try {
    const userMember = await User.findById(userId);
    if (!userMember) {
      const otherUser = await Admin.findById(userId);
      if (!otherUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
      }
      const otherUsercheckPassword = await otherUser.isPasswordMatch(
        body.password
      );
      if (!otherUsercheckPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Password invalid");
      }

      const otherUserhashPassword = await bcrypt.hash(body.newPassword, 10);
      const updateotherUser = Admin.findOneAndUpdate(
        { _id: userId },
        { $set: { password: otherUserhashPassword } },
        { new: true }
      );
      return updateotherUser;
    }
    const checkPassword = await userMember.isPasswordMatch(body.password);
    if (!checkPassword) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Password invalid");
    }

    const hashPassword = await bcrypt.hash(body.newPassword, 10);
    const updateUser = User.findOneAndUpdate(
      { _id: userId },
      { $set: { password: hashPassword } },
      { new: true }
    );
    return updateUser;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const forgotPassword = async (body) => {
  try {
    const userMember = await User.findOne({ email: body.email });
    if (!userMember) {
      const user = await Admin.findOne({ email: body.email });
      if (!user) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
      }
      let result = {
        message: "kindly check your mail inbox for resetPassword",
        user: user,
      };
      return result;
    }
    let result = {
      message: "kindly check your mail inbox for resetPassword",
      user: userMember,
    };
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const changePasswordForAllUser = async (body) => {
  try {
    const user = await User.findByIdAndUpdate(
      body.id,
      { password: body.newPassword },
      {
        new: true,
      }
    );
    if (!user) {
      const userMember = await Admin.findByIdAndUpdate(
        body.id,
        { password: body.newPassword },
        {
          new: true,
        }
      );
      if (!userMember) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
      }
      let result = { message: "Password have been changed", user: userMember };
      return result;
    }
    let result = { message: "Password have been changed", user };
    return result;
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

const transferLeads = async (body) => {
  try {
    if (body?.oldUserId?.toString() === body?.newUserId?.toString()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Old and new user can't be same"
      );
    }
    let queryPromise;
    if (body?.permission === "user") {
      let queryPromiseForBatch = [
        User.findById(body.newUserId).select("companyName aliasName"),
        Batch.find({ user: body.oldUserId }).select("user"),
      ];
      let [userInfo, batchInfo] = await Promise.all(queryPromiseForBatch);
      if (!userInfo) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
      }
      let batchIdArray = [];
      batchIdArray = batchInfo?.map((item) => item._id);
      queryPromise = [
        Batch.updateMany(
          { user: body.oldUserId },
          { $set: { user: body.newUserId } }
        ),
        DirectImport.updateMany(
          { user: body.oldUserId },
          { $set: { user: body.newUserId } }
        ),
        LoginAttempt.updateMany(
          { user: body.oldUserId },
          { $set: { user: body.newUserId } }
        ),
        Reminder.updateMany(
          { user: body.oldUserId },
          { $set: { user: body.newUserId } }
        ),
        Inbox.updateMany(
          { batch: { $in: batchIdArray } },
          {
            $set: {
              companyName: userInfo?.companyName,
              aliasName: userInfo?.aliasName,
            },
          }
        ),
        User.findByIdAndRemove(body.oldUserId),
      ];
    } else {
      let queryPromiseForBatch = [
        Admin.findById(body.newUserId).select("companyName aliasName"),
        Batch.find({ user: body.oldUserId }).select("user"),
      ];
      let [userInfo, batchInfo] = await Promise.all(queryPromiseForBatch);
      if (!userInfo) {
        throw new ApiError(httpStatus.BAD_REQUEST, "No user found");
      }
      let batchIdArray = [];
      batchIdArray = batchInfo?.map((item) => item._id);
      queryPromise = [
        Batch.updateMany(
          { user: body.oldUserId },
          {
            $set: { admin: body.newUserId },
            $unset: { user: body.oldUserId },
          }
        ),
        DirectImport.updateMany(
          { user: body.oldUserId },
          {
            $set: { admin: body.newUserId },
            $unset: { user: body.oldUserId },
          }
        ),
        LoginAttempt.updateMany(
          { user: body.oldUserId },
          {
            $set: { admin: body.newUserId },
            $unset: { user: body.oldUserId },
          }
        ),
        Reminder.updateMany(
          { user: body.oldUserId },
          {
            $set: { admin: body.newUserId },
            $unset: { user: body.oldUserId },
          }
        ),
        Inbox.updateMany(
          { batch: { $in: batchIdArray } },
          {
            $set: {
              companyName: userInfo?.companyName,
              aliasName: userInfo?.aliasName,
            },
          }
        ),
        User.findByIdAndRemove(body.oldUserId),
      ];
    }
    await Promise.all(queryPromise);
    return "Leads has been transfered";
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error);
  }
};

module.exports = {
  register,
  login,
  getAllUser,
  getUserById,
  updateUserById,
  deleteUserById,
  createPassword,
  refreshToken,
  resetPassword,
  forgotPassword,
  changePasswordForAllUser,
  loginWithEmail,
  transferLeads,
};
