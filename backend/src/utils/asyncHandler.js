const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err)); // passes the error to express built-in error handling middleware
  };
};

export { asyncHandler };
