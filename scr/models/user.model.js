const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");
const mongoDuplicateKeyError = require("./../utils/mongoDuplicateKeyError");

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    aliasName: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      trim: true,
    },
    changePasswordOnLogin: {
      type: Boolean,
      default: false,
    },
    verifyEmail: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: false,
    },
    timeZone: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  user.email = user.email.toLowerCase().replace(/\s/g, "");
  next();
});

mongoDuplicateKeyError(userSchema);
/**
 * @typedef User
 */
const User = mongoose.model("User", userSchema);

module.exports = User;
