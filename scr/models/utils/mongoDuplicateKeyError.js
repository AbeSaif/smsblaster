const mongoDuplicateKeyError = (schema) => {
  schema.post("save", function (error, doc, next) {
    if (error.name === "MongoServerError" && error.code === 11000) {
      const dupField = Object.keys(error.keyValue)[0];
      if (dupField === "phone") {
        next(new Error("Number already exist"));
      } else {
        next(
          new Error(
            `${
              dupField.charAt(0).toUpperCase() + dupField.slice(1)
            } already exist`
          )
        );
      }
    } else {
      next(error);
    }
  });
};

module.exports = mongoDuplicateKeyError;
