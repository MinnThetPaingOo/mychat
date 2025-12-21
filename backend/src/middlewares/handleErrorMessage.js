import { validationResult } from "express-validator";

const handleErrorMessage = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    // Use 'path' for the field name
    const errorObj = {};
    result.array().forEach((err) => {
      errorObj[err.path] = err.msg;
    });
    return res.status(400).json({ errors: errorObj });
  } else {
    next();
  }
};

export default handleErrorMessage;
