const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const { userService, emailService } = require("../services");
const bcrypt = require("bcryptjs");
const pick = require("../utils/pick");
const createPasswordTemplate = require("./../templates/createPasswordTemplate");
const resetPasswordTemplate = require("./../templates/resetPassword");
const verifyEmailTemplate = require("./../templates/verifyEmail");
const ApiError = require("../utils/ApiError");
const { uploadToS3 } = require("./../utils/fileUpload");
const path = require("path");
const redis = require("redis");
 
const client = redis.createClient({
  url: `redis://${process.env.redis_user}:${process.env.redis_pass}@${process.env.redis_host}:${process.env.redis_port}`,
});

const register = catchAsync(async (req, res) => {
  let body = req.body;
  if (req.file) {
    await uploadToS3(
      req.file.buffer,
      req.file.fieldname +
        "-" +
        Date.now() +
        path.extname(req.file.originalname)
    )
      .then(async (result) => {
        // body.avatar = result.Location.replace("http://", "https://");
        body.avatar = result.Location;
      })
      .catch((error) => {
        throw new ApiError(httpStatus.BAD_REQUEST, error);
      });
  }
  const user = await userService.register(body);
  let template = createPasswordTemplate(user, body);
  emailService.sendEmail(user.email, "Create Password", template);
  // if (body.verifyEmail === true) {
  //   let template1 = verifyEmailTemplate(user, body, body.password);
  //   emailService.sendEmail(user.email, "Verify Email", template1);
  // }
  res.status(httpStatus.CREATED).send(user);
});

const login = catchAsync(async (req, res) => {
  let body = req.body;
  body.email = body.email.toLowerCase().replace(/\s/g, "");
  const user = await userService.login(body);
  res.status(httpStatus.CREATED).send(user);
});

const loginWithEmail = catchAsync(async (req, res) => {
  let body = req.body;
  body.email = body.email.toLowerCase().replace(/\s/g, "");
  const user = await userService.loginWithEmail(body);
  res.status(httpStatus.CREATED).send(user);
});
const getAllUser = catchAsync(async (req, res) => {
  let filter = {};
  let options = pick(req.query, ["limit", "page"]);
  options.sortBy = "createdAt:desc";
  options.populate = "role";
  const user = await userService.getAllUser(filter, options);
  res.status(httpStatus.CREATED).send(user);
});

const updateUserById = catchAsync(async (req, res) => {
  let body = req.body;
  if (req.file) {
    await uploadToS3(
      req.file.buffer,
      req.file.fieldname +
        "-" +
        Date.now() +
        path.extname(req.file.originalname)
    )
      .then(async (result) => {
        body.avatar = result.Location;
      })
      .catch((error) => {
        throw new ApiError(httpStatus.BAD_REQUEST, error);
      });
  }
  if (body.email) {
    res.status(httpStatus.CREATED).send("Email can't be updated");
  }
  if (body.password) {
    body.password = bcrypt.hashSync(body.password, 10);
  }
  let id = req.params.userId;
  const user = await userService.updateUserById(id, body);
  res.status(httpStatus.CREATED).send(user);
});

const getUserById = catchAsync(async (req, res) => {
  let id = req.params.userId;
  const user = await userService.getUserById(id);
  res.status(httpStatus.CREATED).send(user);
});

const deleteUserById = catchAsync(async (req, res) => {
  let id = req.params.userId;
  const user = await userService.deleteUserById(id);
  res.status(httpStatus.CREATED).send(user);
});

const createPassword = catchAsync(async (req, res) => {
  let body = req.body;
  if (body.password) {
    body.password = bcrypt.hashSync(body.password, 10);
  }

  let id = req.params.userId;
  const user = await userService.createPassword(id, body);
  res.status(httpStatus.CREATED).send(user);
});

const refreshToken = catchAsync(async (req, res) => {
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(" ")[1];
    const user = await userService.refreshToken(token);
    res.status(httpStatus.CREATED).send(user);
  } else {
    res.status(httpStatus.BAD_REQUEST).send("Refresh token required");
  }
});

const resetPassword = catchAsync(async (req, res) => {
  let body = req.body;
  let userId = req.params.userId;
  const user = await userService.resetPassword(body, userId);
  res.status(httpStatus.CREATED).send(user);
});

const forgotPassword = catchAsync(async (req, res) => {
  let body = req.body;
  const user = await userService.forgotPassword(body);
  const template = resetPasswordTemplate(user.user, body);
  emailService.sendEmail(user.user.email, "Forgot Password", template);
  res.status(httpStatus.CREATED).send(user);
});

const changePasswordForAllUser = catchAsync(async (req, res) => {
  let body = req.body;
  if (body.newPassword) {
    body.newPassword = bcrypt.hashSync(body.newPassword, 10);
  }
  const user = await userService.changePasswordForAllUser(body);
  res.status(httpStatus.CREATED).send(user);
});

const transferLeads = catchAsync(async (req, res) => {
  let body = req.body;
  const result = await userService.transferLeads(body);
  res.status(httpStatus.CREATED).send(result);
});

const flushRedisData = async (req, res) => {
  try {
    await client.connect(); // Connect to the Redis server
    let result = await client.flushAll(); // Flush all data from Redis
    await client.quit(); // Close the Redis connection
    res.status(httpStatus.CREATED).json({ message: "Data has been deleted" });
  } catch (err) {
    console.error(`Failed to flush Redis: ${err}`);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ message: "Failed to delete data" });
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
  flushRedisData,
};
