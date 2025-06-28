const jwt = require("jsonwebtoken");

const generateJwtToken = (_id, role) => {
  const accessToken = jwt.sign(
    { _id, role },
    process.env.JWT_ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1y",
    }
  );
  const refreshToken = jwt.sign(
    { _id, role },
    process.env.JWT_REFRESH_TOKEN_SECRET,
    {
      expiresIn: "1y",
    }
  );
  return { accessToken, refreshToken };
};

module.exports = generateJwtToken;
